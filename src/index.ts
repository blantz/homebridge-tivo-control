"use strict";
const settings_1 = require("./settings");
const platform_1 = require("./platform");

/**
 * This method registers the platform with Homebridge
 */
module.exports = (api) => {
    api.registerPlatform(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, platform_1.TivoPlatform);
}