/**
 * @name HideStreamPreview
 * @author blurrpy
 * @description Hide your own stream preview in multistream calls.
 * @version 0.0.3
 * @authorLink https://github.com/danegottwald
 * @website https://github.com/danegottwald
 * @donate https://www.paypal.com/paypalme/danegottwald
 * @source https://raw.githubusercontent.com/danegottwald/BetterDiscordPlugins/main/HideStreamPreview/HideStreamPreview.plugin.js
 */

const fs = require("fs");
const path = require("path");
const request = require("request");

const config = {
    "info": {
        "name": "HideStreamPreview",
        "authors": [{
            "name": "blurrpy",
            "discord_id": "154401402263699457",
            "github_username": "danegottwald"
        }],
        "version": "0.0.3",
        "description": "Hide your own stream preview when screen sharing with multiple users",
        "github": "",
        "github_raw": ""
    },
    "changelog": [
        //{"title": "New Stuff", "items": ["Added more settings", "Added changelog"]},
    ],
    "main": "HideStreamPreview.js"
};

var settings = {
    "showWhenLowStreams": {
        "title": "Show Own Stream At Low Stream Count (1-2 streams)",
        "description": "Displays stream preview when there are less than 3 active streams",
        "value": true
    }
}

module.exports = !global.ZeresPluginLibrary ? class {
    constructor() {
        this._config = config;
    }

    load() {
        BdApi.showConfirmationModal("Library plugin is needed",
            `ZeresPluginLibrary is missing. Please click Download Now to install it.`, {
            confirmText: "Download",
            cancelText: "Cancel",
            onConfirm: () => {
                request.get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", (error, response, body) => {
                    if (error) {
                        return electron.shell.openExternal("https://github.com/rauenzi/BDPluginLibrary");
                    }
                    fs.writeFileSync(path.join(BdApi.Plugins.folder, "HideStreamPreview.plugin.js"), body);
                });
            }
        });
    }

    start() { }

    stop() { }

    } : (([Plugin, Library]) => {
    const { DiscordAPI, DiscordModules : { StreamStore }, Patcher, PluginUtilities, Logger } = Library;

    return class HideStreamPreview extends Plugin {
        load() {
        }

        unload() {
        }

        onStart() {
            // Check for Plugin Updates
            ZLibrary.PluginUpdater.checkForUpdate(this.getName(), this.getVersion(), "https://raw.githubusercontent.com/danegottwald/BetterDiscordPlugins/main/HideStreamPreview/HideStreamPreview.plugin.js");

            Patcher.before(Logger, "log", (t, a) => {
                a[0] = "Patched Message: " + a[0];
            });
            
            // Load Settings from Config on Startup
            Object.entries(PluginUtilities.loadData("HideStreamPreview", "settings", {})).forEach(([setting, value]) => {
                settings[setting]["value"] = value
            });
        }

        onStop() {
            Patcher.unpatchAll();
        }

        getSettingsPanel () {
            var panel = new Library.Settings.SettingPanel();
            Object.entries(settings).forEach(([setting, content]) => {
                panel.append(
                    new Library.Settings.Switch(
                        content["title"], content["description"], content["value"], 
                        (val) => {
                            settings[setting]["value"] = val;
                            PluginUtilities.saveSettings("HideStreamPreview", { [setting]: val });
                        }
                    )
                );
            });
                
            return panel.getElement();
        }

        // Hide stream preview when the wrapper for the video tiles is targeted
        observer(e) {
            if (e.target.className.includes("previewWrapper")) {
               this._hideStreamPreview();
            }
        }

        _hideStreamPreview() {
            // Only hide stream preview if there are three or more streams OR if setting is false
            if (!settings["showWhenLowStreams"]["value"] || StreamStore.getAllActiveStreams().length >= 3) {
                let element = Array.from(document.getElementsByTagName('span')).find(span =>
                    ((span.textContent == DiscordAPI.currentUser.discordObject.username || 
                        span.textContent == DiscordAPI.currentGuild.members[0].nickname) &&
                        span.className.includes("overlayTitleText"))
                )
                if (element) {
                    while (element.parentElement && !element.parentElement.classList.contains("tile-kezkfV")) {
                        element = element.parentElement;
                    }
                    if (element.parentElement != null) {
                        element.parentElement.style.display = "none";
                    }
                }
            }
        }

    };

})(global.ZeresPluginLibrary.buildPlugin(config));
