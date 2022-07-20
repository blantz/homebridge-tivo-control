# homebridge-tivo-control
[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)

A Homebridge plugin for defining switches to control a TiVo set top box.
> NOTE: Tivo has a Remote Control feature that needs to be enabled in the
> Settings, in order for this plugin to be able to communicate with the Tivo.
>
> Look for it in the Remote Control page and enable it.

# Features
This plugin allows you to define multiple Tivo devices, each with there own set
of momentary contact switches (buttons) that will send remote control commands
to the defined Tivo unit. The results are the same as pressing specific buttons on the
Tivo's remote.

The first type of switches are for changing the channel on the Tivo.
You supply a name for the switch, and the channel number.

The second style allow you to send any supported
IR codes to Tivo. There are many defined IR codes
available. See more
[information here](doc/README.md). 

The last type are switches predefined to common actions, such as pausing a recording,
etc. Currently only four of these are defined, Play, and Pause.
# Installation

1. Install homebridge using: `npm install -g homebridge`
2. Install this plugin using: `npm install -g homebridge-tivo-control`
3. Add one (or more) Tivo switch accessories. See below for examples.

# Sample Configuration

The following is a configuration example:

```
{
  "bridge": {
    "name": "Homebridge",
    "username": "....",
    "port": 0,
    "pin": "....."
  },
  "description": ".....",
  "platforms": [
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
          "predefined": {
            "play": {
                "enabled": true,
                "name": "Play Tivo"
            },
            "pause": {
                "enabled": false,
                "name": "Pause Tivo"
            }
          }
        }
      ]
    }
  ],
  "accessories": []
}
```
