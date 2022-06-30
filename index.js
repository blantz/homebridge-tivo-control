"use strict";

var net = require('net');
var util = require('util');

var tivo = require('node-tivo');

var Service, Characteristic;

var channel = 2;
var verbose = false;
var commands = [];

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-tivo-bal", "Tivo Channels", TiVoAccessory);
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

	if (config['channel'] != null) {
		channel = "" + config['channel'];
	}

	if (config['debug'] != null) {
		verbose = config['debug'];
	}
	console.log("Verbose: " + verbose);
	
	makeCommands(channel);
 
	
    this.service = new Service.Switch(this.name);
    this.service
        .getCharacteristic(Characteristic.On)        
        .on('get', this._getOn.bind(this))
        .on('set', this._setOn.bind(this))
        .updateValue(false);
}

function logIt (message) {
	if (verbose) {
		console.log(message);
	}
}

function makeCommands (thisChannel) {
	logIt("Using channel: " + thisChannel);
	
	commands = [];
	for (let character of thisChannel) {
		commands.push("IRCODE NUM" + character);
	}
	
	logIt("CMD: " + JSON.stringify(commands));
	
	// define the required commands
//	commands = ['SETCH 1008'];
}

TiVoAccessory.prototype.getServices = function() {
    var informationService = new Service.AccessoryInformation();
    informationService
        .setCharacteristic(Characteristic.Name, this.name)
        .setCharacteristic(Characteristic.Manufacturer, 'TiVo')
        .setCharacteristic(Characteristic.Model, '1.0.0')
        .setCharacteristic(Characteristic.SerialNumber, this.ip);
    return [this.service, informationService];
};

TiVoAccessory.prototype._getOn = function(callback) {
    var accessory = this;
	logIt("Returning state = false");
    callback(null, false);
};

TiVoAccessory.prototype._setOn = function(on, callback) {
    var accessory = this;
    if (on) {
	var theseCommands = commands.slice();
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

