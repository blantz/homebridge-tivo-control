# homebridge-tivo-control

A Homebridge plugin for defining switches to control a TiVo set top box.

# Features
This plugin allows you to define multiple Tivo devices, each with there own set
of momentary contact switches (buttons) that will send remote control commands
to the defined Tivo unit. The results are the same as pressing specific buttons on the
Tivo's remote.

The first type of switches are for changing the channel on the Tivo.
You supply a name for the switch, and the channel number.

The second style allow you to send any supported
IR codes to Tivo. There are many defined IR codes
available. See this web page: 
> https://www.tivocommunity.com/threads/tivo-ui-control-via-telnet-no-hacking-required.392385/

The last type are switches predefined to common actions, such as pausing a recording,
etc. Currently only four of these are defined, Play, Pause, Standby and Resume.
# Installation

1. Install homebridge using: `npm install -g homebridge`
2. Install this plugin using: `npm install -g homebridge-tivo-control`
3. Add one (or more) tivo switch accessories. See below for an example.

# Configuration

Configuration sample:

```
{
  "platform": "TivoControl",
  "debug": false,
  "devices": [
    {
      "name": "Living Room TiVo",
      "ip": "192.168.1.100",
      "port": 31339,
      "channels": [
        {
          "name": "tivo-NBC",
          "channel": 1008
        }
      ],
      "custom": [
        {
          "name": "Live TV",
          "commands": "IRCODE LIVETV"
        }
      ],
      "play": false,
      "play-name": "Play Tivo",
      "pause": false,
      "pause-name": "Pause Tivo",
      "standby": false,
      "standby-name": "Tivo Standby",
      "resume": false,
      "resume-name": "Tivo Resume"
    }
  ]
}

```
