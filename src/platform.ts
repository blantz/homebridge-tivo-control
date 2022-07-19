import { sendCommands } from 'node-tivo';

import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig } from 'homebridge';
import { Service, Characteristic, CharacteristicValue } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';

let logger;
let verbose = false;
let predefinedMap : Map<string, string> = new Map([
	['play', 'IRCODE PLAY'],
	['pause', 'IRCODE PAUSE'],
	['standby', 'IRCODE STANDBY'],
	['resume', 'IRCODE LIVETV']
]);

export class TivoPlatform implements DynamicPlatformPlugin {
	public readonly Service: typeof Service = this.api.hap.Service;
	public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

	public readonly accessories: PlatformAccessory[] = [];
	public readonly registeredAccessories: PlatformAccessory[] = [];

	sendCommands;

	constructor(
		public readonly log: Logger,
		public readonly config: PlatformConfig,
		public readonly api: API,
	) {
		this.sendCommands = sendCommands.bind(this);
		logger = log;

		verbose = config['debug'];
		logger.info('Verbose debug logging: ' + verbose);


		// When this event is fired it means Homebridge has restored all cached accessories from disk.
		// Dynamic Platform plugins should only register new accessories after this event was fired,
		// in order to ensure they weren't added to homebridge already. This event can also be used
		// to start discovery of new accessories.
		api.on('didFinishLaunching', () => {
			logIt('Executed didFinishLaunching callback');
			this.configureDevices();
		});
	}

	/**
	 * This function is invoked when homebridge restores cached accessories from disk at startup.
	 * It should be used to set up event handlers for characteristics and update respective values.
	 */
	configureAccessory(accessory: PlatformAccessory) {
		logIt('Loading accessory from cache: ' + accessory.displayName);

		// add the restored accessory to the accessories cache, so we can track if it has already been registered
		this.accessories.push(accessory);
	}

	configureDevices() {
		logIt('Configuring devices');
		const devices = this.config['devices'];
		devices?.forEach(device => this.configureEachDevice(device));

		this.accessories?.forEach(accessory => {
			// @ts-ignore
			if (this.registeredAccessories === null || !this.registeredAccessories.includes(accessory)) {
				logIt('Removing accessory not found in config: ' + accessory.displayName);
				this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
			}
		})
	}

	configureEachDevice(device) {
		device.tivoConfig = {
			ip: device['ip'],
			port: device['port'],
		};

		device['channels']?.forEach(channel => this.configureEachChannel(channel, device.tivoConfig));

		for (let [name, command] of predefinedMap) {
			if(device[name]) {
				this.configure(device[name + '-name'],
					'Sending ' + name.charAt(0).toUpperCase() + name.slice(1) + ' command',
					[ command ], device.tivoConfig);
			}
		}

		device['custom']?.forEach(custom => this.configure(custom.name,
			'Sending custom command: ' + custom.name, custom.commands.split(','), device.tivoConfig));
	}

	configureEachChannel(thisChannel, tivoConfig) {
		logIt('Configuring channel: ' + thisChannel['channel']);

		thisChannel.name = '' + thisChannel['name'];
		thisChannel.channel = '' + thisChannel['channel'];
		thisChannel.message = 'Changing to channel: ' + thisChannel.channel;
		thisChannel.commands = this.makeChannelCommands(thisChannel.channel);
		this.configure(thisChannel.name, thisChannel.message, thisChannel.commands, tivoConfig);
	}

	makeChannelCommands (thisChannel) {
		const myCommands = [];
		for (const character of thisChannel) {
			// @ts-ignore
			myCommands.push('IRCODE NUM' + character);
		}

		return myCommands;
	}

	configure(theName, message, commands, tivoConfig) {
		const uuid = this.api.hap.uuid.generate(theName);

		logIt("Configuring: " + theName);
		logIt("Using commands: " + JSON.stringify(commands));
		const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
		let accessory = existingAccessory;
		if (!existingAccessory) {
			logIt('Adding new accessory: ' + theName);
			accessory = new this.api.platformAccessory(theName, uuid);
		}

		// @ts-ignore
		let service = accessory.getService(this.Service.Switch)
		if (!service) {
			// @ts-ignore
			service = accessory.addService(this.Service.Switch);
		}

		// @ts-ignore
		accessory.context?.device = {
			name: theName,
			message: message,
			commands: commands,
			tivoConfig: tivoConfig,
			uuid: uuid,
			service: service,
		};

		service.setCharacteristic(this.Characteristic.Name, theName);

		service.getCharacteristic(this.Characteristic.On)
			.on('get', (callback) => {
				logIt('Returning state = false');
				callback(null, false);
			})
			.on('set', (value, callback) => {
				this.setOn(accessory, value, callback);
			})
			.updateValue(false);

		// @ts-ignore
		let informationService = accessory.getService(this.Service.AccessoryInformation);
		if (!informationService) {
			informationService = new this.Service.AccessoryInformation();
		}
		informationService
			.setCharacteristic(this.Characteristic.Name, theName)
			.setCharacteristic(this.Characteristic.Manufacturer, 'TiVo')
			.setCharacteristic(this.Characteristic.Model, '1.0.0')
			.setCharacteristic(this.Characteristic.SerialNumber, tivoConfig.ip);

		if (!existingAccessory) {
			// @ts-ignore
			this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
		}

		// @ts-ignore
		this.registeredAccessories.push(accessory);
	}

	setOn (accessory, value, callback) {
		let device = accessory.context.device;
		if (value) {
			logger.info(device.message);
			const theseCommands = device.commands.slice();
			logIt('Using commands: ' + JSON.stringify(theseCommands));
			this.sendCommands(device.tivoConfig, theseCommands, responses => {
				logIt('Responses: ' + JSON.stringify(responses));
				callback();
				device.service.getCharacteristic(this.Characteristic.On).updateValue(false);
			});
		} else {
			logIt('Skipping action for OFF');
			device.service.getCharacteristic(this.Characteristic.On).updateValue(false);
		}
		logIt('setOn exiting');
	}
}

function logIt (message) {
	if (verbose) {
		logger.info(message);
	}
}

