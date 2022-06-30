# homebridge-tivo-channels

A Homebridge plugin for defining switches to control a TiVo set top box.

# Installation

1. Install homebridge using: `npm install -g homebridge`
2. Install this plugin using: `npm install -g homebridge-tivo-channels`
3. Add one (or more) tivo switch accessories. See below for an example.

# Configuration

Configuration sample:

```
"accessories": [
  {
    "accessory": "tivo",
    "name": "Living Room TiVo",
    "ip": "192.168.1.100",
    "port": 31339,
    "channel": 1008
  }
]
```
