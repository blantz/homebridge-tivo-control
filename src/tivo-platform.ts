const tivo = require('node-tivo');

import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic, CharacteristicValue } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';


export class TivoPlatform implements DynamicPlatformPlugin {
	public readonly Service: typeof Service = this.api.hap.Service;
	public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

	public readonly accessories: PlatformAccessory[] = [];
	public verbose = false;

	constructor(
		public readonly log: Logger,
		public readonly config: PlatformConfig,
		public readonly api: API,
	) {
		log.debug('Finished initializing platform:', config.name);

		if (config['debug'] == true) {
			this.verbose = true;
		}
		log.info("Verbose: " + this.verbose);

		// When this event is fired it means Homebridge has restored all cached accessories from disk.
		// Dynamic Platform plugins should only register new accessories after this event was fired,
		// in order to ensure they weren't added to homebridge already. This event can also be used
		// to start discovery of new accessories.
		api.on('didFinishLaunching', () => {
			this.logIt('Executed didFinishLaunching callback');
			this.discoverDevices();
		});
	}

	/**
	 * This function is invoked when homebridge restores cached accessories from disk at startup.
	 * It should be used to setup event handlers for characteristics and update respective values.
	 */
	configureAccessory(accessory: PlatformAccessory) {
		this.logIt('Loading accessory from cache:' + accessory.displayName);

		// add the restored accessory to the accessories cache so we can track if it has already been registered
		this.accessories.push(accessory);
	}

	/**
	 * This is an example method showing how to register discovered accessories.
	 * Accessories must only be registered once, previously created accessories
	 * must not be registered again to prevent "duplicate UUID" errors.
	 */
	discoverDevices() {
		this.logIt("Discovering devices");
		const units = this.config['units'];
		for (let index = 0; index < units.length; index++) {
			this.configureEachUnit(units[index]);
		}
	}

	logIt (message) {
		if (this.verbose) {
			this.log.info(message);
		}
	}

	configureEachUnit(unit) {
		// assume flat for the moment - array item 0
		unit.tivoConfig = {
			ip: unit['ip'],
			port: unit['port']
		};

		const channels = unit['channels'];
		for (let index = 0; index < channels.length; index++) {
			this.configureEachChannel(channels[index], unit.tivoConfig);
		}
	}

	configureEachChannel(thisChannel, tivoConfig) {
		thisChannel.channel = "" + thisChannel['channel'];
		thisChannel.message = "Changing to channel: " + thisChannel.channel;
		thisChannel.commands = this.makeChannelCommands(thisChannel.channel);
		this.configure("tivo-ch-" + thisChannel.channel, thisChannel.channel, thisChannel.message, thisChannel.commands, tivoConfig);
	}

	makeChannelCommands (thisChannel) {
		this.logIt("Using channel: " + thisChannel);

		const myCommands = [];
		for (let character of thisChannel) {
			// @ts-ignore
			myCommands.push("IRCODE NUM" + character);
		}

		this.logIt("CMD: " + JSON.stringify(myCommands));
		return myCommands;
	}

	configure(theName, channel, message, commands, tivoConfig) {
		const uuid = this.api.hap.uuid.generate(theName);
		const device = {
			name: theName,
			channel: channel,
			message: message,
			commands: commands,
			tivoConfig: tivoConfig,
			uuid: uuid
		};

		const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
		let accessory = existingAccessory;
		if (!existingAccessory) {
			accessory = new this.api.platformAccessory(theName, uuid);
			accessory.context.device = device;
		}

		// @ts-ignore
		let service = accessory.getService(this.Service.Switch);
		if (!service) {
			service = new this.Service.Switch(theName);
		}
		service
			.getCharacteristic(this.Characteristic.On)
			.on('get', (callback) => {
				this.logIt("Returning state = false");
				callback(null, false);
			})
			.on('set', (value, callback) => {
				this.setOn(accessory, value, callback, this.logIt, this.Characteristic);
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
	}

	setOn (accessory, on: CharacteristicValue, callback, logIt, Characteristic) {
		if (on) {
			accessory.log(accessory.message);
			const theseCommands = accessory.commands.slice();
			this.logIt("Using commands: "+ JSON.stringify(theseCommands));
			tivo.sendCommands(accessory.tivoConfig, theseCommands, function(responses) {
				logIt("Responses: " + JSON.stringify(responses));
				callback();
				logIt("Back from callback");
				accessory.service.getCharacteristic(Characteristic.On).updateValue(false);
				logIt("Should now be back off");
			});
		} else {
			this.logIt("Skipping action for OFF");
			accessory.service.getCharacteristic(Characteristic.On).updateValue(false);
		}
		this.logIt("_setOn exiting");
	};
}



