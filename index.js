"use strict";

var net = require('net');
var util = require('util');

var tivo = require('node-tivo');

var Service, Characteristic;

var verbose = false;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-tivo-channels", "TivoChannels", TiVoAccessory);
}

function TiVoAccessory(log, config) {
    var that = this;

    this.log = log;
    this.config = config;
    this.name = config['name'];

    this.tivoConfig = {
        ip: config['ip'],
        port: config['port']
    };

	this.channel = 2;
	if (config['channel'] != null) {
		this.channel = "" + config['channel'];
	}

	if (config['debug'] != null) {
		verbose = config['debug'];
	}
	log("Verbose: " + verbose);
	
	this.commands = makeChannelCommands(channel); 
	
    this.service = new Service.Switch(this.name);
    this.service
        .getCharacteristic(Characteristic.On)        
        .on('get', this._getOn.bind(this))
        .on('set', this._setOn.bind(this))
        .updateValue(false);
    
    this.informationService = new Service.AccessoryInformation();
    this.informationService
        .setCharacteristic(Characteristic.Name, this.name)
        .setCharacteristic(Characteristic.Manufacturer, 'TiVo')
        .setCharacteristic(Characteristic.Model, '1.0.0')
        .setCharacteristic(Characteristic.SerialNumber, this.ip);
}

function logIt (message) {
	if (verbose) {
		console.log(message);
	}
}

function makeChannelCommands (thisChannel) {
	logIt("Using channel: " + thisChannel);
	
	var myCommands = [];
	for (let character of thisChannel) {
		myCommands.push("IRCODE NUM" + character);
	}
	
	logIt("CMD: " + JSON.stringify(commands));
	
	return myCommands;
}

TiVoAccessory.prototype.getServices = function() {
    logIt("Registering services");
    return [this.service, this.informationService];
};

TiVoAccessory.prototype._getOn = function(callback) {
	logIt("Returning state = false");
    callback(null, false);
};

TiVoAccessory.prototype._setOn = function(on, callback) {
    var accessory = this;
    if (on) {
		accessory.log("Changing to channel: " + accessory.channel);
		var theseCommands = accessory.commands.slice();
		logIt("Using commands: "+ JSON.stringify(theseCommands));
   		tivo.sendCommands(accessory.tivoConfig, theseCommands, function(responses) {
			logIt("Responses: " + JSON.stringify(responses));
        	callback();
        	logIt("Back from callback");
			accessory.service.getCharacteristic(Characteristic.On).updateValue(false);
			logIt("Should now be back off");
    	});
	} else {
		logIt("Skipping action for OFF");
		accessory.service.getCharacteristic(Characteristic.On).updateValue(false);
	}
	logIt("_setOn exiting");
};

