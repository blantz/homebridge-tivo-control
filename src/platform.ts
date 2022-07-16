import { sendCommands } from 'node-tivo';

import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig } from 'homebridge';
import { Service, Characteristic, CharacteristicValue } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';

let logger;
let verbose = false;

export class TivoPlatform implements DynamicPlatformPlugin {
	public readonly Service: typeof Service = this.api.hap.Service;
	public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

	public readonly accessories: PlatformAccessory[] = [];
	public readonly registeredAccessories: PlatformAccessory[] = [];

	play = false;
	pause = false;
	sendCommands;

	constructor(
		public readonly log: Logger,
		public readonly config: PlatformConfig,
		public readonly api: API,
	) {
		this.sendCommands = sendCommands.bind(this);
		logger = log;

		log.debug('Finished initializing platform:', config.name);

		verbose = config['debug'];
		logger.info('Verbose: ' + verbose);


		// When this event is fired it means Homebridge has restored all cached accessories from disk.
		// Dynamic Platform plugins should only register new accessories after this event was fired,
		// in order to ensure they weren't added to homebridge already. This event can also be used
		// to start discovery of new accessories.
		api.on('didFinishLaunching', () => {
			this.logIt('Executed didFinishLaunching callback');
			this.configureDevices();
		});
	}

	/**
	 * This function is invoked when homebridge restores cached accessories from disk at startup.
	 * It should be used to set up event handlers for characteristics and update respective values.
	 */
	configureAccessory(accessory: PlatformAccessory) {
		this.logIt('Loading accessory from cache: ' + accessory.displayName);

		// add the restored accessory to the accessories cache, so we can track if it has already been registered
		this.accessories.push(accessory);
	}

	/**
	 * This is an example method showing how to register discovered accessories.
	 * Accessories must only be registered once, previously created accessories
	 * must not be registered again to prevent "duplicate UUID" errors.
	 */
	configureDevices() {
		this.logIt('Configuring devices');
		const units = this.config['devices'];
		for (let index = 0; index < units.length; index++) {
			this.configureEachUnit(units[index]);
		}
		for (let index = 0; index < this.accessories.length; index++) {
			// @ts-ignore
			if (!this.registeredAccessories.includes(this.accessories[index])) {
				this.logIt('Removing accessory not found in config: ' + this.accessories[index].displayName);
				this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [this.accessories[index]]);
			}
		}
	}

	logIt (message) {
		if (verbose) {
			logger.info(message);
		}
	}

	configureEachUnit(unit) {
		unit.tivoConfig = {
			ip: unit['ip'],
			port: unit['port'],
		};

		const channels = unit['channels'];
		if (channels != undefined) {
			for (let index = 0; index < channels.length; index++) {
				this.configureEachChannel(channels[index], unit.tivoConfig);
			}
		}

		this.handlePreDefined(unit);

		const customs = unit['custom'];
		if (customs != undefined) {
			for (let index = 0; index < customs.length; index++) {
				let custom = customs[index];
				this.configure(custom.name, 'Sending custom command: ' + custom.name, custom.commands.split(','), unit.tivoConfig);
			}
		}
	}

	handlePreDefined(unit) {
		if(unit['play']) {
			this.configure(unit['play-name'], 'Sending Play command', [ 'IRCODE PLAY' ], unit.tivoConfig);
		}

		if(unit['pause']) {
			this.configure(unit['pause-name'], 'Sending Pause command', [ 'IRCODE PAUSE' ], unit.tivoConfig);
		}

		if(unit['standby']) {
			this.configure(unit['standby-name'], 'Sending standby command', [ 'IRCODE STANDBY' ], unit.tivoConfig);
		}

		if(unit['resume']) {
			this.configure(unit['resume-name'], 'Sending resume command', [ 'IRCODE STANDBY, IRCODE STANDBY' ], unit.tivoConfig);
		}
	}

	configureEachChannel(thisChannel, tivoConfig) {
		thisChannel.name = '' + thisChannel['name'];
		thisChannel.channel = '' + thisChannel['channel'];
		thisChannel.message = 'Changing to channel: ' + thisChannel.channel;
		thisChannel.commands = this.makeChannelCommands(thisChannel.channel);
		this.configure(thisChannel.name, thisChannel.message, thisChannel.commands, tivoConfig);
	}

	makeChannelCommands (thisChannel) {
		this.logIt('Using channel: ' + thisChannel);

		const myCommands = [];
		for (const character of thisChannel) {
			// @ts-ignore
			myCommands.push('IRCODE NUM' + character);
		}

		return myCommands;
	}

	configure(theName, message, commands, tivoConfig) {
		const uuid = this.api.hap.uuid.generate(theName);

		this.logIt("Using commands: " + JSON.stringify(commands));
		const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
		let accessory = existingAccessory;
		if (!existingAccessory) {
			this.logIt('Configuring new accessory: ' + theName);
			accessory = new this.api.platformAccessory(theName, uuid);
		}

		// @ts-ignore
		let service = accessory.getService(this.Service.Switch);
		if (!service) {
			// @ts-ignore
			service = accessory.addService(this.Service.Switch);
		}
		let device = {
			name: theName,
			message: message,
			commands: commands,
			tivoConfig: tivoConfig,
			uuid: uuid,
			service: service,
		};
		// @ts-ignore
		accessory.context.device = device;

		service.setCharacteristic(this.Characteristic.Name, theName);

		service.getCharacteristic(this.Characteristic.On)
			.on('get', (callback) => {
				this.logIt('Returning state = false');
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
			this.logIt('Using commands: ' + JSON.stringify(theseCommands));
			this.sendCommands(device.tivoConfig, theseCommands, responses => {
				this.logIt('Responses: ' + JSON.stringify(responses));
				callback();
				this.logIt('Back from callback');
				device.service.getCharacteristic(this.Characteristic.On).updateValue(false);
				this.logIt('Should now be back off');
			});
		} else {
			this.logIt('Skipping action for OFF');
			device.service.getCharacteristic(this.Characteristic.On).updateValue(false);
		}
		this.logIt('setOn exiting');
	}
}



