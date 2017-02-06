(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var clickoverlay_1 = require("./clickoverlay");
/**
 * A simple click capture overlay for clickThroughUrls of ads.
 */
var AdClickOverlay = (function (_super) {
    __extends(AdClickOverlay, _super);
    function AdClickOverlay() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AdClickOverlay.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        var self = this;
        var clickThroughUrl = null;
        var clickThroughEnabled = !player.getConfig().advertising
            || !player.getConfig().advertising.hasOwnProperty('clickThroughEnabled')
            || player.getConfig().advertising.clickThroughEnabled;
        player.addEventHandler(bitmovin.player.EVENT.ON_AD_STARTED, function (event) {
            clickThroughUrl = event.clickThroughUrl;
            if (clickThroughEnabled) {
                self.setUrl(clickThroughUrl);
            }
            else {
                // If click-through is disabled, we set the url to null to avoid it open
                self.setUrl(null);
            }
        });
        // Clear click-through URL when ad has finished
        var adFinishedHandler = function () {
            self.setUrl(null);
        };
        player.addEventHandler(bitmovin.player.EVENT.ON_AD_FINISHED, adFinishedHandler);
        player.addEventHandler(bitmovin.player.EVENT.ON_AD_SKIPPED, adFinishedHandler);
        self.onClick.subscribe(function () {
            // Pause the ad when overlay is clicked
            player.pause('ui-content-click');
            // Notify the player of the clicked ad
            player.fireEvent(bitmovin.player.EVENT.ON_AD_CLICKED, {
                clickThroughUrl: clickThroughUrl
            });
        });
    };
    return AdClickOverlay;
}(clickoverlay_1.ClickOverlay));
exports.AdClickOverlay = AdClickOverlay;

},{"./clickoverlay":11}],2:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var label_1 = require("./label");
var utils_1 = require("../utils");
/**
 * A label that displays a message about a running ad, optionally with a countdown.
 */
var AdMessageLabel = (function (_super) {
    __extends(AdMessageLabel, _super);
    function AdMessageLabel(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-label-ad-message',
            text: 'This ad will end in {remainingTime} seconds.'
        }, _this.config);
        return _this;
    }
    AdMessageLabel.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        var self = this;
        var text = this.getConfig().text;
        var updateMessageHandler = function () {
            self.setText(utils_1.StringUtils.replaceAdMessagePlaceholders(text, null, player));
        };
        var adStartHandler = function (event) {
            text = event.adMessage || text;
            updateMessageHandler();
            player.addEventHandler(bitmovin.player.EVENT.ON_TIME_CHANGED, updateMessageHandler);
            player.addEventHandler(bitmovin.player.EVENT.ON_CAST_TIME_UPDATED, updateMessageHandler);
        };
        var adEndHandler = function () {
            player.removeEventHandler(bitmovin.player.EVENT.ON_TIME_CHANGED, updateMessageHandler);
            player.removeEventHandler(bitmovin.player.EVENT.ON_CAST_TIME_UPDATED, updateMessageHandler);
        };
        player.addEventHandler(bitmovin.player.EVENT.ON_AD_STARTED, adStartHandler);
        player.addEventHandler(bitmovin.player.EVENT.ON_AD_SKIPPED, adEndHandler);
        player.addEventHandler(bitmovin.player.EVENT.ON_AD_FINISHED, adEndHandler);
    };
    return AdMessageLabel;
}(label_1.Label));
exports.AdMessageLabel = AdMessageLabel;

},{"../utils":51,"./label":20}],3:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var button_1 = require("./button");
var utils_1 = require("../utils");
/**
 * A button that is displayed during ads and can be used to skip the ad.
 */
var AdSkipButton = (function (_super) {
    __extends(AdSkipButton, _super);
    function AdSkipButton(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-button-ad-skip',
            skipMessage: {
                countdown: 'Skip ad in {remainingTime}',
                skip: 'Skip ad'
            }
        }, _this.config);
        return _this;
    }
    AdSkipButton.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        var self = this;
        var config = this.getConfig(); // TODO get rid of generic cast
        var skipMessage = config.skipMessage;
        var adEvent = null;
        var updateSkipMessageHandler = function () {
            // Display this button only if ad is skippable
            if (adEvent.skipOffset) {
                self.show();
            }
            else {
                self.hide();
            }
            // Update the skip message on the button
            if (player.getCurrentTime() < adEvent.skipOffset) {
                self.setText(utils_1.StringUtils.replaceAdMessagePlaceholders(config.skipMessage.countdown, adEvent.skipOffset, player));
            }
            else {
                self.setText(config.skipMessage.skip);
            }
        };
        var adStartHandler = function (event) {
            adEvent = event;
            skipMessage = adEvent.skipMessage || skipMessage;
            updateSkipMessageHandler();
            player.addEventHandler(bitmovin.player.EVENT.ON_TIME_CHANGED, updateSkipMessageHandler);
            player.addEventHandler(bitmovin.player.EVENT.ON_CAST_TIME_UPDATED, updateSkipMessageHandler);
        };
        var adEndHandler = function () {
            player.removeEventHandler(bitmovin.player.EVENT.ON_TIME_CHANGED, updateSkipMessageHandler);
            player.removeEventHandler(bitmovin.player.EVENT.ON_CAST_TIME_UPDATED, updateSkipMessageHandler);
        };
        player.addEventHandler(bitmovin.player.EVENT.ON_AD_STARTED, adStartHandler);
        player.addEventHandler(bitmovin.player.EVENT.ON_AD_SKIPPED, adEndHandler);
        player.addEventHandler(bitmovin.player.EVENT.ON_AD_FINISHED, adEndHandler);
        self.onClick.subscribe(function () {
            // Try to skip the ad (this only works if it is skippable so we don't need to take extra care of that here)
            player.skipAd();
        });
    };
    return AdSkipButton;
}(button_1.Button));
exports.AdSkipButton = AdSkipButton;

},{"../utils":51,"./button":7}],4:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var selectbox_1 = require("./selectbox");
/**
 * A select box providing a selection between 'auto' and the available audio qualities.
 */
var AudioQualitySelectBox = (function (_super) {
    __extends(AudioQualitySelectBox, _super);
    function AudioQualitySelectBox(config) {
        if (config === void 0) { config = {}; }
        return _super.call(this, config) || this;
    }
    AudioQualitySelectBox.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        var self = this;
        var updateAudioQualities = function () {
            var audioQualities = player.getAvailableAudioQualities();
            self.clearItems();
            // Add entry for automatic quality switching (default setting)
            self.addItem('auto', 'auto');
            // Add audio qualities
            for (var _i = 0, audioQualities_1 = audioQualities; _i < audioQualities_1.length; _i++) {
                var audioQuality = audioQualities_1[_i];
                self.addItem(audioQuality.id, audioQuality.label);
            }
        };
        self.onItemSelected.subscribe(function (sender, value) {
            player.setAudioQuality(value);
        });
        // Update qualities when audio track has changed
        player.addEventHandler(bitmovin.player.EVENT.ON_AUDIO_CHANGED, updateAudioQualities);
        // Update qualities when source goes away
        player.addEventHandler(bitmovin.player.EVENT.ON_SOURCE_UNLOADED, updateAudioQualities);
        // Update qualities when a new source is loaded
        player.addEventHandler(bitmovin.player.EVENT.ON_READY, updateAudioQualities);
        // Update quality selection when quality is changed (from outside)
        player.addEventHandler(bitmovin.player.EVENT.ON_AUDIO_DOWNLOAD_QUALITY_CHANGED, function () {
            var data = player.getDownloadedAudioData();
            self.selectItem(data.isAuto ? 'auto' : data.id);
        });
        // Populate qualities at startup
        updateAudioQualities();
    };
    return AudioQualitySelectBox;
}(selectbox_1.SelectBox));
exports.AudioQualitySelectBox = AudioQualitySelectBox;

},{"./selectbox":30}],5:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var selectbox_1 = require("./selectbox");
/**
 * A select box providing a selection between available audio tracks (e.g. different languages).
 */
var AudioTrackSelectBox = (function (_super) {
    __extends(AudioTrackSelectBox, _super);
    function AudioTrackSelectBox(config) {
        if (config === void 0) { config = {}; }
        return _super.call(this, config) || this;
    }
    AudioTrackSelectBox.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        var self = this;
        var updateAudioTracks = function () {
            var audioTracks = player.getAvailableAudio();
            self.clearItems();
            // Add audio tracks
            for (var _i = 0, audioTracks_1 = audioTracks; _i < audioTracks_1.length; _i++) {
                var audioTrack = audioTracks_1[_i];
                self.addItem(audioTrack.id, audioTrack.label);
            }
        };
        self.onItemSelected.subscribe(function (sender, value) {
            player.setAudio(value);
        });
        var audioTrackHandler = function () {
            var currentAudioTrack = player.getAudio();
            self.selectItem(currentAudioTrack.id);
        };
        // Update selection when selected track has changed
        player.addEventHandler(bitmovin.player.EVENT.ON_AUDIO_CHANGED, audioTrackHandler);
        // Update tracks when source goes away
        player.addEventHandler(bitmovin.player.EVENT.ON_SOURCE_UNLOADED, updateAudioTracks);
        // Update tracks when a new source is loaded
        player.addEventHandler(bitmovin.player.EVENT.ON_READY, updateAudioTracks);
        // Populate tracks at startup
        updateAudioTracks();
    };
    return AudioTrackSelectBox;
}(selectbox_1.SelectBox));
exports.AudioTrackSelectBox = AudioTrackSelectBox;

},{"./selectbox":30}],6:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var container_1 = require("./container");
var component_1 = require("./component");
/**
 * Overlays the player and displays a buffering indicator.
 */
var BufferingOverlay = (function (_super) {
    __extends(BufferingOverlay, _super);
    function BufferingOverlay(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.indicators = [
            new component_1.Component({ tag: 'div', cssClass: 'ui-buffering-overlay-indicator' }),
            new component_1.Component({ tag: 'div', cssClass: 'ui-buffering-overlay-indicator' }),
            new component_1.Component({ tag: 'div', cssClass: 'ui-buffering-overlay-indicator' }),
        ];
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-buffering-overlay',
            hidden: true,
            components: _this.indicators
        }, _this.config);
        return _this;
    }
    BufferingOverlay.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        var self = this;
        player.addEventHandler(bitmovin.player.EVENT.ON_STALL_STARTED, function () {
            self.show();
        });
        player.addEventHandler(bitmovin.player.EVENT.ON_STALL_ENDED, function () {
            self.hide();
        });
    };
    return BufferingOverlay;
}(container_1.Container));
exports.BufferingOverlay = BufferingOverlay;

},{"./component":13,"./container":14}],7:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var component_1 = require("./component");
var dom_1 = require("../dom");
var eventdispatcher_1 = require("../eventdispatcher");
/**
 * A simple clickable button.
 */
var Button = (function (_super) {
    __extends(Button, _super);
    function Button(config) {
        var _this = _super.call(this, config) || this;
        _this.buttonEvents = {
            onClick: new eventdispatcher_1.EventDispatcher()
        };
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-button'
        }, _this.config);
        return _this;
    }
    Button.prototype.toDomElement = function () {
        var self = this;
        // Create the button element with the text label
        var buttonElement = new dom_1.DOM('button', {
            'type': 'button',
            'id': this.config.id,
            'class': this.getCssClasses()
        }).append(new dom_1.DOM('span', {
            'class': this.prefixCss('label')
        }).html(this.config.text));
        // Listen for the click event on the button element and trigger the corresponding event on the button component
        buttonElement.on('click', function () {
            self.onClickEvent();
        });
        return buttonElement;
    };
    /**
     * Sets text on the label of the button.
     * @param text the text to put into the label of the button
     */
    Button.prototype.setText = function (text) {
        this.getDomElement().find('.' + this.prefixCss('label')).html(text);
    };
    Button.prototype.onClickEvent = function () {
        this.buttonEvents.onClick.dispatch(this);
    };
    Object.defineProperty(Button.prototype, "onClick", {
        /**
         * Gets the event that is fired when the button is clicked.
         * @returns {Event<Button<Config>, NoArgs>}
         */
        get: function () {
            return this.buttonEvents.onClick.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    return Button;
}(component_1.Component));
exports.Button = Button;

},{"../dom":45,"../eventdispatcher":46,"./component":13}],8:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var container_1 = require("./container");
var label_1 = require("./label");
/**
 * Overlays the player and displays the status of a Cast session.
 */
var CastStatusOverlay = (function (_super) {
    __extends(CastStatusOverlay, _super);
    function CastStatusOverlay(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.statusLabel = new label_1.Label({ cssClass: 'ui-cast-status-label' });
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-cast-status-overlay',
            components: [_this.statusLabel],
            hidden: true
        }, _this.config);
        return _this;
    }
    CastStatusOverlay.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        var self = this;
        var castDeviceName = 'unknown';
        player.addEventHandler(bitmovin.player.EVENT.ON_CAST_START, function (event) {
            // Show Cast status when a session is being started
            self.show();
            self.statusLabel.setText('Select a Cast device');
        });
        player.addEventHandler(bitmovin.player.EVENT.ON_CAST_WAITING_FOR_DEVICE, function (event) {
            // Get device name and update status text while connecting
            castDeviceName = event.castPayload.deviceName;
            self.statusLabel.setText("Connecting to <strong>" + castDeviceName + "</strong>...");
        });
        player.addEventHandler(bitmovin.player.EVENT.ON_CAST_STARTED, function (event) {
            // Session is started or resumed
            // For cases when a session is resumed, we do not receive the previous events and therefore show the status panel
            // here too
            self.show();
            self.statusLabel.setText("Playing on <strong>" + castDeviceName + "</strong>");
        });
        player.addEventHandler(bitmovin.player.EVENT.ON_CAST_STOPPED, function (event) {
            // Cast session gone, hide the status panel
            self.hide();
        });
    };
    return CastStatusOverlay;
}(container_1.Container));
exports.CastStatusOverlay = CastStatusOverlay;

},{"./container":14,"./label":20}],9:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var togglebutton_1 = require("./togglebutton");
/**
 * A button that toggles casting to a Cast receiver.
 */
var CastToggleButton = (function (_super) {
    __extends(CastToggleButton, _super);
    function CastToggleButton(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-casttogglebutton',
            text: 'Google Cast'
        }, _this.config);
        return _this;
    }
    CastToggleButton.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        var self = this;
        self.onClick.subscribe(function () {
            if (player.isCastAvailable()) {
                if (player.isCasting()) {
                    player.castStop();
                }
                else {
                    player.castVideo();
                }
            }
            else {
                if (console) {
                    console.log('Cast unavailable');
                }
            }
        });
        var castAvailableHander = function () {
            if (player.isCastAvailable()) {
                self.show();
            }
            else {
                self.hide();
            }
        };
        player.addEventHandler(bitmovin.player.EVENT.ON_CAST_AVAILABLE, castAvailableHander);
        // Toggle button 'on' state
        player.addEventHandler(bitmovin.player.EVENT.ON_CAST_STARTED, function () {
            self.on();
        });
        player.addEventHandler(bitmovin.player.EVENT.ON_CAST_STOPPED, function () {
            self.off();
        });
        // Startup init
        castAvailableHander(); // Hide button if Cast not available
        if (player.isCasting()) {
            self.on();
        }
    };
    return CastToggleButton;
}(togglebutton_1.ToggleButton));
exports.CastToggleButton = CastToggleButton;

},{"./togglebutton":36}],10:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var uicontainer_1 = require("./uicontainer");
var timeout_1 = require("../timeout");
/**
 * The base container for Cast receivers that contains all of the UI and takes care that the UI is shown on
 * certain playback events.
 */
var CastUIContainer = (function (_super) {
    __extends(CastUIContainer, _super);
    function CastUIContainer(config) {
        return _super.call(this, config) || this;
    }
    CastUIContainer.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        var self = this;
        var config = this.getConfig();
        /*
         * Show UI on Cast devices at certain playback events
         *
         * Since a Cast receiver does not have a direct HCI, we show the UI on certain playback events to give the user
         * a chance to see on the screen what's going on, e.g. on play/pause or a seek the UI is shown and the user can
         * see the current time and position on the seek bar.
         * The UI is shown permanently while playback is paused, otherwise hides automatically after the configured
         * hide delay time.
         */
        var isUiShown = false;
        var hideUi = function () {
            uimanager.onControlsHide.dispatch(self);
            isUiShown = false;
        };
        var uiHideTimeout = new timeout_1.Timeout(config.hideDelay, hideUi);
        var showUi = function () {
            if (!isUiShown) {
                uimanager.onControlsShow.dispatch(self);
                isUiShown = true;
            }
        };
        var showUiPermanently = function () {
            showUi();
            uiHideTimeout.clear();
        };
        var showUiWithTimeout = function () {
            showUi();
            uiHideTimeout.start();
        };
        var showUiAfterSeek = function () {
            if (player.isPlaying()) {
                showUiWithTimeout();
            }
            else {
                showUiPermanently();
            }
        };
        player.addEventHandler(bitmovin.player.EVENT.ON_READY, showUiWithTimeout);
        player.addEventHandler(bitmovin.player.EVENT.ON_SOURCE_LOADED, showUiWithTimeout);
        player.addEventHandler(bitmovin.player.EVENT.ON_PLAY, showUiWithTimeout);
        player.addEventHandler(bitmovin.player.EVENT.ON_PAUSED, showUiPermanently);
        player.addEventHandler(bitmovin.player.EVENT.ON_SEEK, showUiPermanently);
        player.addEventHandler(bitmovin.player.EVENT.ON_SEEKED, showUiAfterSeek);
    };
    return CastUIContainer;
}(uicontainer_1.UIContainer));
exports.CastUIContainer = CastUIContainer;

},{"../timeout":49,"./uicontainer":38}],11:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var button_1 = require("./button");
/**
 * A click overlay that opens an url in a new tab if clicked.
 */
var ClickOverlay = (function (_super) {
    __extends(ClickOverlay, _super);
    function ClickOverlay(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-clickoverlay'
        }, _this.config);
        return _this;
    }
    ClickOverlay.prototype.initialize = function () {
        _super.prototype.initialize.call(this);
        this.setUrl(this.config.url);
        var element = this.getDomElement();
        element.on('click', function () {
            if (element.data('url')) {
                window.open(element.data('url'), '_blank');
            }
        });
    };
    /**
     * Gets the URL that should be followed when the watermark is clicked.
     * @returns {string} the watermark URL
     */
    ClickOverlay.prototype.getUrl = function () {
        return this.getDomElement().data('url');
    };
    ClickOverlay.prototype.setUrl = function (url) {
        if (url === undefined || url == null) {
            url = '';
        }
        this.getDomElement().data('url', url);
    };
    return ClickOverlay;
}(button_1.Button));
exports.ClickOverlay = ClickOverlay;

},{"./button":7}],12:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var button_1 = require("./button");
/**
 * A button that closes (hides) a configured component.
 */
var CloseButton = (function (_super) {
    __extends(CloseButton, _super);
    function CloseButton(config) {
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-closebutton',
            text: 'Close'
        }, _this.config);
        return _this;
    }
    CloseButton.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        var config = this.getConfig();
        this.onClick.subscribe(function () {
            config.target.hide();
        });
    };
    return CloseButton;
}(button_1.Button));
exports.CloseButton = CloseButton;

},{"./button":7}],13:[function(require,module,exports){
"use strict";
var guid_1 = require("../guid");
var dom_1 = require("../dom");
var eventdispatcher_1 = require("../eventdispatcher");
/**
 * The base class of the UI framework.
 * Each component must extend this class and optionally the config interface.
 */
var Component = (function () {
    /**
     * Constructs a component with an optionally supplied config. All subclasses must call the constructor of their
     * superclass and then merge their configuration into the component's configuration.
     * @param config the configuration for the component
     */
    function Component(config) {
        if (config === void 0) { config = {}; }
        /**
         * The list of events that this component offers. These events should always be private and only directly
         * accessed from within the implementing component.
         *
         * Because TypeScript does not support private properties with the same name on different class hierarchy levels
         * (i.e. superclass and subclass cannot contain a private property with the same name), the default naming
         * convention for the event list of a component that should be followed by subclasses is the concatenation of the
         * camel-cased class name + 'Events' (e.g. SubClass extends Component => subClassEvents).
         * See {@link #componentEvents} for an example.
         *
         * Event properties should be named in camel case with an 'on' prefix and in the present tense. Async events may
         * have a start event (when the operation starts) in the present tense, and must have an end event (when the
         * operation ends) in the past tense (or present tense in special cases (e.g. onStart/onStarted or onPlay/onPlaying).
         * See {@link #componentEvents#onShow} for an example.
         *
         * Each event should be accompanied with a protected method named by the convention eventName + 'Event'
         * (e.g. onStartEvent), that actually triggers the event by calling {@link EventDispatcher#dispatch dispatch} and
         * passing a reference to the component as first parameter. Components should always trigger their events with these
         * methods. Implementing this pattern gives subclasses means to directly listen to the events by overriding the
         * method (and saving the overhead of passing a handler to the event dispatcher) and more importantly to trigger
         * these events without having access to the private event list.
         * See {@link #onShow} for an example.
         *
         * To provide external code the possibility to listen to this component's events (subscribe, unsubscribe, etc.),
         * each event should also be accompanied by a public getter function with the same name as the event's property,
         * that returns the {@link Event} obtained from the event dispatcher by calling {@link EventDispatcher#getEvent}.
         * See {@link #onShow} for an example.
         *
         * Full example for an event representing an example action in a example component:
         *
         * <code>
         * // Define an example component class with an example event
         * class ExampleComponent extends Component<ComponentConfig> {
           *
           *     private exampleComponentEvents = {
           *         onExampleAction: new EventDispatcher<ExampleComponent, NoArgs>()
           *     }
           *
           *     // constructor and other stuff...
           *
           *     protected onExampleActionEvent() {
           *        this.exampleComponentEvents.onExampleAction.dispatch(this);
           *    }
           *
           *    get onExampleAction(): Event<ExampleComponent, NoArgs> {
           *        return this.exampleComponentEvents.onExampleAction.getEvent();
           *    }
           * }
         *
         * // Create an instance of the component somewhere
         * var exampleComponentInstance = new ExampleComponent();
         *
         * // Subscribe to the example event on the component
         * exampleComponentInstance.onExampleAction.subscribe(function (sender: ExampleComponent) {
           *     console.log('onExampleAction of ' + sender + ' has fired!');
           * });
         * </code>
         */
        this.componentEvents = {
            onShow: new eventdispatcher_1.EventDispatcher(),
            onHide: new eventdispatcher_1.EventDispatcher()
        };
        // Create the configuration for this component
        this.config = this.mergeConfig(config, {
            tag: 'div',
            id: 'bmpui-id-' + guid_1.Guid.next(),
            cssPrefix: 'bmpui',
            cssClass: 'ui-component',
            cssClasses: [],
            hidden: false
        }, {});
    }
    /**
     * Initializes the component, e.g. by applying config settings.
     * This method must not be called from outside the UI framework.
     *
     * This method is automatically called by the {@link UIInstanceManager}. If the component is an inner component of
     * some component, and thus encapsulated abd managed internally and never directly exposed to the UIManager,
     * this method must be called from the managing component's {@link #initialize} method.
     */
    Component.prototype.initialize = function () {
        this.hidden = this.config.hidden;
        // Hide the component at initialization if it is configured to be hidden
        if (this.isHidden()) {
            this.hide();
        }
    };
    /**
     * Configures the component for the supplied Player and UIInstanceManager. This is the place where all the magic
     * happens, where components typically subscribe and react to events (on their DOM element, the Player, or the
     * UIInstanceManager), and basically everything that makes them interactive.
     * This method is called only once, when the UIManager initializes the UI.
     *
     * Subclasses usually overwrite this method to add their own functionality.
     *
     * @param player the player which this component controls
     * @param uimanager the UIInstanceManager that manages this component
     */
    Component.prototype.configure = function (player, uimanager) {
        var self = this;
        self.onShow.subscribe(function () {
            uimanager.onComponentShow.dispatch(self);
        });
        self.onHide.subscribe(function () {
            uimanager.onComponentHide.dispatch(self);
        });
    };
    /**
     * Generate the DOM element for this component.
     *
     * Subclasses usually overwrite this method to extend or replace the DOM element with their own design.
     */
    Component.prototype.toDomElement = function () {
        var element = new dom_1.DOM(this.config.tag, {
            'id': this.config.id,
            'class': this.getCssClasses()
        });
        return element;
    };
    /**
     * Returns the DOM element of this component. Creates the DOM element if it does not yet exist.
     *
     * Should not be overwritten by subclasses.
     *
     * @returns {DOM}
     */
    Component.prototype.getDomElement = function () {
        if (!this.element) {
            this.element = this.toDomElement();
        }
        return this.element;
    };
    /**
     * Merges a configuration with a default configuration and a base configuration from the superclass.
     *
     * @param config the configuration settings for the components, as usually passed to the constructor
     * @param defaults a default configuration for settings that are not passed with the configuration
     * @param base configuration inherited from a superclass
     * @returns {Config}
     */
    Component.prototype.mergeConfig = function (config, defaults, base) {
        // Extend default config with supplied config
        var merged = Object.assign({}, base, defaults, config);
        // Return the extended config
        return merged;
    };
    /**
     * Helper method that returns a string of all CSS classes of the component.
     *
     * @returns {string}
     */
    Component.prototype.getCssClasses = function () {
        var self = this;
        // Merge all CSS classes into single array
        var flattenedArray = [this.config.cssClass].concat(this.config.cssClasses);
        // Prefix classes
        flattenedArray = flattenedArray.map(function (css) {
            return self.prefixCss(css);
        });
        // Join array values into a string
        var flattenedString = flattenedArray.join(' ');
        // Return trimmed string to prevent whitespace at the end from the join operation
        return flattenedString.trim();
    };
    Component.prototype.prefixCss = function (cssClassOrId) {
        return this.config.cssPrefix + '-' + cssClassOrId;
    };
    /**
     * Returns the configuration object of the component.
     * @returns {Config}
     */
    Component.prototype.getConfig = function () {
        return this.config;
    };
    /**
     * Hides the component.
     * This method basically transfers the component into the hidden state. Actual hiding is done via CSS.
     */
    Component.prototype.hide = function () {
        this.hidden = true;
        this.getDomElement().addClass(this.prefixCss(Component.CLASS_HIDDEN));
        this.onHideEvent();
    };
    /**
     * Shows the component.
     */
    Component.prototype.show = function () {
        this.getDomElement().removeClass(this.prefixCss(Component.CLASS_HIDDEN));
        this.hidden = false;
        this.onShowEvent();
    };
    /**
     * Determines if the component is hidden.
     * @returns {boolean} true if the component is hidden, else false
     */
    Component.prototype.isHidden = function () {
        return this.hidden;
    };
    /**
     * Determines if the component is shown.
     * @returns {boolean} true if the component is visible, else false
     */
    Component.prototype.isShown = function () {
        return !this.isHidden();
    };
    /**
     * Toggles the hidden state by hiding the component if it is shown, or showing it if hidden.
     */
    Component.prototype.toggleHidden = function () {
        if (this.isHidden()) {
            this.show();
        }
        else {
            this.hide();
        }
    };
    /**
     * Fires the onShow event.
     * See the detailed explanation on event architecture onj the {@link #componentEvents events list}.
     */
    Component.prototype.onShowEvent = function () {
        this.componentEvents.onShow.dispatch(this);
    };
    /**
     * Fires the onHide event.
     * See the detailed explanation on event architecture onj the {@link #componentEvents events list}.
     */
    Component.prototype.onHideEvent = function () {
        this.componentEvents.onHide.dispatch(this);
    };
    Object.defineProperty(Component.prototype, "onShow", {
        /**
         * Gets the event that is fired when the component is showing.
         * See the detailed explanation on event architecture onj the {@link #componentEvents events list}.
         * @returns {Event<Component<Config>, NoArgs>}
         */
        get: function () {
            return this.componentEvents.onShow.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Component.prototype, "onHide", {
        /**
         * Gets the event that is fired when the component is hiding.
         * See the detailed explanation on event architecture onj the {@link #componentEvents events list}.
         * @returns {Event<Component<Config>, NoArgs>}
         */
        get: function () {
            return this.componentEvents.onHide.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    return Component;
}());
/**
 * The classname that is attached to the element when it is in the hidden state.
 * @type {string}
 */
Component.CLASS_HIDDEN = 'hidden';
exports.Component = Component;

},{"../dom":45,"../eventdispatcher":46,"../guid":47}],14:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var component_1 = require("./component");
var dom_1 = require("../dom");
var utils_1 = require("../utils");
/**
 * A container component that can contain a collection of child components.
 * Components can be added at construction time through the {@link ContainerConfig#components} setting, or later
 * through the {@link Container#addComponent} method. The UIManager automatically takes care of all components, i.e. it
 * initializes and configures them automatically.
 *
 * In the DOM, the container consists of an outer <div> (that can be configured by the config) and an inner wrapper
 * <div> that contains the components. This double-<div>-structure is often required to achieve many advanced effects
 * in CSS and/or JS, e.g. animations and certain formatting with absolute positioning.
 *
 * DOM example:
 * <code>
 *     <div class='ui-container'>
 *         <div class='container-wrapper'>
 *             ... child components ...
 *         </div>
 *     </div>
 * </code>
 */
var Container = (function (_super) {
    __extends(Container, _super);
    function Container(config) {
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-container',
            components: []
        }, _this.config);
        return _this;
    }
    /**
     * Adds a child component to the container.
     * @param component the component to add
     */
    Container.prototype.addComponent = function (component) {
        this.config.components.push(component);
    };
    /**
     * Removes a child component from the container.
     * @param component the component to remove
     * @returns {boolean} true if the component has been removed, false if it is not contained in this container
     */
    Container.prototype.removeComponent = function (component) {
        return utils_1.ArrayUtils.remove(this.config.components, component) != null;
    };
    /**
     * Gets an array of all child components in this container.
     * @returns {Component<ComponentConfig>[]}
     */
    Container.prototype.getComponents = function () {
        return this.config.components;
    };
    /**
     * Updates the DOM of the container with the current components.
     */
    Container.prototype.updateComponents = function () {
        this.innerContainerElement.empty();
        for (var _i = 0, _a = this.config.components; _i < _a.length; _i++) {
            var component = _a[_i];
            this.innerContainerElement.append(component.getDomElement());
        }
    };
    Container.prototype.toDomElement = function () {
        // Create the container element (the outer <div>)
        var containerElement = new dom_1.DOM(this.config.tag, {
            'id': this.config.id,
            'class': this.getCssClasses()
        });
        // Create the inner container element (the inner <div>) that will contain the components
        var innerContainer = new dom_1.DOM(this.config.tag, {
            'class': this.prefixCss('container-wrapper')
        });
        this.innerContainerElement = innerContainer;
        this.updateComponents();
        containerElement.append(innerContainer);
        return containerElement;
    };
    return Container;
}(component_1.Component));
exports.Container = Container;

},{"../dom":45,"../utils":51,"./component":13}],15:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var container_1 = require("./container");
/**
 * A container for main player control components, e.g. play toggle button, seek bar, volume control, fullscreen toggle
 * button.
 */
var ControlBar = (function (_super) {
    __extends(ControlBar, _super);
    function ControlBar(config) {
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-controlbar',
            hidden: true,
        }, _this.config);
        return _this;
    }
    ControlBar.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        var self = this;
        uimanager.onControlsShow.subscribe(function () {
            self.show();
        });
        uimanager.onControlsHide.subscribe(function () {
            self.hide();
        });
    };
    return ControlBar;
}(container_1.Container));
exports.ControlBar = ControlBar;

},{"./container":14}],16:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var container_1 = require("./container");
var label_1 = require("./label");
var tvnoisecanvas_1 = require("./tvnoisecanvas");
/**
 * Overlays the player and displays error messages.
 */
var ErrorMessageOverlay = (function (_super) {
    __extends(ErrorMessageOverlay, _super);
    function ErrorMessageOverlay(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.errorLabel = new label_1.Label({ cssClass: 'ui-errormessage-label' });
        _this.tvNoiseBackground = new tvnoisecanvas_1.TvNoiseCanvas();
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-errormessage-overlay',
            components: [_this.tvNoiseBackground, _this.errorLabel],
            hidden: true
        }, _this.config);
        return _this;
    }
    ErrorMessageOverlay.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        var self = this;
        player.addEventHandler(bitmovin.player.EVENT.ON_ERROR, function (event) {
            self.errorLabel.setText(event.message);
            self.tvNoiseBackground.start();
            self.show();
        });
    };
    return ErrorMessageOverlay;
}(container_1.Container));
exports.ErrorMessageOverlay = ErrorMessageOverlay;

},{"./container":14,"./label":20,"./tvnoisecanvas":37}],17:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var togglebutton_1 = require("./togglebutton");
/**
 * A button that toggles the player between windowed and fullscreen view.
 */
var FullscreenToggleButton = (function (_super) {
    __extends(FullscreenToggleButton, _super);
    function FullscreenToggleButton(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-fullscreentogglebutton',
            text: 'Fullscreen'
        }, _this.config);
        return _this;
    }
    FullscreenToggleButton.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        var self = this;
        var fullscreenStateHandler = function () {
            if (player.isFullscreen()) {
                self.on();
            }
            else {
                self.off();
            }
        };
        player.addEventHandler(bitmovin.player.EVENT.ON_FULLSCREEN_ENTER, fullscreenStateHandler);
        player.addEventHandler(bitmovin.player.EVENT.ON_FULLSCREEN_EXIT, fullscreenStateHandler);
        self.onClick.subscribe(function () {
            if (player.isFullscreen()) {
                var d = document;
                if (d.exitFullscreen) {
                    d.exitFullscreen();
                }
                else if (d.webkitExitFullscreen) {
                    d.webkitExitFullscreen();
                }
                else if (d.mozCancelFullScreen) {
                    d.mozCancelFullScreen();
                }
                else if (d.msExitFullscreen) {
                    d.msExitFullscreen();
                }
                player.fireEvent(bitmovin.player.EVENT.ON_FULLSCREEN_EXIT, { requested: true });
            }
            else {
                var el = player.getFigure().parentElement.parentElement;
                if (el.requestFullscreen) {
                    el.requestFullscreen();
                }
                else if (el.webkitRequestFullscreen) {
                    el.webkitRequestFullscreen();
                }
                else if (el.mozRequestFullScreen) {
                    el.mozRequestFullScreen();
                }
                else if (el.msRequestFullscreen) {
                    el.msRequestFullscreen();
                }
                player.fireEvent(bitmovin.player.EVENT.ON_FULLSCREEN_ENTER, { requested: true });
            }
        });
        // Startup init
        fullscreenStateHandler();
    };
    return FullscreenToggleButton;
}(togglebutton_1.ToggleButton));
exports.FullscreenToggleButton = FullscreenToggleButton;

},{"./togglebutton":36}],18:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var playbacktogglebutton_1 = require("./playbacktogglebutton");
var dom_1 = require("../dom");
/**
 * A button that overlays the video and toggles between playback and pause.
 */
var HugePlaybackToggleButton = (function (_super) {
    __extends(HugePlaybackToggleButton, _super);
    function HugePlaybackToggleButton(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-hugeplaybacktogglebutton',
            text: 'Play/Pause'
        }, _this.config);
        return _this;
    }
    HugePlaybackToggleButton.prototype.configure = function (player, uimanager) {
        // Update button state through API events
        _super.prototype.configure.call(this, player, uimanager, false);
        var self = this;
        var togglePlayback = function () {
            if (player.isPlaying()) {
                player.pause('ui-overlay');
            }
            else {
                player.play('ui-overlay');
            }
        };
        // let toggleFullscreen = function() {
        //   if (player.isFullscreen()) {
        //     player.exitFullscreen();
        //   } else {
        //     player.enterFullscreen();
        //   }
        // };
        // let firstClick = true;
        // let clickTime = 0;
        // let doubleClickTime = 0;
        /*
         * YouTube-style toggle button handling
         *
         * The goal is to prevent a short pause or playback interval between a click, that toggles playback, and a
         * double click, that toggles fullscreen. In this naive approach, the first click would e.g. start playback,
         * the second click would be detected as double click and toggle to fullscreen, and as second normal click stop
         * playback, which results is a short playback interval with max length of the double click detection
         * period (usually 500ms).
         *
         * To solve this issue, we defer handling of the first click for 200ms, which is almost unnoticeable to the user,
         * and just toggle playback if no second click (double click) has been registered during this period. If a double
         * click is registered, we just toggle the fullscreen. In the first 200ms, undesired playback changes thus cannot
         * happen. If a double click is registered within 500ms, we undo the playback change and switch fullscreen mode.
         * In the end, this method basically introduces a 200ms observing interval in which playback changes are prevented
         * if a double click happens.
         */
        self.onClick.subscribe(function () {
            togglePlayback();
            // Directly start playback on first click of the button.
            // This is a required workaround for mobile browsers where video playback needs to be triggered directly
            // by the user. A deferred playback start through the timeout below is not considered as user action and
            // therefore ignored by mobile browsers.
            // if (firstClick) {
            //   togglePlayback();
            //   firstClick = false;
            //   return;
            // }
            //
            // let now = Date.now();
            //
            // if (now - clickTime < 200) {
            //   // We have a double click inside the 200ms interval, just toggle fullscreen mode
            //   toggleFullscreen();
            //   doubleClickTime = now;
            //   return;
            // } else if (now - clickTime < 500) {
            //   // We have a double click inside the 500ms interval, undo playback toggle and toggle fullscreen mode
            //   toggleFullscreen();
            //   togglePlayback();
            //   doubleClickTime = now;
            //   return;
            // }
            //
            // clickTime = now;
            //
            // setTimeout(function() {
            //   if (Date.now() - doubleClickTime > 200) {
            //     // No double click detected, so we toggle playback and wait what happens next
            //     togglePlayback();
            //   }
            // }, 200);
        });
        // Hide button while initializing a Cast session
        var castInitializationHandler = function (event) {
            if (event.type === bitmovin.player.EVENT.ON_CAST_STARTED) {
                // Hide button when session is being initialized
                self.hide();
            }
            else {
                // Show button when session is established or initialization was aborted
                self.show();
            }
        };
        player.addEventHandler(bitmovin.player.EVENT.ON_CAST_START, castInitializationHandler);
        player.addEventHandler(bitmovin.player.EVENT.ON_CAST_STARTED, castInitializationHandler);
        player.addEventHandler(bitmovin.player.EVENT.ON_CAST_STOPPED, castInitializationHandler);
    };
    HugePlaybackToggleButton.prototype.toDomElement = function () {
        var buttonElement = _super.prototype.toDomElement.call(this);
        // Add child that contains the play button image
        // Setting the image directly on the button does not work together with scaling animations, because the button
        // can cover the whole video player are and scaling would extend it beyond. By adding an inner element, confined
        // to the size if the image, it can scale inside the player without overshooting.
        buttonElement.append(new dom_1.DOM('div', {
            'class': this.prefixCss('image')
        }));
        return buttonElement;
    };
    return HugePlaybackToggleButton;
}(playbacktogglebutton_1.PlaybackToggleButton));
exports.HugePlaybackToggleButton = HugePlaybackToggleButton;

},{"../dom":45,"./playbacktogglebutton":25}],19:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var button_1 = require("./button");
var dom_1 = require("../dom");
/**
 * A button to play/replay a video.
 */
var HugeReplayButton = (function (_super) {
    __extends(HugeReplayButton, _super);
    function HugeReplayButton(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-hugereplaybutton',
            text: 'Replay'
        }, _this.config);
        return _this;
    }
    HugeReplayButton.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        this.onClick.subscribe(function () {
            player.play('ui-overlay');
        });
    };
    HugeReplayButton.prototype.toDomElement = function () {
        var buttonElement = _super.prototype.toDomElement.call(this);
        // Add child that contains the play button image
        // Setting the image directly on the button does not work together with scaling animations, because the button
        // can cover the whole video player are and scaling would extend it beyond. By adding an inner element, confined
        // to the size if the image, it can scale inside the player without overshooting.
        buttonElement.append(new dom_1.DOM('div', {
            'class': this.prefixCss('image')
        }));
        return buttonElement;
    };
    return HugeReplayButton;
}(button_1.Button));
exports.HugeReplayButton = HugeReplayButton;

},{"../dom":45,"./button":7}],20:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var component_1 = require("./component");
var dom_1 = require("../dom");
var eventdispatcher_1 = require("../eventdispatcher");
/**
 * A simple text label.
 *
 * DOM example:
 * <code>
 *     <span class='ui-label'>...some text...</span>
 * </code>
 */
var Label = (function (_super) {
    __extends(Label, _super);
    function Label(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.labelEvents = {
            onClick: new eventdispatcher_1.EventDispatcher()
        };
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-label'
        }, _this.config);
        return _this;
    }
    Label.prototype.toDomElement = function () {
        var self = this;
        var labelElement = new dom_1.DOM('span', {
            'id': this.config.id,
            'class': this.getCssClasses()
        }).html(this.config.text);
        labelElement.on('click', function () {
            self.onClickEvent();
        });
        return labelElement;
    };
    /**
     * Set the text on this label.
     * @param text
     */
    Label.prototype.setText = function (text) {
        this.getDomElement().html(text);
    };
    /**
     * Clears the text on this label.
     */
    Label.prototype.clearText = function () {
        this.getDomElement().html('');
    };
    Label.prototype.onClickEvent = function () {
        this.labelEvents.onClick.dispatch(this);
    };
    Object.defineProperty(Label.prototype, "onClick", {
        /**
         * Gets the event that is fired when the label is clicked.
         * @returns {Event<Label<LabelConfig>, NoArgs>}
         */
        get: function () {
            return this.labelEvents.onClick.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    return Label;
}(component_1.Component));
exports.Label = Label;

},{"../dom":45,"../eventdispatcher":46,"./component":13}],21:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var component_1 = require("./component");
var eventdispatcher_1 = require("../eventdispatcher");
var utils_1 = require("../utils");
var ListSelector = (function (_super) {
    __extends(ListSelector, _super);
    function ListSelector(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.listSelectorEvents = {
            onItemAdded: new eventdispatcher_1.EventDispatcher(),
            onItemRemoved: new eventdispatcher_1.EventDispatcher(),
            onItemSelected: new eventdispatcher_1.EventDispatcher()
        };
        _this.config = _this.mergeConfig(config, {
            items: [],
            cssClass: 'ui-listselector'
        }, _this.config);
        _this.items = _this.config.items;
        return _this;
    }
    ListSelector.prototype.getItemIndex = function (key) {
        for (var index in this.items) {
            if (key === this.items[index].key) {
                return parseInt(index);
            }
        }
        return -1;
    };
    /**
     * Checks if the specified item is part of this selector.
     * @param key the key of the item to check
     * @returns {boolean} true if the item is part of this selector, else false
     */
    ListSelector.prototype.hasItem = function (key) {
        return this.getItemIndex(key) > -1;
    };
    /**
     * Adds an item to this selector by appending it to the end of the list of items. If an item with the specified
     * key already exists, it is replaced.
     * @param key the key of the item to add
     * @param label the (human-readable) label of the item to add
     */
    ListSelector.prototype.addItem = function (key, label) {
        this.removeItem(key); // Try to remove key first to get overwrite behavior and avoid duplicate keys
        this.items.push({ key: key, label: label });
        this.onItemAddedEvent(key);
    };
    /**
     * Removes an item from this selector.
     * @param key the key of the item to remove
     * @returns {boolean} true if removal was successful, false if the item is not part of this selector
     */
    ListSelector.prototype.removeItem = function (key) {
        var index = this.getItemIndex(key);
        if (index > -1) {
            utils_1.ArrayUtils.remove(this.items, this.items[index]);
            this.onItemRemovedEvent(key);
            return true;
        }
        return false;
    };
    /**
     * Selects an item from the items in this selector.
     * @param key the key of the item to select
     * @returns {boolean} true is the selection was successful, false if the selected item is not part of the selector
     */
    ListSelector.prototype.selectItem = function (key) {
        if (key === this.selectedItem) {
            // itemConfig is already selected, suppress any further action
            return true;
        }
        var index = this.getItemIndex(key);
        if (index > -1) {
            this.selectedItem = key;
            this.onItemSelectedEvent(key);
            return true;
        }
        return false;
    };
    /**
     * Returns the key of the selected item.
     * @returns {string} the key of the selected item or null if no item is selected
     */
    ListSelector.prototype.getSelectedItem = function () {
        return this.selectedItem;
    };
    /**
     * Removes all items from this selector.
     */
    ListSelector.prototype.clearItems = function () {
        var items = this.items; // local copy for iteration after clear
        this.items = []; // clear items
        // fire events
        for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
            var item = items_1[_i];
            this.onItemRemovedEvent(item.key);
        }
    };
    /**
     * Returns the number of items in this selector.
     * @returns {number}
     */
    ListSelector.prototype.itemCount = function () {
        return Object.keys(this.items).length;
    };
    ListSelector.prototype.onItemAddedEvent = function (key) {
        this.listSelectorEvents.onItemAdded.dispatch(this, key);
    };
    ListSelector.prototype.onItemRemovedEvent = function (key) {
        this.listSelectorEvents.onItemRemoved.dispatch(this, key);
    };
    ListSelector.prototype.onItemSelectedEvent = function (key) {
        this.listSelectorEvents.onItemSelected.dispatch(this, key);
    };
    Object.defineProperty(ListSelector.prototype, "onItemAdded", {
        /**
         * Gets the event that is fired when an item is added to the list of items.
         * @returns {Event<ListSelector<Config>, string>}
         */
        get: function () {
            return this.listSelectorEvents.onItemAdded.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ListSelector.prototype, "onItemRemoved", {
        /**
         * Gets the event that is fired when an item is removed from the list of items.
         * @returns {Event<ListSelector<Config>, string>}
         */
        get: function () {
            return this.listSelectorEvents.onItemRemoved.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ListSelector.prototype, "onItemSelected", {
        /**
         * Gets the event that is fired when an item is selected from the list of items.
         * @returns {Event<ListSelector<Config>, string>}
         */
        get: function () {
            return this.listSelectorEvents.onItemSelected.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    return ListSelector;
}(component_1.Component));
exports.ListSelector = ListSelector;

},{"../eventdispatcher":46,"../utils":51,"./component":13}],22:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var label_1 = require("./label");
/**
 * Enumerates the types of content that the {@link MetadataLabel} can display.
 */
var MetadataLabelContent;
(function (MetadataLabelContent) {
    /**
     * Title of the data source.
     */
    MetadataLabelContent[MetadataLabelContent["Title"] = 0] = "Title";
    /**
     * Description fo the data source.
     */
    MetadataLabelContent[MetadataLabelContent["Description"] = 1] = "Description";
})(MetadataLabelContent = exports.MetadataLabelContent || (exports.MetadataLabelContent = {}));
/**
 * A label that can be configured to display certain metadata.
 */
var MetadataLabel = (function (_super) {
    __extends(MetadataLabel, _super);
    function MetadataLabel(config) {
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClasses: ['label-metadata', 'label-metadata-' + MetadataLabelContent[config.content].toLowerCase()]
        }, _this.config);
        return _this;
    }
    MetadataLabel.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        var config = this.getConfig();
        var uiconfig = uimanager.getConfig();
        switch (config.content) {
            case MetadataLabelContent.Title:
                if (uiconfig && uiconfig.metadata && uiconfig.metadata.title) {
                    this.setText(uiconfig.metadata.title);
                }
                break;
            case MetadataLabelContent.Description:
                if (uiconfig && uiconfig.metadata && uiconfig.metadata.description) {
                    this.setText(uiconfig.metadata.description);
                }
                break;
        }
    };
    return MetadataLabel;
}(label_1.Label));
exports.MetadataLabel = MetadataLabel;

},{"./label":20}],23:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var selectbox_1 = require("./selectbox");
/**
 * A select box providing a selection of different playback speeds.
 */
var PlaybackSpeedSelectBox = (function (_super) {
    __extends(PlaybackSpeedSelectBox, _super);
    function PlaybackSpeedSelectBox(config) {
        if (config === void 0) { config = {}; }
        return _super.call(this, config) || this;
    }
    PlaybackSpeedSelectBox.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        var self = this;
        self.addItem('0.25', '0.25x');
        self.addItem('0.5', '0.5x');
        self.addItem('1', 'Normal');
        self.addItem('1.5', '1.5x');
        self.addItem('2', '2x');
        self.selectItem('1');
        self.onItemSelected.subscribe(function (sender, value) {
            player.setPlaybackSpeed(parseFloat(value));
        });
    };
    return PlaybackSpeedSelectBox;
}(selectbox_1.SelectBox));
exports.PlaybackSpeedSelectBox = PlaybackSpeedSelectBox;

},{"./selectbox":30}],24:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var label_1 = require("./label");
var utils_1 = require("../utils");
var TimeLabelMode;
(function (TimeLabelMode) {
    TimeLabelMode[TimeLabelMode["CurrentTime"] = 0] = "CurrentTime";
    TimeLabelMode[TimeLabelMode["TotalTime"] = 1] = "TotalTime";
    TimeLabelMode[TimeLabelMode["CurrentAndTotalTime"] = 2] = "CurrentAndTotalTime";
})(TimeLabelMode = exports.TimeLabelMode || (exports.TimeLabelMode = {}));
/**
 * A label that display the current playback time and the total time through {@link PlaybackTimeLabel#setTime setTime}
 * or any string through {@link PlaybackTimeLabel#setText setText}.
 */
var PlaybackTimeLabel = (function (_super) {
    __extends(PlaybackTimeLabel, _super);
    function PlaybackTimeLabel(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-playbacktimelabel',
            timeLabelMode: TimeLabelMode.CurrentAndTotalTime,
            hideInLivePlayback: false,
        }, _this.config);
        return _this;
    }
    PlaybackTimeLabel.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        var self = this;
        var config = self.getConfig();
        var live = false;
        var liveCssClass = self.prefixCss('ui-playbacktimelabel-live');
        var liveEdgeCssClass = self.prefixCss('ui-playbacktimelabel-live-edge');
        var minWidth = 0;
        var liveClickHandler = function () {
            player.timeShift(0);
        };
        var updateLiveState = function () {
            // Player is playing a live stream when the duration is infinite
            live = (player.getDuration() === Infinity);
            // Attach/detach live marker class
            if (live) {
                self.getDomElement().addClass(liveCssClass);
                self.setText('Live');
                if (config.hideInLivePlayback) {
                    self.hide();
                }
                self.onClick.subscribe(liveClickHandler);
                updateLiveTimeshiftState();
            }
            else {
                self.getDomElement().removeClass(liveCssClass);
                self.getDomElement().removeClass(liveEdgeCssClass);
                self.show();
                self.onClick.unsubscribe(liveClickHandler);
            }
        };
        var updateLiveTimeshiftState = function () {
            if (player.getTimeShift() === 0) {
                self.getDomElement().addClass(liveEdgeCssClass);
            }
            else {
                self.getDomElement().removeClass(liveEdgeCssClass);
            }
        };
        var playbackTimeHandler = function () {
            if ((player.getDuration() === Infinity) !== live) {
                updateLiveState();
            }
            if (!live) {
                self.setTime(player.getCurrentTime(), player.getDuration());
            }
            // To avoid 'jumping' in the UI by varying label sizes due to non-monospaced fonts,
            // we gradually increase the min-width with the content to reach a stable size.
            var width = self.getDomElement().width();
            if (width > minWidth) {
                minWidth = width;
                self.getDomElement().css({
                    'min-width': minWidth + 'px'
                });
            }
        };
        player.addEventHandler(bitmovin.player.EVENT.ON_TIME_CHANGED, playbackTimeHandler);
        player.addEventHandler(bitmovin.player.EVENT.ON_SEEKED, playbackTimeHandler);
        player.addEventHandler(bitmovin.player.EVENT.ON_CAST_TIME_UPDATED, playbackTimeHandler);
        player.addEventHandler(bitmovin.player.EVENT.ON_TIME_SHIFT, updateLiveTimeshiftState);
        player.addEventHandler(bitmovin.player.EVENT.ON_TIME_SHIFTED, updateLiveTimeshiftState);
        var init = function () {
            // Reset min-width when a new source is ready (especially for switching VOD/Live modes where the label content
            // changes)
            minWidth = 0;
            self.getDomElement().css({
                'min-width': null
            });
            // Set time format depending on source duration
            self.timeFormat = Math.abs(player.isLive() ? player.getMaxTimeShift() : player.getDuration()) >= 3600 ?
                utils_1.StringUtils.FORMAT_HHMMSS : utils_1.StringUtils.FORMAT_MMSS;
            // Update time after the format has been set
            playbackTimeHandler();
        };
        player.addEventHandler(bitmovin.player.EVENT.ON_READY, init);
        init();
    };
    /**
     * Sets the current playback time and total duration.
     * @param playbackSeconds the current playback time in seconds
     * @param durationSeconds the total duration in seconds
     */
    PlaybackTimeLabel.prototype.setTime = function (playbackSeconds, durationSeconds) {
        var currentTime = utils_1.StringUtils.secondsToTime(playbackSeconds, this.timeFormat);
        var totalTime = utils_1.StringUtils.secondsToTime(durationSeconds, this.timeFormat);
        switch (this.config.timeLabelMode) {
            case TimeLabelMode.CurrentTime:
                this.setText("" + currentTime);
                break;
            case TimeLabelMode.TotalTime:
                this.setText("" + totalTime);
                break;
            case TimeLabelMode.CurrentAndTotalTime:
                this.setText(currentTime + " / " + totalTime);
                break;
        }
    };
    return PlaybackTimeLabel;
}(label_1.Label));
exports.PlaybackTimeLabel = PlaybackTimeLabel;

},{"../utils":51,"./label":20}],25:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var togglebutton_1 = require("./togglebutton");
/**
 * A button that toggles between playback and pause.
 */
var PlaybackToggleButton = (function (_super) {
    __extends(PlaybackToggleButton, _super);
    function PlaybackToggleButton(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-playbacktogglebutton',
            text: 'Play/Pause'
        }, _this.config);
        return _this;
    }
    PlaybackToggleButton.prototype.configure = function (player, uimanager, handleClickEvent) {
        if (handleClickEvent === void 0) { handleClickEvent = true; }
        _super.prototype.configure.call(this, player, uimanager);
        var self = this;
        var isSeeking = false;
        // Handler to update button state based on player state
        var playbackStateHandler = function (event) {
            // If the UI is currently seeking, playback is temporarily stopped but the buttons should
            // not reflect that and stay as-is (e.g indicate playback while seeking).
            if (isSeeking) {
                return;
            }
            // TODO replace this hack with a sole player.isPlaying() call once issue #1203 is fixed
            var isPlaying = player.isPlaying();
            if (player.isCasting() && event &&
                (event.type === bitmovin.player.EVENT.ON_PLAY
                    || event.type === bitmovin.player.EVENT.ON_PAUSED
                    || event.type === bitmovin.player.EVENT.ON_CAST_PLAYING
                    || event.type === bitmovin.player.EVENT.ON_CAST_PAUSED)) {
                isPlaying = !isPlaying;
            }
            if (isPlaying) {
                self.on();
            }
            else {
                self.off();
            }
        };
        // Call handler upon these events
        player.addEventHandler(bitmovin.player.EVENT.ON_PLAY, playbackStateHandler);
        player.addEventHandler(bitmovin.player.EVENT.ON_PAUSED, playbackStateHandler);
        // when playback finishes, player turns to paused mode
        player.addEventHandler(bitmovin.player.EVENT.ON_PLAYBACK_FINISHED, playbackStateHandler);
        player.addEventHandler(bitmovin.player.EVENT.ON_CAST_STARTED, playbackStateHandler);
        player.addEventHandler(bitmovin.player.EVENT.ON_CAST_PLAYING, playbackStateHandler);
        player.addEventHandler(bitmovin.player.EVENT.ON_CAST_PAUSED, playbackStateHandler);
        player.addEventHandler(bitmovin.player.EVENT.ON_CAST_PLAYBACK_FINISHED, playbackStateHandler);
        if (handleClickEvent) {
            // Control player by button events
            // When a button event triggers a player API call, events are fired which in turn call the event handler
            // above that updated the button state.
            self.onClick.subscribe(function () {
                if (player.isPlaying()) {
                    player.pause('ui-button');
                }
                else {
                    player.play('ui-button');
                }
            });
        }
        // Track UI seeking status
        uimanager.onSeek.subscribe(function () {
            isSeeking = true;
        });
        uimanager.onSeeked.subscribe(function () {
            isSeeking = false;
        });
        // Startup init
        playbackStateHandler(null);
    };
    return PlaybackToggleButton;
}(togglebutton_1.ToggleButton));
exports.PlaybackToggleButton = PlaybackToggleButton;

},{"./togglebutton":36}],26:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var container_1 = require("./container");
var hugeplaybacktogglebutton_1 = require("./hugeplaybacktogglebutton");
/**
 * Overlays the player and displays error messages.
 */
var PlaybackToggleOverlay = (function (_super) {
    __extends(PlaybackToggleOverlay, _super);
    function PlaybackToggleOverlay(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.playbackToggleButton = new hugeplaybacktogglebutton_1.HugePlaybackToggleButton();
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-playbacktoggle-overlay',
            components: [_this.playbackToggleButton]
        }, _this.config);
        return _this;
    }
    return PlaybackToggleOverlay;
}(container_1.Container));
exports.PlaybackToggleOverlay = PlaybackToggleOverlay;

},{"./container":14,"./hugeplaybacktogglebutton":18}],27:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var container_1 = require("./container");
var component_1 = require("./component");
var dom_1 = require("../dom");
var utils_1 = require("../utils");
var hugereplaybutton_1 = require("./hugereplaybutton");
/**
 * Overlays the player and displays recommended videos.
 */
var RecommendationOverlay = (function (_super) {
    __extends(RecommendationOverlay, _super);
    function RecommendationOverlay(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.replayButton = new hugereplaybutton_1.HugeReplayButton();
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-recommendation-overlay',
            hidden: true,
            components: [_this.replayButton]
        }, _this.config);
        return _this;
    }
    RecommendationOverlay.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        var self = this;
        if (uimanager.getConfig().recommendations && uimanager.getConfig().recommendations.length > 0) {
            var index = 1;
            for (var _i = 0, _a = uimanager.getConfig().recommendations; _i < _a.length; _i++) {
                var item = _a[_i];
                this.addComponent(new RecommendationItem({
                    itemConfig: item,
                    cssClasses: ['recommendation-item-' + (index++)]
                }));
            }
            this.updateComponents(); // create container DOM elements
            this.getDomElement().addClass(this.prefixCss('recommendations'));
        }
        // Display recommendations when playback has finished
        player.addEventHandler(bitmovin.player.EVENT.ON_PLAYBACK_FINISHED, function () {
            // Dismiss ON_PLAYBACK_FINISHED events at the end of ads
            // TODO remove this workaround once issue #1278 is solved
            if (player.isAd()) {
                return;
            }
            self.show();
        });
        // Hide recommendations when playback starts, e.g. a restart
        player.addEventHandler(bitmovin.player.EVENT.ON_PLAY, function () {
            self.hide();
        });
    };
    return RecommendationOverlay;
}(container_1.Container));
exports.RecommendationOverlay = RecommendationOverlay;
/**
 * An item of the {@link RecommendationOverlay}. Used only internally in {@link RecommendationOverlay}.
 */
var RecommendationItem = (function (_super) {
    __extends(RecommendationItem, _super);
    function RecommendationItem(config) {
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-recommendation-item',
            itemConfig: null // this must be passed in from outside
        }, _this.config);
        return _this;
    }
    RecommendationItem.prototype.toDomElement = function () {
        var config = this.config.itemConfig; // TODO fix generics and get rid of cast
        var itemElement = new dom_1.DOM('a', {
            'id': this.config.id,
            'class': this.getCssClasses(),
            'href': config.url
        }).css({ 'background-image': "url(" + config.thumbnail + ")" });
        var bgElement = new dom_1.DOM('div', {
            'class': this.prefixCss('background')
        });
        itemElement.append(bgElement);
        var titleElement = new dom_1.DOM('span', {
            'class': this.prefixCss('title')
        }).append(new dom_1.DOM('span', {
            'class': this.prefixCss('innertitle')
        }).html(config.title));
        itemElement.append(titleElement);
        var timeElement = new dom_1.DOM('span', {
            'class': this.prefixCss('duration')
        }).append(new dom_1.DOM('span', {
            'class': this.prefixCss('innerduration')
        }).html(config.duration ? utils_1.StringUtils.secondsToTime(config.duration) : ''));
        itemElement.append(timeElement);
        return itemElement;
    };
    return RecommendationItem;
}(component_1.Component));

},{"../dom":45,"../utils":51,"./component":13,"./container":14,"./hugereplaybutton":19}],28:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var component_1 = require("./component");
var dom_1 = require("../dom");
var eventdispatcher_1 = require("../eventdispatcher");
var timeout_1 = require("../timeout");
/**
 * A seek bar to seek within the player's media. It displays the current playback position, amount of buffed data, seek
 * target, and keeps status about an ongoing seek.
 *
 * The seek bar displays different 'bars':
 *  - the playback position, i.e. the position in the media at which the player current playback pointer is positioned
 *  - the buffer position, which usually is the playback position plus the time span that is already buffered ahead
 *  - the seek position, used to preview to where in the timeline a seek will jump to
 */
var SeekBar = (function (_super) {
    __extends(SeekBar, _super);
    function SeekBar(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        /**
         * Buffer of the the current playback position. The position must be buffered in case it needs the element
         * needs to be refreshed with {@link #refreshPlaybackPosition}.
         * @type {number}
         */
        _this.playbackPositionPercentage = 0;
        // https://hacks.mozilla.org/2013/04/detecting-touch-its-the-why-not-the-how/
        _this.touchSupported = ('ontouchstart' in window);
        _this.seekBarEvents = {
            /**
             * Fired when a scrubbing seek operation is started.
             */
            onSeek: new eventdispatcher_1.EventDispatcher(),
            /**
             * Fired during a scrubbing seek to indicate that the seek preview (i.e. the video frame) should be updated.
             */
            onSeekPreview: new eventdispatcher_1.EventDispatcher(),
            /**
             * Fired when a scrubbing seek has finished or when a direct seek is issued.
             */
            onSeeked: new eventdispatcher_1.EventDispatcher()
        };
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-seekbar'
        }, _this.config);
        _this.label = _this.config.label;
        _this.timelineMarkers = [];
        return _this;
    }
    SeekBar.prototype.initialize = function () {
        _super.prototype.initialize.call(this);
        if (this.hasLabel()) {
            this.getLabel().initialize();
        }
    };
    SeekBar.prototype.configure = function (player, uimanager, configureSeek) {
        if (configureSeek === void 0) { configureSeek = true; }
        _super.prototype.configure.call(this, player, uimanager);
        if (!configureSeek) {
            // The configureSeek flag can be used by subclasses to disable configuration as seek bar. E.g. the volume
            // slider is reusing this component but adds its own functionality, and does not need the seek functionality.
            // This is actually a hack, the proper solution would be for both seek bar and volume sliders to extend
            // a common base slider component and implement their functionality there.
            return;
        }
        if (uimanager.getConfig().metadata && uimanager.getConfig().metadata.markers
            && uimanager.getConfig().metadata.markers.length > 0) {
            for (var _i = 0, _a = uimanager.getConfig().metadata.markers; _i < _a.length; _i++) {
                var chapter = _a[_i];
                this.timelineMarkers.push({
                    time: 100 / player.getDuration() * chapter.time,
                    title: chapter.title,
                });
            }
        }
        var self = this;
        var playbackNotInitialized = true;
        var isPlaying = false;
        var isSeeking = false;
        // Update playback and buffer positions
        var playbackPositionHandler = function () {
            // Once this handler os called, playback has been started and we set the flag to false
            playbackNotInitialized = false;
            if (isSeeking) {
                // We caught a seek preview seek, do not update the seekbar
                return;
            }
            if (player.isLive()) {
                if (player.getMaxTimeShift() === 0) {
                    // This case must be explicitly handled to avoid division by zero
                    self.setPlaybackPosition(100);
                }
                else {
                    var playbackPositionPercentage = 100 - (100 / player.getMaxTimeShift() * player.getTimeShift());
                    self.setPlaybackPosition(playbackPositionPercentage);
                }
                // Always show full buffer for live streams
                self.setBufferPosition(100);
            }
            else {
                var playbackPositionPercentage = 100 / player.getDuration() * player.getCurrentTime();
                var videoBufferLength = player.getVideoBufferLength();
                var audioBufferLength = player.getAudioBufferLength();
                // Calculate the buffer length which is the smaller length of the audio and video buffers. If one of these
                // buffers is not available, we set it's value to MAX_VALUE to make sure that the other real value is taken
                // as the buffer length.
                var bufferLength = Math.min(videoBufferLength != null ? videoBufferLength : Number.MAX_VALUE, audioBufferLength != null ? audioBufferLength : Number.MAX_VALUE);
                // If both buffer lengths are missing, we set the buffer length to zero
                if (bufferLength === Number.MAX_VALUE) {
                    bufferLength = 0;
                }
                var bufferPercentage = 100 / player.getDuration() * bufferLength;
                // Update playback position only in paused state, playback updates are handled in the Timeout below
                if (player.isPaused()) {
                    self.setPlaybackPosition(playbackPositionPercentage);
                }
                self.setBufferPosition(playbackPositionPercentage + bufferPercentage);
            }
        };
        player.addEventHandler(bitmovin.player.EVENT.ON_READY, function () {
            // Reset flag when a new source is loaded
            playbackNotInitialized = true;
        });
        // Update seekbar upon these events
        // update playback position when it changes
        player.addEventHandler(bitmovin.player.EVENT.ON_TIME_CHANGED, playbackPositionHandler);
        // update bufferlevel when buffering is complete
        player.addEventHandler(bitmovin.player.EVENT.ON_STALL_ENDED, playbackPositionHandler);
        // update playback position when a seek has finished
        player.addEventHandler(bitmovin.player.EVENT.ON_SEEKED, playbackPositionHandler);
        // update playback position when a timeshift has finished
        player.addEventHandler(bitmovin.player.EVENT.ON_TIME_SHIFTED, playbackPositionHandler);
        // update bufferlevel when a segment has been downloaded
        player.addEventHandler(bitmovin.player.EVENT.ON_SEGMENT_REQUEST_FINISHED, playbackPositionHandler);
        // update playback position of Cast playback
        player.addEventHandler(bitmovin.player.EVENT.ON_CAST_TIME_UPDATED, playbackPositionHandler);
        /*
         * Playback position update
         *
         * We do not update the position directly from the ON_TIME_CHANGED event, because it arrives very jittery and
         * results in a jittery position indicator since the CSS transition time is statically set.
         * To work around this issue, we maintain a local playback position that is updated in a stable regular interval
         * and kept in sync with the player.
         */
        var currentTimeSeekBar = 0;
        var currentTimePlayer = 0;
        var updateIntervalMs = 25;
        var currentTimeUpdateDeltaSecs = updateIntervalMs / 1000;
        var smoothPlaybackPositionUpdater = new timeout_1.Timeout(updateIntervalMs, function () {
            currentTimeSeekBar += currentTimeUpdateDeltaSecs;
            currentTimePlayer = player.getCurrentTime();
            // Sync currentTime of seekbar to player
            var currentTimeDelta = currentTimeSeekBar - currentTimePlayer;
            // If currentTimeDelta is negative and below the adjustment threshold,
            // the player is ahead of the seekbar and we 'fast forward' the seekbar
            if (currentTimeDelta <= -currentTimeUpdateDeltaSecs) {
                currentTimeSeekBar += currentTimeUpdateDeltaSecs;
            }
            else if (currentTimeDelta >= currentTimeUpdateDeltaSecs) {
                currentTimeSeekBar -= currentTimeUpdateDeltaSecs;
            }
            var playbackPositionPercentage = 100 / player.getDuration() * currentTimeSeekBar;
            self.setPlaybackPosition(playbackPositionPercentage);
        }, true);
        player.addEventHandler(bitmovin.player.EVENT.ON_PLAY, function () {
            if (!player.isLive()) {
                currentTimeSeekBar = player.getCurrentTime();
                smoothPlaybackPositionUpdater.start();
            }
        });
        player.addEventHandler(bitmovin.player.EVENT.ON_PAUSED, function () {
            smoothPlaybackPositionUpdater.clear();
        });
        player.addEventHandler(bitmovin.player.EVENT.ON_SEEKED, function () {
            currentTimeSeekBar = player.getCurrentTime();
        });
        // Seek handling
        player.addEventHandler(bitmovin.player.EVENT.ON_SEEK, function () {
            self.setSeeking(true);
        });
        player.addEventHandler(bitmovin.player.EVENT.ON_SEEKED, function () {
            self.setSeeking(false);
        });
        player.addEventHandler(bitmovin.player.EVENT.ON_TIME_SHIFT, function () {
            self.setSeeking(true);
        });
        player.addEventHandler(bitmovin.player.EVENT.ON_TIME_SHIFTED, function () {
            self.setSeeking(false);
        });
        var seek = function (percentage) {
            if (player.isLive()) {
                player.timeShift(player.getMaxTimeShift() - (player.getMaxTimeShift() * (percentage / 100)));
            }
            else {
                player.seek(player.getDuration() * (percentage / 100));
            }
        };
        self.onSeek.subscribe(function (sender) {
            isSeeking = true; // track seeking status so we can catch events from seek preview seeks
            // Notify UI manager of started seek
            uimanager.onSeek.dispatch(sender);
            // Save current playback state
            isPlaying = player.isPlaying();
            // Pause playback while seeking
            if (isPlaying) {
                player.pause('ui-seek');
            }
        });
        self.onSeekPreview.subscribe(function (sender, args) {
            // Notify UI manager of seek preview
            uimanager.onSeekPreview.dispatch(sender, args);
        });
        self.onSeekPreview.subscribeRateLimited(function (sender, args) {
            // Rate-limited scrubbing seek
            if (args.scrubbing) {
                seek(args.position);
            }
        }, 200);
        self.onSeeked.subscribe(function (sender, percentage) {
            isSeeking = false;
            // If playback has not been started before, we need to call play to in it the playback engine for the
            // seek to work. We call pause() immediately afterwards because we actually do not want to play back anything.
            // The flag serves to call play/pause only on the first seek before playback has started, instead of every
            // time a seek is issued.
            if (playbackNotInitialized) {
                playbackNotInitialized = false;
                player.play('ui-seek');
                player.pause('ui-seek');
            }
            // Do the seek
            seek(percentage);
            // Continue playback after seek if player was playing when seek started
            if (isPlaying) {
                player.play('ui-seek');
            }
            // Notify UI manager of finished seek
            uimanager.onSeeked.dispatch(sender);
        });
        if (self.hasLabel()) {
            // Configure a seekbar label that is internal to the seekbar)
            self.getLabel().configure(player, uimanager);
        }
        // Hide seekbar for live sources without timeshift
        player.addEventHandler(bitmovin.player.EVENT.ON_READY, function () {
            if (player.isLive() && player.getMaxTimeShift() === 0) {
                self.hide();
            }
            else {
                self.show();
            }
        });
        player.addEventHandler(bitmovin.player.EVENT.ON_PLAYER_RESIZE, function () {
            self.refreshPlaybackPosition();
        });
        // Initialize seekbar
        this.setPlaybackPosition(0);
        this.setBufferPosition(0);
        this.setSeekPosition(0);
        this.updateMarkers();
    };
    SeekBar.prototype.toDomElement = function () {
        if (this.config.vertical) {
            this.config.cssClasses.push('vertical');
        }
        var seekBarContainer = new dom_1.DOM('div', {
            'id': this.config.id,
            'class': this.getCssClasses()
        });
        var seekBar = new dom_1.DOM('div', {
            'class': this.prefixCss('seekbar')
        });
        this.seekBar = seekBar;
        // Indicator that shows the buffer fill level
        var seekBarBufferLevel = new dom_1.DOM('div', {
            'class': this.prefixCss('seekbar-bufferlevel')
        });
        this.seekBarBufferPosition = seekBarBufferLevel;
        // Indicator that shows the current playback position
        var seekBarPlaybackPosition = new dom_1.DOM('div', {
            'class': this.prefixCss('seekbar-playbackposition')
        });
        this.seekBarPlaybackPosition = seekBarPlaybackPosition;
        // A marker of the current playback position, e.g. a dot or line
        var seekBarPlaybackPositionMarker = new dom_1.DOM('div', {
            'class': this.prefixCss('seekbar-playbackposition-marker')
        });
        this.seekBarPlaybackPositionMarker = seekBarPlaybackPositionMarker;
        // Indicator that show where a seek will go to
        var seekBarSeekPosition = new dom_1.DOM('div', {
            'class': this.prefixCss('seekbar-seekposition')
        });
        this.seekBarSeekPosition = seekBarSeekPosition;
        // Indicator that shows the full seekbar
        var seekBarBackdrop = new dom_1.DOM('div', {
            'class': this.prefixCss('seekbar-backdrop')
        });
        this.seekBarBackdrop = seekBarBackdrop;
        var seekBarChapterMarkersContainer = new dom_1.DOM('div', {
            'class': this.prefixCss('seekbar-markers')
        });
        this.seekBarMarkersContainer = seekBarChapterMarkersContainer;
        seekBar.append(seekBarBackdrop, seekBarBufferLevel, seekBarSeekPosition, seekBarPlaybackPosition, seekBarChapterMarkersContainer, seekBarPlaybackPositionMarker);
        var self = this;
        var seeking = false;
        // Define handler functions so we can attach/remove them later
        var mouseTouchMoveHandler = function (e) {
            e.preventDefault();
            // Avoid propagation to VR handler
            e.stopPropagation();
            var targetPercentage = 100 * self.getOffset(e);
            self.setSeekPosition(targetPercentage);
            self.setPlaybackPosition(targetPercentage);
            self.onSeekPreviewEvent(targetPercentage, true);
        };
        var mouseTouchUpHandler = function (e) {
            e.preventDefault();
            // Remove handlers, seek operation is finished
            new dom_1.DOM(document).off('touchmove mousemove', mouseTouchMoveHandler);
            new dom_1.DOM(document).off('touchend mouseup', mouseTouchUpHandler);
            var targetPercentage = 100 * self.getOffset(e);
            var snappedChapter = self.getMarkerAtPosition(targetPercentage);
            self.setSeeking(false);
            seeking = false;
            // Fire seeked event
            self.onSeekedEvent(snappedChapter ? snappedChapter.time : targetPercentage);
        };
        // A seek always start with a touchstart or mousedown directly on the seekbar.
        // To track a mouse seek also outside the seekbar (for touch events this works automatically),
        // so the user does not need to take care that the mouse always stays on the seekbar, we attach the mousemove
        // and mouseup handlers to the whole document. A seek is triggered when the user lifts the mouse key.
        // A seek mouse gesture is thus basically a click with a long time frame between down and up events.
        seekBar.on('touchstart mousedown', function (e) {
            var isTouchEvent = self.touchSupported && e instanceof TouchEvent;
            // Prevent selection of DOM elements (also prevents mousedown if current event is touchstart)
            e.preventDefault();
            // Avoid propagation to VR handler
            e.stopPropagation();
            self.setSeeking(true); // Set seeking class on DOM element
            seeking = true; // Set seek tracking flag
            // Fire seeked event
            self.onSeekEvent();
            // Add handler to track the seek operation over the whole document
            new dom_1.DOM(document).on(isTouchEvent ? 'touchmove' : 'mousemove', mouseTouchMoveHandler);
            new dom_1.DOM(document).on(isTouchEvent ? 'touchend' : 'mouseup', mouseTouchUpHandler);
        });
        // Display seek target indicator when mouse hovers or finger slides over seekbar
        seekBar.on('touchmove mousemove', function (e) {
            e.preventDefault();
            if (seeking) {
                // During a seek (when mouse is down or touch move active), we need to stop propagation to avoid
                // the VR viewport reacting to the moves.
                e.stopPropagation();
                // Because the stopped propagation inhibits the event on the document, we need to call it from here
                mouseTouchMoveHandler(e);
            }
            var position = 100 * self.getOffset(e);
            self.setSeekPosition(position);
            self.onSeekPreviewEvent(position, false);
            if (self.hasLabel() && self.getLabel().isHidden()) {
                self.getLabel().show();
            }
        });
        // Hide seek target indicator when mouse or finger leaves seekbar
        seekBar.on('touchend mouseleave', function (e) {
            e.preventDefault();
            self.setSeekPosition(0);
            if (self.hasLabel()) {
                self.getLabel().hide();
            }
        });
        seekBarContainer.append(seekBar);
        if (this.label) {
            seekBarContainer.append(this.label.getDomElement());
        }
        return seekBarContainer;
    };
    SeekBar.prototype.updateMarkers = function () {
        this.seekBarMarkersContainer.empty();
        for (var _i = 0, _a = this.timelineMarkers; _i < _a.length; _i++) {
            var marker = _a[_i];
            this.seekBarMarkersContainer.append(new dom_1.DOM('div', {
                'class': this.prefixCss('seekbar-marker'),
                'data-marker-time': String(marker.time),
                'data-marker-title': String(marker.title),
            }).css({
                'width': marker.time + '%',
            }));
        }
    };
    SeekBar.prototype.getMarkerAtPosition = function (percentage) {
        var snappedMarker = null;
        var snappingRange = 1;
        if (this.timelineMarkers.length > 0) {
            for (var _i = 0, _a = this.timelineMarkers; _i < _a.length; _i++) {
                var marker = _a[_i];
                if (percentage >= marker.time - snappingRange && percentage <= marker.time + snappingRange) {
                    snappedMarker = marker;
                    break;
                }
            }
        }
        return snappedMarker;
    };
    /**
     * Gets the horizontal offset of a mouse/touch event point from the left edge of the seek bar.
     * @param eventPageX the pageX coordinate of an event to calculate the offset from
     * @returns {number} a number in the range of [0, 1], where 0 is the left edge and 1 is the right edge
     */
    SeekBar.prototype.getHorizontalOffset = function (eventPageX) {
        var elementOffsetPx = this.seekBar.offset().left;
        var widthPx = this.seekBar.width();
        var offsetPx = eventPageX - elementOffsetPx;
        var offset = 1 / widthPx * offsetPx;
        return this.sanitizeOffset(offset);
    };
    /**
     * Gets the vertical offset of a mouse/touch event point from the bottom edge of the seek bar.
     * @param eventPageY the pageX coordinate of an event to calculate the offset from
     * @returns {number} a number in the range of [0, 1], where 0 is the bottom edge and 1 is the top edge
     */
    SeekBar.prototype.getVerticalOffset = function (eventPageY) {
        var elementOffsetPx = this.seekBar.offset().top;
        var widthPx = this.seekBar.height();
        var offsetPx = eventPageY - elementOffsetPx;
        var offset = 1 / widthPx * offsetPx;
        return 1 - this.sanitizeOffset(offset);
    };
    /**
     * Gets the mouse or touch event offset for the current configuration (horizontal or vertical).
     * @param e the event to calculate the offset from
     * @returns {number} a number in the range of [0, 1]
     * @see #getHorizontalOffset
     * @see #getVerticalOffset
     */
    SeekBar.prototype.getOffset = function (e) {
        if (this.touchSupported && e instanceof TouchEvent) {
            if (this.config.vertical) {
                return this.getVerticalOffset(e.type === 'touchend' ? e.changedTouches[0].pageY : e.touches[0].pageY);
            }
            else {
                return this.getHorizontalOffset(e.type === 'touchend' ? e.changedTouches[0].pageX : e.touches[0].pageX);
            }
        }
        else if (e instanceof MouseEvent) {
            if (this.config.vertical) {
                return this.getVerticalOffset(e.pageY);
            }
            else {
                return this.getHorizontalOffset(e.pageX);
            }
        }
        else {
            if (console) {
                console.warn('invalid event');
            }
            return 0;
        }
    };
    /**
     * Sanitizes the mouse offset to the range of [0, 1].
     *
     * When tracking the mouse outside the seek bar, the offset can be outside the desired range and this method
     * limits it to the desired range. E.g. a mouse event left of the left edge of a seek bar yields an offset below
     * zero, but to display the seek target on the seek bar, we need to limit it to zero.
     *
     * @param offset the offset to sanitize
     * @returns {number} the sanitized offset.
     */
    SeekBar.prototype.sanitizeOffset = function (offset) {
        // Since we track mouse moves over the whole document, the target can be outside the seek range,
        // and we need to limit it to the [0, 1] range.
        if (offset < 0) {
            offset = 0;
        }
        else if (offset > 1) {
            offset = 1;
        }
        return offset;
    };
    /**
     * Sets the position of the playback position indicator.
     * @param percent a number between 0 and 100 as returned by the player
     */
    SeekBar.prototype.setPlaybackPosition = function (percent) {
        this.playbackPositionPercentage = percent;
        // Set position of the bar
        this.setPosition(this.seekBarPlaybackPosition, percent);
        // Set position of the marker
        var px = (this.config.vertical ? this.seekBar.height() : this.seekBar.width()) / 100 * percent;
        if (this.config.vertical) {
            px = this.seekBar.height() - px;
        }
        var style = this.config.vertical ?
            // -ms-transform required for IE9
            { 'transform': 'translateY(' + px + 'px)', '-ms-transform': 'translateY(' + px + 'px)' } :
            { 'transform': 'translateX(' + px + 'px)', '-ms-transform': 'translateX(' + px + 'px)' };
        this.seekBarPlaybackPositionMarker.css(style);
    };
    /**
     * Refreshes the playback position. Can be used by subclasses to refresh the position when
     * the size of the component changes.
     */
    SeekBar.prototype.refreshPlaybackPosition = function () {
        this.setPlaybackPosition(this.playbackPositionPercentage);
    };
    /**
     * Sets the position until which media is buffered.
     * @param percent a number between 0 and 100
     */
    SeekBar.prototype.setBufferPosition = function (percent) {
        this.setPosition(this.seekBarBufferPosition, percent);
    };
    /**
     * Sets the position where a seek, if executed, would jump to.
     * @param percent a number between 0 and 100
     */
    SeekBar.prototype.setSeekPosition = function (percent) {
        this.setPosition(this.seekBarSeekPosition, percent);
    };
    /**
     * Set the actual position (width or height) of a DOM element that represent a bar in the seek bar.
     * @param element the element to set the position for
     * @param percent a number between 0 and 100
     */
    SeekBar.prototype.setPosition = function (element, percent) {
        var scale = percent / 100;
        var style = this.config.vertical ?
            // -ms-transform required for IE9
            { 'transform': 'scaleY(' + scale + ')', '-ms-transform': 'scaleY(' + scale + ')' } :
            { 'transform': 'scaleX(' + scale + ')', '-ms-transform': 'scaleX(' + scale + ')' };
        element.css(style);
    };
    /**
     * Puts the seek bar into or out of seeking state by adding/removing a class to the DOM element. This can be used
     * to adjust the styling while seeking.
     *
     * @param seeking should be true when entering seek state, false when exiting the seek state
     */
    SeekBar.prototype.setSeeking = function (seeking) {
        if (seeking) {
            this.getDomElement().addClass(this.prefixCss(SeekBar.CLASS_SEEKING));
        }
        else {
            this.getDomElement().removeClass(this.prefixCss(SeekBar.CLASS_SEEKING));
        }
    };
    /**
     * Checks if the seek bar is currently in the seek state.
     * @returns {boolean} true if in seek state, else false
     */
    SeekBar.prototype.isSeeking = function () {
        return this.getDomElement().hasClass(this.prefixCss(SeekBar.CLASS_SEEKING));
    };
    /**
     * Checks if the seek bar has a {@link SeekBarLabel}.
     * @returns {boolean} true if the seek bar has a label, else false
     */
    SeekBar.prototype.hasLabel = function () {
        return this.label != null;
    };
    /**
     * Gets the label of this seek bar.
     * @returns {SeekBarLabel} the label if this seek bar has a label, else null
     */
    SeekBar.prototype.getLabel = function () {
        return this.label;
    };
    SeekBar.prototype.onSeekEvent = function () {
        this.seekBarEvents.onSeek.dispatch(this);
    };
    SeekBar.prototype.onSeekPreviewEvent = function (percentage, scrubbing) {
        var snappedMarker = this.getMarkerAtPosition(percentage);
        if (this.label) {
            this.label.setText(percentage + '');
            this.label.getDomElement().css({
                'left': (snappedMarker ? snappedMarker.time : percentage) + '%'
            });
        }
        this.seekBarEvents.onSeekPreview.dispatch(this, {
            scrubbing: scrubbing,
            position: percentage,
            marker: snappedMarker,
        });
    };
    SeekBar.prototype.onSeekedEvent = function (percentage) {
        this.seekBarEvents.onSeeked.dispatch(this, percentage);
    };
    Object.defineProperty(SeekBar.prototype, "onSeek", {
        /**
         * Gets the event that is fired when a scrubbing seek operation is started.
         * @returns {Event<SeekBar, NoArgs>}
         */
        get: function () {
            return this.seekBarEvents.onSeek.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SeekBar.prototype, "onSeekPreview", {
        /**
         * Gets the event that is fired during a scrubbing seek (to indicate that the seek preview, i.e. the video frame,
         * should be updated), or during a normal seek preview when the seek bar is hovered (and the seek target,
         * i.e. the seek bar label, should be updated).
         * @returns {Event<SeekBar, SeekPreviewEventArgs>}
         */
        get: function () {
            return this.seekBarEvents.onSeekPreview.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SeekBar.prototype, "onSeeked", {
        /**
         * Gets the event that is fired when a scrubbing seek has finished or when a direct seek is issued.
         * @returns {Event<SeekBar, number>}
         */
        get: function () {
            return this.seekBarEvents.onSeeked.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    return SeekBar;
}(component_1.Component));
/**
 * The CSS class that is added to the DOM element while the seek bar is in 'seeking' state.
 */
SeekBar.CLASS_SEEKING = 'seeking';
exports.SeekBar = SeekBar;

},{"../dom":45,"../eventdispatcher":46,"../timeout":49,"./component":13}],29:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var container_1 = require("./container");
var label_1 = require("./label");
var component_1 = require("./component");
var utils_1 = require("../utils");
/**
 * A label for a {@link SeekBar} that can display the seek target time and a thumbnail.
 */
var SeekBarLabel = (function (_super) {
    __extends(SeekBarLabel, _super);
    function SeekBarLabel(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.timeLabel = new label_1.Label({ cssClasses: ['seekbar-label-time'] });
        _this.titleLabel = new label_1.Label({ cssClasses: ['seekbar-label-title'] });
        _this.thumbnail = new component_1.Component({ cssClasses: ['seekbar-thumbnail'] });
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-seekbar-label',
            components: [new container_1.Container({
                    components: [
                        _this.thumbnail,
                        new container_1.Container({
                            components: [_this.titleLabel, _this.timeLabel],
                            cssClass: 'seekbar-label-metadata',
                        })
                    ],
                    cssClass: 'seekbar-label-inner',
                })],
            hidden: true
        }, _this.config);
        return _this;
    }
    SeekBarLabel.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        var self = this;
        uimanager.onSeekPreview.subscribe(function (sender, args) {
            if (player.isLive()) {
                var time = player.getMaxTimeShift() - player.getMaxTimeShift() * (args.position / 100);
                self.setTime(time);
            }
            else {
                var time = 0;
                if (args.marker) {
                    time = args.marker.time;
                    self.setTitleText(args.marker.title);
                }
                else {
                    time = args.position;
                    self.setTitleText(null);
                }
                self.setTime(player.getDuration() * (time / 100));
                self.setThumbnail(player.getThumb(time));
            }
        });
        var init = function () {
            // Set time format depending on source duration
            self.timeFormat = Math.abs(player.isLive() ? player.getMaxTimeShift() : player.getDuration()) >= 3600 ?
                utils_1.StringUtils.FORMAT_HHMMSS : utils_1.StringUtils.FORMAT_MMSS;
        };
        player.addEventHandler(bitmovin.player.EVENT.ON_READY, init);
        init();
    };
    /**
     * Sets arbitrary text on the label.
     * @param text the text to show on the label
     */
    SeekBarLabel.prototype.setText = function (text) {
        this.timeLabel.setText(text);
    };
    /**
     * Sets a time to be displayed on the label.
     * @param seconds the time in seconds to display on the label
     */
    SeekBarLabel.prototype.setTime = function (seconds) {
        this.setText(utils_1.StringUtils.secondsToTime(seconds, this.timeFormat));
    };
    /**
     * Sets the text on the title label.
     * @param text the text to show on the label
     */
    SeekBarLabel.prototype.setTitleText = function (text) {
        this.titleLabel.setText(text);
    };
    /**
     * Sets or removes a thumbnail on the label.
     * @param thumbnail the thumbnail to display on the label or null to remove a displayed thumbnail
     */
    SeekBarLabel.prototype.setThumbnail = function (thumbnail) {
        if (thumbnail === void 0) { thumbnail = null; }
        var thumbnailElement = this.thumbnail.getDomElement();
        if (thumbnail == null) {
            thumbnailElement.css({
                'background-image': null,
                'display': null,
                'width': null,
                'height': null
            });
        }
        else {
            thumbnailElement.css({
                'display': 'inherit',
                'background-image': "url(" + thumbnail.url + ")",
                'width': thumbnail.w + 'px',
                'height': thumbnail.h + 'px',
                'background-position': "-" + thumbnail.x + "px -" + thumbnail.y + "px"
            });
        }
    };
    return SeekBarLabel;
}(container_1.Container));
exports.SeekBarLabel = SeekBarLabel;

},{"../utils":51,"./component":13,"./container":14,"./label":20}],30:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var listselector_1 = require("./listselector");
var dom_1 = require("../dom");
/**
 * A simple select box providing the possibility to select a single item out of a list of available items.
 *
 * DOM example:
 * <code>
 *     <select class='ui-selectbox'>
 *         <option value='key'>label</option>
 *         ...
 *     </select>
 * </code>
 */
var SelectBox = (function (_super) {
    __extends(SelectBox, _super);
    function SelectBox(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-selectbox'
        }, _this.config);
        return _this;
    }
    SelectBox.prototype.toDomElement = function () {
        var selectElement = new dom_1.DOM('select', {
            'id': this.config.id,
            'class': this.getCssClasses()
        });
        this.selectElement = selectElement;
        this.updateDomItems();
        var self = this;
        selectElement.on('change', function () {
            var value = new dom_1.DOM(this).val();
            self.onItemSelectedEvent(value, false);
        });
        return selectElement;
    };
    SelectBox.prototype.updateDomItems = function (selectedValue) {
        if (selectedValue === void 0) { selectedValue = null; }
        // Delete all children
        this.selectElement.empty();
        // Add updated children
        for (var _i = 0, _a = this.items; _i < _a.length; _i++) {
            var item = _a[_i];
            var optionElement = new dom_1.DOM('option', {
                'value': item.key
            }).html(item.label);
            if (item.key === selectedValue + '') {
                optionElement.attr('selected', 'selected');
            }
            this.selectElement.append(optionElement);
        }
    };
    SelectBox.prototype.onItemAddedEvent = function (value) {
        _super.prototype.onItemAddedEvent.call(this, value);
        this.updateDomItems(this.selectedItem);
    };
    SelectBox.prototype.onItemRemovedEvent = function (value) {
        _super.prototype.onItemRemovedEvent.call(this, value);
        this.updateDomItems(this.selectedItem);
    };
    SelectBox.prototype.onItemSelectedEvent = function (value, updateDomItems) {
        if (updateDomItems === void 0) { updateDomItems = true; }
        _super.prototype.onItemSelectedEvent.call(this, value);
        if (updateDomItems) {
            this.updateDomItems(value);
        }
    };
    return SelectBox;
}(listselector_1.ListSelector));
exports.SelectBox = SelectBox;

},{"../dom":45,"./listselector":21}],31:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var container_1 = require("./container");
var label_1 = require("./label");
var videoqualityselectbox_1 = require("./videoqualityselectbox");
var audioqualityselectbox_1 = require("./audioqualityselectbox");
var timeout_1 = require("../timeout");
var eventdispatcher_1 = require("../eventdispatcher");
/**
 * A panel containing a list of {@link SettingsPanelItem items} that represent labelled settings.
 */
var SettingsPanel = (function (_super) {
    __extends(SettingsPanel, _super);
    function SettingsPanel(config) {
        var _this = _super.call(this, config) || this;
        _this.settingsPanelEvents = {
            onSettingsStateChanged: new eventdispatcher_1.EventDispatcher()
        };
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-settings-panel',
            hideDelay: 3000
        }, _this.config);
        return _this;
    }
    SettingsPanel.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        var self = this;
        var config = this.getConfig(); // TODO fix generics type inference
        if (config.hideDelay > -1) {
            var timeout_2 = new timeout_1.Timeout(config.hideDelay, function () {
                self.hide();
            });
            self.onShow.subscribe(function () {
                // Activate timeout when shown
                timeout_2.start();
            });
            self.getDomElement().on('mousemove', function () {
                // Reset timeout on interaction
                timeout_2.reset();
            });
            self.onHide.subscribe(function () {
                // Clear timeout when hidden from outside
                timeout_2.clear();
            });
        }
        // Fire event when the state of a settings-item has changed
        var settingsStateChangedHandler = function () {
            self.onSettingsStateChangedEvent();
            // Attach marker class to last visible item
            var lastShownItem = null;
            for (var _i = 0, _a = self.getItems(); _i < _a.length; _i++) {
                var component = _a[_i];
                if (component instanceof SettingsPanelItem) {
                    component.getDomElement().removeClass(self.prefixCss(SettingsPanel.CLASS_LAST));
                    if (component.isShown()) {
                        lastShownItem = component;
                    }
                }
            }
            if (lastShownItem) {
                lastShownItem.getDomElement().addClass(self.prefixCss(SettingsPanel.CLASS_LAST));
            }
        };
        for (var _i = 0, _a = this.getItems(); _i < _a.length; _i++) {
            var component = _a[_i];
            if (component instanceof SettingsPanelItem) {
                component.onActiveChanged.subscribe(settingsStateChangedHandler);
            }
        }
    };
    /**
     * Checks if there are active settings within this settings panel. An active setting is a setting that is visible
     * and enabled, which the user can interact with.
     * @returns {boolean} true if there are active settings, false if the panel is functionally empty to a user
     */
    SettingsPanel.prototype.hasActiveSettings = function () {
        for (var _i = 0, _a = this.getItems(); _i < _a.length; _i++) {
            var component = _a[_i];
            if (component.isActive()) {
                return true;
            }
        }
        return false;
    };
    SettingsPanel.prototype.getItems = function () {
        return this.config.components;
    };
    SettingsPanel.prototype.onSettingsStateChangedEvent = function () {
        this.settingsPanelEvents.onSettingsStateChanged.dispatch(this);
    };
    Object.defineProperty(SettingsPanel.prototype, "onSettingsStateChanged", {
        /**
         * Gets the event that is fired when one or more {@link SettingsPanelItem items} have changed state.
         * @returns {Event<SettingsPanel, NoArgs>}
         */
        get: function () {
            return this.settingsPanelEvents.onSettingsStateChanged.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    return SettingsPanel;
}(container_1.Container));
SettingsPanel.CLASS_LAST = 'last';
exports.SettingsPanel = SettingsPanel;
/**
 * An item for a {@link SettingsPanel}, containing a {@link Label} and a component that configures a setting.
 * Supported setting components: {@link SelectBox}
 */
var SettingsPanelItem = (function (_super) {
    __extends(SettingsPanelItem, _super);
    function SettingsPanelItem(label, selectBox, config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.settingsPanelItemEvents = {
            onActiveChanged: new eventdispatcher_1.EventDispatcher()
        };
        _this.label = new label_1.Label({ text: label });
        _this.setting = selectBox;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-settings-panel-item',
            components: [_this.label, _this.setting]
        }, _this.config);
        return _this;
    }
    SettingsPanelItem.prototype.configure = function (player, uimanager) {
        var self = this;
        var handleConfigItemChanged = function () {
            // The minimum number of items that must be available for the setting to be displayed
            // By default, at least two items must be available, else a selection is not possible
            var minItemsToDisplay = 2;
            // Audio/video quality select boxes contain an additional 'auto' mode, which in combination with a single
            // available quality also does not make sense
            if (self.setting instanceof videoqualityselectbox_1.VideoQualitySelectBox || self.setting instanceof audioqualityselectbox_1.AudioQualitySelectBox) {
                minItemsToDisplay = 3;
            }
            // Hide the setting if no meaningful choice is available
            if (self.setting.itemCount() < minItemsToDisplay) {
                self.hide();
            }
            else {
                self.show();
            }
            // Visibility might have changed and therefore the active state might have changed so we fire the event
            // TODO fire only when state has really changed (e.g. check if visibility has really changed)
            self.onActiveChangedEvent();
        };
        self.setting.onItemAdded.subscribe(handleConfigItemChanged);
        self.setting.onItemRemoved.subscribe(handleConfigItemChanged);
        // Initialize hidden state
        handleConfigItemChanged();
    };
    /**
     * Checks if this settings panel item is active, i.e. visible and enabled and a user can interact with it.
     * @returns {boolean} true if the panel is active, else false
     */
    SettingsPanelItem.prototype.isActive = function () {
        return this.isShown();
    };
    SettingsPanelItem.prototype.onActiveChangedEvent = function () {
        this.settingsPanelItemEvents.onActiveChanged.dispatch(this);
    };
    Object.defineProperty(SettingsPanelItem.prototype, "onActiveChanged", {
        /**
         * Gets the event that is fired when the 'active' state of this item changes.
         * @see #isActive
         * @returns {Event<SettingsPanelItem, NoArgs>}
         */
        get: function () {
            return this.settingsPanelItemEvents.onActiveChanged.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    return SettingsPanelItem;
}(container_1.Container));
exports.SettingsPanelItem = SettingsPanelItem;

},{"../eventdispatcher":46,"../timeout":49,"./audioqualityselectbox":4,"./container":14,"./label":20,"./videoqualityselectbox":39}],32:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var togglebutton_1 = require("./togglebutton");
/**
 * A button that toggles visibility of a settings panel.
 */
var SettingsToggleButton = (function (_super) {
    __extends(SettingsToggleButton, _super);
    function SettingsToggleButton(config) {
        var _this = _super.call(this, config) || this;
        if (!config.settingsPanel) {
            throw new Error('Required SettingsPanel is missing');
        }
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-settingstogglebutton',
            text: 'Settings',
            settingsPanel: null,
            autoHideWhenNoActiveSettings: true
        }, _this.config);
        return _this;
    }
    SettingsToggleButton.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        var self = this;
        var config = this.getConfig(); // TODO fix generics type inference
        var settingsPanel = config.settingsPanel;
        this.onClick.subscribe(function () {
            settingsPanel.toggleHidden();
        });
        settingsPanel.onShow.subscribe(function () {
            // Set toggle status to on when the settings panel shows
            self.on();
        });
        settingsPanel.onHide.subscribe(function () {
            // Set toggle status to off when the settings panel hides
            self.off();
        });
        // Handle automatic hiding of the button if there are no settings for the user to interact with
        if (config.autoHideWhenNoActiveSettings) {
            // Setup handler to show/hide button when the settings change
            var settingsPanelItemsChangedHandler = function () {
                if (settingsPanel.hasActiveSettings()) {
                    if (self.isHidden()) {
                        self.show();
                    }
                }
                else {
                    if (self.isShown()) {
                        self.hide();
                    }
                }
            };
            // Wire the handler to the event
            settingsPanel.onSettingsStateChanged.subscribe(settingsPanelItemsChangedHandler);
            // Call handler for first init at startup
            settingsPanelItemsChangedHandler();
        }
    };
    return SettingsToggleButton;
}(togglebutton_1.ToggleButton));
exports.SettingsToggleButton = SettingsToggleButton;

},{"./togglebutton":36}],33:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var container_1 = require("./container");
var label_1 = require("./label");
var controlbar_1 = require("./controlbar");
/**
 * Overlays the player to display subtitles.
 */
var SubtitleOverlay = (function (_super) {
    __extends(SubtitleOverlay, _super);
    function SubtitleOverlay(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.subtitleLabel = new label_1.Label({ cssClass: 'ui-subtitle-label' });
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-subtitle-overlay',
            components: [_this.subtitleLabel]
        }, _this.config);
        return _this;
    }
    SubtitleOverlay.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        var self = this;
        player.addEventHandler(bitmovin.player.EVENT.ON_CUE_ENTER, function (event) {
            self.subtitleLabel.setText(event.text);
        });
        player.addEventHandler(bitmovin.player.EVENT.ON_CUE_EXIT, function (event) {
            self.subtitleLabel.setText('');
        });
        var subtitleClearHandler = function () {
            self.subtitleLabel.setText('');
        };
        player.addEventHandler(bitmovin.player.EVENT.ON_AUDIO_CHANGED, subtitleClearHandler);
        player.addEventHandler(bitmovin.player.EVENT.ON_SUBTITLE_CHANGED, subtitleClearHandler);
        player.addEventHandler(bitmovin.player.EVENT.ON_SEEK, subtitleClearHandler);
        player.addEventHandler(bitmovin.player.EVENT.ON_TIME_SHIFT, subtitleClearHandler);
        uimanager.onComponentShow.subscribe(function (component) {
            if (component instanceof controlbar_1.ControlBar) {
                self.getDomElement().addClass(self.prefixCss(SubtitleOverlay.CLASS_CONTROLBAR_VISIBLE));
            }
        });
        uimanager.onComponentHide.subscribe(function (component) {
            if (component instanceof controlbar_1.ControlBar) {
                self.getDomElement().removeClass(self.prefixCss(SubtitleOverlay.CLASS_CONTROLBAR_VISIBLE));
            }
        });
    };
    return SubtitleOverlay;
}(container_1.Container));
SubtitleOverlay.CLASS_CONTROLBAR_VISIBLE = 'controlbar-visible';
exports.SubtitleOverlay = SubtitleOverlay;

},{"./container":14,"./controlbar":15,"./label":20}],34:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var selectbox_1 = require("./selectbox");
/**
 * A select box providing a selection between available subtitle and caption tracks.
 */
var SubtitleSelectBox = (function (_super) {
    __extends(SubtitleSelectBox, _super);
    function SubtitleSelectBox(config) {
        if (config === void 0) { config = {}; }
        return _super.call(this, config) || this;
    }
    SubtitleSelectBox.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        var self = this;
        var updateSubtitles = function () {
            self.clearItems();
            for (var _i = 0, _a = player.getAvailableSubtitles(); _i < _a.length; _i++) {
                var subtitle = _a[_i];
                self.addItem(subtitle.id, subtitle.label);
            }
        };
        self.onItemSelected.subscribe(function (sender, value) {
            player.setSubtitle(value === 'null' ? null : value);
        });
        // React to API events
        player.addEventHandler(bitmovin.player.EVENT.ON_SUBTITLE_ADDED, function (event) {
            self.addItem(event.subtitle.id, event.subtitle.label);
        });
        player.addEventHandler(bitmovin.player.EVENT.ON_SUBTITLE_CHANGED, function (event) {
            self.selectItem(event.targetSubtitle.id);
        });
        player.addEventHandler(bitmovin.player.EVENT.ON_SUBTITLE_REMOVED, function (event) {
            self.removeItem(event.subtitleId);
        });
        // Update subtitles when source goes away
        player.addEventHandler(bitmovin.player.EVENT.ON_SOURCE_UNLOADED, updateSubtitles);
        // Update subtitles when a new source is loaded
        player.addEventHandler(bitmovin.player.EVENT.ON_READY, updateSubtitles);
        // Populate subtitles at startup
        updateSubtitles();
    };
    return SubtitleSelectBox;
}(selectbox_1.SelectBox));
exports.SubtitleSelectBox = SubtitleSelectBox;

},{"./selectbox":30}],35:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var container_1 = require("./container");
var metadatalabel_1 = require("./metadatalabel");
/**
 * Displays a title bar containing a label with the title of the video.
 */
var TitleBar = (function (_super) {
    __extends(TitleBar, _super);
    function TitleBar(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-titlebar',
            hidden: true,
            components: [
                new metadatalabel_1.MetadataLabel({ content: metadatalabel_1.MetadataLabelContent.Title }),
                new metadatalabel_1.MetadataLabel({ content: metadatalabel_1.MetadataLabelContent.Description })
            ]
        }, _this.config);
        return _this;
    }
    TitleBar.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        var self = this;
        uimanager.onControlsShow.subscribe(function () {
            self.show();
        });
        uimanager.onControlsHide.subscribe(function () {
            self.hide();
        });
    };
    return TitleBar;
}(container_1.Container));
exports.TitleBar = TitleBar;

},{"./container":14,"./metadatalabel":22}],36:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var button_1 = require("./button");
var eventdispatcher_1 = require("../eventdispatcher");
/**
 * A button that can be toggled between 'on' and 'off' states.
 */
var ToggleButton = (function (_super) {
    __extends(ToggleButton, _super);
    function ToggleButton(config) {
        var _this = _super.call(this, config) || this;
        _this.toggleButtonEvents = {
            onToggle: new eventdispatcher_1.EventDispatcher(),
            onToggleOn: new eventdispatcher_1.EventDispatcher(),
            onToggleOff: new eventdispatcher_1.EventDispatcher()
        };
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-togglebutton'
        }, _this.config);
        return _this;
    }
    /**
     * Toggles the button to the 'on' state.
     */
    ToggleButton.prototype.on = function () {
        if (this.isOff()) {
            this.onState = true;
            this.getDomElement().removeClass(this.prefixCss(ToggleButton.CLASS_OFF));
            this.getDomElement().addClass(this.prefixCss(ToggleButton.CLASS_ON));
            this.onToggleEvent();
            this.onToggleOnEvent();
        }
    };
    /**
     * Toggles the button to the 'off' state.
     */
    ToggleButton.prototype.off = function () {
        if (this.isOn()) {
            this.onState = false;
            this.getDomElement().removeClass(this.prefixCss(ToggleButton.CLASS_ON));
            this.getDomElement().addClass(this.prefixCss(ToggleButton.CLASS_OFF));
            this.onToggleEvent();
            this.onToggleOffEvent();
        }
    };
    /**
     * Toggle the button 'on' if it is 'off', or 'off' if it is 'on'.
     */
    ToggleButton.prototype.toggle = function () {
        if (this.isOn()) {
            this.off();
        }
        else {
            this.on();
        }
    };
    /**
     * Checks if the toggle button is in the 'on' state.
     * @returns {boolean} true if button is 'on', false if 'off'
     */
    ToggleButton.prototype.isOn = function () {
        return this.onState;
    };
    /**
     * Checks if the toggle button is in the 'off' state.
     * @returns {boolean} true if button is 'off', false if 'on'
     */
    ToggleButton.prototype.isOff = function () {
        return !this.isOn();
    };
    ToggleButton.prototype.onClickEvent = function () {
        _super.prototype.onClickEvent.call(this);
        // Fire the toggle event together with the click event
        // (they are technically the same, only the semantics are different)
        this.onToggleEvent();
    };
    ToggleButton.prototype.onToggleEvent = function () {
        this.toggleButtonEvents.onToggle.dispatch(this);
    };
    ToggleButton.prototype.onToggleOnEvent = function () {
        this.toggleButtonEvents.onToggleOn.dispatch(this);
    };
    ToggleButton.prototype.onToggleOffEvent = function () {
        this.toggleButtonEvents.onToggleOff.dispatch(this);
    };
    Object.defineProperty(ToggleButton.prototype, "onToggle", {
        /**
         * Gets the event that is fired when the button is toggled.
         * @returns {Event<ToggleButton<Config>, NoArgs>}
         */
        get: function () {
            return this.toggleButtonEvents.onToggle.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ToggleButton.prototype, "onToggleOn", {
        /**
         * Gets the event that is fired when the button is toggled 'on'.
         * @returns {Event<ToggleButton<Config>, NoArgs>}
         */
        get: function () {
            return this.toggleButtonEvents.onToggleOn.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ToggleButton.prototype, "onToggleOff", {
        /**
         * Gets the event that is fired when the button is toggled 'off'.
         * @returns {Event<ToggleButton<Config>, NoArgs>}
         */
        get: function () {
            return this.toggleButtonEvents.onToggleOff.getEvent();
        },
        enumerable: true,
        configurable: true
    });
    return ToggleButton;
}(button_1.Button));
ToggleButton.CLASS_ON = 'on';
ToggleButton.CLASS_OFF = 'off';
exports.ToggleButton = ToggleButton;

},{"../eventdispatcher":46,"./button":7}],37:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var component_1 = require("./component");
var dom_1 = require("../dom");
/**
 * Animated analog TV static noise.
 */
var TvNoiseCanvas = (function (_super) {
    __extends(TvNoiseCanvas, _super);
    function TvNoiseCanvas(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.canvasWidth = 160;
        _this.canvasHeight = 90;
        _this.interferenceHeight = 50;
        _this.lastFrameUpdate = 0;
        _this.frameInterval = 60;
        _this.useAnimationFrame = !!window.requestAnimationFrame;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-tvnoisecanvas'
        }, _this.config);
        return _this;
    }
    TvNoiseCanvas.prototype.toDomElement = function () {
        return this.canvas = new dom_1.DOM('canvas', { 'class': this.getCssClasses() });
    };
    TvNoiseCanvas.prototype.start = function () {
        this.canvasElement = this.canvas.getElements()[0];
        this.canvasContext = this.canvasElement.getContext('2d');
        this.noiseAnimationWindowPos = -this.canvasHeight;
        this.lastFrameUpdate = 0;
        this.canvasElement.width = this.canvasWidth;
        this.canvasElement.height = this.canvasHeight;
        this.renderFrame();
    };
    TvNoiseCanvas.prototype.stop = function () {
        if (this.useAnimationFrame) {
            cancelAnimationFrame(this.frameUpdateHandlerId);
        }
        else {
            clearTimeout(this.frameUpdateHandlerId);
        }
    };
    TvNoiseCanvas.prototype.renderFrame = function () {
        // This code has been copied from the player controls.js and simplified
        if (this.lastFrameUpdate + this.frameInterval > new Date().getTime()) {
            // It's too early to render the next frame
            this.scheduleNextRender();
            return;
        }
        var currentPixelOffset;
        var canvasWidth = this.canvasWidth;
        var canvasHeight = this.canvasHeight;
        // Create texture
        var noiseImage = this.canvasContext.createImageData(canvasWidth, canvasHeight);
        // Fill texture with noise
        for (var y = 0; y < canvasHeight; y++) {
            for (var x = 0; x < canvasWidth; x++) {
                currentPixelOffset = (canvasWidth * y * 4) + x * 4;
                noiseImage.data[currentPixelOffset] = Math.random() * 255;
                if (y < this.noiseAnimationWindowPos || y > this.noiseAnimationWindowPos + this.interferenceHeight) {
                    noiseImage.data[currentPixelOffset] *= 0.85;
                }
                noiseImage.data[currentPixelOffset + 1] = noiseImage.data[currentPixelOffset];
                noiseImage.data[currentPixelOffset + 2] = noiseImage.data[currentPixelOffset];
                noiseImage.data[currentPixelOffset + 3] = 50;
            }
        }
        // Put texture onto canvas
        this.canvasContext.putImageData(noiseImage, 0, 0);
        this.lastFrameUpdate = new Date().getTime();
        this.noiseAnimationWindowPos += 7;
        if (this.noiseAnimationWindowPos > canvasHeight) {
            this.noiseAnimationWindowPos = -canvasHeight;
        }
        this.scheduleNextRender();
    };
    TvNoiseCanvas.prototype.scheduleNextRender = function () {
        if (this.useAnimationFrame) {
            this.frameUpdateHandlerId = window.requestAnimationFrame(this.renderFrame.bind(this));
        }
        else {
            this.frameUpdateHandlerId = setTimeout(this.renderFrame.bind(this), this.frameInterval);
        }
    };
    return TvNoiseCanvas;
}(component_1.Component));
exports.TvNoiseCanvas = TvNoiseCanvas;

},{"../dom":45,"./component":13}],38:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var container_1 = require("./container");
var dom_1 = require("../dom");
var timeout_1 = require("../timeout");
var utils_1 = require("../utils");
/**
 * The base container that contains all of the UI. The UIContainer is passed to the {@link UIManager} to build and
 * setup the UI.
 */
var UIContainer = (function (_super) {
    __extends(UIContainer, _super);
    function UIContainer(config) {
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-uicontainer',
            hideDelay: 5000,
        }, _this.config);
        return _this;
    }
    UIContainer.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        this.configureUIShowHide(player, uimanager);
        this.configurePlayerStates(player, uimanager);
    };
    UIContainer.prototype.configureUIShowHide = function (player, uimanager) {
        var self = this;
        var container = this.getDomElement();
        var config = this.getConfig();
        var isUiShown = false;
        var isSeeking = false;
        var showUi = function () {
            if (!isUiShown) {
                // Let subscribers know that they should reveal themselves
                uimanager.onControlsShow.dispatch(self);
                isUiShown = true;
            }
            // Don't trigger timeout while seeking, it will be triggered once the seek is finished
            if (!isSeeking) {
                uiHideTimeout.start();
            }
        };
        var hideUi = function () {
            if (isUiShown) {
                // Let subscribers know that they should now hide themselves
                uimanager.onControlsHide.dispatch(self);
                isUiShown = false;
            }
        };
        // Timeout to defer UI hiding by the configured delay time
        var uiHideTimeout = new timeout_1.Timeout(config.hideDelay, hideUi);
        // On touch displays, the first touch reveals the UI
        container.on('touchend', function (e) {
            if (!isUiShown) {
                // Only if the UI is hidden, we prevent other actions and reveal the UI instead
                e.preventDefault();
                showUi();
            }
        });
        // When the mouse enters, we show the UI
        container.on('mouseenter', function () {
            showUi();
        });
        // When the mouse moves within, we show the UI
        container.on('mousemove', function () {
            showUi();
        });
        // When the mouse leaves, we can prepare to hide the UI, except a seek is going on
        container.on('mouseleave', function () {
            // When a seek is going on, the seek scrub pointer may exit the UI area while still seeking, and we do not hide
            // the UI in such cases
            if (!isSeeking) {
                uiHideTimeout.start();
            }
        });
        uimanager.onSeek.subscribe(function () {
            uiHideTimeout.clear(); // Don't hide UI while a seek is in progress
            isSeeking = true;
        });
        uimanager.onSeeked.subscribe(function () {
            isSeeking = false;
            uiHideTimeout.start(); // Re-enable UI hide timeout after a seek
        });
    };
    UIContainer.prototype.configurePlayerStates = function (player, uimanager) {
        var self = this;
        var container = this.getDomElement();
        var removeStates = function () {
            container.removeClass(self.prefixCss(UIContainer.STATE_IDLE));
            container.removeClass(self.prefixCss(UIContainer.STATE_PREPARED));
            container.removeClass(self.prefixCss(UIContainer.STATE_PLAYING));
            container.removeClass(self.prefixCss(UIContainer.STATE_PAUSED));
            container.removeClass(self.prefixCss(UIContainer.STATE_FINISHED));
        };
        player.addEventHandler(bitmovin.player.EVENT.ON_READY, function () {
            removeStates();
            container.addClass(self.prefixCss(UIContainer.STATE_PREPARED));
        });
        player.addEventHandler(bitmovin.player.EVENT.ON_PLAY, function () {
            removeStates();
            container.addClass(self.prefixCss(UIContainer.STATE_PLAYING));
        });
        player.addEventHandler(bitmovin.player.EVENT.ON_PAUSED, function () {
            removeStates();
            container.addClass(self.prefixCss(UIContainer.STATE_PAUSED));
        });
        player.addEventHandler(bitmovin.player.EVENT.ON_PLAYBACK_FINISHED, function () {
            removeStates();
            container.addClass(self.prefixCss(UIContainer.STATE_FINISHED));
        });
        player.addEventHandler(bitmovin.player.EVENT.ON_SOURCE_UNLOADED, function () {
            removeStates();
            container.addClass(self.prefixCss(UIContainer.STATE_IDLE));
        });
        // Init in idle state without a source or prepared if a source is set
        container.addClass(self.prefixCss(utils_1.PlayerUtils.isSourceLoaded(player) ?
            UIContainer.STATE_PREPARED : UIContainer.STATE_IDLE));
        // Fullscreen marker class
        player.addEventHandler(bitmovin.player.EVENT.ON_FULLSCREEN_ENTER, function () {
            container.addClass(self.prefixCss(UIContainer.FULLSCREEN));
        });
        player.addEventHandler(bitmovin.player.EVENT.ON_FULLSCREEN_EXIT, function () {
            container.removeClass(self.prefixCss(UIContainer.FULLSCREEN));
        });
        // Init fullscreen state
        if (player.isFullscreen()) {
            container.addClass(self.prefixCss(UIContainer.FULLSCREEN));
        }
        // Buffering marker class
        player.addEventHandler(bitmovin.player.EVENT.ON_STALL_STARTED, function () {
            container.addClass(self.prefixCss(UIContainer.BUFFERING));
        });
        player.addEventHandler(bitmovin.player.EVENT.ON_STALL_ENDED, function () {
            container.removeClass(self.prefixCss(UIContainer.BUFFERING));
        });
        // Init buffering state
        if (player.isStalled()) {
            container.addClass(self.prefixCss(UIContainer.BUFFERING));
        }
        // Controls visibility marker class
        uimanager.onControlsShow.subscribe(function () {
            container.removeClass(self.prefixCss(UIContainer.CONTROLS_HIDDEN));
            container.addClass(self.prefixCss(UIContainer.CONTROLS_SHOWN));
        });
        uimanager.onControlsHide.subscribe(function () {
            container.removeClass(self.prefixCss(UIContainer.CONTROLS_SHOWN));
            container.addClass(self.prefixCss(UIContainer.CONTROLS_HIDDEN));
        });
        // Layout size classes
        var updateLayoutSizeClasses = function (width, height) {
            container.removeClass(self.prefixCss('layout-max-width-400'));
            container.removeClass(self.prefixCss('layout-max-width-600'));
            container.removeClass(self.prefixCss('layout-max-width-800'));
            container.removeClass(self.prefixCss('layout-max-width-1200'));
            if (width <= 400) {
                container.addClass(self.prefixCss('layout-max-width-400'));
            }
            else if (width <= 600) {
                container.addClass(self.prefixCss('layout-max-width-600'));
            }
            else if (width <= 800) {
                container.addClass(self.prefixCss('layout-max-width-800'));
            }
            else if (width <= 1200) {
                container.addClass(self.prefixCss('layout-max-width-1200'));
            }
        };
        player.addEventHandler(bitmovin.player.EVENT.ON_PLAYER_RESIZE, function (e) {
            // Convert strings (with "px" suffix) to ints
            var width = Math.round(Number(e.width.substring(0, e.width.length - 2)));
            var height = Math.round(Number(e.height.substring(0, e.height.length - 2)));
            updateLayoutSizeClasses(width, height);
        });
        // Init layout state
        updateLayoutSizeClasses(new dom_1.DOM(player.getFigure()).width(), new dom_1.DOM(player.getFigure()).height());
    };
    UIContainer.prototype.toDomElement = function () {
        var self = this;
        var container = _super.prototype.toDomElement.call(this);
        // Detect flexbox support (not supported in IE9)
        if (document && typeof document.createElement('p').style.flex !== 'undefined') {
            container.addClass(self.prefixCss('flexbox'));
        }
        else {
            container.addClass(self.prefixCss('no-flexbox'));
        }
        return container;
    };
    return UIContainer;
}(container_1.Container));
UIContainer.STATE_IDLE = 'player-state-idle';
UIContainer.STATE_PREPARED = 'player-state-prepared';
UIContainer.STATE_PLAYING = 'player-state-playing';
UIContainer.STATE_PAUSED = 'player-state-paused';
UIContainer.STATE_FINISHED = 'player-state-finished';
UIContainer.FULLSCREEN = 'fullscreen';
UIContainer.BUFFERING = 'buffering';
UIContainer.CONTROLS_SHOWN = 'controls-shown';
UIContainer.CONTROLS_HIDDEN = 'controls-hidden';
exports.UIContainer = UIContainer;

},{"../dom":45,"../timeout":49,"../utils":51,"./container":14}],39:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var selectbox_1 = require("./selectbox");
/**
 * A select box providing a selection between 'auto' and the available video qualities.
 */
var VideoQualitySelectBox = (function (_super) {
    __extends(VideoQualitySelectBox, _super);
    function VideoQualitySelectBox(config) {
        if (config === void 0) { config = {}; }
        return _super.call(this, config) || this;
    }
    VideoQualitySelectBox.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        var self = this;
        var updateVideoQualities = function () {
            var videoQualities = player.getAvailableVideoQualities();
            self.clearItems();
            // Add entry for automatic quality switching (default setting)
            self.addItem('auto', 'auto');
            // Add video qualities
            for (var _i = 0, videoQualities_1 = videoQualities; _i < videoQualities_1.length; _i++) {
                var videoQuality = videoQualities_1[_i];
                self.addItem(videoQuality.id, videoQuality.label);
            }
        };
        self.onItemSelected.subscribe(function (sender, value) {
            player.setVideoQuality(value);
        });
        // Update qualities when source goes away
        player.addEventHandler(bitmovin.player.EVENT.ON_SOURCE_UNLOADED, updateVideoQualities);
        // Update qualities when a new source is loaded
        player.addEventHandler(bitmovin.player.EVENT.ON_READY, updateVideoQualities);
        // Update quality selection when quality is changed (from outside)
        player.addEventHandler(bitmovin.player.EVENT.ON_VIDEO_DOWNLOAD_QUALITY_CHANGED, function () {
            var data = player.getDownloadedVideoData();
            self.selectItem(data.isAuto ? 'auto' : data.id);
        });
        // Populate qualities at startup
        updateVideoQualities();
    };
    return VideoQualitySelectBox;
}(selectbox_1.SelectBox));
exports.VideoQualitySelectBox = VideoQualitySelectBox;

},{"./selectbox":30}],40:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var container_1 = require("./container");
var volumeslider_1 = require("./volumeslider");
var volumetogglebutton_1 = require("./volumetogglebutton");
var timeout_1 = require("../timeout");
/**
 * A composite volume control that consists of and internally manages a volume control button that can be used
 * for muting, and a (depending on the CSS style, e.g. slide-out) volume control bar.
 */
var VolumeControlButton = (function (_super) {
    __extends(VolumeControlButton, _super);
    function VolumeControlButton(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.volumeToggleButton = new volumetogglebutton_1.VolumeToggleButton();
        _this.volumeSlider = new volumeslider_1.VolumeSlider({
            vertical: config.vertical != null ? config.vertical : true,
            hidden: true
        });
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-volumecontrolbutton',
            components: [_this.volumeToggleButton, _this.volumeSlider],
            hideDelay: 500
        }, _this.config);
        return _this;
    }
    VolumeControlButton.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        var self = this;
        var volumeToggleButton = this.getVolumeToggleButton();
        var volumeSlider = this.getVolumeSlider();
        var timeout = new timeout_1.Timeout(self.getConfig().hideDelay, function () {
            volumeSlider.hide();
        });
        /*
         * Volume Slider visibility handling
         *
         * The volume slider shall be visible while the user hovers the mute toggle button, while the user hovers the
         * volume slider, and while the user slides the volume slider. If none of these situations are true, the slider
         * shall disappear.
         */
        var volumeSliderHovered = false;
        volumeToggleButton.getDomElement().on('mouseenter', function () {
            // Show volume slider when mouse enters the button area
            if (volumeSlider.isHidden()) {
                volumeSlider.show();
            }
            // Avoid hiding of the slider when button is hovered
            timeout.clear();
        });
        volumeToggleButton.getDomElement().on('mouseleave', function () {
            // Hide slider delayed when button is left
            timeout.reset();
        });
        volumeSlider.getDomElement().on('mouseenter', function () {
            // When the slider is entered, cancel the hide timeout activated by leaving the button
            timeout.clear();
            volumeSliderHovered = true;
        });
        volumeSlider.getDomElement().on('mouseleave', function () {
            // When mouse leaves the slider, only hide it if there is no slide operation in progress
            if (volumeSlider.isSeeking()) {
                timeout.clear();
            }
            else {
                timeout.reset();
            }
            volumeSliderHovered = false;
        });
        volumeSlider.onSeeked.subscribe(function () {
            // When a slide operation is done and the slider not hovered (mouse outside slider), hide slider delayed
            if (!volumeSliderHovered) {
                timeout.reset();
            }
        });
    };
    /**
     * Provides access to the internally managed volume toggle button.
     * @returns {VolumeToggleButton}
     */
    VolumeControlButton.prototype.getVolumeToggleButton = function () {
        return this.volumeToggleButton;
    };
    /**
     * Provides access to the internally managed volume silder.
     * @returns {VolumeSlider}
     */
    VolumeControlButton.prototype.getVolumeSlider = function () {
        return this.volumeSlider;
    };
    return VolumeControlButton;
}(container_1.Container));
exports.VolumeControlButton = VolumeControlButton;

},{"../timeout":49,"./container":14,"./volumeslider":41,"./volumetogglebutton":42}],41:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var seekbar_1 = require("./seekbar");
var timeout_1 = require("../timeout");
/**
 * A simple volume slider component to adjust the player's volume setting.
 */
var VolumeSlider = (function (_super) {
    __extends(VolumeSlider, _super);
    function VolumeSlider(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-volumeslider'
        }, _this.config);
        return _this;
    }
    VolumeSlider.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager, false);
        var self = this;
        var volumeChangeHandler = function () {
            if (player.isMuted()) {
                self.setPlaybackPosition(0);
                self.setBufferPosition(0);
            }
            else {
                self.setPlaybackPosition(player.getVolume());
                self.setBufferPosition(player.getVolume());
            }
        };
        player.addEventHandler(bitmovin.player.EVENT.ON_VOLUME_CHANGED, volumeChangeHandler);
        player.addEventHandler(bitmovin.player.EVENT.ON_MUTED, volumeChangeHandler);
        player.addEventHandler(bitmovin.player.EVENT.ON_UNMUTED, volumeChangeHandler);
        this.onSeekPreview.subscribe(function (sender, args) {
            if (args.scrubbing) {
                player.setVolume(args.position);
            }
        });
        this.onSeeked.subscribe(function (sender, percentage) {
            player.setVolume(percentage);
        });
        player.addEventHandler(bitmovin.player.EVENT.ON_PLAYER_RESIZE, function () {
            self.refreshPlaybackPosition();
        });
        // Init volume bar
        volumeChangeHandler();
        // TODO find a better solution for this hack
        /* At the time where this is called, the DOM element does not have a size yet, resulting in a zero offset of the
         * volume slider knob, no matter what the actual volume setting on the player is. Out of lack of a way to
         * detect when the element gets its size, we use this hack that actually seems to work on all browsers.
         */
        new timeout_1.Timeout(1, function () {
            self.refreshPlaybackPosition();
        }).start();
    };
    return VolumeSlider;
}(seekbar_1.SeekBar));
exports.VolumeSlider = VolumeSlider;

},{"../timeout":49,"./seekbar":28}],42:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var togglebutton_1 = require("./togglebutton");
/**
 * A button that toggles audio muting.
 */
var VolumeToggleButton = (function (_super) {
    __extends(VolumeToggleButton, _super);
    function VolumeToggleButton(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-volumetogglebutton',
            text: 'Volume/Mute'
        }, _this.config);
        return _this;
    }
    VolumeToggleButton.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        var self = this;
        var muteStateHandler = function () {
            if (player.isMuted()) {
                self.on();
            }
            else {
                self.off();
            }
        };
        player.addEventHandler(bitmovin.player.EVENT.ON_MUTED, muteStateHandler);
        player.addEventHandler(bitmovin.player.EVENT.ON_UNMUTED, muteStateHandler);
        self.onClick.subscribe(function () {
            if (player.isMuted()) {
                player.unmute();
            }
            else {
                player.mute();
            }
        });
        player.addEventHandler(bitmovin.player.EVENT.ON_VOLUME_CHANGED, function (event) {
            // Toggle low class to display low volume icon below 50% volume
            if (event.targetVolume < 50) {
                self.getDomElement().addClass(self.prefixCss('low'));
            }
            else {
                self.getDomElement().removeClass(self.prefixCss('low'));
            }
        });
        // Startup init
        muteStateHandler();
    };
    return VolumeToggleButton;
}(togglebutton_1.ToggleButton));
exports.VolumeToggleButton = VolumeToggleButton;

},{"./togglebutton":36}],43:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var togglebutton_1 = require("./togglebutton");
/**
 * A button that toggles the video view between normal/mono and VR/stereo.
 */
var VRToggleButton = (function (_super) {
    __extends(VRToggleButton, _super);
    function VRToggleButton(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-vrtogglebutton',
            text: 'VR'
        }, _this.config);
        return _this;
    }
    VRToggleButton.prototype.configure = function (player, uimanager) {
        _super.prototype.configure.call(this, player, uimanager);
        var self = this;
        var isVRConfigured = function () {
            // VR availability cannot be checked through getVRStatus() because it is asynchronously populated and not
            // available at UI initialization. As an alternative, we check the VR settings in the config.
            // TODO use getVRStatus() through isVRStereoAvailable() once the player has been rewritten and the status is
            // available in ON_READY
            var config = player.getConfig();
            return config.source && config.source.vr && config.source.vr.contentType !== 'none';
        };
        var isVRStereoAvailable = function () {
            return player.getVRStatus().contentType !== 'none';
        };
        var vrStateHandler = function () {
            if (isVRConfigured() && isVRStereoAvailable()) {
                self.show(); // show button in case it is hidden
                if (player.getVRStatus().isStereo) {
                    self.on();
                }
                else {
                    self.off();
                }
            }
            else {
                self.hide(); // hide button if no stereo mode available
            }
        };
        var vrButtonVisibilityHandler = function () {
            if (isVRConfigured()) {
                self.show();
            }
            else {
                self.hide();
            }
        };
        player.addEventHandler(bitmovin.player.EVENT.ON_VR_MODE_CHANGED, vrStateHandler);
        player.addEventHandler(bitmovin.player.EVENT.ON_VR_STEREO_CHANGED, vrStateHandler);
        player.addEventHandler(bitmovin.player.EVENT.ON_VR_ERROR, vrStateHandler);
        // Hide button when VR source goes away
        player.addEventHandler(bitmovin.player.EVENT.ON_SOURCE_UNLOADED, vrButtonVisibilityHandler);
        // Show button when a new source is loaded and it's VR
        player.addEventHandler(bitmovin.player.EVENT.ON_READY, vrButtonVisibilityHandler);
        self.onClick.subscribe(function () {
            if (!isVRStereoAvailable()) {
                if (console) {
                    console.log('No VR content');
                }
            }
            else {
                if (player.getVRStatus().isStereo) {
                    player.setVRStereo(false);
                }
                else {
                    player.setVRStereo(true);
                }
            }
        });
        // Set startup visibility
        vrButtonVisibilityHandler();
    };
    return VRToggleButton;
}(togglebutton_1.ToggleButton));
exports.VRToggleButton = VRToggleButton;

},{"./togglebutton":36}],44:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var clickoverlay_1 = require("./clickoverlay");
/**
 * A watermark overlay with a clickable logo.
 */
var Watermark = (function (_super) {
    __extends(Watermark, _super);
    function Watermark(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this, config) || this;
        _this.config = _this.mergeConfig(config, {
            cssClass: 'ui-watermark',
            url: 'http://bitmovin.com'
        }, _this.config);
        return _this;
    }
    return Watermark;
}(clickoverlay_1.ClickOverlay));
exports.Watermark = Watermark;

},{"./clickoverlay":11}],45:[function(require,module,exports){
"use strict";
/**
 * Simple DOM manipulation and DOM element event handling modeled after jQuery (as replacement for jQuery).
 *
 * Like jQuery, DOM operates on single elements and lists of elements. For example: creating an element returns a DOM
 * instance with a single element, selecting elements returns a DOM instance with zero, one, or many elements. Similar
 * to jQuery, setters usually affect all elements, while getters operate on only the first element.
 * Also similar to jQuery, most methods (except getters) return the DOM instance facilitating easy chaining of method
 * calls.
 *
 * Built with the help of: http://youmightnotneedjquery.com/
 */
var DOM = (function () {
    function DOM(something, attributes) {
        this.document = document; // Set the global document to the local document field
        if (something instanceof Array) {
            if (something.length > 0 && something[0] instanceof HTMLElement) {
                var elements = something;
                this.elements = elements;
            }
        }
        else if (something instanceof HTMLElement) {
            var element = something;
            this.elements = [element];
        }
        else if (something instanceof Document) {
            // When a document is passed in, we do not do anything with it, but by setting this.elements to null
            // we give the event handling method a means to detect if the events should be registered on the document
            // instead of elements.
            this.elements = null;
        }
        else if (attributes) {
            var tagName = something;
            var element = document.createElement(tagName);
            for (var attributeName in attributes) {
                var attributeValue = attributes[attributeName];
                element.setAttribute(attributeName, attributeValue);
            }
            this.elements = [element];
        }
        else {
            var selector = something;
            this.elements = this.findChildElements(selector);
        }
    }
    Object.defineProperty(DOM.prototype, "length", {
        /**
         * Gets the number of elements that this DOM instance currently holds.
         * @returns {number} the number of elements
         */
        get: function () {
            return this.elements ? this.elements.length : 0;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Gets the HTML elements that this DOM instance currently holds.
     * @returns {HTMLElement[]} the raw HTML elements
     */
    DOM.prototype.getElements = function () {
        return this.elements;
    };
    /**
     * A shortcut method for iterating all elements. Shorts this.elements.forEach(...) to this.forEach(...).
     * @param handler the handler to execute an operation on an element
     */
    DOM.prototype.forEach = function (handler) {
        this.elements.forEach(function (element) {
            handler(element);
        });
    };
    DOM.prototype.findChildElementsOfElement = function (element, selector) {
        var childElements = element.querySelectorAll(selector);
        // Convert NodeList to Array
        // https://toddmotto.com/a-comprehensive-dive-into-nodelists-arrays-converting-nodelists-and-understanding-the-dom/
        return [].slice.call(childElements);
    };
    DOM.prototype.findChildElements = function (selector) {
        var self = this;
        var allChildElements = [];
        if (this.elements) {
            this.forEach(function (element) {
                allChildElements = allChildElements.concat(self.findChildElementsOfElement(element, selector));
            });
        }
        else {
            return this.findChildElementsOfElement(document, selector);
        }
        return allChildElements;
    };
    /**
     * Finds all child elements of all elements matching the supplied selector.
     * @param selector the selector to match with child elements
     * @returns {DOM} a new DOM instance representing all matched children
     */
    DOM.prototype.find = function (selector) {
        var allChildElements = this.findChildElements(selector);
        return new DOM(allChildElements);
    };
    DOM.prototype.html = function (content) {
        if (arguments.length > 0) {
            return this.setHtml(content);
        }
        else {
            return this.getHtml();
        }
    };
    DOM.prototype.getHtml = function () {
        return this.elements[0].innerHTML;
    };
    DOM.prototype.setHtml = function (content) {
        if (content === undefined || content == null) {
            // Set to empty string to avoid innerHTML getting set to 'undefined' (all browsers) or 'null' (IE9)
            content = '';
        }
        this.forEach(function (element) {
            element.innerHTML = content;
        });
        return this;
    };
    /**
     * Clears the inner HTML of all elements (deletes all children).
     * @returns {DOM}
     */
    DOM.prototype.empty = function () {
        this.forEach(function (element) {
            element.innerHTML = '';
        });
        return this;
    };
    /**
     * Returns the current value of the first form element, e.g. the selected value of a select box or the text if an
     * input field.
     * @returns {string} the value of a form element
     */
    DOM.prototype.val = function () {
        var element = this.elements[0];
        if (element instanceof HTMLSelectElement || element instanceof HTMLInputElement) {
            return element.value;
        }
        else {
            // TODO add support for missing form elements
            throw new Error("val() not supported for " + typeof element);
        }
    };
    DOM.prototype.attr = function (attribute, value) {
        if (arguments.length > 1) {
            return this.setAttr(attribute, value);
        }
        else {
            return this.getAttr(attribute);
        }
    };
    DOM.prototype.getAttr = function (attribute) {
        return this.elements[0].getAttribute(attribute);
    };
    DOM.prototype.setAttr = function (attribute, value) {
        this.forEach(function (element) {
            element.setAttribute(attribute, value);
        });
        return this;
    };
    DOM.prototype.data = function (dataAttribute, value) {
        if (arguments.length > 1) {
            return this.setData(dataAttribute, value);
        }
        else {
            return this.getData(dataAttribute);
        }
    };
    DOM.prototype.getData = function (dataAttribute) {
        return this.elements[0].getAttribute('data-' + dataAttribute);
    };
    DOM.prototype.setData = function (dataAttribute, value) {
        this.forEach(function (element) {
            element.setAttribute('data-' + dataAttribute, value);
        });
        return this;
    };
    /**
     * Appends one or more DOM elements as children to all elements.
     * @param childElements the chrild elements to append
     * @returns {DOM}
     */
    DOM.prototype.append = function () {
        var childElements = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            childElements[_i] = arguments[_i];
        }
        this.forEach(function (element) {
            childElements.forEach(function (childElement) {
                childElement.elements.forEach(function (_, index) {
                    element.appendChild(childElement.elements[index]);
                });
            });
        });
        return this;
    };
    /**
     * Removes all elements from the DOM.
     */
    DOM.prototype.remove = function () {
        this.forEach(function (element) {
            var parent = element.parentNode;
            if (parent) {
                parent.removeChild(element);
            }
        });
    };
    /**
     * Returns the offset of the first element from the document's top left corner.
     * @returns {Offset}
     */
    DOM.prototype.offset = function () {
        var element = this.elements[0];
        var elementRect = element.getBoundingClientRect();
        var htmlRect = document.body.parentElement.getBoundingClientRect();
        // Virtual viewport scroll handling (e.g. pinch zoomed viewports in mobile browsers or desktop Chrome/Edge)
        // 'normal' zooms and virtual viewport zooms (aka layout viewport) result in different
        // element.getBoundingClientRect() results:
        //  - with normal scrolls, the clientRect decreases with an increase in scroll(Top|Left)/page(X|Y)Offset
        //  - with pinch zoom scrolls, the clientRect stays the same while scroll/pageOffset changes
        // This means, that the combination of clientRect + scroll/pageOffset does not work to calculate the offset
        // from the document's upper left origin when pinch zoom is used.
        // To work around this issue, we do not use scroll/pageOffset but get the clientRect of the html element and
        // subtract it from the element's rect, which always results in the offset from the document origin.
        // NOTE: the current way of offset calculation was implemented specifically to track event positions on the
        // seek bar, and it might break compatibility with jQuery's offset() method. If this ever turns out to be a
        // problem, this method should be reverted to the old version and the offset calculation moved to the seek bar.
        return {
            top: elementRect.top - htmlRect.top,
            left: elementRect.left - htmlRect.left
        };
    };
    /**
     * Returns the width of the first element.
     * @returns {number} the width of the first element
     */
    DOM.prototype.width = function () {
        // TODO check if this is the same as jQuery's width() (probably not)
        return this.elements[0].offsetWidth;
    };
    /**
     * Returns the height of the first element.
     * @returns {number} the height of the first element
     */
    DOM.prototype.height = function () {
        // TODO check if this is the same as jQuery's height() (probably not)
        return this.elements[0].offsetHeight;
    };
    /**
     * Attaches an event handler to one or more events on all elements.
     * @param eventName the event name (or multiple names separated by space) to listen to
     * @param eventHandler the event handler to call when the event fires
     * @returns {DOM}
     */
    DOM.prototype.on = function (eventName, eventHandler) {
        var events = eventName.split(' ');
        var self = this;
        events.forEach(function (event) {
            if (self.elements == null) {
                self.document.addEventListener(event, eventHandler);
            }
            else {
                self.forEach(function (element) {
                    element.addEventListener(event, eventHandler);
                });
            }
        });
        return this;
    };
    /**
     * Removes an event handler from one or more events on all elements.
     * @param eventName the event name (or multiple names separated by space) to remove the handler from
     * @param eventHandler the event handler to remove
     * @returns {DOM}
     */
    DOM.prototype.off = function (eventName, eventHandler) {
        var events = eventName.split(' ');
        var self = this;
        events.forEach(function (event) {
            if (self.elements == null) {
                self.document.removeEventListener(event, eventHandler);
            }
            else {
                self.forEach(function (element) {
                    element.removeEventListener(event, eventHandler);
                });
            }
        });
        return this;
    };
    /**
     * Adds the specified class(es) to all elements.
     * @param className the class(es) to add, multiple classes separated by space
     * @returns {DOM}
     */
    DOM.prototype.addClass = function (className) {
        this.forEach(function (element) {
            if (element.classList) {
                element.classList.add(className);
            }
            else {
                element.className += ' ' + className;
            }
        });
        return this;
    };
    /**
     * Removed the specified class(es) from all elements.
     * @param className the class(es) to remove, multiple classes separated by space
     * @returns {DOM}
     */
    DOM.prototype.removeClass = function (className) {
        this.forEach(function (element) {
            if (element.classList) {
                element.classList.remove(className);
            }
            else {
                element.className = element.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
            }
        });
        return this;
    };
    /**
     * Checks if any of the elements has the specified class.
     * @param className the class name to check
     * @returns {boolean} true if one of the elements has the class attached, else if no element has it attached
     */
    DOM.prototype.hasClass = function (className) {
        var hasClass = false;
        this.forEach(function (element) {
            if (element.classList) {
                if (element.classList.contains(className)) {
                    // Since we are inside a handler, we can't just 'return true'. Instead, we save it to a variable
                    // and return it at the end of the function body.
                    hasClass = true;
                }
            }
            else {
                if (new RegExp('(^| )' + className + '( |$)', 'gi').test(element.className)) {
                    // See comment above
                    hasClass = true;
                }
            }
        });
        return hasClass;
    };
    DOM.prototype.css = function (propertyNameOrCollection, value) {
        if (typeof propertyNameOrCollection === 'string') {
            var propertyName = propertyNameOrCollection;
            if (arguments.length === 2) {
                return this.setCss(propertyName, value);
            }
            else {
                return this.getCss(propertyName);
            }
        }
        else {
            var propertyValueCollection = propertyNameOrCollection;
            return this.setCssCollection(propertyValueCollection);
        }
    };
    DOM.prototype.getCss = function (propertyName) {
        return getComputedStyle(this.elements[0])[propertyName];
    };
    DOM.prototype.setCss = function (propertyName, value) {
        this.forEach(function (element) {
            // <any> cast to resolve TS7015: http://stackoverflow.com/a/36627114/370252
            element.style[propertyName] = value;
        });
        return this;
    };
    DOM.prototype.setCssCollection = function (ruleValueCollection) {
        this.forEach(function (element) {
            // http://stackoverflow.com/a/34490573/370252
            Object.assign(element.style, ruleValueCollection);
        });
        return this;
    };
    return DOM;
}());
exports.DOM = DOM;

},{}],46:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var utils_1 = require("./utils");
/**
 * Event dispatcher to subscribe and trigger events. Each event should have its own dispatcher.
 */
var EventDispatcher = (function () {
    function EventDispatcher() {
        this.listeners = [];
    }
    /**
     * {@inheritDoc}
     */
    EventDispatcher.prototype.subscribe = function (listener) {
        this.listeners.push(new EventListenerWrapper(listener));
    };
    /**
     * {@inheritDoc}
     */
    EventDispatcher.prototype.subscribeOnce = function (listener) {
        this.listeners.push(new EventListenerWrapper(listener, true));
    };
    /**
     * {@inheritDoc}
     */
    EventDispatcher.prototype.subscribeRateLimited = function (listener, rateMs) {
        this.listeners.push(new RateLimitedEventListenerWrapper(listener, rateMs));
    };
    /**
     * {@inheritDoc}
     */
    EventDispatcher.prototype.unsubscribe = function (listener) {
        // Iterate through listeners, compare with parameter, and remove if found
        for (var i = 0; i < this.listeners.length; i++) {
            var subscribedListener = this.listeners[i];
            if (subscribedListener.listener === listener) {
                utils_1.ArrayUtils.remove(this.listeners, subscribedListener);
                return true;
            }
        }
        return false;
    };
    /**
     * Removes all listeners from this dispatcher.
     */
    EventDispatcher.prototype.unsubscribeAll = function () {
        this.listeners = [];
    };
    /**
     * Dispatches an event to all subscribed listeners.
     * @param sender the source of the event
     * @param args the arguments for the event
     */
    EventDispatcher.prototype.dispatch = function (sender, args) {
        if (args === void 0) { args = null; }
        var listenersToRemove = [];
        // Call every listener
        for (var _i = 0, _a = this.listeners; _i < _a.length; _i++) {
            var listener = _a[_i];
            listener.fire(sender, args);
            if (listener.isOnce()) {
                listenersToRemove.push(listener);
            }
        }
        // Remove one-time listener
        for (var _b = 0, listenersToRemove_1 = listenersToRemove; _b < listenersToRemove_1.length; _b++) {
            var listenerToRemove = listenersToRemove_1[_b];
            utils_1.ArrayUtils.remove(this.listeners, listenerToRemove);
        }
    };
    /**
     * Returns the event that this dispatcher manages and on which listeners can subscribe and unsubscribe event handlers.
     * @returns {Event}
     */
    EventDispatcher.prototype.getEvent = function () {
        // For now, just case the event dispatcher to the event interface. At some point in the future when the
        // codebase grows, it might make sense to split the dispatcher into separate dispatcher and event classes.
        return this;
    };
    return EventDispatcher;
}());
exports.EventDispatcher = EventDispatcher;
/**
 * A basic event listener wrapper to manage listeners within the {@link EventDispatcher}. This is a 'private' class
 * for internal dispatcher use and it is therefore not exported.
 */
var EventListenerWrapper = (function () {
    function EventListenerWrapper(listener, once) {
        if (once === void 0) { once = false; }
        this.eventListener = listener;
        this.once = once;
    }
    Object.defineProperty(EventListenerWrapper.prototype, "listener", {
        /**
         * Returns the wrapped event listener.
         * @returns {EventListener<Sender, Args>}
         */
        get: function () {
            return this.eventListener;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Fires the wrapped event listener with the given arguments.
     * @param sender
     * @param args
     */
    EventListenerWrapper.prototype.fire = function (sender, args) {
        this.eventListener(sender, args);
    };
    /**
     * Checks if this listener is scheduled to be called only once.
     * @returns {boolean} once if true
     */
    EventListenerWrapper.prototype.isOnce = function () {
        return this.once;
    };
    return EventListenerWrapper;
}());
/**
 * Extends the basic {@link EventListenerWrapper} with rate-limiting functionality.
 */
var RateLimitedEventListenerWrapper = (function (_super) {
    __extends(RateLimitedEventListenerWrapper, _super);
    function RateLimitedEventListenerWrapper(listener, rateMs) {
        var _this = _super.call(this, listener) || this;
        _this.rateMs = rateMs;
        _this.lastFireTime = 0;
        // Wrap the event listener with an event listener that does the rate-limiting
        _this.rateLimitingEventListener = function (sender, args) {
            if (Date.now() - this.lastFireTime > this.rateMs) {
                // Only if enough time since the previous call has passed, call the
                // actual event listener and record the current time
                this.fireSuper(sender, args);
                this.lastFireTime = Date.now();
            }
        };
        return _this;
    }
    RateLimitedEventListenerWrapper.prototype.fireSuper = function (sender, args) {
        // Fire the actual external event listener
        _super.prototype.fire.call(this, sender, args);
    };
    RateLimitedEventListenerWrapper.prototype.fire = function (sender, args) {
        // Fire the internal rate-limiting listener instead of the external event listener
        this.rateLimitingEventListener(sender, args);
    };
    return RateLimitedEventListenerWrapper;
}(EventListenerWrapper));

},{"./utils":51}],47:[function(require,module,exports){
"use strict";
var Guid;
(function (Guid) {
    var guid = 1;
    function next() {
        return guid++;
    }
    Guid.next = next;
})(Guid = exports.Guid || (exports.Guid = {}));

},{}],48:[function(require,module,exports){
"use strict";
/// <reference path='player.d.ts' />
/// <reference path='../../node_modules/@types/core-js/index.d.ts' />
var uimanager_1 = require("./uimanager");
var button_1 = require("./components/button");
var controlbar_1 = require("./components/controlbar");
var fullscreentogglebutton_1 = require("./components/fullscreentogglebutton");
var hugeplaybacktogglebutton_1 = require("./components/hugeplaybacktogglebutton");
var playbacktimelabel_1 = require("./components/playbacktimelabel");
var playbacktogglebutton_1 = require("./components/playbacktogglebutton");
var seekbar_1 = require("./components/seekbar");
var selectbox_1 = require("./components/selectbox");
var settingspanel_1 = require("./components/settingspanel");
var settingstogglebutton_1 = require("./components/settingstogglebutton");
var togglebutton_1 = require("./components/togglebutton");
var videoqualityselectbox_1 = require("./components/videoqualityselectbox");
var volumetogglebutton_1 = require("./components/volumetogglebutton");
var vrtogglebutton_1 = require("./components/vrtogglebutton");
var watermark_1 = require("./components/watermark");
var uicontainer_1 = require("./components/uicontainer");
var container_1 = require("./components/container");
var label_1 = require("./components/label");
var audioqualityselectbox_1 = require("./components/audioqualityselectbox");
var audiotrackselectbox_1 = require("./components/audiotrackselectbox");
var caststatusoverlay_1 = require("./components/caststatusoverlay");
var casttogglebutton_1 = require("./components/casttogglebutton");
var component_1 = require("./components/component");
var errormessageoverlay_1 = require("./components/errormessageoverlay");
var recommendationoverlay_1 = require("./components/recommendationoverlay");
var seekbarlabel_1 = require("./components/seekbarlabel");
var subtitleoverlay_1 = require("./components/subtitleoverlay");
var subtitleselectbox_1 = require("./components/subtitleselectbox");
var titlebar_1 = require("./components/titlebar");
var volumecontrolbutton_1 = require("./components/volumecontrolbutton");
var clickoverlay_1 = require("./components/clickoverlay");
var adskipbutton_1 = require("./components/adskipbutton");
var admessagelabel_1 = require("./components/admessagelabel");
var adclickoverlay_1 = require("./components/adclickoverlay");
var playbackspeedselectbox_1 = require("./components/playbackspeedselectbox");
var hugereplaybutton_1 = require("./components/hugereplaybutton");
var bufferingoverlay_1 = require("./components/bufferingoverlay");
var castuicontainer_1 = require("./components/castuicontainer");
var playbacktoggleoverlay_1 = require("./components/playbacktoggleoverlay");
var closebutton_1 = require("./components/closebutton");
var metadatalabel_1 = require("./components/metadatalabel");
// Object.assign polyfill for ES5/IE9
// https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
if (typeof Object.assign !== 'function') {
    Object.assign = function (target) {
        'use strict';
        if (target == null) {
            throw new TypeError('Cannot convert undefined or null to object');
        }
        target = Object(target);
        for (var index = 1; index < arguments.length; index++) {
            var source = arguments[index];
            if (source != null) {
                for (var key in source) {
                    if (Object.prototype.hasOwnProperty.call(source, key)) {
                        target[key] = source[key];
                    }
                }
            }
        }
        return target;
    };
}
// Expose classes to window
window.bitmovin.playerui = {
    // Management
    UIManager: uimanager_1.UIManager,
    // Components
    AdClickOverlay: adclickoverlay_1.AdClickOverlay,
    AdMessageLabel: admessagelabel_1.AdMessageLabel,
    AdSkipButton: adskipbutton_1.AdSkipButton,
    AudioQualitySelectBox: audioqualityselectbox_1.AudioQualitySelectBox,
    AudioTrackSelectBox: audiotrackselectbox_1.AudioTrackSelectBox,
    Button: button_1.Button,
    CastStatusOverlay: caststatusoverlay_1.CastStatusOverlay,
    CastToggleButton: casttogglebutton_1.CastToggleButton,
    ClickOverlay: clickoverlay_1.ClickOverlay,
    Component: component_1.Component,
    Container: container_1.Container,
    ControlBar: controlbar_1.ControlBar,
    ErrorMessageOverlay: errormessageoverlay_1.ErrorMessageOverlay,
    FullscreenToggleButton: fullscreentogglebutton_1.FullscreenToggleButton,
    HugePlaybackToggleButton: hugeplaybacktogglebutton_1.HugePlaybackToggleButton,
    Label: label_1.Label,
    PlaybackTimeLabel: playbacktimelabel_1.PlaybackTimeLabel,
    PlaybackToggleButton: playbacktogglebutton_1.PlaybackToggleButton,
    RecommendationOverlay: recommendationoverlay_1.RecommendationOverlay,
    SeekBar: seekbar_1.SeekBar,
    SeekBarLabel: seekbarlabel_1.SeekBarLabel,
    SelectBox: selectbox_1.SelectBox,
    SettingsPanel: settingspanel_1.SettingsPanel,
    SettingsToggleButton: settingstogglebutton_1.SettingsToggleButton,
    SubtitleOverlay: subtitleoverlay_1.SubtitleOverlay,
    SubtitleSelectBox: subtitleselectbox_1.SubtitleSelectBox,
    TitleBar: titlebar_1.TitleBar,
    ToggleButton: togglebutton_1.ToggleButton,
    UIContainer: uicontainer_1.UIContainer,
    VideoQualitySelectBox: videoqualityselectbox_1.VideoQualitySelectBox,
    VolumeControlButton: volumecontrolbutton_1.VolumeControlButton,
    VolumeToggleButton: volumetogglebutton_1.VolumeToggleButton,
    VRToggleButton: vrtogglebutton_1.VRToggleButton,
    Watermark: watermark_1.Watermark,
    PlaybackSpeedSelectBox: playbackspeedselectbox_1.PlaybackSpeedSelectBox,
    HugeReplayButton: hugereplaybutton_1.HugeReplayButton,
    BufferingOverlay: bufferingoverlay_1.BufferingOverlay,
    CastUIContainer: castuicontainer_1.CastUIContainer,
    PlaybackToggleOverlay: playbacktoggleoverlay_1.PlaybackToggleOverlay,
    CloseButton: closebutton_1.CloseButton,
    MetadataLabel: metadatalabel_1.MetadataLabel,
    MetadataLabelContent: metadatalabel_1.MetadataLabelContent,
};

},{"./components/adclickoverlay":1,"./components/admessagelabel":2,"./components/adskipbutton":3,"./components/audioqualityselectbox":4,"./components/audiotrackselectbox":5,"./components/bufferingoverlay":6,"./components/button":7,"./components/caststatusoverlay":8,"./components/casttogglebutton":9,"./components/castuicontainer":10,"./components/clickoverlay":11,"./components/closebutton":12,"./components/component":13,"./components/container":14,"./components/controlbar":15,"./components/errormessageoverlay":16,"./components/fullscreentogglebutton":17,"./components/hugeplaybacktogglebutton":18,"./components/hugereplaybutton":19,"./components/label":20,"./components/metadatalabel":22,"./components/playbackspeedselectbox":23,"./components/playbacktimelabel":24,"./components/playbacktogglebutton":25,"./components/playbacktoggleoverlay":26,"./components/recommendationoverlay":27,"./components/seekbar":28,"./components/seekbarlabel":29,"./components/selectbox":30,"./components/settingspanel":31,"./components/settingstogglebutton":32,"./components/subtitleoverlay":33,"./components/subtitleselectbox":34,"./components/titlebar":35,"./components/togglebutton":36,"./components/uicontainer":38,"./components/videoqualityselectbox":39,"./components/volumecontrolbutton":40,"./components/volumetogglebutton":42,"./components/vrtogglebutton":43,"./components/watermark":44,"./uimanager":50}],49:[function(require,module,exports){
"use strict";
// TODO change to internal (not exported) class, how to use in other files?
/**
 * Executes a callback after a specified amount of time, optionally repeatedly until stopped.
 */
var Timeout = (function () {
    /**
     * Creates a new timeout callback handler.
     * @param delay the delay in milliseconds after which the callback should be executed
     * @param callback the callback to execute after the delay time
     * @param repeat if true, call the callback repeatedly in delay intervals
     */
    function Timeout(delay, callback, repeat) {
        if (repeat === void 0) { repeat = false; }
        this.delay = delay;
        this.callback = callback;
        this.repeat = repeat;
        this.timeoutHandle = 0;
    }
    /**
     * Starts the timeout and calls the callback when the timeout delay has passed.
     */
    Timeout.prototype.start = function () {
        this.reset();
    };
    /**
     * Clears the timeout. The callback will not be called if clear is called during the timeout.
     */
    Timeout.prototype.clear = function () {
        clearTimeout(this.timeoutHandle);
    };
    /**
     * Resets the passed timeout delay to zero. Can be used to defer the calling of the callback.
     */
    Timeout.prototype.reset = function () {
        var self = this;
        var lastScheduleTime = 0;
        var delayAdjust = 0;
        this.clear();
        var internalCallback = function () {
            self.callback();
            if (self.repeat) {
                var now = Date.now();
                // The time of one iteration from scheduling to executing the callback (usually a bit longer than the delay
                // time)
                var delta = now - lastScheduleTime;
                // Calculate the delay adjustment for the next schedule to keep a steady delay interval over time
                delayAdjust = self.delay - delta + delayAdjust;
                lastScheduleTime = now;
                // Schedule next execution by the adjusted delay
                self.timeoutHandle = setTimeout(internalCallback, self.delay + delayAdjust);
            }
        };
        lastScheduleTime = Date.now();
        this.timeoutHandle = setTimeout(internalCallback, this.delay);
    };
    return Timeout;
}());
exports.Timeout = Timeout;

},{}],50:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var uicontainer_1 = require("./components/uicontainer");
var dom_1 = require("./dom");
var component_1 = require("./components/component");
var container_1 = require("./components/container");
var playbacktogglebutton_1 = require("./components/playbacktogglebutton");
var fullscreentogglebutton_1 = require("./components/fullscreentogglebutton");
var vrtogglebutton_1 = require("./components/vrtogglebutton");
var volumetogglebutton_1 = require("./components/volumetogglebutton");
var seekbar_1 = require("./components/seekbar");
var playbacktimelabel_1 = require("./components/playbacktimelabel");
var controlbar_1 = require("./components/controlbar");
var eventdispatcher_1 = require("./eventdispatcher");
var settingstogglebutton_1 = require("./components/settingstogglebutton");
var settingspanel_1 = require("./components/settingspanel");
var videoqualityselectbox_1 = require("./components/videoqualityselectbox");
var watermark_1 = require("./components/watermark");
var audioqualityselectbox_1 = require("./components/audioqualityselectbox");
var audiotrackselectbox_1 = require("./components/audiotrackselectbox");
var seekbarlabel_1 = require("./components/seekbarlabel");
var volumeslider_1 = require("./components/volumeslider");
var subtitleselectbox_1 = require("./components/subtitleselectbox");
var subtitleoverlay_1 = require("./components/subtitleoverlay");
var volumecontrolbutton_1 = require("./components/volumecontrolbutton");
var casttogglebutton_1 = require("./components/casttogglebutton");
var caststatusoverlay_1 = require("./components/caststatusoverlay");
var errormessageoverlay_1 = require("./components/errormessageoverlay");
var titlebar_1 = require("./components/titlebar");
var recommendationoverlay_1 = require("./components/recommendationoverlay");
var admessagelabel_1 = require("./components/admessagelabel");
var adskipbutton_1 = require("./components/adskipbutton");
var adclickoverlay_1 = require("./components/adclickoverlay");
var EVENT = bitmovin.player.EVENT;
var utils_1 = require("./utils");
var playbackspeedselectbox_1 = require("./components/playbackspeedselectbox");
var bufferingoverlay_1 = require("./components/bufferingoverlay");
var castuicontainer_1 = require("./components/castuicontainer");
var playbacktoggleoverlay_1 = require("./components/playbacktoggleoverlay");
var closebutton_1 = require("./components/closebutton");
var metadatalabel_1 = require("./components/metadatalabel");
var label_1 = require("./components/label");
var UIManager = (function () {
    function UIManager(player, playerUi, adsUi, config) {
        if (config === void 0) { config = {}; }
        this.player = player;
        this.config = config;
        if (!config.metadata) {
            config.metadata = {
                title: player.getConfig().source ? player.getConfig().source.title : null,
                description: player.getConfig().source ? player.getConfig().source.description : null,
            };
        }
        this.playerUi = new InternalUIInstanceManager(player, playerUi, config);
        this.managerPlayerWrapper = new PlayerWrapper(player);
        this.playerElement = new dom_1.DOM(player.getFigure());
        // Add UI elements to player
        this.addUi(this.playerUi);
        var self = this;
        // Ads UI
        if (adsUi) {
            this.adsUi = new InternalUIInstanceManager(player, adsUi, config);
            var adsUiAdded_1 = false;
            var enterAdsUi = function (event) {
                playerUi.hide();
                // Display the ads UI (only for VAST ads, other clients bring their own UI)
                if (event.clientType === 'vast') {
                    // Add ads UI when it is needed for the first time
                    if (!adsUiAdded_1) {
                        self.addUi(self.adsUi);
                        adsUiAdded_1 = true;
                        /* Relay the ON_AD_STARTED event to the ads UI
                         *
                         * Because the ads UI is initialized in the ON_AD_STARTED handler, i.e. when the ON_AD_STARTED event has
                         * already been fired, components in the ads UI that listen for the ON_AD_STARTED event never receive it.
                         * Since this can break functionality of components that rely on this event, we relay the event to the
                         * ads UI components with the following call.
                         */
                        self.adsUi.getPlayer().fireEventInUI(bitmovin.player.EVENT.ON_AD_STARTED, event);
                    }
                    adsUi.show();
                }
            };
            var exitAdsUi = function () {
                if (adsUiAdded_1) {
                    adsUi.hide();
                }
                playerUi.show();
            };
            // React to ad events from the player
            this.managerPlayerWrapper.getPlayer().addEventHandler(EVENT.ON_AD_STARTED, enterAdsUi);
            this.managerPlayerWrapper.getPlayer().addEventHandler(EVENT.ON_AD_FINISHED, exitAdsUi);
            this.managerPlayerWrapper.getPlayer().addEventHandler(EVENT.ON_AD_SKIPPED, exitAdsUi);
            this.managerPlayerWrapper.getPlayer().addEventHandler(EVENT.ON_AD_ERROR, exitAdsUi);
        }
    }
    UIManager.prototype.getConfig = function () {
        return this.config;
    };
    UIManager.prototype.configureControls = function (component, manager) {
        component.initialize();
        component.configure(manager.getPlayer(), manager);
        if (component instanceof container_1.Container) {
            for (var _i = 0, _a = component.getComponents(); _i < _a.length; _i++) {
                var childComponent = _a[_i];
                this.configureControls(childComponent, manager);
            }
        }
    };
    UIManager.prototype.addUi = function (ui) {
        var dom = ui.getUI().getDomElement();
        this.configureControls(ui.getUI(), ui);
        /* Append the UI DOM after configuration to avoid CSS transitions at initialization
         * Example: Components are hidden during configuration and these hides may trigger CSS transitions that are
         * undesirable at this time. */
        this.playerElement.append(dom);
    };
    UIManager.prototype.releaseUi = function (ui) {
        ui.getUI().getDomElement().remove();
        ui.clearEventHandlers();
    };
    UIManager.prototype.release = function () {
        this.releaseUi(this.playerUi);
        if (this.adsUi) {
            this.releaseUi(this.adsUi);
        }
        this.managerPlayerWrapper.clearEventHandlers();
    };
    return UIManager;
}());
UIManager.Factory = (function () {
    function class_1() {
    }
    class_1.buildDefaultUI = function (player, config) {
        if (config === void 0) { config = {}; }
        return UIManager.Factory.buildModernUI(player, config);
    };
    class_1.buildDefaultSmallScreenUI = function (player, config) {
        if (config === void 0) { config = {}; }
        return UIManager.Factory.buildModernSmallScreenUI(player, config);
    };
    class_1.buildDefaultCastReceiverUI = function (player, config) {
        if (config === void 0) { config = {}; }
        return UIManager.Factory.buildModernCastReceiverUI(player, config);
    };
    class_1.buildModernUI = function (player, config) {
        if (config === void 0) { config = {}; }
        var settingsPanel = new settingspanel_1.SettingsPanel({
            components: [
                new settingspanel_1.SettingsPanelItem('Video Quality', new videoqualityselectbox_1.VideoQualitySelectBox()),
                new settingspanel_1.SettingsPanelItem('Speed', new playbackspeedselectbox_1.PlaybackSpeedSelectBox()),
                new settingspanel_1.SettingsPanelItem('Audio Track', new audiotrackselectbox_1.AudioTrackSelectBox()),
                new settingspanel_1.SettingsPanelItem('Audio Quality', new audioqualityselectbox_1.AudioQualitySelectBox()),
                new settingspanel_1.SettingsPanelItem('Subtitles', new subtitleselectbox_1.SubtitleSelectBox())
            ],
            hidden: true
        });
        var controlBar = new controlbar_1.ControlBar({
            components: [
                settingsPanel,
                new container_1.Container({
                    components: [
                        new playbacktimelabel_1.PlaybackTimeLabel({ timeLabelMode: playbacktimelabel_1.TimeLabelMode.CurrentTime, hideInLivePlayback: true }),
                        new seekbar_1.SeekBar({ label: new seekbarlabel_1.SeekBarLabel() }),
                        new playbacktimelabel_1.PlaybackTimeLabel({ timeLabelMode: playbacktimelabel_1.TimeLabelMode.TotalTime, cssClasses: ['text-right'] }),
                    ],
                    cssClasses: ['controlbar-top']
                }),
                new container_1.Container({
                    components: [
                        new playbacktogglebutton_1.PlaybackToggleButton(),
                        new volumetogglebutton_1.VolumeToggleButton(),
                        new volumeslider_1.VolumeSlider(),
                        new component_1.Component({ cssClass: 'spacer' }),
                        new casttogglebutton_1.CastToggleButton(),
                        new vrtogglebutton_1.VRToggleButton(),
                        new settingstogglebutton_1.SettingsToggleButton({ settingsPanel: settingsPanel }),
                        new fullscreentogglebutton_1.FullscreenToggleButton(),
                    ],
                    cssClasses: ['controlbar-bottom']
                }),
            ]
        });
        var ui = new uicontainer_1.UIContainer({
            components: [
                new subtitleoverlay_1.SubtitleOverlay(),
                new bufferingoverlay_1.BufferingOverlay(),
                new playbacktoggleoverlay_1.PlaybackToggleOverlay(),
                new caststatusoverlay_1.CastStatusOverlay(),
                controlBar,
                new titlebar_1.TitleBar(),
                new recommendationoverlay_1.RecommendationOverlay(),
                new watermark_1.Watermark(),
                new errormessageoverlay_1.ErrorMessageOverlay()
            ], cssClasses: ['ui-skin-modern']
        });
        var adsUi = new uicontainer_1.UIContainer({
            components: [
                new bufferingoverlay_1.BufferingOverlay(),
                new adclickoverlay_1.AdClickOverlay(),
                new playbacktoggleoverlay_1.PlaybackToggleOverlay(),
                new container_1.Container({
                    components: [
                        new admessagelabel_1.AdMessageLabel({ text: 'Ad: {remainingTime} secs' }),
                        new adskipbutton_1.AdSkipButton()
                    ],
                    cssClass: 'ui-ads-status'
                }),
                new controlbar_1.ControlBar({
                    components: [
                        new container_1.Container({
                            components: [
                                new playbacktogglebutton_1.PlaybackToggleButton(),
                                new volumetogglebutton_1.VolumeToggleButton(),
                                new volumeslider_1.VolumeSlider(),
                                new component_1.Component({ cssClass: 'spacer' }),
                                new fullscreentogglebutton_1.FullscreenToggleButton(),
                            ],
                            cssClasses: ['controlbar-bottom']
                        }),
                    ]
                })
            ], cssClasses: ['ui-skin-modern', 'ui-skin-ads']
        });
        return new UIManager(player, ui, adsUi, config);
    };
    class_1.buildModernSmallScreenUI = function (player, config) {
        if (config === void 0) { config = {}; }
        var settingsPanel = new settingspanel_1.SettingsPanel({
            components: [
                new settingspanel_1.SettingsPanelItem('Video Quality', new videoqualityselectbox_1.VideoQualitySelectBox()),
                new settingspanel_1.SettingsPanelItem('Speed', new playbackspeedselectbox_1.PlaybackSpeedSelectBox()),
                new settingspanel_1.SettingsPanelItem('Audio Track', new audiotrackselectbox_1.AudioTrackSelectBox()),
                new settingspanel_1.SettingsPanelItem('Audio Quality', new audioqualityselectbox_1.AudioQualitySelectBox()),
                new settingspanel_1.SettingsPanelItem('Subtitles', new subtitleselectbox_1.SubtitleSelectBox())
            ],
            hidden: true,
            hideDelay: -1,
        });
        settingsPanel.addComponent(new closebutton_1.CloseButton({ target: settingsPanel }));
        var controlBar = new controlbar_1.ControlBar({
            components: [
                new container_1.Container({
                    components: [
                        new playbacktimelabel_1.PlaybackTimeLabel({ timeLabelMode: playbacktimelabel_1.TimeLabelMode.CurrentTime, hideInLivePlayback: true }),
                        new seekbar_1.SeekBar({ label: new seekbarlabel_1.SeekBarLabel() }),
                        new playbacktimelabel_1.PlaybackTimeLabel({ timeLabelMode: playbacktimelabel_1.TimeLabelMode.TotalTime, cssClasses: ['text-right'] }),
                    ],
                    cssClasses: ['controlbar-top']
                }),
            ]
        });
        var ui = new uicontainer_1.UIContainer({
            components: [
                new subtitleoverlay_1.SubtitleOverlay(),
                new bufferingoverlay_1.BufferingOverlay(),
                new playbacktoggleoverlay_1.PlaybackToggleOverlay(),
                new caststatusoverlay_1.CastStatusOverlay(),
                controlBar,
                new titlebar_1.TitleBar({
                    components: [
                        new metadatalabel_1.MetadataLabel({ content: metadatalabel_1.MetadataLabelContent.Title }),
                        new casttogglebutton_1.CastToggleButton(),
                        new vrtogglebutton_1.VRToggleButton(),
                        new settingstogglebutton_1.SettingsToggleButton({ settingsPanel: settingsPanel }),
                        new fullscreentogglebutton_1.FullscreenToggleButton(),
                    ]
                }),
                settingsPanel,
                new recommendationoverlay_1.RecommendationOverlay(),
                new watermark_1.Watermark(),
                new errormessageoverlay_1.ErrorMessageOverlay()
            ], cssClasses: ['ui-skin-modern', 'ui-skin-smallscreen']
        });
        var adsUi = new uicontainer_1.UIContainer({
            components: [
                new bufferingoverlay_1.BufferingOverlay(),
                new adclickoverlay_1.AdClickOverlay(),
                new playbacktoggleoverlay_1.PlaybackToggleOverlay(),
                new titlebar_1.TitleBar({
                    components: [
                        // dummy label with no content to move buttons to the right
                        new label_1.Label({ cssClass: 'label-metadata-title' }),
                        new fullscreentogglebutton_1.FullscreenToggleButton(),
                    ]
                }),
                new container_1.Container({
                    components: [
                        new admessagelabel_1.AdMessageLabel({ text: 'Ad: {remainingTime} secs' }),
                        new adskipbutton_1.AdSkipButton()
                    ],
                    cssClass: 'ui-ads-status'
                }),
            ], cssClasses: ['ui-skin-modern', 'ui-skin-ads', 'ui-skin-smallscreen']
        });
        return new UIManager(player, ui, adsUi, config);
    };
    class_1.buildModernCastReceiverUI = function (player, config) {
        if (config === void 0) { config = {}; }
        var controlBar = new controlbar_1.ControlBar({
            components: [
                new container_1.Container({
                    components: [
                        new playbacktimelabel_1.PlaybackTimeLabel({ timeLabelMode: playbacktimelabel_1.TimeLabelMode.CurrentTime, hideInLivePlayback: true }),
                        new seekbar_1.SeekBar({ label: new seekbarlabel_1.SeekBarLabel() }),
                        new playbacktimelabel_1.PlaybackTimeLabel({ timeLabelMode: playbacktimelabel_1.TimeLabelMode.TotalTime, cssClasses: ['text-right'] }),
                    ],
                    cssClasses: ['controlbar-top']
                }),
            ]
        });
        var ui = new castuicontainer_1.CastUIContainer({
            components: [
                new subtitleoverlay_1.SubtitleOverlay(),
                new bufferingoverlay_1.BufferingOverlay(),
                new playbacktoggleoverlay_1.PlaybackToggleOverlay(),
                new watermark_1.Watermark(),
                controlBar,
                new titlebar_1.TitleBar(),
                new errormessageoverlay_1.ErrorMessageOverlay()
            ], cssClasses: ['ui-skin-modern', 'ui-skin-cast-receiver']
        });
        return new UIManager(player, ui, null, config);
    };
    class_1.buildLegacyUI = function (player, config) {
        if (config === void 0) { config = {}; }
        var settingsPanel = new settingspanel_1.SettingsPanel({
            components: [
                new settingspanel_1.SettingsPanelItem('Video Quality', new videoqualityselectbox_1.VideoQualitySelectBox()),
                new settingspanel_1.SettingsPanelItem('Audio Track', new audiotrackselectbox_1.AudioTrackSelectBox()),
                new settingspanel_1.SettingsPanelItem('Audio Quality', new audioqualityselectbox_1.AudioQualitySelectBox()),
                new settingspanel_1.SettingsPanelItem('Subtitles', new subtitleselectbox_1.SubtitleSelectBox())
            ],
            hidden: true
        });
        var controlBar = new controlbar_1.ControlBar({
            components: [
                settingsPanel,
                new playbacktogglebutton_1.PlaybackToggleButton(),
                new seekbar_1.SeekBar({ label: new seekbarlabel_1.SeekBarLabel() }),
                new playbacktimelabel_1.PlaybackTimeLabel(),
                new vrtogglebutton_1.VRToggleButton(),
                new volumecontrolbutton_1.VolumeControlButton(),
                new settingstogglebutton_1.SettingsToggleButton({ settingsPanel: settingsPanel }),
                new casttogglebutton_1.CastToggleButton(),
                new fullscreentogglebutton_1.FullscreenToggleButton()
            ]
        });
        var ui = new uicontainer_1.UIContainer({
            components: [
                new subtitleoverlay_1.SubtitleOverlay(),
                new caststatusoverlay_1.CastStatusOverlay(),
                new playbacktoggleoverlay_1.PlaybackToggleOverlay(),
                new watermark_1.Watermark(),
                new recommendationoverlay_1.RecommendationOverlay(),
                controlBar,
                new titlebar_1.TitleBar(),
                new errormessageoverlay_1.ErrorMessageOverlay()
            ], cssClasses: ['ui-skin-legacy']
        });
        var adsUi = new uicontainer_1.UIContainer({
            components: [
                new adclickoverlay_1.AdClickOverlay(),
                new controlbar_1.ControlBar({
                    components: [
                        new playbacktogglebutton_1.PlaybackToggleButton(),
                        new admessagelabel_1.AdMessageLabel(),
                        new volumecontrolbutton_1.VolumeControlButton(),
                        new fullscreentogglebutton_1.FullscreenToggleButton()
                    ]
                }),
                new adskipbutton_1.AdSkipButton()
            ], cssClasses: ['ui-skin-legacy', 'ui-skin-ads']
        });
        return new UIManager(player, ui, adsUi, config);
    };
    class_1.buildLegacyCastReceiverUI = function (player, config) {
        if (config === void 0) { config = {}; }
        var controlBar = new controlbar_1.ControlBar({
            components: [
                new seekbar_1.SeekBar(),
                new playbacktimelabel_1.PlaybackTimeLabel(),
            ]
        });
        var ui = new uicontainer_1.UIContainer({
            components: [
                new subtitleoverlay_1.SubtitleOverlay(),
                new playbacktoggleoverlay_1.PlaybackToggleOverlay(),
                new watermark_1.Watermark(),
                controlBar,
                new titlebar_1.TitleBar(),
                new errormessageoverlay_1.ErrorMessageOverlay()
            ], cssClasses: ['ui-skin-legacy', 'ui-skin-cast-receiver']
        });
        return new UIManager(player, ui, null, config);
    };
    class_1.buildLegacyTestUI = function (player, config) {
        if (config === void 0) { config = {}; }
        var settingsPanel = new settingspanel_1.SettingsPanel({
            components: [
                new settingspanel_1.SettingsPanelItem('Video Quality', new videoqualityselectbox_1.VideoQualitySelectBox()),
                new settingspanel_1.SettingsPanelItem('Audio Track', new audiotrackselectbox_1.AudioTrackSelectBox()),
                new settingspanel_1.SettingsPanelItem('Audio Quality', new audioqualityselectbox_1.AudioQualitySelectBox()),
                new settingspanel_1.SettingsPanelItem('Subtitles', new subtitleselectbox_1.SubtitleSelectBox())
            ],
            hidden: true
        });
        var controlBar = new controlbar_1.ControlBar({
            components: [settingsPanel,
                new playbacktogglebutton_1.PlaybackToggleButton(),
                new seekbar_1.SeekBar({ label: new seekbarlabel_1.SeekBarLabel() }),
                new playbacktimelabel_1.PlaybackTimeLabel(),
                new vrtogglebutton_1.VRToggleButton(),
                new volumetogglebutton_1.VolumeToggleButton(),
                new volumeslider_1.VolumeSlider(),
                new volumecontrolbutton_1.VolumeControlButton(),
                new volumecontrolbutton_1.VolumeControlButton({ vertical: false }),
                new settingstogglebutton_1.SettingsToggleButton({ settingsPanel: settingsPanel }),
                new casttogglebutton_1.CastToggleButton(),
                new fullscreentogglebutton_1.FullscreenToggleButton()
            ]
        });
        var ui = new uicontainer_1.UIContainer({
            components: [
                new subtitleoverlay_1.SubtitleOverlay(),
                new caststatusoverlay_1.CastStatusOverlay(),
                new playbacktoggleoverlay_1.PlaybackToggleOverlay(),
                new watermark_1.Watermark(),
                new recommendationoverlay_1.RecommendationOverlay(),
                controlBar,
                new titlebar_1.TitleBar(),
                new errormessageoverlay_1.ErrorMessageOverlay()
            ], cssClasses: ['ui-skin-legacy']
        });
        return new UIManager(player, ui, null, config);
    };
    return class_1;
}());
exports.UIManager = UIManager;
/**
 * Encapsulates functionality to manage a UI instance. Used by the {@link UIManager} to manage multiple UI instances.
 */
var UIInstanceManager = (function () {
    function UIInstanceManager(player, ui, config) {
        if (config === void 0) { config = {}; }
        this.events = {
            onSeek: new eventdispatcher_1.EventDispatcher(),
            onSeekPreview: new eventdispatcher_1.EventDispatcher(),
            onSeeked: new eventdispatcher_1.EventDispatcher(),
            onComponentShow: new eventdispatcher_1.EventDispatcher(),
            onComponentHide: new eventdispatcher_1.EventDispatcher(),
            onControlsShow: new eventdispatcher_1.EventDispatcher(),
            onControlsHide: new eventdispatcher_1.EventDispatcher(),
        };
        this.playerWrapper = new PlayerWrapper(player);
        this.ui = ui;
        this.config = config;
    }
    UIInstanceManager.prototype.getConfig = function () {
        return this.config;
    };
    UIInstanceManager.prototype.getUI = function () {
        return this.ui;
    };
    UIInstanceManager.prototype.getPlayer = function () {
        return this.playerWrapper.getPlayer();
    };
    Object.defineProperty(UIInstanceManager.prototype, "onSeek", {
        /**
         * Fires when a seek starts.
         * @returns {EventDispatcher}
         */
        get: function () {
            return this.events.onSeek;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UIInstanceManager.prototype, "onSeekPreview", {
        /**
         * Fires when the seek timeline is scrubbed.
         * @returns {EventDispatcher}
         */
        get: function () {
            return this.events.onSeekPreview;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UIInstanceManager.prototype, "onSeeked", {
        /**
         * Fires when a seek is finished.
         * @returns {EventDispatcher}
         */
        get: function () {
            return this.events.onSeeked;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UIInstanceManager.prototype, "onComponentShow", {
        /**
         * Fires when a component is showing.
         * @returns {EventDispatcher}
         */
        get: function () {
            return this.events.onComponentShow;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UIInstanceManager.prototype, "onComponentHide", {
        /**
         * Fires when a component is hiding.
         * @returns {EventDispatcher}
         */
        get: function () {
            return this.events.onComponentHide;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UIInstanceManager.prototype, "onControlsShow", {
        /**
         * Fires when the UI controls are showing.
         * @returns {EventDispatcher}
         */
        get: function () {
            return this.events.onControlsShow;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UIInstanceManager.prototype, "onControlsHide", {
        /**
         * Fires when the UI controls are hiding.
         * @returns {EventDispatcher}
         */
        get: function () {
            return this.events.onControlsHide;
        },
        enumerable: true,
        configurable: true
    });
    UIInstanceManager.prototype.clearEventHandlers = function () {
        this.playerWrapper.clearEventHandlers();
        var events = this.events; // avoid TS7017
        for (var event_1 in events) {
            var dispatcher = events[event_1];
            dispatcher.unsubscribeAll();
        }
    };
    return UIInstanceManager;
}());
exports.UIInstanceManager = UIInstanceManager;
/**
 * Extends the {@link UIInstanceManager} for internal use in the {@link UIManager} and provides access to functionality
 * that components receiving a reference to the {@link UIInstanceManager} should not have access to.
 */
var InternalUIInstanceManager = (function (_super) {
    __extends(InternalUIInstanceManager, _super);
    function InternalUIInstanceManager() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    InternalUIInstanceManager.prototype.clearEventHandlers = function () {
        _super.prototype.clearEventHandlers.call(this);
    };
    return InternalUIInstanceManager;
}(UIInstanceManager));
/**
 * Wraps the player to track event handlers and provide a simple method to remove all registered event
 * handlers from the player.
 */
var PlayerWrapper = (function () {
    function PlayerWrapper(player) {
        this.eventHandlers = {};
        this.player = player;
        var self = this;
        // Collect all public API methods of the player
        var methods = [];
        for (var member in player) {
            if (typeof player[member] === 'function') {
                methods.push(member);
            }
        }
        // Create wrapper object and add function wrappers for all API methods that do nothing but calling the base method
        // on the player
        var wrapper = {};
        var _loop_1 = function (member) {
            wrapper[member] = function () {
                // console.log('called ' + member); // track method calls on the player
                return player[member].apply(player, arguments);
            };
        };
        for (var _i = 0, methods_1 = methods; _i < methods_1.length; _i++) {
            var member = methods_1[_i];
            _loop_1(member);
        }
        // Explicitly add a wrapper method for 'addEventHandler' that adds added event handlers to the event list
        wrapper.addEventHandler = function (eventType, callback) {
            player.addEventHandler(eventType, callback);
            if (!self.eventHandlers[eventType]) {
                self.eventHandlers[eventType] = [];
            }
            self.eventHandlers[eventType].push(callback);
            return wrapper;
        };
        // Explicitly add a wrapper method for 'removeEventHandler' that removes removed event handlers from the event list
        wrapper.removeEventHandler = function (eventType, callback) {
            player.removeEventHandler(eventType, callback);
            if (self.eventHandlers[eventType]) {
                utils_1.ArrayUtils.remove(self.eventHandlers[eventType], callback);
            }
            return wrapper;
        };
        wrapper.fireEventInUI = function (event, data) {
            if (self.eventHandlers[event]) {
                // Extend the data object with default values to convert it to a {@link PlayerEvent} object.
                var playerEventData = Object.assign({}, {
                    timestamp: Date.now(),
                    type: event,
                    // Add a marker property so the UI can detect UI-internal player events
                    uiSourced: true,
                }, data);
                // Execute the registered callbacks
                for (var _i = 0, _a = self.eventHandlers[event]; _i < _a.length; _i++) {
                    var callback = _a[_i];
                    callback(playerEventData);
                }
            }
        };
        this.wrapper = wrapper;
    }
    /**
     * Returns a wrapped player object that can be used on place of the normal player object.
     * @returns {WrappedPlayer} a wrapped player
     */
    PlayerWrapper.prototype.getPlayer = function () {
        return this.wrapper;
    };
    /**
     * Clears all registered event handlers from the player that were added through the wrapped player.
     */
    PlayerWrapper.prototype.clearEventHandlers = function () {
        for (var eventType in this.eventHandlers) {
            for (var _i = 0, _a = this.eventHandlers[eventType]; _i < _a.length; _i++) {
                var callback = _a[_i];
                this.player.removeEventHandler(eventType, callback);
            }
        }
    };
    return PlayerWrapper;
}());

},{"./components/adclickoverlay":1,"./components/admessagelabel":2,"./components/adskipbutton":3,"./components/audioqualityselectbox":4,"./components/audiotrackselectbox":5,"./components/bufferingoverlay":6,"./components/caststatusoverlay":8,"./components/casttogglebutton":9,"./components/castuicontainer":10,"./components/closebutton":12,"./components/component":13,"./components/container":14,"./components/controlbar":15,"./components/errormessageoverlay":16,"./components/fullscreentogglebutton":17,"./components/label":20,"./components/metadatalabel":22,"./components/playbackspeedselectbox":23,"./components/playbacktimelabel":24,"./components/playbacktogglebutton":25,"./components/playbacktoggleoverlay":26,"./components/recommendationoverlay":27,"./components/seekbar":28,"./components/seekbarlabel":29,"./components/settingspanel":31,"./components/settingstogglebutton":32,"./components/subtitleoverlay":33,"./components/subtitleselectbox":34,"./components/titlebar":35,"./components/uicontainer":38,"./components/videoqualityselectbox":39,"./components/volumecontrolbutton":40,"./components/volumeslider":41,"./components/volumetogglebutton":42,"./components/vrtogglebutton":43,"./components/watermark":44,"./dom":45,"./eventdispatcher":46,"./utils":51}],51:[function(require,module,exports){
"use strict";
var ArrayUtils;
(function (ArrayUtils) {
    /**
     * Removes an item from an array.
     * @param array the array that may contain the item to remove
     * @param item the item to remove from the array
     * @returns {any} the removed item or null if it wasn't part of the array
     */
    function remove(array, item) {
        var index = array.indexOf(item);
        if (index > -1) {
            return array.splice(index, 1)[0];
        }
        else {
            return null;
        }
    }
    ArrayUtils.remove = remove;
})(ArrayUtils = exports.ArrayUtils || (exports.ArrayUtils = {}));
var StringUtils;
(function (StringUtils) {
    StringUtils.FORMAT_HHMMSS = 'hh:mm:ss';
    StringUtils.FORMAT_MMSS = 'mm:ss';
    /**
     * Formats a number of seconds into a time string with the pattern hh:mm:ss.
     *
     * @param totalSeconds the total number of seconds to format to string
     * @param format the time format to output (default: hh:mm:ss)
     * @returns {string} the formatted time string
     */
    function secondsToTime(totalSeconds, format) {
        if (format === void 0) { format = StringUtils.FORMAT_HHMMSS; }
        var isNegative = totalSeconds < 0;
        if (isNegative) {
            // If the time is negative, we make it positive for the calculation below
            // (else we'd get all negative numbers) and reattach the negative sign later.
            totalSeconds = -totalSeconds;
        }
        // Split into separate time parts
        var hours = Math.floor(totalSeconds / 3600);
        var minutes = Math.floor(totalSeconds / 60) - hours * 60;
        var seconds = Math.floor(totalSeconds) % 60;
        return (isNegative ? '-' : '') + format
            .replace('hh', leftPadWithZeros(hours, 2))
            .replace('mm', leftPadWithZeros(minutes, 2))
            .replace('ss', leftPadWithZeros(seconds, 2));
    }
    StringUtils.secondsToTime = secondsToTime;
    /**
     * Converts a number to a string and left-pads it with zeros to the specified length.
     * Example: leftPadWithZeros(123, 5) => '00123'
     *
     * @param num the number to convert to string and pad with zeros
     * @param length the desired length of the padded string
     * @returns {string} the padded number as string
     */
    function leftPadWithZeros(num, length) {
        var text = num + '';
        var padding = '0000000000'.substr(0, length - text.length);
        return padding + text;
    }
    /**
     * Fills out placeholders in an ad message.
     *
     * Has the placeholders '{remainingTime[formatString]}', '{playedTime[formatString]}' and
     * '{adDuration[formatString]}', which are replaced by the remaining time until the ad can be skipped, the current
     * time or the ad duration. The format string is optional. If not specified, the placeholder is replaced by the time
     * in seconds. If specified, it must be of the following format:
     * - %d - Inserts the time as an integer.
     * - %0Nd - Inserts the time as an integer with leading zeroes, if the length of the time string is smaller than N.
     * - %f - Inserts the time as a float.
     * - %0Nf - Inserts the time as a float with leading zeroes.
     * - %.Mf - Inserts the time as a float with M decimal places. Can be combined with %0Nf, e.g. %04.2f (the time
     * 10.123
     * would be printed as 0010.12).
     * - %hh:mm:ss
     * - %mm:ss
     *
     * @param adMessage an ad message with optional placeholders to fill
     * @param skipOffset if specified, {remainingTime} will be filled with the remaining time until the ad can be skipped
     * @param player the player to get the time data from
     * @returns {string} the ad message with filled placeholders
     */
    function replaceAdMessagePlaceholders(adMessage, skipOffset, player) {
        var adMessagePlaceholderRegex = new RegExp('\\{(remainingTime|playedTime|adDuration)(}|%((0[1-9]\\d*(\\.\\d+(d|f)|d|f)|\\.\\d+f|d|f)|hh:mm:ss|mm:ss)})', 'g');
        return adMessage.replace(adMessagePlaceholderRegex, function (formatString) {
            var time = 0;
            if (formatString.indexOf('remainingTime') > -1) {
                if (skipOffset) {
                    time = Math.ceil(skipOffset - player.getCurrentTime());
                }
                else {
                    time = player.getDuration() - player.getCurrentTime();
                }
            }
            else if (formatString.indexOf('playedTime') > -1) {
                time = player.getCurrentTime();
            }
            else if (formatString.indexOf('adDuration') > -1) {
                time = player.getDuration();
            }
            return formatNumber(time, formatString);
        });
    }
    StringUtils.replaceAdMessagePlaceholders = replaceAdMessagePlaceholders;
    function formatNumber(time, format) {
        var formatStringValidationRegex = /%((0[1-9]\d*(\.\d+(d|f)|d|f)|\.\d+f|d|f)|hh:mm:ss|mm:ss)/;
        var leadingZeroesRegex = /(%0[1-9]\d*)(?=(\.\d+f|f|d))/;
        var decimalPlacesRegex = /\.\d*(?=f)/;
        if (!formatStringValidationRegex.test(format)) {
            // If the format is invalid, we set a default fallback format
            format = '%d';
        }
        // Determine the number of leading zeros
        var leadingZeroes = 0;
        var leadingZeroesMatches = format.match(leadingZeroesRegex);
        if (leadingZeroesMatches) {
            leadingZeroes = parseInt(leadingZeroesMatches[0].substring(2));
        }
        // Determine the number of decimal places
        var numDecimalPlaces = null;
        var decimalPlacesMatches = format.match(decimalPlacesRegex);
        if (decimalPlacesMatches && !isNaN(parseInt(decimalPlacesMatches[0].substring(1)))) {
            numDecimalPlaces = parseInt(decimalPlacesMatches[0].substring(1));
            if (numDecimalPlaces > 20) {
                numDecimalPlaces = 20;
            }
        }
        // Float format
        if (format.indexOf('f') > -1) {
            var timeString = '';
            if (numDecimalPlaces !== null) {
                // Apply fixed number of decimal places
                timeString = time.toFixed(numDecimalPlaces);
            }
            else {
                timeString = '' + time;
            }
            // Apply leading zeros
            if (timeString.indexOf('.') > -1) {
                return leftPadWithZeros(timeString, timeString.length + (leadingZeroes - timeString.indexOf('.')));
            }
            else {
                return leftPadWithZeros(timeString, leadingZeroes);
            }
        }
        else if (format.indexOf(':') > -1) {
            var totalSeconds = Math.ceil(time);
            // hh:mm:ss format
            if (format.indexOf('hh') > -1) {
                return secondsToTime(totalSeconds);
            }
            else {
                var minutes = Math.floor(totalSeconds / 60);
                var seconds = totalSeconds % 60;
                return leftPadWithZeros(minutes, 2) + ':' + leftPadWithZeros(seconds, 2);
            }
        }
        else {
            return leftPadWithZeros(Math.ceil(time), leadingZeroes);
        }
    }
})(StringUtils = exports.StringUtils || (exports.StringUtils = {}));
var PlayerUtils;
(function (PlayerUtils) {
    function isSourceLoaded(player) {
        return player.getConfig().source !== undefined;
    }
    PlayerUtils.isSourceLoaded = isSourceLoaded;
})(PlayerUtils = exports.PlayerUtils || (exports.PlayerUtils = {}));

},{}]},{},[48])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvdHMvY29tcG9uZW50cy9hZGNsaWNrb3ZlcmxheS50cyIsInNyYy90cy9jb21wb25lbnRzL2FkbWVzc2FnZWxhYmVsLnRzIiwic3JjL3RzL2NvbXBvbmVudHMvYWRza2lwYnV0dG9uLnRzIiwic3JjL3RzL2NvbXBvbmVudHMvYXVkaW9xdWFsaXR5c2VsZWN0Ym94LnRzIiwic3JjL3RzL2NvbXBvbmVudHMvYXVkaW90cmFja3NlbGVjdGJveC50cyIsInNyYy90cy9jb21wb25lbnRzL2J1ZmZlcmluZ292ZXJsYXkudHMiLCJzcmMvdHMvY29tcG9uZW50cy9idXR0b24udHMiLCJzcmMvdHMvY29tcG9uZW50cy9jYXN0c3RhdHVzb3ZlcmxheS50cyIsInNyYy90cy9jb21wb25lbnRzL2Nhc3R0b2dnbGVidXR0b24udHMiLCJzcmMvdHMvY29tcG9uZW50cy9jYXN0dWljb250YWluZXIudHMiLCJzcmMvdHMvY29tcG9uZW50cy9jbGlja292ZXJsYXkudHMiLCJzcmMvdHMvY29tcG9uZW50cy9jbG9zZWJ1dHRvbi50cyIsInNyYy90cy9jb21wb25lbnRzL2NvbXBvbmVudC50cyIsInNyYy90cy9jb21wb25lbnRzL2NvbnRhaW5lci50cyIsInNyYy90cy9jb21wb25lbnRzL2NvbnRyb2xiYXIudHMiLCJzcmMvdHMvY29tcG9uZW50cy9lcnJvcm1lc3NhZ2VvdmVybGF5LnRzIiwic3JjL3RzL2NvbXBvbmVudHMvZnVsbHNjcmVlbnRvZ2dsZWJ1dHRvbi50cyIsInNyYy90cy9jb21wb25lbnRzL2h1Z2VwbGF5YmFja3RvZ2dsZWJ1dHRvbi50cyIsInNyYy90cy9jb21wb25lbnRzL2h1Z2VyZXBsYXlidXR0b24udHMiLCJzcmMvdHMvY29tcG9uZW50cy9sYWJlbC50cyIsInNyYy90cy9jb21wb25lbnRzL2xpc3RzZWxlY3Rvci50cyIsInNyYy90cy9jb21wb25lbnRzL21ldGFkYXRhbGFiZWwudHMiLCJzcmMvdHMvY29tcG9uZW50cy9wbGF5YmFja3NwZWVkc2VsZWN0Ym94LnRzIiwic3JjL3RzL2NvbXBvbmVudHMvcGxheWJhY2t0aW1lbGFiZWwudHMiLCJzcmMvdHMvY29tcG9uZW50cy9wbGF5YmFja3RvZ2dsZWJ1dHRvbi50cyIsInNyYy90cy9jb21wb25lbnRzL3BsYXliYWNrdG9nZ2xlb3ZlcmxheS50cyIsInNyYy90cy9jb21wb25lbnRzL3JlY29tbWVuZGF0aW9ub3ZlcmxheS50cyIsInNyYy90cy9jb21wb25lbnRzL3NlZWtiYXIudHMiLCJzcmMvdHMvY29tcG9uZW50cy9zZWVrYmFybGFiZWwudHMiLCJzcmMvdHMvY29tcG9uZW50cy9zZWxlY3Rib3gudHMiLCJzcmMvdHMvY29tcG9uZW50cy9zZXR0aW5nc3BhbmVsLnRzIiwic3JjL3RzL2NvbXBvbmVudHMvc2V0dGluZ3N0b2dnbGVidXR0b24udHMiLCJzcmMvdHMvY29tcG9uZW50cy9zdWJ0aXRsZW92ZXJsYXkudHMiLCJzcmMvdHMvY29tcG9uZW50cy9zdWJ0aXRsZXNlbGVjdGJveC50cyIsInNyYy90cy9jb21wb25lbnRzL3RpdGxlYmFyLnRzIiwic3JjL3RzL2NvbXBvbmVudHMvdG9nZ2xlYnV0dG9uLnRzIiwic3JjL3RzL2NvbXBvbmVudHMvdHZub2lzZWNhbnZhcy50cyIsInNyYy90cy9jb21wb25lbnRzL3VpY29udGFpbmVyLnRzIiwic3JjL3RzL2NvbXBvbmVudHMvdmlkZW9xdWFsaXR5c2VsZWN0Ym94LnRzIiwic3JjL3RzL2NvbXBvbmVudHMvdm9sdW1lY29udHJvbGJ1dHRvbi50cyIsInNyYy90cy9jb21wb25lbnRzL3ZvbHVtZXNsaWRlci50cyIsInNyYy90cy9jb21wb25lbnRzL3ZvbHVtZXRvZ2dsZWJ1dHRvbi50cyIsInNyYy90cy9jb21wb25lbnRzL3ZydG9nZ2xlYnV0dG9uLnRzIiwic3JjL3RzL2NvbXBvbmVudHMvd2F0ZXJtYXJrLnRzIiwic3JjL3RzL2RvbS50cyIsInNyYy90cy9ldmVudGRpc3BhdGNoZXIudHMiLCJzcmMvdHMvZ3VpZC50cyIsInNyYy90cy9tYWluLnRzIiwic3JjL3RzL3RpbWVvdXQudHMiLCJzcmMvdHMvdWltYW5hZ2VyLnRzIiwic3JjL3RzL3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0FDQUEsK0NBQTRDO0FBRzVDOztHQUVHO0FBQ0g7SUFBb0Msa0NBQVk7SUFBaEQ7O0lBdUNBLENBQUM7SUFyQ0Msa0NBQVMsR0FBVCxVQUFVLE1BQThCLEVBQUUsU0FBNEI7UUFDcEUsaUJBQU0sU0FBUyxZQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztRQUVuQyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUM7UUFDaEIsSUFBSSxlQUFlLEdBQVcsSUFBSSxDQUFDO1FBQ25DLElBQUksbUJBQW1CLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsV0FBVztlQUNwRCxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLHFCQUFxQixDQUFDO2VBQ3JFLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxXQUFXLENBQUMsbUJBQW1CLENBQUM7UUFFeEQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxhQUFhLEVBQUUsVUFBUyxLQUFxQztZQUN4RyxlQUFlLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQztZQUV4QyxFQUFFLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hCLElBQUksQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDL0IsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNOLHdFQUF3RTtnQkFDeEUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNwQixDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCwrQ0FBK0M7UUFDL0MsSUFBSSxpQkFBaUIsR0FBRztZQUN0QixJQUFJLENBQUMsTUFBTSxDQUFDLElB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QyxDQUFDO1FBQzFELENBQUM7SUFDSCxDQUFDO0FBQ0gsQ0FBQyxFQTlKZ0IsV0FBVyxHQUFYLG1CQUFXLEtBQVgsbUJBQVcsUUE4SjNCO0FBRUQsSUFBaUIsV0FBVyxDQU8zQjtBQVBELFdBQWlCLFdBQVc7SUFJMUIsd0JBQStCLE1BQWM7UUFDM0MsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxNQUFNLEtBQUssU0FBUyxDQUFDO0lBQ2pELENBQUM7SUFGZSwwQkFBYyxpQkFFN0IsQ0FBQTtBQUNILENBQUMsRUFQZ0IsV0FBVyxHQUFYLG1CQUFXLEtBQVgsbUJBQVcsUUFPM0IiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaW1wb3J0IHtDbGlja092ZXJsYXl9IGZyb20gJy4vY2xpY2tvdmVybGF5JztcbmltcG9ydCB7VUlJbnN0YW5jZU1hbmFnZXJ9IGZyb20gJy4uL3VpbWFuYWdlcic7XG5cbi8qKlxuICogQSBzaW1wbGUgY2xpY2sgY2FwdHVyZSBvdmVybGF5IGZvciBjbGlja1Rocm91Z2hVcmxzIG9mIGFkcy5cbiAqL1xuZXhwb3J0IGNsYXNzIEFkQ2xpY2tPdmVybGF5IGV4dGVuZHMgQ2xpY2tPdmVybGF5IHtcblxuICBjb25maWd1cmUocGxheWVyOiBiaXRtb3Zpbi5wbGF5ZXIuUGxheWVyLCB1aW1hbmFnZXI6IFVJSW5zdGFuY2VNYW5hZ2VyKTogdm9pZCB7XG4gICAgc3VwZXIuY29uZmlndXJlKHBsYXllciwgdWltYW5hZ2VyKTtcblxuICAgIGxldCBzZWxmID0gdGhpcztcbiAgICBsZXQgY2xpY2tUaHJvdWdoVXJsID0gPHN0cmluZz5udWxsO1xuICAgIGxldCBjbGlja1Rocm91Z2hFbmFibGVkID0gIXBsYXllci5nZXRDb25maWcoKS5hZHZlcnRpc2luZ1xuICAgICAgfHwgIXBsYXllci5nZXRDb25maWcoKS5hZHZlcnRpc2luZy5oYXNPd25Qcm9wZXJ0eSgnY2xpY2tUaHJvdWdoRW5hYmxlZCcpXG4gICAgICB8fCBwbGF5ZXIuZ2V0Q29uZmlnKCkuYWR2ZXJ0aXNpbmcuY2xpY2tUaHJvdWdoRW5hYmxlZDtcblxuICAgIHBsYXllci5hZGRFdmVudEhhbmRsZXIoYml0bW92aW4ucGxheWVyLkVWRU5ULk9OX0FEX1NUQVJURUQsIGZ1bmN0aW9uKGV2ZW50OiBiaXRtb3Zpbi5wbGF5ZXIuQWRTdGFydGVkRXZlbnQpIHtcbiAgICAgIGNsaWNrVGhyb3VnaFVybCA9IGV2ZW50LmNsaWNrVGhyb3VnaFVybDtcblxuICAgICAgaWYgKGNsaWNrVGhyb3VnaEVuYWJsZWQpIHtcbiAgICAgICAgc2VsZi5zZXRVcmwoY2xpY2tUaHJvdWdoVXJsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIElmIGNsaWNrLXRocm91Z2ggaXMgZGlzYWJsZWQsIHdlIHNldCB0aGUgdXJsIHRvIG51bGwgdG8gYXZvaWQgaXQgb3BlblxuICAgICAgICBzZWxmLnNldFVybChudWxsKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIENsZWFyIGNsaWNrLXRocm91Z2ggVVJMIHdoZW4gYWQgaGFzIGZpbmlzaGVkXG4gICAgbGV0IGFkRmluaXNoZWRIYW5kbGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLnNldFVybChudWxsKTtcbiAgICB9O1xuICAgIHBsYXllci5hZGRFdmVudEhhbmRsZXIoYml0bW92aW4ucGxheWVyLkVWRU5ULk9OX0FEX0ZJTklTSEVELCBhZEZpbmlzaGVkSGFuZGxlcik7XG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fQURfU0tJUFBFRCwgYWRGaW5pc2hlZEhhbmRsZXIpO1xuXG4gICAgc2VsZi5vbkNsaWNrLnN1YnNjcmliZShmdW5jdGlvbigpIHtcbiAgICAgIC8vIFBhdXNlIHRoZSBhZCB3aGVuIG92ZXJsYXkgaXMgY2xpY2tlZFxuICAgICAgcGxheWVyLnBhdXNlKCd1aS1jb250ZW50LWNsaWNrJyk7XG5cbiAgICAgIC8vIE5vdGlmeSB0aGUgcGxheWVyIG9mIHRoZSBjbGlja2VkIGFkXG4gICAgICBwbGF5ZXIuZmlyZUV2ZW50KGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9BRF9DTElDS0VELCB7XG4gICAgICAgIGNsaWNrVGhyb3VnaFVybDogY2xpY2tUaHJvdWdoVXJsXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufSIsImltcG9ydCB7TGFiZWwsIExhYmVsQ29uZmlnfSBmcm9tICcuL2xhYmVsJztcbmltcG9ydCB7VUlJbnN0YW5jZU1hbmFnZXJ9IGZyb20gJy4uL3VpbWFuYWdlcic7XG5pbXBvcnQge1N0cmluZ1V0aWxzfSBmcm9tICcuLi91dGlscyc7XG5cbi8qKlxuICogQSBsYWJlbCB0aGF0IGRpc3BsYXlzIGEgbWVzc2FnZSBhYm91dCBhIHJ1bm5pbmcgYWQsIG9wdGlvbmFsbHkgd2l0aCBhIGNvdW50ZG93bi5cbiAqL1xuZXhwb3J0IGNsYXNzIEFkTWVzc2FnZUxhYmVsIGV4dGVuZHMgTGFiZWw8TGFiZWxDb25maWc+IHtcblxuICBjb25zdHJ1Y3Rvcihjb25maWc6IExhYmVsQ29uZmlnID0ge30pIHtcbiAgICBzdXBlcihjb25maWcpO1xuXG4gICAgdGhpcy5jb25maWcgPSB0aGlzLm1lcmdlQ29uZmlnKGNvbmZpZywge1xuICAgICAgY3NzQ2xhc3M6ICd1aS1sYWJlbC1hZC1tZXNzYWdlJyxcbiAgICAgIHRleHQ6ICdUaGlzIGFkIHdpbGwgZW5kIGluIHtyZW1haW5pbmdUaW1lfSBzZWNvbmRzLidcbiAgICB9LCB0aGlzLmNvbmZpZyk7XG4gIH1cblxuICBjb25maWd1cmUocGxheWVyOiBiaXRtb3Zpbi5wbGF5ZXIuUGxheWVyLCB1aW1hbmFnZXI6IFVJSW5zdGFuY2VNYW5hZ2VyKTogdm9pZCB7XG4gICAgc3VwZXIuY29uZmlndXJlKHBsYXllciwgdWltYW5hZ2VyKTtcblxuICAgIGxldCBzZWxmID0gdGhpcztcbiAgICBsZXQgdGV4dCA9IHRoaXMuZ2V0Q29uZmlnKCkudGV4dDtcblxuICAgIGxldCB1cGRhdGVNZXNzYWdlSGFuZGxlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5zZXRUZXh0KFN0cmluZ1V0aWxzLnJlcGxhY2VBZE1lc3NhZ2VQbGFjZWhvbGRlcnModGV4dCwgbnVsbCwgcGxheWVyKSk7XG4gICAgfTtcblxuICAgIGxldCBhZFN0YXJ0SGFuZGxlciA9IGZ1bmN0aW9uKGV2ZW50OiBiaXRtb3Zpbi5wbGF5ZXIuQWRTdGFydGVkRXZlbnQpIHtcbiAgICAgIHRleHQgPSBldmVudC5hZE1lc3NhZ2UgfHwgdGV4dDtcbiAgICAgIHVwZGF0ZU1lc3NhZ2VIYW5kbGVyKCk7XG5cbiAgICAgIHBsYXllci5hZGRFdmVudEhhbmRsZXIoYml0bW92aW4ucGxheWVyLkVWRU5ULk9OX1RJTUVfQ0hBTkdFRCwgdXBkYXRlTWVzc2FnZUhhbmRsZXIpO1xuICAgICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fQ0FTVF9USU1FX1VQREFURUQsIHVwZGF0ZU1lc3NhZ2VIYW5kbGVyKTtcbiAgICB9O1xuXG4gICAgbGV0IGFkRW5kSGFuZGxlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgcGxheWVyLnJlbW92ZUV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fVElNRV9DSEFOR0VELCB1cGRhdGVNZXNzYWdlSGFuZGxlcik7XG4gICAgICBwbGF5ZXIucmVtb3ZlRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9DQVNUX1RJTUVfVVBEQVRFRCwgdXBkYXRlTWVzc2FnZUhhbmRsZXIpO1xuICAgIH07XG5cbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9BRF9TVEFSVEVELCBhZFN0YXJ0SGFuZGxlcik7XG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fQURfU0tJUFBFRCwgYWRFbmRIYW5kbGVyKTtcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9BRF9GSU5JU0hFRCwgYWRFbmRIYW5kbGVyKTtcbiAgfVxufSIsImltcG9ydCB7QnV0dG9uQ29uZmlnLCBCdXR0b259IGZyb20gJy4vYnV0dG9uJztcbmltcG9ydCB7VUlJbnN0YW5jZU1hbmFnZXJ9IGZyb20gJy4uL3VpbWFuYWdlcic7XG5pbXBvcnQgU2tpcE1lc3NhZ2UgPSBiaXRtb3Zpbi5wbGF5ZXIuU2tpcE1lc3NhZ2U7XG5pbXBvcnQge1N0cmluZ1V0aWxzfSBmcm9tICcuLi91dGlscyc7XG5cbi8qKlxuICogQ29uZmlndXJhdGlvbiBpbnRlcmZhY2UgZm9yIHRoZSB7QGxpbmsgQWRTa2lwQnV0dG9ufS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBZFNraXBCdXR0b25Db25maWcgZXh0ZW5kcyBCdXR0b25Db25maWcge1xuICBza2lwTWVzc2FnZT86IFNraXBNZXNzYWdlO1xufVxuXG4vKipcbiAqIEEgYnV0dG9uIHRoYXQgaXMgZGlzcGxheWVkIGR1cmluZyBhZHMgYW5kIGNhbiBiZSB1c2VkIHRvIHNraXAgdGhlIGFkLlxuICovXG5leHBvcnQgY2xhc3MgQWRTa2lwQnV0dG9uIGV4dGVuZHMgQnV0dG9uPEFkU2tpcEJ1dHRvbkNvbmZpZz4ge1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogQWRTa2lwQnV0dG9uQ29uZmlnID0ge30pIHtcbiAgICBzdXBlcihjb25maWcpO1xuXG4gICAgdGhpcy5jb25maWcgPSB0aGlzLm1lcmdlQ29uZmlnKGNvbmZpZywgPEFkU2tpcEJ1dHRvbkNvbmZpZz57XG4gICAgICBjc3NDbGFzczogJ3VpLWJ1dHRvbi1hZC1za2lwJyxcbiAgICAgIHNraXBNZXNzYWdlOiB7XG4gICAgICAgIGNvdW50ZG93bjogJ1NraXAgYWQgaW4ge3JlbWFpbmluZ1RpbWV9JyxcbiAgICAgICAgc2tpcDogJ1NraXAgYWQnXG4gICAgICB9XG4gICAgfSwgdGhpcy5jb25maWcpO1xuICB9XG5cbiAgY29uZmlndXJlKHBsYXllcjogYml0bW92aW4ucGxheWVyLlBsYXllciwgdWltYW5hZ2VyOiBVSUluc3RhbmNlTWFuYWdlcik6IHZvaWQge1xuICAgIHN1cGVyLmNvbmZpZ3VyZShwbGF5ZXIsIHVpbWFuYWdlcik7XG5cbiAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgbGV0IGNvbmZpZyA9IDxBZFNraXBCdXR0b25Db25maWc+dGhpcy5nZXRDb25maWcoKTsgLy8gVE9ETyBnZXQgcmlkIG9mIGdlbmVyaWMgY2FzdFxuICAgIGxldCBza2lwTWVzc2FnZSA9IGNvbmZpZy5za2lwTWVzc2FnZTtcbiAgICBsZXQgYWRFdmVudCA9IDxiaXRtb3Zpbi5wbGF5ZXIuQWRTdGFydGVkRXZlbnQ+bnVsbDtcblxuICAgIGxldCB1cGRhdGVTa2lwTWVzc2FnZUhhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIC8vIERpc3BsYXkgdGhpcyBidXR0b24gb25seSBpZiBhZCBpcyBza2lwcGFibGVcbiAgICAgIGlmIChhZEV2ZW50LnNraXBPZmZzZXQpIHtcbiAgICAgICAgc2VsZi5zaG93KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZWxmLmhpZGUoKTtcbiAgICAgIH1cblxuICAgICAgLy8gVXBkYXRlIHRoZSBza2lwIG1lc3NhZ2Ugb24gdGhlIGJ1dHRvblxuICAgICAgaWYgKHBsYXllci5nZXRDdXJyZW50VGltZSgpIDwgYWRFdmVudC5za2lwT2Zmc2V0KSB7XG4gICAgICAgIHNlbGYuc2V0VGV4dChcbiAgICAgICAgICBTdHJpbmdVdGlscy5yZXBsYWNlQWRNZXNzYWdlUGxhY2Vob2xkZXJzKGNvbmZpZy5za2lwTWVzc2FnZS5jb3VudGRvd24sIGFkRXZlbnQuc2tpcE9mZnNldCwgcGxheWVyKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZWxmLnNldFRleHQoY29uZmlnLnNraXBNZXNzYWdlLnNraXApO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBsZXQgYWRTdGFydEhhbmRsZXIgPSBmdW5jdGlvbihldmVudDogYml0bW92aW4ucGxheWVyLkFkU3RhcnRlZEV2ZW50KSB7XG4gICAgICBhZEV2ZW50ID0gZXZlbnQ7XG4gICAgICBza2lwTWVzc2FnZSA9IGFkRXZlbnQuc2tpcE1lc3NhZ2UgfHwgc2tpcE1lc3NhZ2U7XG4gICAgICB1cGRhdGVTa2lwTWVzc2FnZUhhbmRsZXIoKTtcblxuICAgICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fVElNRV9DSEFOR0VELCB1cGRhdGVTa2lwTWVzc2FnZUhhbmRsZXIpO1xuICAgICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fQ0FTVF9USU1FX1VQREFURUQsIHVwZGF0ZVNraXBNZXNzYWdlSGFuZGxlcik7XG4gICAgfTtcblxuICAgIGxldCBhZEVuZEhhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIHBsYXllci5yZW1vdmVFdmVudEhhbmRsZXIoYml0bW92aW4ucGxheWVyLkVWRU5ULk9OX1RJTUVfQ0hBTkdFRCwgdXBkYXRlU2tpcE1lc3NhZ2VIYW5kbGVyKTtcbiAgICAgIHBsYXllci5yZW1vdmVFdmVudEhhbmRsZXIoYml0bW92aW4ucGxheWVyLkVWRU5ULk9OX0NBU1RfVElNRV9VUERBVEVELCB1cGRhdGVTa2lwTWVzc2FnZUhhbmRsZXIpO1xuICAgIH07XG5cbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9BRF9TVEFSVEVELCBhZFN0YXJ0SGFuZGxlcik7XG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fQURfU0tJUFBFRCwgYWRFbmRIYW5kbGVyKTtcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9BRF9GSU5JU0hFRCwgYWRFbmRIYW5kbGVyKTtcblxuICAgIHNlbGYub25DbGljay5zdWJzY3JpYmUoZnVuY3Rpb24oKSB7XG4gICAgICAvLyBUcnkgdG8gc2tpcCB0aGUgYWQgKHRoaXMgb25seSB3b3JrcyBpZiBpdCBpcyBza2lwcGFibGUgc28gd2UgZG9uJ3QgbmVlZCB0byB0YWtlIGV4dHJhIGNhcmUgb2YgdGhhdCBoZXJlKVxuICAgICAgcGxheWVyLnNraXBBZCgpO1xuICAgIH0pO1xuICB9XG59IiwiaW1wb3J0IHtTZWxlY3RCb3h9IGZyb20gJy4vc2VsZWN0Ym94JztcbmltcG9ydCB7TGlzdFNlbGVjdG9yQ29uZmlnfSBmcm9tICcuL2xpc3RzZWxlY3Rvcic7XG5pbXBvcnQge1VJSW5zdGFuY2VNYW5hZ2VyfSBmcm9tICcuLi91aW1hbmFnZXInO1xuXG4vKipcbiAqIEEgc2VsZWN0IGJveCBwcm92aWRpbmcgYSBzZWxlY3Rpb24gYmV0d2VlbiAnYXV0bycgYW5kIHRoZSBhdmFpbGFibGUgYXVkaW8gcXVhbGl0aWVzLlxuICovXG5leHBvcnQgY2xhc3MgQXVkaW9RdWFsaXR5U2VsZWN0Qm94IGV4dGVuZHMgU2VsZWN0Qm94IHtcblxuICBjb25zdHJ1Y3Rvcihjb25maWc6IExpc3RTZWxlY3RvckNvbmZpZyA9IHt9KSB7XG4gICAgc3VwZXIoY29uZmlnKTtcbiAgfVxuXG4gIGNvbmZpZ3VyZShwbGF5ZXI6IGJpdG1vdmluLnBsYXllci5QbGF5ZXIsIHVpbWFuYWdlcjogVUlJbnN0YW5jZU1hbmFnZXIpOiB2b2lkIHtcbiAgICBzdXBlci5jb25maWd1cmUocGxheWVyLCB1aW1hbmFnZXIpO1xuXG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuXG4gICAgbGV0IHVwZGF0ZUF1ZGlvUXVhbGl0aWVzID0gZnVuY3Rpb24oKSB7XG4gICAgICBsZXQgYXVkaW9RdWFsaXRpZXMgPSBwbGF5ZXIuZ2V0QXZhaWxhYmxlQXVkaW9RdWFsaXRpZXMoKTtcblxuICAgICAgc2VsZi5jbGVhckl0ZW1zKCk7XG5cbiAgICAgIC8vIEFkZCBlbnRyeSBmb3IgYXV0b21hdGljIHF1YWxpdHkgc3dpdGNoaW5nIChkZWZhdWx0IHNldHRpbmcpXG4gICAgICBzZWxmLmFkZEl0ZW0oJ2F1dG8nLCAnYXV0bycpO1xuXG4gICAgICAvLyBBZGQgYXVkaW8gcXVhbGl0aWVzXG4gICAgICBmb3IgKGxldCBhdWRpb1F1YWxpdHkgb2YgYXVkaW9RdWFsaXRpZXMpIHtcbiAgICAgICAgc2VsZi5hZGRJdGVtKGF1ZGlvUXVhbGl0eS5pZCwgYXVkaW9RdWFsaXR5LmxhYmVsKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgc2VsZi5vbkl0ZW1TZWxlY3RlZC5zdWJzY3JpYmUoZnVuY3Rpb24oc2VuZGVyOiBBdWRpb1F1YWxpdHlTZWxlY3RCb3gsIHZhbHVlOiBzdHJpbmcpIHtcbiAgICAgIHBsYXllci5zZXRBdWRpb1F1YWxpdHkodmFsdWUpO1xuICAgIH0pO1xuXG4gICAgLy8gVXBkYXRlIHF1YWxpdGllcyB3aGVuIGF1ZGlvIHRyYWNrIGhhcyBjaGFuZ2VkXG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fQVVESU9fQ0hBTkdFRCwgdXBkYXRlQXVkaW9RdWFsaXRpZXMpO1xuICAgIC8vIFVwZGF0ZSBxdWFsaXRpZXMgd2hlbiBzb3VyY2UgZ29lcyBhd2F5XG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fU09VUkNFX1VOTE9BREVELCB1cGRhdGVBdWRpb1F1YWxpdGllcyk7XG4gICAgLy8gVXBkYXRlIHF1YWxpdGllcyB3aGVuIGEgbmV3IHNvdXJjZSBpcyBsb2FkZWRcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9SRUFEWSwgdXBkYXRlQXVkaW9RdWFsaXRpZXMpO1xuICAgIC8vIFVwZGF0ZSBxdWFsaXR5IHNlbGVjdGlvbiB3aGVuIHF1YWxpdHkgaXMgY2hhbmdlZCAoZnJvbSBvdXRzaWRlKVxuICAgIHBsYXllci5hZGRFdmVudEhhbmRsZXIoYml0bW92aW4ucGxheWVyLkVWRU5ULk9OX0FVRElPX0RPV05MT0FEX1FVQUxJVFlfQ0hBTkdFRCwgZnVuY3Rpb24oKSB7XG4gICAgICBsZXQgZGF0YSA9IHBsYXllci5nZXREb3dubG9hZGVkQXVkaW9EYXRhKCk7XG4gICAgICBzZWxmLnNlbGVjdEl0ZW0oZGF0YS5pc0F1dG8gPyAnYXV0bycgOiBkYXRhLmlkKTtcbiAgICB9KTtcblxuICAgIC8vIFBvcHVsYXRlIHF1YWxpdGllcyBhdCBzdGFydHVwXG4gICAgdXBkYXRlQXVkaW9RdWFsaXRpZXMoKTtcbiAgfVxufSIsImltcG9ydCB7U2VsZWN0Qm94fSBmcm9tICcuL3NlbGVjdGJveCc7XG5pbXBvcnQge0xpc3RTZWxlY3RvckNvbmZpZ30gZnJvbSAnLi9saXN0c2VsZWN0b3InO1xuaW1wb3J0IHtVSUluc3RhbmNlTWFuYWdlcn0gZnJvbSAnLi4vdWltYW5hZ2VyJztcblxuLyoqXG4gKiBBIHNlbGVjdCBib3ggcHJvdmlkaW5nIGEgc2VsZWN0aW9uIGJldHdlZW4gYXZhaWxhYmxlIGF1ZGlvIHRyYWNrcyAoZS5nLiBkaWZmZXJlbnQgbGFuZ3VhZ2VzKS5cbiAqL1xuZXhwb3J0IGNsYXNzIEF1ZGlvVHJhY2tTZWxlY3RCb3ggZXh0ZW5kcyBTZWxlY3RCb3gge1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogTGlzdFNlbGVjdG9yQ29uZmlnID0ge30pIHtcbiAgICBzdXBlcihjb25maWcpO1xuICB9XG5cbiAgY29uZmlndXJlKHBsYXllcjogYml0bW92aW4ucGxheWVyLlBsYXllciwgdWltYW5hZ2VyOiBVSUluc3RhbmNlTWFuYWdlcik6IHZvaWQge1xuICAgIHN1cGVyLmNvbmZpZ3VyZShwbGF5ZXIsIHVpbWFuYWdlcik7XG5cbiAgICBsZXQgc2VsZiA9IHRoaXM7XG5cbiAgICBsZXQgdXBkYXRlQXVkaW9UcmFja3MgPSBmdW5jdGlvbigpIHtcbiAgICAgIGxldCBhdWRpb1RyYWNrcyA9IHBsYXllci5nZXRBdmFpbGFibGVBdWRpbygpO1xuXG4gICAgICBzZWxmLmNsZWFySXRlbXMoKTtcblxuICAgICAgLy8gQWRkIGF1ZGlvIHRyYWNrc1xuICAgICAgZm9yIChsZXQgYXVkaW9UcmFjayBvZiBhdWRpb1RyYWNrcykge1xuICAgICAgICBzZWxmLmFkZEl0ZW0oYXVkaW9UcmFjay5pZCwgYXVkaW9UcmFjay5sYWJlbCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHNlbGYub25JdGVtU2VsZWN0ZWQuc3Vic2NyaWJlKGZ1bmN0aW9uKHNlbmRlcjogQXVkaW9UcmFja1NlbGVjdEJveCwgdmFsdWU6IHN0cmluZykge1xuICAgICAgcGxheWVyLnNldEF1ZGlvKHZhbHVlKTtcbiAgICB9KTtcblxuICAgIGxldCBhdWRpb1RyYWNrSGFuZGxlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgbGV0IGN1cnJlbnRBdWRpb1RyYWNrID0gcGxheWVyLmdldEF1ZGlvKCk7XG4gICAgICBzZWxmLnNlbGVjdEl0ZW0oY3VycmVudEF1ZGlvVHJhY2suaWQpO1xuICAgIH07XG5cbiAgICAvLyBVcGRhdGUgc2VsZWN0aW9uIHdoZW4gc2VsZWN0ZWQgdHJhY2sgaGFzIGNoYW5nZWRcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9BVURJT19DSEFOR0VELCBhdWRpb1RyYWNrSGFuZGxlcik7XG4gICAgLy8gVXBkYXRlIHRyYWNrcyB3aGVuIHNvdXJjZSBnb2VzIGF3YXlcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9TT1VSQ0VfVU5MT0FERUQsIHVwZGF0ZUF1ZGlvVHJhY2tzKTtcbiAgICAvLyBVcGRhdGUgdHJhY2tzIHdoZW4gYSBuZXcgc291cmNlIGlzIGxvYWRlZFxuICAgIHBsYXllci5hZGRFdmVudEhhbmRsZXIoYml0bW92aW4ucGxheWVyLkVWRU5ULk9OX1JFQURZLCB1cGRhdGVBdWRpb1RyYWNrcyk7XG5cbiAgICAvLyBQb3B1bGF0ZSB0cmFja3MgYXQgc3RhcnR1cFxuICAgIHVwZGF0ZUF1ZGlvVHJhY2tzKCk7XG4gIH1cbn0iLCJpbXBvcnQge0NvbnRhaW5lckNvbmZpZywgQ29udGFpbmVyfSBmcm9tICcuL2NvbnRhaW5lcic7XG5pbXBvcnQge1VJSW5zdGFuY2VNYW5hZ2VyfSBmcm9tICcuLi91aW1hbmFnZXInO1xuaW1wb3J0IHtDb21wb25lbnQsIENvbXBvbmVudENvbmZpZ30gZnJvbSAnLi9jb21wb25lbnQnO1xuXG4vKipcbiAqIE92ZXJsYXlzIHRoZSBwbGF5ZXIgYW5kIGRpc3BsYXlzIGEgYnVmZmVyaW5nIGluZGljYXRvci5cbiAqL1xuZXhwb3J0IGNsYXNzIEJ1ZmZlcmluZ092ZXJsYXkgZXh0ZW5kcyBDb250YWluZXI8Q29udGFpbmVyQ29uZmlnPiB7XG5cbiAgcHJpdmF0ZSBpbmRpY2F0b3JzOiBDb21wb25lbnQ8Q29tcG9uZW50Q29uZmlnPltdO1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogQ29udGFpbmVyQ29uZmlnID0ge30pIHtcbiAgICBzdXBlcihjb25maWcpO1xuXG4gICAgdGhpcy5pbmRpY2F0b3JzID0gW1xuICAgICAgbmV3IENvbXBvbmVudDxDb21wb25lbnRDb25maWc+KHsgdGFnOiAnZGl2JywgY3NzQ2xhc3M6ICd1aS1idWZmZXJpbmctb3ZlcmxheS1pbmRpY2F0b3InIH0pLFxuICAgICAgbmV3IENvbXBvbmVudDxDb21wb25lbnRDb25maWc+KHsgdGFnOiAnZGl2JywgY3NzQ2xhc3M6ICd1aS1idWZmZXJpbmctb3ZlcmxheS1pbmRpY2F0b3InIH0pLFxuICAgICAgbmV3IENvbXBvbmVudDxDb21wb25lbnRDb25maWc+KHsgdGFnOiAnZGl2JywgY3NzQ2xhc3M6ICd1aS1idWZmZXJpbmctb3ZlcmxheS1pbmRpY2F0b3InIH0pLFxuICAgIF07XG5cbiAgICB0aGlzLmNvbmZpZyA9IHRoaXMubWVyZ2VDb25maWcoY29uZmlnLCB7XG4gICAgICBjc3NDbGFzczogJ3VpLWJ1ZmZlcmluZy1vdmVybGF5JyxcbiAgICAgIGhpZGRlbjogdHJ1ZSxcbiAgICAgIGNvbXBvbmVudHM6IHRoaXMuaW5kaWNhdG9yc1xuICAgIH0sIHRoaXMuY29uZmlnKTtcbiAgfVxuXG4gIGNvbmZpZ3VyZShwbGF5ZXI6IGJpdG1vdmluLnBsYXllci5QbGF5ZXIsIHVpbWFuYWdlcjogVUlJbnN0YW5jZU1hbmFnZXIpOiB2b2lkIHtcbiAgICBzdXBlci5jb25maWd1cmUocGxheWVyLCB1aW1hbmFnZXIpO1xuXG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuXG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fU1RBTExfU1RBUlRFRCwgZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLnNob3coKTtcbiAgICB9KTtcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9TVEFMTF9FTkRFRCwgZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLmhpZGUoKTtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHtDb21wb25lbnRDb25maWcsIENvbXBvbmVudH0gZnJvbSAnLi9jb21wb25lbnQnO1xuaW1wb3J0IHtET019IGZyb20gJy4uL2RvbSc7XG5pbXBvcnQge0V2ZW50RGlzcGF0Y2hlciwgTm9BcmdzLCBFdmVudH0gZnJvbSAnLi4vZXZlbnRkaXNwYXRjaGVyJztcblxuLyoqXG4gKiBDb25maWd1cmF0aW9uIGludGVyZmFjZSBmb3IgYSB7QGxpbmsgQnV0dG9ufSBjb21wb25lbnQuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQnV0dG9uQ29uZmlnIGV4dGVuZHMgQ29tcG9uZW50Q29uZmlnIHtcbiAgLyoqXG4gICAqIFRoZSB0ZXh0IG9uIHRoZSBidXR0b24uXG4gICAqL1xuICB0ZXh0Pzogc3RyaW5nO1xufVxuXG4vKipcbiAqIEEgc2ltcGxlIGNsaWNrYWJsZSBidXR0b24uXG4gKi9cbmV4cG9ydCBjbGFzcyBCdXR0b248Q29uZmlnIGV4dGVuZHMgQnV0dG9uQ29uZmlnPiBleHRlbmRzIENvbXBvbmVudDxCdXR0b25Db25maWc+IHtcblxuICBwcml2YXRlIGJ1dHRvbkV2ZW50cyA9IHtcbiAgICBvbkNsaWNrOiBuZXcgRXZlbnREaXNwYXRjaGVyPEJ1dHRvbjxDb25maWc+LCBOb0FyZ3M+KClcbiAgfTtcblxuICBjb25zdHJ1Y3Rvcihjb25maWc6IEJ1dHRvbkNvbmZpZykge1xuICAgIHN1cGVyKGNvbmZpZyk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IHRoaXMubWVyZ2VDb25maWcoY29uZmlnLCB7XG4gICAgICBjc3NDbGFzczogJ3VpLWJ1dHRvbidcbiAgICB9LCB0aGlzLmNvbmZpZyk7XG4gIH1cblxuICBwcm90ZWN0ZWQgdG9Eb21FbGVtZW50KCk6IERPTSB7XG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuXG4gICAgLy8gQ3JlYXRlIHRoZSBidXR0b24gZWxlbWVudCB3aXRoIHRoZSB0ZXh0IGxhYmVsXG4gICAgbGV0IGJ1dHRvbkVsZW1lbnQgPSBuZXcgRE9NKCdidXR0b24nLCB7XG4gICAgICAndHlwZSc6ICdidXR0b24nLFxuICAgICAgJ2lkJzogdGhpcy5jb25maWcuaWQsXG4gICAgICAnY2xhc3MnOiB0aGlzLmdldENzc0NsYXNzZXMoKVxuICAgIH0pLmFwcGVuZChuZXcgRE9NKCdzcGFuJywge1xuICAgICAgJ2NsYXNzJzogdGhpcy5wcmVmaXhDc3MoJ2xhYmVsJylcbiAgICB9KS5odG1sKHRoaXMuY29uZmlnLnRleHQpKTtcblxuICAgIC8vIExpc3RlbiBmb3IgdGhlIGNsaWNrIGV2ZW50IG9uIHRoZSBidXR0b24gZWxlbWVudCBhbmQgdHJpZ2dlciB0aGUgY29ycmVzcG9uZGluZyBldmVudCBvbiB0aGUgYnV0dG9uIGNvbXBvbmVudFxuICAgIGJ1dHRvbkVsZW1lbnQub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLm9uQ2xpY2tFdmVudCgpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGJ1dHRvbkVsZW1lbnQ7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0ZXh0IG9uIHRoZSBsYWJlbCBvZiB0aGUgYnV0dG9uLlxuICAgKiBAcGFyYW0gdGV4dCB0aGUgdGV4dCB0byBwdXQgaW50byB0aGUgbGFiZWwgb2YgdGhlIGJ1dHRvblxuICAgKi9cbiAgc2V0VGV4dCh0ZXh0OiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmdldERvbUVsZW1lbnQoKS5maW5kKCcuJyArIHRoaXMucHJlZml4Q3NzKCdsYWJlbCcpKS5odG1sKHRleHQpO1xuICB9XG5cbiAgcHJvdGVjdGVkIG9uQ2xpY2tFdmVudCgpIHtcbiAgICB0aGlzLmJ1dHRvbkV2ZW50cy5vbkNsaWNrLmRpc3BhdGNoKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGV2ZW50IHRoYXQgaXMgZmlyZWQgd2hlbiB0aGUgYnV0dG9uIGlzIGNsaWNrZWQuXG4gICAqIEByZXR1cm5zIHtFdmVudDxCdXR0b248Q29uZmlnPiwgTm9BcmdzPn1cbiAgICovXG4gIGdldCBvbkNsaWNrKCk6IEV2ZW50PEJ1dHRvbjxDb25maWc+LCBOb0FyZ3M+IHtcbiAgICByZXR1cm4gdGhpcy5idXR0b25FdmVudHMub25DbGljay5nZXRFdmVudCgpO1xuICB9XG59IiwiaW1wb3J0IHtDb250YWluZXJDb25maWcsIENvbnRhaW5lcn0gZnJvbSAnLi9jb250YWluZXInO1xuaW1wb3J0IHtMYWJlbCwgTGFiZWxDb25maWd9IGZyb20gJy4vbGFiZWwnO1xuaW1wb3J0IHtVSUluc3RhbmNlTWFuYWdlcn0gZnJvbSAnLi4vdWltYW5hZ2VyJztcbmltcG9ydCBDYXN0V2FpdGluZ0ZvckRldmljZUV2ZW50ID0gYml0bW92aW4ucGxheWVyLkNhc3RXYWl0aW5nRm9yRGV2aWNlRXZlbnQ7XG5pbXBvcnQgQ2FzdExhdW5jaGVkRXZlbnQgPSBiaXRtb3Zpbi5wbGF5ZXIuQ2FzdExhdW5jaGVkRXZlbnQ7XG5pbXBvcnQgQ2FzdFN0b3BwZWRFdmVudCA9IGJpdG1vdmluLnBsYXllci5DYXN0U3RvcHBlZEV2ZW50O1xuXG4vKipcbiAqIE92ZXJsYXlzIHRoZSBwbGF5ZXIgYW5kIGRpc3BsYXlzIHRoZSBzdGF0dXMgb2YgYSBDYXN0IHNlc3Npb24uXG4gKi9cbmV4cG9ydCBjbGFzcyBDYXN0U3RhdHVzT3ZlcmxheSBleHRlbmRzIENvbnRhaW5lcjxDb250YWluZXJDb25maWc+IHtcblxuICBwcml2YXRlIHN0YXR1c0xhYmVsOiBMYWJlbDxMYWJlbENvbmZpZz47XG5cbiAgY29uc3RydWN0b3IoY29uZmlnOiBDb250YWluZXJDb25maWcgPSB7fSkge1xuICAgIHN1cGVyKGNvbmZpZyk7XG5cbiAgICB0aGlzLnN0YXR1c0xhYmVsID0gbmV3IExhYmVsPExhYmVsQ29uZmlnPih7IGNzc0NsYXNzOiAndWktY2FzdC1zdGF0dXMtbGFiZWwnIH0pO1xuXG4gICAgdGhpcy5jb25maWcgPSB0aGlzLm1lcmdlQ29uZmlnKGNvbmZpZywge1xuICAgICAgY3NzQ2xhc3M6ICd1aS1jYXN0LXN0YXR1cy1vdmVybGF5JyxcbiAgICAgIGNvbXBvbmVudHM6IFt0aGlzLnN0YXR1c0xhYmVsXSxcbiAgICAgIGhpZGRlbjogdHJ1ZVxuICAgIH0sIHRoaXMuY29uZmlnKTtcbiAgfVxuXG4gIGNvbmZpZ3VyZShwbGF5ZXI6IGJpdG1vdmluLnBsYXllci5QbGF5ZXIsIHVpbWFuYWdlcjogVUlJbnN0YW5jZU1hbmFnZXIpOiB2b2lkIHtcbiAgICBzdXBlci5jb25maWd1cmUocGxheWVyLCB1aW1hbmFnZXIpO1xuXG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgIGxldCBjYXN0RGV2aWNlTmFtZSA9ICd1bmtub3duJztcblxuICAgIHBsYXllci5hZGRFdmVudEhhbmRsZXIoYml0bW92aW4ucGxheWVyLkVWRU5ULk9OX0NBU1RfU1RBUlQsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAvLyBTaG93IENhc3Qgc3RhdHVzIHdoZW4gYSBzZXNzaW9uIGlzIGJlaW5nIHN0YXJ0ZWRcbiAgICAgIHNlbGYuc2hvdygpO1xuICAgICAgc2VsZi5zdGF0dXNMYWJlbC5zZXRUZXh0KCdTZWxlY3QgYSBDYXN0IGRldmljZScpO1xuICAgIH0pO1xuICAgIHBsYXllci5hZGRFdmVudEhhbmRsZXIoYml0bW92aW4ucGxheWVyLkVWRU5ULk9OX0NBU1RfV0FJVElOR19GT1JfREVWSUNFLFxuICAgICAgZnVuY3Rpb24oZXZlbnQ6IENhc3RXYWl0aW5nRm9yRGV2aWNlRXZlbnQpIHtcbiAgICAgICAgLy8gR2V0IGRldmljZSBuYW1lIGFuZCB1cGRhdGUgc3RhdHVzIHRleHQgd2hpbGUgY29ubmVjdGluZ1xuICAgICAgICBjYXN0RGV2aWNlTmFtZSA9IGV2ZW50LmNhc3RQYXlsb2FkLmRldmljZU5hbWU7XG4gICAgICAgIHNlbGYuc3RhdHVzTGFiZWwuc2V0VGV4dChgQ29ubmVjdGluZyB0byA8c3Ryb25nPiR7Y2FzdERldmljZU5hbWV9PC9zdHJvbmc+Li4uYCk7XG4gICAgICB9KTtcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9DQVNUX1NUQVJURUQsIGZ1bmN0aW9uKGV2ZW50OiBDYXN0TGF1bmNoZWRFdmVudCkge1xuICAgICAgLy8gU2Vzc2lvbiBpcyBzdGFydGVkIG9yIHJlc3VtZWRcbiAgICAgIC8vIEZvciBjYXNlcyB3aGVuIGEgc2Vzc2lvbiBpcyByZXN1bWVkLCB3ZSBkbyBub3QgcmVjZWl2ZSB0aGUgcHJldmlvdXMgZXZlbnRzIGFuZCB0aGVyZWZvcmUgc2hvdyB0aGUgc3RhdHVzIHBhbmVsXG4gICAgICAvLyBoZXJlIHRvb1xuICAgICAgc2VsZi5zaG93KCk7XG4gICAgICBzZWxmLnN0YXR1c0xhYmVsLnNldFRleHQoYFBsYXlpbmcgb24gPHN0cm9uZz4ke2Nhc3REZXZpY2VOYW1lfTwvc3Ryb25nPmApO1xuICAgIH0pO1xuICAgIHBsYXllci5hZGRFdmVudEhhbmRsZXIoYml0bW92aW4ucGxheWVyLkVWRU5ULk9OX0NBU1RfU1RPUFBFRCwgZnVuY3Rpb24oZXZlbnQ6IENhc3RTdG9wcGVkRXZlbnQpIHtcbiAgICAgIC8vIENhc3Qgc2Vzc2lvbiBnb25lLCBoaWRlIHRoZSBzdGF0dXMgcGFuZWxcbiAgICAgIHNlbGYuaGlkZSgpO1xuICAgIH0pO1xuICB9XG59IiwiaW1wb3J0IHtUb2dnbGVCdXR0b24sIFRvZ2dsZUJ1dHRvbkNvbmZpZ30gZnJvbSAnLi90b2dnbGVidXR0b24nO1xuaW1wb3J0IHtVSUluc3RhbmNlTWFuYWdlcn0gZnJvbSAnLi4vdWltYW5hZ2VyJztcblxuLyoqXG4gKiBBIGJ1dHRvbiB0aGF0IHRvZ2dsZXMgY2FzdGluZyB0byBhIENhc3QgcmVjZWl2ZXIuXG4gKi9cbmV4cG9ydCBjbGFzcyBDYXN0VG9nZ2xlQnV0dG9uIGV4dGVuZHMgVG9nZ2xlQnV0dG9uPFRvZ2dsZUJ1dHRvbkNvbmZpZz4ge1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogVG9nZ2xlQnV0dG9uQ29uZmlnID0ge30pIHtcbiAgICBzdXBlcihjb25maWcpO1xuXG4gICAgdGhpcy5jb25maWcgPSB0aGlzLm1lcmdlQ29uZmlnKGNvbmZpZywge1xuICAgICAgY3NzQ2xhc3M6ICd1aS1jYXN0dG9nZ2xlYnV0dG9uJyxcbiAgICAgIHRleHQ6ICdHb29nbGUgQ2FzdCdcbiAgICB9LCB0aGlzLmNvbmZpZyk7XG4gIH1cblxuICBjb25maWd1cmUocGxheWVyOiBiaXRtb3Zpbi5wbGF5ZXIuUGxheWVyLCB1aW1hbmFnZXI6IFVJSW5zdGFuY2VNYW5hZ2VyKTogdm9pZCB7XG4gICAgc3VwZXIuY29uZmlndXJlKHBsYXllciwgdWltYW5hZ2VyKTtcblxuICAgIGxldCBzZWxmID0gdGhpcztcblxuICAgIHNlbGYub25DbGljay5zdWJzY3JpYmUoZnVuY3Rpb24oKSB7XG4gICAgICBpZiAocGxheWVyLmlzQ2FzdEF2YWlsYWJsZSgpKSB7XG4gICAgICAgIGlmIChwbGF5ZXIuaXNDYXN0aW5nKCkpIHtcbiAgICAgICAgICBwbGF5ZXIuY2FzdFN0b3AoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwbGF5ZXIuY2FzdFZpZGVvKCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChjb25zb2xlKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ0Nhc3QgdW5hdmFpbGFibGUnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgbGV0IGNhc3RBdmFpbGFibGVIYW5kZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChwbGF5ZXIuaXNDYXN0QXZhaWxhYmxlKCkpIHtcbiAgICAgICAgc2VsZi5zaG93KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZWxmLmhpZGUoKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fQ0FTVF9BVkFJTEFCTEUsIGNhc3RBdmFpbGFibGVIYW5kZXIpO1xuXG4gICAgLy8gVG9nZ2xlIGJ1dHRvbiAnb24nIHN0YXRlXG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fQ0FTVF9TVEFSVEVELCBmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYub24oKTtcbiAgICB9KTtcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9DQVNUX1NUT1BQRUQsIGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5vZmYoKTtcbiAgICB9KTtcblxuICAgIC8vIFN0YXJ0dXAgaW5pdFxuICAgIGNhc3RBdmFpbGFibGVIYW5kZXIoKTsgLy8gSGlkZSBidXR0b24gaWYgQ2FzdCBub3QgYXZhaWxhYmxlXG4gICAgaWYgKHBsYXllci5pc0Nhc3RpbmcoKSkge1xuICAgICAgc2VsZi5vbigpO1xuICAgIH1cbiAgfVxufSIsImltcG9ydCB7VUlDb250YWluZXIsIFVJQ29udGFpbmVyQ29uZmlnfSBmcm9tICcuL3VpY29udGFpbmVyJztcbmltcG9ydCB7VUlJbnN0YW5jZU1hbmFnZXJ9IGZyb20gJy4uL3VpbWFuYWdlcic7XG5pbXBvcnQge1RpbWVvdXR9IGZyb20gJy4uL3RpbWVvdXQnO1xuXG4vKipcbiAqIFRoZSBiYXNlIGNvbnRhaW5lciBmb3IgQ2FzdCByZWNlaXZlcnMgdGhhdCBjb250YWlucyBhbGwgb2YgdGhlIFVJIGFuZCB0YWtlcyBjYXJlIHRoYXQgdGhlIFVJIGlzIHNob3duIG9uXG4gKiBjZXJ0YWluIHBsYXliYWNrIGV2ZW50cy5cbiAqL1xuZXhwb3J0IGNsYXNzIENhc3RVSUNvbnRhaW5lciBleHRlbmRzIFVJQ29udGFpbmVyIHtcblxuICBjb25zdHJ1Y3Rvcihjb25maWc6IFVJQ29udGFpbmVyQ29uZmlnKSB7XG4gICAgc3VwZXIoY29uZmlnKTtcbiAgfVxuXG4gIGNvbmZpZ3VyZShwbGF5ZXI6IGJpdG1vdmluLnBsYXllci5QbGF5ZXIsIHVpbWFuYWdlcjogVUlJbnN0YW5jZU1hbmFnZXIpOiB2b2lkIHtcbiAgICBzdXBlci5jb25maWd1cmUocGxheWVyLCB1aW1hbmFnZXIpO1xuXG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgIGxldCBjb25maWcgPSA8VUlDb250YWluZXJDb25maWc+dGhpcy5nZXRDb25maWcoKTtcblxuICAgIC8qXG4gICAgICogU2hvdyBVSSBvbiBDYXN0IGRldmljZXMgYXQgY2VydGFpbiBwbGF5YmFjayBldmVudHNcbiAgICAgKlxuICAgICAqIFNpbmNlIGEgQ2FzdCByZWNlaXZlciBkb2VzIG5vdCBoYXZlIGEgZGlyZWN0IEhDSSwgd2Ugc2hvdyB0aGUgVUkgb24gY2VydGFpbiBwbGF5YmFjayBldmVudHMgdG8gZ2l2ZSB0aGUgdXNlclxuICAgICAqIGEgY2hhbmNlIHRvIHNlZSBvbiB0aGUgc2NyZWVuIHdoYXQncyBnb2luZyBvbiwgZS5nLiBvbiBwbGF5L3BhdXNlIG9yIGEgc2VlayB0aGUgVUkgaXMgc2hvd24gYW5kIHRoZSB1c2VyIGNhblxuICAgICAqIHNlZSB0aGUgY3VycmVudCB0aW1lIGFuZCBwb3NpdGlvbiBvbiB0aGUgc2VlayBiYXIuXG4gICAgICogVGhlIFVJIGlzIHNob3duIHBlcm1hbmVudGx5IHdoaWxlIHBsYXliYWNrIGlzIHBhdXNlZCwgb3RoZXJ3aXNlIGhpZGVzIGF1dG9tYXRpY2FsbHkgYWZ0ZXIgdGhlIGNvbmZpZ3VyZWRcbiAgICAgKiBoaWRlIGRlbGF5IHRpbWUuXG4gICAgICovXG5cbiAgICBsZXQgaXNVaVNob3duID0gZmFsc2U7XG5cbiAgICBsZXQgaGlkZVVpID0gZnVuY3Rpb24oKSB7XG4gICAgICB1aW1hbmFnZXIub25Db250cm9sc0hpZGUuZGlzcGF0Y2goc2VsZik7XG4gICAgICBpc1VpU2hvd24gPSBmYWxzZTtcbiAgICB9O1xuXG4gICAgbGV0IHVpSGlkZVRpbWVvdXQgPSBuZXcgVGltZW91dChjb25maWcuaGlkZURlbGF5LCBoaWRlVWkpO1xuXG4gICAgbGV0IHNob3dVaSA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCFpc1VpU2hvd24pIHtcbiAgICAgICAgdWltYW5hZ2VyLm9uQ29udHJvbHNTaG93LmRpc3BhdGNoKHNlbGYpO1xuICAgICAgICBpc1VpU2hvd24gPSB0cnVlO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBsZXQgc2hvd1VpUGVybWFuZW50bHkgPSBmdW5jdGlvbigpIHtcbiAgICAgIHNob3dVaSgpO1xuICAgICAgdWlIaWRlVGltZW91dC5jbGVhcigpO1xuICAgIH07XG5cbiAgICBsZXQgc2hvd1VpV2l0aFRpbWVvdXQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHNob3dVaSgpO1xuICAgICAgdWlIaWRlVGltZW91dC5zdGFydCgpO1xuICAgIH07XG5cbiAgICBsZXQgc2hvd1VpQWZ0ZXJTZWVrID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAocGxheWVyLmlzUGxheWluZygpKSB7XG4gICAgICAgIHNob3dVaVdpdGhUaW1lb3V0KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzaG93VWlQZXJtYW5lbnRseSgpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9SRUFEWSwgc2hvd1VpV2l0aFRpbWVvdXQpO1xuICAgIHBsYXllci5hZGRFdmVudEhhbmRsZXIoYml0bW92aW4ucGxheWVyLkVWRU5ULk9OX1NPVVJDRV9MT0FERUQsIHNob3dVaVdpdGhUaW1lb3V0KTtcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9QTEFZLCBzaG93VWlXaXRoVGltZW91dCk7XG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fUEFVU0VELCBzaG93VWlQZXJtYW5lbnRseSk7XG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fU0VFSywgc2hvd1VpUGVybWFuZW50bHkpO1xuICAgIHBsYXllci5hZGRFdmVudEhhbmRsZXIoYml0bW92aW4ucGxheWVyLkVWRU5ULk9OX1NFRUtFRCwgc2hvd1VpQWZ0ZXJTZWVrKTtcbiAgfVxufSIsImltcG9ydCB7QnV0dG9uLCBCdXR0b25Db25maWd9IGZyb20gJy4vYnV0dG9uJztcblxuLyoqXG4gKiBDb25maWd1cmF0aW9uIGludGVyZmFjZSBmb3IgYSB7QGxpbmsgQ2xpY2tPdmVybGF5fS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDbGlja092ZXJsYXlDb25maWcgZXh0ZW5kcyBCdXR0b25Db25maWcge1xuICAvKipcbiAgICogVGhlIHVybCB0byBvcGVuIHdoZW4gdGhlIG92ZXJsYXkgaXMgY2xpY2tlZC4gU2V0IHRvIG51bGwgdG8gZGlzYWJsZSB0aGUgY2xpY2sgaGFuZGxlci5cbiAgICovXG4gIHVybD86IHN0cmluZztcbn1cblxuLyoqXG4gKiBBIGNsaWNrIG92ZXJsYXkgdGhhdCBvcGVucyBhbiB1cmwgaW4gYSBuZXcgdGFiIGlmIGNsaWNrZWQuXG4gKi9cbmV4cG9ydCBjbGFzcyBDbGlja092ZXJsYXkgZXh0ZW5kcyBCdXR0b248Q2xpY2tPdmVybGF5Q29uZmlnPiB7XG5cbiAgY29uc3RydWN0b3IoY29uZmlnOiBDbGlja092ZXJsYXlDb25maWcgPSB7fSkge1xuICAgIHN1cGVyKGNvbmZpZyk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IHRoaXMubWVyZ2VDb25maWcoY29uZmlnLCB7XG4gICAgICBjc3NDbGFzczogJ3VpLWNsaWNrb3ZlcmxheSdcbiAgICB9LCA8Q2xpY2tPdmVybGF5Q29uZmlnPnRoaXMuY29uZmlnKTtcbiAgfVxuXG4gIGluaXRpYWxpemUoKTogdm9pZCB7XG4gICAgc3VwZXIuaW5pdGlhbGl6ZSgpO1xuXG4gICAgdGhpcy5zZXRVcmwoKDxDbGlja092ZXJsYXlDb25maWc+dGhpcy5jb25maWcpLnVybCk7XG4gICAgbGV0IGVsZW1lbnQgPSB0aGlzLmdldERvbUVsZW1lbnQoKTtcbiAgICBlbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKGVsZW1lbnQuZGF0YSgndXJsJykpIHtcbiAgICAgICAgd2luZG93Lm9wZW4oZWxlbWVudC5kYXRhKCd1cmwnKSwgJ19ibGFuaycpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIFVSTCB0aGF0IHNob3VsZCBiZSBmb2xsb3dlZCB3aGVuIHRoZSB3YXRlcm1hcmsgaXMgY2xpY2tlZC5cbiAgICogQHJldHVybnMge3N0cmluZ30gdGhlIHdhdGVybWFyayBVUkxcbiAgICovXG4gIGdldFVybCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmdldERvbUVsZW1lbnQoKS5kYXRhKCd1cmwnKTtcbiAgfVxuXG4gIHNldFVybCh1cmw6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICh1cmwgPT09IHVuZGVmaW5lZCB8fCB1cmwgPT0gbnVsbCkge1xuICAgICAgdXJsID0gJyc7XG4gICAgfVxuICAgIHRoaXMuZ2V0RG9tRWxlbWVudCgpLmRhdGEoJ3VybCcsIHVybCk7XG4gIH1cbn0iLCJpbXBvcnQge0J1dHRvbkNvbmZpZywgQnV0dG9ufSBmcm9tICcuL2J1dHRvbic7XG5pbXBvcnQge1VJSW5zdGFuY2VNYW5hZ2VyfSBmcm9tICcuLi91aW1hbmFnZXInO1xuaW1wb3J0IHtDb21wb25lbnQsIENvbXBvbmVudENvbmZpZ30gZnJvbSAnLi9jb21wb25lbnQnO1xuXG4vKipcbiAqIENvbmZpZ3VyYXRpb24gaW50ZXJmYWNlIGZvciB0aGUge0BsaW5rIENsb3NlQnV0dG9ufS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDbG9zZUJ1dHRvbkNvbmZpZyBleHRlbmRzIEJ1dHRvbkNvbmZpZyB7XG4gIC8qKlxuICAgKiBUaGUgY29tcG9uZW50IHRoYXQgc2hvdWxkIGJlIGNsb3NlZCB3aGVuIHRoZSBidXR0b24gaXMgY2xpY2tlZC5cbiAgICovXG4gIHRhcmdldDogQ29tcG9uZW50PENvbXBvbmVudENvbmZpZz47XG59XG5cbi8qKlxuICogQSBidXR0b24gdGhhdCBjbG9zZXMgKGhpZGVzKSBhIGNvbmZpZ3VyZWQgY29tcG9uZW50LlxuICovXG5leHBvcnQgY2xhc3MgQ2xvc2VCdXR0b24gZXh0ZW5kcyBCdXR0b248Q2xvc2VCdXR0b25Db25maWc+IHtcblxuICBjb25zdHJ1Y3Rvcihjb25maWc6IENsb3NlQnV0dG9uQ29uZmlnKSB7XG4gICAgc3VwZXIoY29uZmlnKTtcblxuICAgIHRoaXMuY29uZmlnID0gdGhpcy5tZXJnZUNvbmZpZyhjb25maWcsIHtcbiAgICAgIGNzc0NsYXNzOiAndWktY2xvc2VidXR0b24nLFxuICAgICAgdGV4dDogJ0Nsb3NlJ1xuICAgIH0sIHRoaXMuY29uZmlnKTtcbiAgfVxuXG4gIGNvbmZpZ3VyZShwbGF5ZXI6IGJpdG1vdmluLnBsYXllci5QbGF5ZXIsIHVpbWFuYWdlcjogVUlJbnN0YW5jZU1hbmFnZXIpOiB2b2lkIHtcbiAgICBzdXBlci5jb25maWd1cmUocGxheWVyLCB1aW1hbmFnZXIpO1xuXG4gICAgbGV0IGNvbmZpZyA9IDxDbG9zZUJ1dHRvbkNvbmZpZz50aGlzLmdldENvbmZpZygpO1xuXG4gICAgdGhpcy5vbkNsaWNrLnN1YnNjcmliZShmdW5jdGlvbigpIHtcbiAgICAgIGNvbmZpZy50YXJnZXQuaGlkZSgpO1xuICAgIH0pO1xuICB9XG59IiwiaW1wb3J0IHtHdWlkfSBmcm9tICcuLi9ndWlkJztcbmltcG9ydCB7RE9NfSBmcm9tICcuLi9kb20nO1xuaW1wb3J0IHtFdmVudERpc3BhdGNoZXIsIE5vQXJncywgRXZlbnR9IGZyb20gJy4uL2V2ZW50ZGlzcGF0Y2hlcic7XG5pbXBvcnQge1VJSW5zdGFuY2VNYW5hZ2VyfSBmcm9tICcuLi91aW1hbmFnZXInO1xuXG4vKipcbiAqIEJhc2UgY29uZmlndXJhdGlvbiBpbnRlcmZhY2UgZm9yIGEgY29tcG9uZW50LlxuICogU2hvdWxkIGJlIGV4dGVuZGVkIGJ5IGNvbXBvbmVudHMgdGhhdCB3YW50IHRvIGFkZCBhZGRpdGlvbmFsIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDb21wb25lbnRDb25maWcge1xuICAvKipcbiAgICogVGhlIEhUTUwgdGFnIG5hbWUgb2YgdGhlIGNvbXBvbmVudC5cbiAgICogRGVmYXVsdDogJ2RpdidcbiAgICovXG4gIHRhZz86IHN0cmluZztcbiAgLyoqXG4gICAqIFRoZSBIVE1MIElEIG9mIHRoZSBjb21wb25lbnQuXG4gICAqIERlZmF1bHQ6IGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGVkIHdpdGggcGF0dGVybiAndWktaWQte2d1aWR9Jy5cbiAgICovXG4gIGlkPzogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBBIHByZWZpeCB0byBwcmVwZW5kIGFsbCBDU1MgY2xhc3NlcyB3aXRoLlxuICAgKi9cbiAgY3NzUHJlZml4Pzogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBUaGUgQ1NTIGNsYXNzZXMgb2YgdGhlIGNvbXBvbmVudC4gVGhpcyBpcyB1c3VhbGx5IHRoZSBjbGFzcyBmcm9tIHdoZXJlIHRoZSBjb21wb25lbnQgdGFrZXMgaXRzIHN0eWxpbmcuXG4gICAqL1xuICBjc3NDbGFzcz86IHN0cmluZzsgLy8gJ2NsYXNzJyBpcyBhIHJlc2VydmVkIGtleXdvcmQsIHNvIHdlIG5lZWQgdG8gbWFrZSB0aGUgbmFtZSBtb3JlIGNvbXBsaWNhdGVkXG5cbiAgLyoqXG4gICAqIEFkZGl0aW9uYWwgQ1NTIGNsYXNzZXMgb2YgdGhlIGNvbXBvbmVudC5cbiAgICovXG4gIGNzc0NsYXNzZXM/OiBzdHJpbmdbXTtcblxuICAvKipcbiAgICogU3BlY2lmaWVzIGlmIHRoZSBjb21wb25lbnQgc2hvdWxkIGJlIGhpZGRlbiBhdCBzdGFydHVwLlxuICAgKiBEZWZhdWx0OiBmYWxzZVxuICAgKi9cbiAgaGlkZGVuPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBUaGUgYmFzZSBjbGFzcyBvZiB0aGUgVUkgZnJhbWV3b3JrLlxuICogRWFjaCBjb21wb25lbnQgbXVzdCBleHRlbmQgdGhpcyBjbGFzcyBhbmQgb3B0aW9uYWxseSB0aGUgY29uZmlnIGludGVyZmFjZS5cbiAqL1xuZXhwb3J0IGNsYXNzIENvbXBvbmVudDxDb25maWcgZXh0ZW5kcyBDb21wb25lbnRDb25maWc+IHtcblxuICAvKipcbiAgICogVGhlIGNsYXNzbmFtZSB0aGF0IGlzIGF0dGFjaGVkIHRvIHRoZSBlbGVtZW50IHdoZW4gaXQgaXMgaW4gdGhlIGhpZGRlbiBzdGF0ZS5cbiAgICogQHR5cGUge3N0cmluZ31cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IENMQVNTX0hJRERFTiA9ICdoaWRkZW4nO1xuXG4gIC8qKlxuICAgKiBDb25maWd1cmF0aW9uIG9iamVjdCBvZiB0aGlzIGNvbXBvbmVudC5cbiAgICovXG4gIHByb3RlY3RlZCBjb25maWc6IENvbmZpZztcblxuICAvKipcbiAgICogVGhlIGNvbXBvbmVudCdzIERPTSBlbGVtZW50LlxuICAgKi9cbiAgcHJpdmF0ZSBlbGVtZW50OiBET007XG5cbiAgLyoqXG4gICAqIEZsYWcgdGhhdCBrZWVwcyB0cmFjayBvZiB0aGUgaGlkZGVuIHN0YXRlLlxuICAgKi9cbiAgcHJpdmF0ZSBoaWRkZW46IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFRoZSBsaXN0IG9mIGV2ZW50cyB0aGF0IHRoaXMgY29tcG9uZW50IG9mZmVycy4gVGhlc2UgZXZlbnRzIHNob3VsZCBhbHdheXMgYmUgcHJpdmF0ZSBhbmQgb25seSBkaXJlY3RseVxuICAgKiBhY2Nlc3NlZCBmcm9tIHdpdGhpbiB0aGUgaW1wbGVtZW50aW5nIGNvbXBvbmVudC5cbiAgICpcbiAgICogQmVjYXVzZSBUeXBlU2NyaXB0IGRvZXMgbm90IHN1cHBvcnQgcHJpdmF0ZSBwcm9wZXJ0aWVzIHdpdGggdGhlIHNhbWUgbmFtZSBvbiBkaWZmZXJlbnQgY2xhc3MgaGllcmFyY2h5IGxldmVsc1xuICAgKiAoaS5lLiBzdXBlcmNsYXNzIGFuZCBzdWJjbGFzcyBjYW5ub3QgY29udGFpbiBhIHByaXZhdGUgcHJvcGVydHkgd2l0aCB0aGUgc2FtZSBuYW1lKSwgdGhlIGRlZmF1bHQgbmFtaW5nXG4gICAqIGNvbnZlbnRpb24gZm9yIHRoZSBldmVudCBsaXN0IG9mIGEgY29tcG9uZW50IHRoYXQgc2hvdWxkIGJlIGZvbGxvd2VkIGJ5IHN1YmNsYXNzZXMgaXMgdGhlIGNvbmNhdGVuYXRpb24gb2YgdGhlXG4gICAqIGNhbWVsLWNhc2VkIGNsYXNzIG5hbWUgKyAnRXZlbnRzJyAoZS5nLiBTdWJDbGFzcyBleHRlbmRzIENvbXBvbmVudCA9PiBzdWJDbGFzc0V2ZW50cykuXG4gICAqIFNlZSB7QGxpbmsgI2NvbXBvbmVudEV2ZW50c30gZm9yIGFuIGV4YW1wbGUuXG4gICAqXG4gICAqIEV2ZW50IHByb3BlcnRpZXMgc2hvdWxkIGJlIG5hbWVkIGluIGNhbWVsIGNhc2Ugd2l0aCBhbiAnb24nIHByZWZpeCBhbmQgaW4gdGhlIHByZXNlbnQgdGVuc2UuIEFzeW5jIGV2ZW50cyBtYXlcbiAgICogaGF2ZSBhIHN0YXJ0IGV2ZW50ICh3aGVuIHRoZSBvcGVyYXRpb24gc3RhcnRzKSBpbiB0aGUgcHJlc2VudCB0ZW5zZSwgYW5kIG11c3QgaGF2ZSBhbiBlbmQgZXZlbnQgKHdoZW4gdGhlXG4gICAqIG9wZXJhdGlvbiBlbmRzKSBpbiB0aGUgcGFzdCB0ZW5zZSAob3IgcHJlc2VudCB0ZW5zZSBpbiBzcGVjaWFsIGNhc2VzIChlLmcuIG9uU3RhcnQvb25TdGFydGVkIG9yIG9uUGxheS9vblBsYXlpbmcpLlxuICAgKiBTZWUge0BsaW5rICNjb21wb25lbnRFdmVudHMjb25TaG93fSBmb3IgYW4gZXhhbXBsZS5cbiAgICpcbiAgICogRWFjaCBldmVudCBzaG91bGQgYmUgYWNjb21wYW5pZWQgd2l0aCBhIHByb3RlY3RlZCBtZXRob2QgbmFtZWQgYnkgdGhlIGNvbnZlbnRpb24gZXZlbnROYW1lICsgJ0V2ZW50J1xuICAgKiAoZS5nLiBvblN0YXJ0RXZlbnQpLCB0aGF0IGFjdHVhbGx5IHRyaWdnZXJzIHRoZSBldmVudCBieSBjYWxsaW5nIHtAbGluayBFdmVudERpc3BhdGNoZXIjZGlzcGF0Y2ggZGlzcGF0Y2h9IGFuZFxuICAgKiBwYXNzaW5nIGEgcmVmZXJlbmNlIHRvIHRoZSBjb21wb25lbnQgYXMgZmlyc3QgcGFyYW1ldGVyLiBDb21wb25lbnRzIHNob3VsZCBhbHdheXMgdHJpZ2dlciB0aGVpciBldmVudHMgd2l0aCB0aGVzZVxuICAgKiBtZXRob2RzLiBJbXBsZW1lbnRpbmcgdGhpcyBwYXR0ZXJuIGdpdmVzIHN1YmNsYXNzZXMgbWVhbnMgdG8gZGlyZWN0bHkgbGlzdGVuIHRvIHRoZSBldmVudHMgYnkgb3ZlcnJpZGluZyB0aGVcbiAgICogbWV0aG9kIChhbmQgc2F2aW5nIHRoZSBvdmVyaGVhZCBvZiBwYXNzaW5nIGEgaGFuZGxlciB0byB0aGUgZXZlbnQgZGlzcGF0Y2hlcikgYW5kIG1vcmUgaW1wb3J0YW50bHkgdG8gdHJpZ2dlclxuICAgKiB0aGVzZSBldmVudHMgd2l0aG91dCBoYXZpbmcgYWNjZXNzIHRvIHRoZSBwcml2YXRlIGV2ZW50IGxpc3QuXG4gICAqIFNlZSB7QGxpbmsgI29uU2hvd30gZm9yIGFuIGV4YW1wbGUuXG4gICAqXG4gICAqIFRvIHByb3ZpZGUgZXh0ZXJuYWwgY29kZSB0aGUgcG9zc2liaWxpdHkgdG8gbGlzdGVuIHRvIHRoaXMgY29tcG9uZW50J3MgZXZlbnRzIChzdWJzY3JpYmUsIHVuc3Vic2NyaWJlLCBldGMuKSxcbiAgICogZWFjaCBldmVudCBzaG91bGQgYWxzbyBiZSBhY2NvbXBhbmllZCBieSBhIHB1YmxpYyBnZXR0ZXIgZnVuY3Rpb24gd2l0aCB0aGUgc2FtZSBuYW1lIGFzIHRoZSBldmVudCdzIHByb3BlcnR5LFxuICAgKiB0aGF0IHJldHVybnMgdGhlIHtAbGluayBFdmVudH0gb2J0YWluZWQgZnJvbSB0aGUgZXZlbnQgZGlzcGF0Y2hlciBieSBjYWxsaW5nIHtAbGluayBFdmVudERpc3BhdGNoZXIjZ2V0RXZlbnR9LlxuICAgKiBTZWUge0BsaW5rICNvblNob3d9IGZvciBhbiBleGFtcGxlLlxuICAgKlxuICAgKiBGdWxsIGV4YW1wbGUgZm9yIGFuIGV2ZW50IHJlcHJlc2VudGluZyBhbiBleGFtcGxlIGFjdGlvbiBpbiBhIGV4YW1wbGUgY29tcG9uZW50OlxuICAgKlxuICAgKiA8Y29kZT5cbiAgICogLy8gRGVmaW5lIGFuIGV4YW1wbGUgY29tcG9uZW50IGNsYXNzIHdpdGggYW4gZXhhbXBsZSBldmVudFxuICAgKiBjbGFzcyBFeGFtcGxlQ29tcG9uZW50IGV4dGVuZHMgQ29tcG9uZW50PENvbXBvbmVudENvbmZpZz4ge1xuICAgICAqXG4gICAgICogICAgIHByaXZhdGUgZXhhbXBsZUNvbXBvbmVudEV2ZW50cyA9IHtcbiAgICAgKiAgICAgICAgIG9uRXhhbXBsZUFjdGlvbjogbmV3IEV2ZW50RGlzcGF0Y2hlcjxFeGFtcGxlQ29tcG9uZW50LCBOb0FyZ3M+KClcbiAgICAgKiAgICAgfVxuICAgICAqXG4gICAgICogICAgIC8vIGNvbnN0cnVjdG9yIGFuZCBvdGhlciBzdHVmZi4uLlxuICAgICAqXG4gICAgICogICAgIHByb3RlY3RlZCBvbkV4YW1wbGVBY3Rpb25FdmVudCgpIHtcbiAgICAgKiAgICAgICAgdGhpcy5leGFtcGxlQ29tcG9uZW50RXZlbnRzLm9uRXhhbXBsZUFjdGlvbi5kaXNwYXRjaCh0aGlzKTtcbiAgICAgKiAgICB9XG4gICAgICpcbiAgICAgKiAgICBnZXQgb25FeGFtcGxlQWN0aW9uKCk6IEV2ZW50PEV4YW1wbGVDb21wb25lbnQsIE5vQXJncz4ge1xuICAgICAqICAgICAgICByZXR1cm4gdGhpcy5leGFtcGxlQ29tcG9uZW50RXZlbnRzLm9uRXhhbXBsZUFjdGlvbi5nZXRFdmVudCgpO1xuICAgICAqICAgIH1cbiAgICAgKiB9XG4gICAqXG4gICAqIC8vIENyZWF0ZSBhbiBpbnN0YW5jZSBvZiB0aGUgY29tcG9uZW50IHNvbWV3aGVyZVxuICAgKiB2YXIgZXhhbXBsZUNvbXBvbmVudEluc3RhbmNlID0gbmV3IEV4YW1wbGVDb21wb25lbnQoKTtcbiAgICpcbiAgICogLy8gU3Vic2NyaWJlIHRvIHRoZSBleGFtcGxlIGV2ZW50IG9uIHRoZSBjb21wb25lbnRcbiAgICogZXhhbXBsZUNvbXBvbmVudEluc3RhbmNlLm9uRXhhbXBsZUFjdGlvbi5zdWJzY3JpYmUoZnVuY3Rpb24gKHNlbmRlcjogRXhhbXBsZUNvbXBvbmVudCkge1xuICAgICAqICAgICBjb25zb2xlLmxvZygnb25FeGFtcGxlQWN0aW9uIG9mICcgKyBzZW5kZXIgKyAnIGhhcyBmaXJlZCEnKTtcbiAgICAgKiB9KTtcbiAgICogPC9jb2RlPlxuICAgKi9cbiAgcHJpdmF0ZSBjb21wb25lbnRFdmVudHMgPSB7XG4gICAgb25TaG93OiBuZXcgRXZlbnREaXNwYXRjaGVyPENvbXBvbmVudDxDb25maWc+LCBOb0FyZ3M+KCksXG4gICAgb25IaWRlOiBuZXcgRXZlbnREaXNwYXRjaGVyPENvbXBvbmVudDxDb25maWc+LCBOb0FyZ3M+KClcbiAgfTtcblxuICAvKipcbiAgICogQ29uc3RydWN0cyBhIGNvbXBvbmVudCB3aXRoIGFuIG9wdGlvbmFsbHkgc3VwcGxpZWQgY29uZmlnLiBBbGwgc3ViY2xhc3NlcyBtdXN0IGNhbGwgdGhlIGNvbnN0cnVjdG9yIG9mIHRoZWlyXG4gICAqIHN1cGVyY2xhc3MgYW5kIHRoZW4gbWVyZ2UgdGhlaXIgY29uZmlndXJhdGlvbiBpbnRvIHRoZSBjb21wb25lbnQncyBjb25maWd1cmF0aW9uLlxuICAgKiBAcGFyYW0gY29uZmlnIHRoZSBjb25maWd1cmF0aW9uIGZvciB0aGUgY29tcG9uZW50XG4gICAqL1xuICBjb25zdHJ1Y3Rvcihjb25maWc6IENvbXBvbmVudENvbmZpZyA9IHt9KSB7XG4gICAgLy8gQ3JlYXRlIHRoZSBjb25maWd1cmF0aW9uIGZvciB0aGlzIGNvbXBvbmVudFxuICAgIHRoaXMuY29uZmlnID0gPENvbmZpZz50aGlzLm1lcmdlQ29uZmlnKGNvbmZpZywge1xuICAgICAgdGFnOiAnZGl2JyxcbiAgICAgIGlkOiAnYm1wdWktaWQtJyArIEd1aWQubmV4dCgpLFxuICAgICAgY3NzUHJlZml4OiAnYm1wdWknLFxuICAgICAgY3NzQ2xhc3M6ICd1aS1jb21wb25lbnQnLFxuICAgICAgY3NzQ2xhc3NlczogW10sXG4gICAgICBoaWRkZW46IGZhbHNlXG4gICAgfSwge30pO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBjb21wb25lbnQsIGUuZy4gYnkgYXBwbHlpbmcgY29uZmlnIHNldHRpbmdzLlxuICAgKiBUaGlzIG1ldGhvZCBtdXN0IG5vdCBiZSBjYWxsZWQgZnJvbSBvdXRzaWRlIHRoZSBVSSBmcmFtZXdvcmsuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIGlzIGF1dG9tYXRpY2FsbHkgY2FsbGVkIGJ5IHRoZSB7QGxpbmsgVUlJbnN0YW5jZU1hbmFnZXJ9LiBJZiB0aGUgY29tcG9uZW50IGlzIGFuIGlubmVyIGNvbXBvbmVudCBvZlxuICAgKiBzb21lIGNvbXBvbmVudCwgYW5kIHRodXMgZW5jYXBzdWxhdGVkIGFiZCBtYW5hZ2VkIGludGVybmFsbHkgYW5kIG5ldmVyIGRpcmVjdGx5IGV4cG9zZWQgdG8gdGhlIFVJTWFuYWdlcixcbiAgICogdGhpcyBtZXRob2QgbXVzdCBiZSBjYWxsZWQgZnJvbSB0aGUgbWFuYWdpbmcgY29tcG9uZW50J3Mge0BsaW5rICNpbml0aWFsaXplfSBtZXRob2QuXG4gICAqL1xuICBpbml0aWFsaXplKCk6IHZvaWQge1xuICAgIHRoaXMuaGlkZGVuID0gdGhpcy5jb25maWcuaGlkZGVuO1xuXG4gICAgLy8gSGlkZSB0aGUgY29tcG9uZW50IGF0IGluaXRpYWxpemF0aW9uIGlmIGl0IGlzIGNvbmZpZ3VyZWQgdG8gYmUgaGlkZGVuXG4gICAgaWYgKHRoaXMuaXNIaWRkZW4oKSkge1xuICAgICAgdGhpcy5oaWRlKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENvbmZpZ3VyZXMgdGhlIGNvbXBvbmVudCBmb3IgdGhlIHN1cHBsaWVkIFBsYXllciBhbmQgVUlJbnN0YW5jZU1hbmFnZXIuIFRoaXMgaXMgdGhlIHBsYWNlIHdoZXJlIGFsbCB0aGUgbWFnaWNcbiAgICogaGFwcGVucywgd2hlcmUgY29tcG9uZW50cyB0eXBpY2FsbHkgc3Vic2NyaWJlIGFuZCByZWFjdCB0byBldmVudHMgKG9uIHRoZWlyIERPTSBlbGVtZW50LCB0aGUgUGxheWVyLCBvciB0aGVcbiAgICogVUlJbnN0YW5jZU1hbmFnZXIpLCBhbmQgYmFzaWNhbGx5IGV2ZXJ5dGhpbmcgdGhhdCBtYWtlcyB0aGVtIGludGVyYWN0aXZlLlxuICAgKiBUaGlzIG1ldGhvZCBpcyBjYWxsZWQgb25seSBvbmNlLCB3aGVuIHRoZSBVSU1hbmFnZXIgaW5pdGlhbGl6ZXMgdGhlIFVJLlxuICAgKlxuICAgKiBTdWJjbGFzc2VzIHVzdWFsbHkgb3ZlcndyaXRlIHRoaXMgbWV0aG9kIHRvIGFkZCB0aGVpciBvd24gZnVuY3Rpb25hbGl0eS5cbiAgICpcbiAgICogQHBhcmFtIHBsYXllciB0aGUgcGxheWVyIHdoaWNoIHRoaXMgY29tcG9uZW50IGNvbnRyb2xzXG4gICAqIEBwYXJhbSB1aW1hbmFnZXIgdGhlIFVJSW5zdGFuY2VNYW5hZ2VyIHRoYXQgbWFuYWdlcyB0aGlzIGNvbXBvbmVudFxuICAgKi9cbiAgY29uZmlndXJlKHBsYXllcjogYml0bW92aW4ucGxheWVyLlBsYXllciwgdWltYW5hZ2VyOiBVSUluc3RhbmNlTWFuYWdlcik6IHZvaWQge1xuICAgIGxldCBzZWxmID0gdGhpcztcblxuICAgIHNlbGYub25TaG93LnN1YnNjcmliZShmdW5jdGlvbigpIHtcbiAgICAgIHVpbWFuYWdlci5vbkNvbXBvbmVudFNob3cuZGlzcGF0Y2goc2VsZik7XG4gICAgfSk7XG4gICAgc2VsZi5vbkhpZGUuc3Vic2NyaWJlKGZ1bmN0aW9uKCkge1xuICAgICAgdWltYW5hZ2VyLm9uQ29tcG9uZW50SGlkZS5kaXNwYXRjaChzZWxmKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSB0aGUgRE9NIGVsZW1lbnQgZm9yIHRoaXMgY29tcG9uZW50LlxuICAgKlxuICAgKiBTdWJjbGFzc2VzIHVzdWFsbHkgb3ZlcndyaXRlIHRoaXMgbWV0aG9kIHRvIGV4dGVuZCBvciByZXBsYWNlIHRoZSBET00gZWxlbWVudCB3aXRoIHRoZWlyIG93biBkZXNpZ24uXG4gICAqL1xuICBwcm90ZWN0ZWQgdG9Eb21FbGVtZW50KCk6IERPTSB7XG4gICAgbGV0IGVsZW1lbnQgPSBuZXcgRE9NKHRoaXMuY29uZmlnLnRhZywge1xuICAgICAgJ2lkJzogdGhpcy5jb25maWcuaWQsXG4gICAgICAnY2xhc3MnOiB0aGlzLmdldENzc0NsYXNzZXMoKVxuICAgIH0pO1xuICAgIHJldHVybiBlbGVtZW50O1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIERPTSBlbGVtZW50IG9mIHRoaXMgY29tcG9uZW50LiBDcmVhdGVzIHRoZSBET00gZWxlbWVudCBpZiBpdCBkb2VzIG5vdCB5ZXQgZXhpc3QuXG4gICAqXG4gICAqIFNob3VsZCBub3QgYmUgb3ZlcndyaXR0ZW4gYnkgc3ViY2xhc3Nlcy5cbiAgICpcbiAgICogQHJldHVybnMge0RPTX1cbiAgICovXG4gIGdldERvbUVsZW1lbnQoKTogRE9NIHtcbiAgICBpZiAoIXRoaXMuZWxlbWVudCkge1xuICAgICAgdGhpcy5lbGVtZW50ID0gdGhpcy50b0RvbUVsZW1lbnQoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xuICB9XG5cbiAgLyoqXG4gICAqIE1lcmdlcyBhIGNvbmZpZ3VyYXRpb24gd2l0aCBhIGRlZmF1bHQgY29uZmlndXJhdGlvbiBhbmQgYSBiYXNlIGNvbmZpZ3VyYXRpb24gZnJvbSB0aGUgc3VwZXJjbGFzcy5cbiAgICpcbiAgICogQHBhcmFtIGNvbmZpZyB0aGUgY29uZmlndXJhdGlvbiBzZXR0aW5ncyBmb3IgdGhlIGNvbXBvbmVudHMsIGFzIHVzdWFsbHkgcGFzc2VkIHRvIHRoZSBjb25zdHJ1Y3RvclxuICAgKiBAcGFyYW0gZGVmYXVsdHMgYSBkZWZhdWx0IGNvbmZpZ3VyYXRpb24gZm9yIHNldHRpbmdzIHRoYXQgYXJlIG5vdCBwYXNzZWQgd2l0aCB0aGUgY29uZmlndXJhdGlvblxuICAgKiBAcGFyYW0gYmFzZSBjb25maWd1cmF0aW9uIGluaGVyaXRlZCBmcm9tIGEgc3VwZXJjbGFzc1xuICAgKiBAcmV0dXJucyB7Q29uZmlnfVxuICAgKi9cbiAgcHJvdGVjdGVkIG1lcmdlQ29uZmlnPENvbmZpZz4oY29uZmlnOiBDb25maWcsIGRlZmF1bHRzOiBDb25maWcsIGJhc2U6IENvbmZpZyk6IENvbmZpZyB7XG4gICAgLy8gRXh0ZW5kIGRlZmF1bHQgY29uZmlnIHdpdGggc3VwcGxpZWQgY29uZmlnXG4gICAgbGV0IG1lcmdlZCA9IE9iamVjdC5hc3NpZ24oe30sIGJhc2UsIGRlZmF1bHRzLCBjb25maWcpO1xuXG4gICAgLy8gUmV0dXJuIHRoZSBleHRlbmRlZCBjb25maWdcbiAgICByZXR1cm4gbWVyZ2VkO1xuICB9XG5cbiAgLyoqXG4gICAqIEhlbHBlciBtZXRob2QgdGhhdCByZXR1cm5zIGEgc3RyaW5nIG9mIGFsbCBDU1MgY2xhc3NlcyBvZiB0aGUgY29tcG9uZW50LlxuICAgKlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgKi9cbiAgcHJvdGVjdGVkIGdldENzc0NsYXNzZXMoKTogc3RyaW5nIHtcbiAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgLy8gTWVyZ2UgYWxsIENTUyBjbGFzc2VzIGludG8gc2luZ2xlIGFycmF5XG4gICAgbGV0IGZsYXR0ZW5lZEFycmF5ID0gW3RoaXMuY29uZmlnLmNzc0NsYXNzXS5jb25jYXQodGhpcy5jb25maWcuY3NzQ2xhc3Nlcyk7XG4gICAgLy8gUHJlZml4IGNsYXNzZXNcbiAgICBmbGF0dGVuZWRBcnJheSA9IGZsYXR0ZW5lZEFycmF5Lm1hcChmdW5jdGlvbihjc3MpIHtcbiAgICAgIHJldHVybiBzZWxmLnByZWZpeENzcyhjc3MpO1xuICAgIH0pO1xuICAgIC8vIEpvaW4gYXJyYXkgdmFsdWVzIGludG8gYSBzdHJpbmdcbiAgICBsZXQgZmxhdHRlbmVkU3RyaW5nID0gZmxhdHRlbmVkQXJyYXkuam9pbignICcpO1xuICAgIC8vIFJldHVybiB0cmltbWVkIHN0cmluZyB0byBwcmV2ZW50IHdoaXRlc3BhY2UgYXQgdGhlIGVuZCBmcm9tIHRoZSBqb2luIG9wZXJhdGlvblxuICAgIHJldHVybiBmbGF0dGVuZWRTdHJpbmcudHJpbSgpO1xuICB9XG5cbiAgcHJvdGVjdGVkIHByZWZpeENzcyhjc3NDbGFzc09ySWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmNzc1ByZWZpeCArICctJyArIGNzc0NsYXNzT3JJZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjb25maWd1cmF0aW9uIG9iamVjdCBvZiB0aGUgY29tcG9uZW50LlxuICAgKiBAcmV0dXJucyB7Q29uZmlnfVxuICAgKi9cbiAgcHVibGljIGdldENvbmZpZygpOiBDb25maWcge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZztcbiAgfVxuXG4gIC8qKlxuICAgKiBIaWRlcyB0aGUgY29tcG9uZW50LlxuICAgKiBUaGlzIG1ldGhvZCBiYXNpY2FsbHkgdHJhbnNmZXJzIHRoZSBjb21wb25lbnQgaW50byB0aGUgaGlkZGVuIHN0YXRlLiBBY3R1YWwgaGlkaW5nIGlzIGRvbmUgdmlhIENTUy5cbiAgICovXG4gIGhpZGUoKSB7XG4gICAgdGhpcy5oaWRkZW4gPSB0cnVlO1xuICAgIHRoaXMuZ2V0RG9tRWxlbWVudCgpLmFkZENsYXNzKHRoaXMucHJlZml4Q3NzKENvbXBvbmVudC5DTEFTU19ISURERU4pKTtcbiAgICB0aGlzLm9uSGlkZUV2ZW50KCk7XG4gIH1cblxuICAvKipcbiAgICogU2hvd3MgdGhlIGNvbXBvbmVudC5cbiAgICovXG4gIHNob3coKSB7XG4gICAgdGhpcy5nZXREb21FbGVtZW50KCkucmVtb3ZlQ2xhc3ModGhpcy5wcmVmaXhDc3MoQ29tcG9uZW50LkNMQVNTX0hJRERFTikpO1xuICAgIHRoaXMuaGlkZGVuID0gZmFsc2U7XG4gICAgdGhpcy5vblNob3dFdmVudCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgdGhlIGNvbXBvbmVudCBpcyBoaWRkZW4uXG4gICAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmIHRoZSBjb21wb25lbnQgaXMgaGlkZGVuLCBlbHNlIGZhbHNlXG4gICAqL1xuICBpc0hpZGRlbigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5oaWRkZW47XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyBpZiB0aGUgY29tcG9uZW50IGlzIHNob3duLlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgY29tcG9uZW50IGlzIHZpc2libGUsIGVsc2UgZmFsc2VcbiAgICovXG4gIGlzU2hvd24oKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICF0aGlzLmlzSGlkZGVuKCk7XG4gIH1cblxuICAvKipcbiAgICogVG9nZ2xlcyB0aGUgaGlkZGVuIHN0YXRlIGJ5IGhpZGluZyB0aGUgY29tcG9uZW50IGlmIGl0IGlzIHNob3duLCBvciBzaG93aW5nIGl0IGlmIGhpZGRlbi5cbiAgICovXG4gIHRvZ2dsZUhpZGRlbigpIHtcbiAgICBpZiAodGhpcy5pc0hpZGRlbigpKSB7XG4gICAgICB0aGlzLnNob3coKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5oaWRlKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEZpcmVzIHRoZSBvblNob3cgZXZlbnQuXG4gICAqIFNlZSB0aGUgZGV0YWlsZWQgZXhwbGFuYXRpb24gb24gZXZlbnQgYXJjaGl0ZWN0dXJlIG9uaiB0aGUge0BsaW5rICNjb21wb25lbnRFdmVudHMgZXZlbnRzIGxpc3R9LlxuICAgKi9cbiAgcHJvdGVjdGVkIG9uU2hvd0V2ZW50KCkge1xuICAgIHRoaXMuY29tcG9uZW50RXZlbnRzLm9uU2hvdy5kaXNwYXRjaCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGaXJlcyB0aGUgb25IaWRlIGV2ZW50LlxuICAgKiBTZWUgdGhlIGRldGFpbGVkIGV4cGxhbmF0aW9uIG9uIGV2ZW50IGFyY2hpdGVjdHVyZSBvbmogdGhlIHtAbGluayAjY29tcG9uZW50RXZlbnRzIGV2ZW50cyBsaXN0fS5cbiAgICovXG4gIHByb3RlY3RlZCBvbkhpZGVFdmVudCgpIHtcbiAgICB0aGlzLmNvbXBvbmVudEV2ZW50cy5vbkhpZGUuZGlzcGF0Y2godGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZXZlbnQgdGhhdCBpcyBmaXJlZCB3aGVuIHRoZSBjb21wb25lbnQgaXMgc2hvd2luZy5cbiAgICogU2VlIHRoZSBkZXRhaWxlZCBleHBsYW5hdGlvbiBvbiBldmVudCBhcmNoaXRlY3R1cmUgb25qIHRoZSB7QGxpbmsgI2NvbXBvbmVudEV2ZW50cyBldmVudHMgbGlzdH0uXG4gICAqIEByZXR1cm5zIHtFdmVudDxDb21wb25lbnQ8Q29uZmlnPiwgTm9BcmdzPn1cbiAgICovXG4gIGdldCBvblNob3coKTogRXZlbnQ8Q29tcG9uZW50PENvbmZpZz4sIE5vQXJncz4ge1xuICAgIHJldHVybiB0aGlzLmNvbXBvbmVudEV2ZW50cy5vblNob3cuZ2V0RXZlbnQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBldmVudCB0aGF0IGlzIGZpcmVkIHdoZW4gdGhlIGNvbXBvbmVudCBpcyBoaWRpbmcuXG4gICAqIFNlZSB0aGUgZGV0YWlsZWQgZXhwbGFuYXRpb24gb24gZXZlbnQgYXJjaGl0ZWN0dXJlIG9uaiB0aGUge0BsaW5rICNjb21wb25lbnRFdmVudHMgZXZlbnRzIGxpc3R9LlxuICAgKiBAcmV0dXJucyB7RXZlbnQ8Q29tcG9uZW50PENvbmZpZz4sIE5vQXJncz59XG4gICAqL1xuICBnZXQgb25IaWRlKCk6IEV2ZW50PENvbXBvbmVudDxDb25maWc+LCBOb0FyZ3M+IHtcbiAgICByZXR1cm4gdGhpcy5jb21wb25lbnRFdmVudHMub25IaWRlLmdldEV2ZW50KCk7XG4gIH1cbn0iLCJpbXBvcnQge0NvbXBvbmVudENvbmZpZywgQ29tcG9uZW50fSBmcm9tICcuL2NvbXBvbmVudCc7XG5pbXBvcnQge0RPTX0gZnJvbSAnLi4vZG9tJztcbmltcG9ydCB7QXJyYXlVdGlsc30gZnJvbSAnLi4vdXRpbHMnO1xuXG4vKipcbiAqIENvbmZpZ3VyYXRpb24gaW50ZXJmYWNlIGZvciBhIHtAbGluayBDb250YWluZXJ9LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIENvbnRhaW5lckNvbmZpZyBleHRlbmRzIENvbXBvbmVudENvbmZpZyB7XG4gIC8qKlxuICAgKiBDaGlsZCBjb21wb25lbnRzIG9mIHRoZSBjb250YWluZXIuXG4gICAqL1xuICBjb21wb25lbnRzPzogQ29tcG9uZW50PENvbXBvbmVudENvbmZpZz5bXTtcbn1cblxuLyoqXG4gKiBBIGNvbnRhaW5lciBjb21wb25lbnQgdGhhdCBjYW4gY29udGFpbiBhIGNvbGxlY3Rpb24gb2YgY2hpbGQgY29tcG9uZW50cy5cbiAqIENvbXBvbmVudHMgY2FuIGJlIGFkZGVkIGF0IGNvbnN0cnVjdGlvbiB0aW1lIHRocm91Z2ggdGhlIHtAbGluayBDb250YWluZXJDb25maWcjY29tcG9uZW50c30gc2V0dGluZywgb3IgbGF0ZXJcbiAqIHRocm91Z2ggdGhlIHtAbGluayBDb250YWluZXIjYWRkQ29tcG9uZW50fSBtZXRob2QuIFRoZSBVSU1hbmFnZXIgYXV0b21hdGljYWxseSB0YWtlcyBjYXJlIG9mIGFsbCBjb21wb25lbnRzLCBpLmUuIGl0XG4gKiBpbml0aWFsaXplcyBhbmQgY29uZmlndXJlcyB0aGVtIGF1dG9tYXRpY2FsbHkuXG4gKlxuICogSW4gdGhlIERPTSwgdGhlIGNvbnRhaW5lciBjb25zaXN0cyBvZiBhbiBvdXRlciA8ZGl2PiAodGhhdCBjYW4gYmUgY29uZmlndXJlZCBieSB0aGUgY29uZmlnKSBhbmQgYW4gaW5uZXIgd3JhcHBlclxuICogPGRpdj4gdGhhdCBjb250YWlucyB0aGUgY29tcG9uZW50cy4gVGhpcyBkb3VibGUtPGRpdj4tc3RydWN0dXJlIGlzIG9mdGVuIHJlcXVpcmVkIHRvIGFjaGlldmUgbWFueSBhZHZhbmNlZCBlZmZlY3RzXG4gKiBpbiBDU1MgYW5kL29yIEpTLCBlLmcuIGFuaW1hdGlvbnMgYW5kIGNlcnRhaW4gZm9ybWF0dGluZyB3aXRoIGFic29sdXRlIHBvc2l0aW9uaW5nLlxuICpcbiAqIERPTSBleGFtcGxlOlxuICogPGNvZGU+XG4gKiAgICAgPGRpdiBjbGFzcz0ndWktY29udGFpbmVyJz5cbiAqICAgICAgICAgPGRpdiBjbGFzcz0nY29udGFpbmVyLXdyYXBwZXInPlxuICogICAgICAgICAgICAgLi4uIGNoaWxkIGNvbXBvbmVudHMgLi4uXG4gKiAgICAgICAgIDwvZGl2PlxuICogICAgIDwvZGl2PlxuICogPC9jb2RlPlxuICovXG5leHBvcnQgY2xhc3MgQ29udGFpbmVyPENvbmZpZyBleHRlbmRzIENvbnRhaW5lckNvbmZpZz4gZXh0ZW5kcyBDb21wb25lbnQ8Q29udGFpbmVyQ29uZmlnPiB7XG5cbiAgLyoqXG4gICAqIEEgcmVmZXJlbmNlIHRvIHRoZSBpbm5lciBlbGVtZW50IHRoYXQgY29udGFpbnMgdGhlIGNvbXBvbmVudHMgb2YgdGhlIGNvbnRhaW5lci5cbiAgICovXG4gIHByaXZhdGUgaW5uZXJDb250YWluZXJFbGVtZW50OiBET007XG5cbiAgY29uc3RydWN0b3IoY29uZmlnOiBDb250YWluZXJDb25maWcpIHtcbiAgICBzdXBlcihjb25maWcpO1xuXG4gICAgdGhpcy5jb25maWcgPSB0aGlzLm1lcmdlQ29uZmlnKGNvbmZpZywge1xuICAgICAgY3NzQ2xhc3M6ICd1aS1jb250YWluZXInLFxuICAgICAgY29tcG9uZW50czogW11cbiAgICB9LCB0aGlzLmNvbmZpZyk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIGNoaWxkIGNvbXBvbmVudCB0byB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gY29tcG9uZW50IHRoZSBjb21wb25lbnQgdG8gYWRkXG4gICAqL1xuICBhZGRDb21wb25lbnQoY29tcG9uZW50OiBDb21wb25lbnQ8Q29tcG9uZW50Q29uZmlnPikge1xuICAgIHRoaXMuY29uZmlnLmNvbXBvbmVudHMucHVzaChjb21wb25lbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYSBjaGlsZCBjb21wb25lbnQgZnJvbSB0aGUgY29udGFpbmVyLlxuICAgKiBAcGFyYW0gY29tcG9uZW50IHRoZSBjb21wb25lbnQgdG8gcmVtb3ZlXG4gICAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmIHRoZSBjb21wb25lbnQgaGFzIGJlZW4gcmVtb3ZlZCwgZmFsc2UgaWYgaXQgaXMgbm90IGNvbnRhaW5lZCBpbiB0aGlzIGNvbnRhaW5lclxuICAgKi9cbiAgcmVtb3ZlQ29tcG9uZW50KGNvbXBvbmVudDogQ29tcG9uZW50PENvbXBvbmVudENvbmZpZz4pOiBib29sZWFuIHtcbiAgICByZXR1cm4gQXJyYXlVdGlscy5yZW1vdmUodGhpcy5jb25maWcuY29tcG9uZW50cywgY29tcG9uZW50KSAhPSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYW4gYXJyYXkgb2YgYWxsIGNoaWxkIGNvbXBvbmVudHMgaW4gdGhpcyBjb250YWluZXIuXG4gICAqIEByZXR1cm5zIHtDb21wb25lbnQ8Q29tcG9uZW50Q29uZmlnPltdfVxuICAgKi9cbiAgZ2V0Q29tcG9uZW50cygpOiBDb21wb25lbnQ8Q29tcG9uZW50Q29uZmlnPltdIHtcbiAgICByZXR1cm4gdGhpcy5jb25maWcuY29tcG9uZW50cztcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBET00gb2YgdGhlIGNvbnRhaW5lciB3aXRoIHRoZSBjdXJyZW50IGNvbXBvbmVudHMuXG4gICAqL1xuICBwcm90ZWN0ZWQgdXBkYXRlQ29tcG9uZW50cygpOiB2b2lkIHtcbiAgICB0aGlzLmlubmVyQ29udGFpbmVyRWxlbWVudC5lbXB0eSgpO1xuXG4gICAgZm9yIChsZXQgY29tcG9uZW50IG9mIHRoaXMuY29uZmlnLmNvbXBvbmVudHMpIHtcbiAgICAgIHRoaXMuaW5uZXJDb250YWluZXJFbGVtZW50LmFwcGVuZChjb21wb25lbnQuZ2V0RG9tRWxlbWVudCgpKTtcbiAgICB9XG4gIH1cblxuICBwcm90ZWN0ZWQgdG9Eb21FbGVtZW50KCk6IERPTSB7XG4gICAgLy8gQ3JlYXRlIHRoZSBjb250YWluZXIgZWxlbWVudCAodGhlIG91dGVyIDxkaXY+KVxuICAgIGxldCBjb250YWluZXJFbGVtZW50ID0gbmV3IERPTSh0aGlzLmNvbmZpZy50YWcsIHtcbiAgICAgICdpZCc6IHRoaXMuY29uZmlnLmlkLFxuICAgICAgJ2NsYXNzJzogdGhpcy5nZXRDc3NDbGFzc2VzKClcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSB0aGUgaW5uZXIgY29udGFpbmVyIGVsZW1lbnQgKHRoZSBpbm5lciA8ZGl2PikgdGhhdCB3aWxsIGNvbnRhaW4gdGhlIGNvbXBvbmVudHNcbiAgICBsZXQgaW5uZXJDb250YWluZXIgPSBuZXcgRE9NKHRoaXMuY29uZmlnLnRhZywge1xuICAgICAgJ2NsYXNzJzogdGhpcy5wcmVmaXhDc3MoJ2NvbnRhaW5lci13cmFwcGVyJylcbiAgICB9KTtcbiAgICB0aGlzLmlubmVyQ29udGFpbmVyRWxlbWVudCA9IGlubmVyQ29udGFpbmVyO1xuXG4gICAgdGhpcy51cGRhdGVDb21wb25lbnRzKCk7XG5cbiAgICBjb250YWluZXJFbGVtZW50LmFwcGVuZChpbm5lckNvbnRhaW5lcik7XG5cbiAgICByZXR1cm4gY29udGFpbmVyRWxlbWVudDtcbiAgfVxufSIsImltcG9ydCB7Q29udGFpbmVyQ29uZmlnLCBDb250YWluZXJ9IGZyb20gJy4vY29udGFpbmVyJztcbmltcG9ydCB7VUlJbnN0YW5jZU1hbmFnZXJ9IGZyb20gJy4uL3VpbWFuYWdlcic7XG5cbi8qKlxuICogQ29uZmlndXJhdGlvbiBpbnRlcmZhY2UgZm9yIHRoZSB7QGxpbmsgQ29udHJvbEJhcn0uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ29udHJvbEJhckNvbmZpZyBleHRlbmRzIENvbnRhaW5lckNvbmZpZyB7XG4gIC8vIG5vdGhpbmcgeWV0XG59XG5cbi8qKlxuICogQSBjb250YWluZXIgZm9yIG1haW4gcGxheWVyIGNvbnRyb2wgY29tcG9uZW50cywgZS5nLiBwbGF5IHRvZ2dsZSBidXR0b24sIHNlZWsgYmFyLCB2b2x1bWUgY29udHJvbCwgZnVsbHNjcmVlbiB0b2dnbGVcbiAqIGJ1dHRvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIENvbnRyb2xCYXIgZXh0ZW5kcyBDb250YWluZXI8Q29udHJvbEJhckNvbmZpZz4ge1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogQ29udHJvbEJhckNvbmZpZykge1xuICAgIHN1cGVyKGNvbmZpZyk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IHRoaXMubWVyZ2VDb25maWcoY29uZmlnLCB7XG4gICAgICBjc3NDbGFzczogJ3VpLWNvbnRyb2xiYXInLFxuICAgICAgaGlkZGVuOiB0cnVlLFxuICAgIH0sIDxDb250cm9sQmFyQ29uZmlnPnRoaXMuY29uZmlnKTtcbiAgfVxuXG4gIGNvbmZpZ3VyZShwbGF5ZXI6IGJpdG1vdmluLnBsYXllci5QbGF5ZXIsIHVpbWFuYWdlcjogVUlJbnN0YW5jZU1hbmFnZXIpOiB2b2lkIHtcbiAgICBzdXBlci5jb25maWd1cmUocGxheWVyLCB1aW1hbmFnZXIpO1xuXG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuXG4gICAgdWltYW5hZ2VyLm9uQ29udHJvbHNTaG93LnN1YnNjcmliZShmdW5jdGlvbiAoKSB7XG4gICAgICBzZWxmLnNob3coKTtcbiAgICB9KTtcbiAgICB1aW1hbmFnZXIub25Db250cm9sc0hpZGUuc3Vic2NyaWJlKGZ1bmN0aW9uICgpIHtcbiAgICAgIHNlbGYuaGlkZSgpO1xuICAgIH0pO1xuICB9XG59IiwiaW1wb3J0IHtDb250YWluZXJDb25maWcsIENvbnRhaW5lcn0gZnJvbSAnLi9jb250YWluZXInO1xuaW1wb3J0IHtMYWJlbCwgTGFiZWxDb25maWd9IGZyb20gJy4vbGFiZWwnO1xuaW1wb3J0IHtVSUluc3RhbmNlTWFuYWdlcn0gZnJvbSAnLi4vdWltYW5hZ2VyJztcbmltcG9ydCBFcnJvckV2ZW50ID0gYml0bW92aW4ucGxheWVyLkVycm9yRXZlbnQ7XG5pbXBvcnQge1R2Tm9pc2VDYW52YXN9IGZyb20gJy4vdHZub2lzZWNhbnZhcyc7XG5cbi8qKlxuICogT3ZlcmxheXMgdGhlIHBsYXllciBhbmQgZGlzcGxheXMgZXJyb3IgbWVzc2FnZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBFcnJvck1lc3NhZ2VPdmVybGF5IGV4dGVuZHMgQ29udGFpbmVyPENvbnRhaW5lckNvbmZpZz4ge1xuXG4gIHByaXZhdGUgZXJyb3JMYWJlbDogTGFiZWw8TGFiZWxDb25maWc+O1xuICBwcml2YXRlIHR2Tm9pc2VCYWNrZ3JvdW5kOiBUdk5vaXNlQ2FudmFzO1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogQ29udGFpbmVyQ29uZmlnID0ge30pIHtcbiAgICBzdXBlcihjb25maWcpO1xuXG4gICAgdGhpcy5lcnJvckxhYmVsID0gbmV3IExhYmVsPExhYmVsQ29uZmlnPih7IGNzc0NsYXNzOiAndWktZXJyb3JtZXNzYWdlLWxhYmVsJyB9KTtcbiAgICB0aGlzLnR2Tm9pc2VCYWNrZ3JvdW5kID0gbmV3IFR2Tm9pc2VDYW52YXMoKTtcblxuICAgIHRoaXMuY29uZmlnID0gdGhpcy5tZXJnZUNvbmZpZyhjb25maWcsIHtcbiAgICAgIGNzc0NsYXNzOiAndWktZXJyb3JtZXNzYWdlLW92ZXJsYXknLFxuICAgICAgY29tcG9uZW50czogW3RoaXMudHZOb2lzZUJhY2tncm91bmQsIHRoaXMuZXJyb3JMYWJlbF0sXG4gICAgICBoaWRkZW46IHRydWVcbiAgICB9LCB0aGlzLmNvbmZpZyk7XG4gIH1cblxuICBjb25maWd1cmUocGxheWVyOiBiaXRtb3Zpbi5wbGF5ZXIuUGxheWVyLCB1aW1hbmFnZXI6IFVJSW5zdGFuY2VNYW5hZ2VyKTogdm9pZCB7XG4gICAgc3VwZXIuY29uZmlndXJlKHBsYXllciwgdWltYW5hZ2VyKTtcblxuICAgIGxldCBzZWxmID0gdGhpcztcblxuICAgIHBsYXllci5hZGRFdmVudEhhbmRsZXIoYml0bW92aW4ucGxheWVyLkVWRU5ULk9OX0VSUk9SLCBmdW5jdGlvbihldmVudDogRXJyb3JFdmVudCkge1xuICAgICAgc2VsZi5lcnJvckxhYmVsLnNldFRleHQoZXZlbnQubWVzc2FnZSk7XG4gICAgICBzZWxmLnR2Tm9pc2VCYWNrZ3JvdW5kLnN0YXJ0KCk7XG4gICAgICBzZWxmLnNob3coKTtcbiAgICB9KTtcbiAgfVxufSIsImltcG9ydCB7VG9nZ2xlQnV0dG9uLCBUb2dnbGVCdXR0b25Db25maWd9IGZyb20gJy4vdG9nZ2xlYnV0dG9uJztcbmltcG9ydCB7VUlJbnN0YW5jZU1hbmFnZXJ9IGZyb20gJy4uL3VpbWFuYWdlcic7XG5cbi8qKlxuICogQSBidXR0b24gdGhhdCB0b2dnbGVzIHRoZSBwbGF5ZXIgYmV0d2VlbiB3aW5kb3dlZCBhbmQgZnVsbHNjcmVlbiB2aWV3LlxuICovXG5leHBvcnQgY2xhc3MgRnVsbHNjcmVlblRvZ2dsZUJ1dHRvbiBleHRlbmRzIFRvZ2dsZUJ1dHRvbjxUb2dnbGVCdXR0b25Db25maWc+IHtcblxuICBjb25zdHJ1Y3Rvcihjb25maWc6IFRvZ2dsZUJ1dHRvbkNvbmZpZyA9IHt9KSB7XG4gICAgc3VwZXIoY29uZmlnKTtcblxuICAgIHRoaXMuY29uZmlnID0gdGhpcy5tZXJnZUNvbmZpZyhjb25maWcsIHtcbiAgICAgIGNzc0NsYXNzOiAndWktZnVsbHNjcmVlbnRvZ2dsZWJ1dHRvbicsXG4gICAgICB0ZXh0OiAnRnVsbHNjcmVlbidcbiAgICB9LCB0aGlzLmNvbmZpZyk7XG4gIH1cblxuICBjb25maWd1cmUocGxheWVyOiBiaXRtb3Zpbi5wbGF5ZXIuUGxheWVyLCB1aW1hbmFnZXI6IFVJSW5zdGFuY2VNYW5hZ2VyKTogdm9pZCB7XG4gICAgc3VwZXIuY29uZmlndXJlKHBsYXllciwgdWltYW5hZ2VyKTtcblxuICAgIGxldCBzZWxmID0gdGhpcztcblxuICAgIGxldCBmdWxsc2NyZWVuU3RhdGVIYW5kbGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAocGxheWVyLmlzRnVsbHNjcmVlbigpKSB7XG4gICAgICAgIHNlbGYub24oKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNlbGYub2ZmKCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHBsYXllci5hZGRFdmVudEhhbmRsZXIoYml0bW92aW4ucGxheWVyLkVWRU5ULk9OX0ZVTExTQ1JFRU5fRU5URVIsIGZ1bGxzY3JlZW5TdGF0ZUhhbmRsZXIpO1xuICAgIHBsYXllci5hZGRFdmVudEhhbmRsZXIoYml0bW92aW4ucGxheWVyLkVWRU5ULk9OX0ZVTExTQ1JFRU5fRVhJVCwgZnVsbHNjcmVlblN0YXRlSGFuZGxlcik7XG5cbiAgICBzZWxmLm9uQ2xpY2suc3Vic2NyaWJlKGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHBsYXllci5pc0Z1bGxzY3JlZW4oKSkge1xuICAgICAgICBjb25zdCBkOiBhbnkgPSBkb2N1bWVudDtcbiAgICAgICAgaWYgKGQuZXhpdEZ1bGxzY3JlZW4pIHtcbiAgICAgICAgICBkLmV4aXRGdWxsc2NyZWVuKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZC53ZWJraXRFeGl0RnVsbHNjcmVlbikge1xuICAgICAgICAgIGQud2Via2l0RXhpdEZ1bGxzY3JlZW4oKTtcbiAgICAgICAgfSBlbHNlIGlmIChkLm1vekNhbmNlbEZ1bGxTY3JlZW4pIHtcbiAgICAgICAgICBkLm1vekNhbmNlbEZ1bGxTY3JlZW4oKTtcbiAgICAgICAgfSBlbHNlIGlmIChkLm1zRXhpdEZ1bGxzY3JlZW4pIHtcbiAgICAgICAgICBkLm1zRXhpdEZ1bGxzY3JlZW4oKTtcbiAgICAgICAgfVxuICAgICAgICBwbGF5ZXIuZmlyZUV2ZW50KGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9GVUxMU0NSRUVOX0VYSVQsIHsgcmVxdWVzdGVkOiB0cnVlIH0pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgZWwgPSA8YW55PiBwbGF5ZXIuZ2V0RmlndXJlKCkucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50O1xuICAgICAgICBpZiAoZWwucmVxdWVzdEZ1bGxzY3JlZW4pIHtcbiAgICAgICAgICBlbC5yZXF1ZXN0RnVsbHNjcmVlbigpO1xuICAgICAgICB9IGVsc2UgaWYgKGVsLndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuKSB7XG4gICAgICAgICAgZWwud2Via2l0UmVxdWVzdEZ1bGxzY3JlZW4oKTtcbiAgICAgICAgfSBlbHNlIGlmIChlbC5tb3pSZXF1ZXN0RnVsbFNjcmVlbikge1xuICAgICAgICAgIGVsLm1velJlcXVlc3RGdWxsU2NyZWVuKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZWwubXNSZXF1ZXN0RnVsbHNjcmVlbikge1xuICAgICAgICAgIGVsLm1zUmVxdWVzdEZ1bGxzY3JlZW4oKTtcbiAgICAgICAgfVxuICAgICAgICBwbGF5ZXIuZmlyZUV2ZW50KGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9GVUxMU0NSRUVOX0VOVEVSLCB7IHJlcXVlc3RlZDogdHJ1ZSB9KVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gU3RhcnR1cCBpbml0XG4gICAgZnVsbHNjcmVlblN0YXRlSGFuZGxlcigpO1xuICB9XG59XG4iLCJpbXBvcnQge1RvZ2dsZUJ1dHRvbkNvbmZpZ30gZnJvbSAnLi90b2dnbGVidXR0b24nO1xuaW1wb3J0IHtQbGF5YmFja1RvZ2dsZUJ1dHRvbn0gZnJvbSAnLi9wbGF5YmFja3RvZ2dsZWJ1dHRvbic7XG5pbXBvcnQge0RPTX0gZnJvbSAnLi4vZG9tJztcbmltcG9ydCB7VUlJbnN0YW5jZU1hbmFnZXJ9IGZyb20gJy4uL3VpbWFuYWdlcic7XG5pbXBvcnQgUGxheWVyRXZlbnQgPSBiaXRtb3Zpbi5wbGF5ZXIuUGxheWVyRXZlbnQ7XG5cbi8qKlxuICogQSBidXR0b24gdGhhdCBvdmVybGF5cyB0aGUgdmlkZW8gYW5kIHRvZ2dsZXMgYmV0d2VlbiBwbGF5YmFjayBhbmQgcGF1c2UuXG4gKi9cbmV4cG9ydCBjbGFzcyBIdWdlUGxheWJhY2tUb2dnbGVCdXR0b24gZXh0ZW5kcyBQbGF5YmFja1RvZ2dsZUJ1dHRvbiB7XG5cbiAgY29uc3RydWN0b3IoY29uZmlnOiBUb2dnbGVCdXR0b25Db25maWcgPSB7fSkge1xuICAgIHN1cGVyKGNvbmZpZyk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IHRoaXMubWVyZ2VDb25maWcoY29uZmlnLCB7XG4gICAgICBjc3NDbGFzczogJ3VpLWh1Z2VwbGF5YmFja3RvZ2dsZWJ1dHRvbicsXG4gICAgICB0ZXh0OiAnUGxheS9QYXVzZSdcbiAgICB9LCB0aGlzLmNvbmZpZyk7XG4gIH1cblxuICBjb25maWd1cmUocGxheWVyOiBiaXRtb3Zpbi5wbGF5ZXIuUGxheWVyLCB1aW1hbmFnZXI6IFVJSW5zdGFuY2VNYW5hZ2VyKTogdm9pZCB7XG4gICAgLy8gVXBkYXRlIGJ1dHRvbiBzdGF0ZSB0aHJvdWdoIEFQSSBldmVudHNcbiAgICBzdXBlci5jb25maWd1cmUocGxheWVyLCB1aW1hbmFnZXIsIGZhbHNlKTtcblxuICAgIGxldCBzZWxmID0gdGhpcztcblxuICAgIGxldCB0b2dnbGVQbGF5YmFjayA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHBsYXllci5pc1BsYXlpbmcoKSkge1xuICAgICAgICBwbGF5ZXIucGF1c2UoJ3VpLW92ZXJsYXknKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBsYXllci5wbGF5KCd1aS1vdmVybGF5Jyk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8vIGxldCB0b2dnbGVGdWxsc2NyZWVuID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gICBpZiAocGxheWVyLmlzRnVsbHNjcmVlbigpKSB7XG4gICAgLy8gICAgIHBsYXllci5leGl0RnVsbHNjcmVlbigpO1xuICAgIC8vICAgfSBlbHNlIHtcbiAgICAvLyAgICAgcGxheWVyLmVudGVyRnVsbHNjcmVlbigpO1xuICAgIC8vICAgfVxuICAgIC8vIH07XG5cbiAgICAvLyBsZXQgZmlyc3RDbGljayA9IHRydWU7XG4gICAgLy8gbGV0IGNsaWNrVGltZSA9IDA7XG4gICAgLy8gbGV0IGRvdWJsZUNsaWNrVGltZSA9IDA7XG5cbiAgICAvKlxuICAgICAqIFlvdVR1YmUtc3R5bGUgdG9nZ2xlIGJ1dHRvbiBoYW5kbGluZ1xuICAgICAqXG4gICAgICogVGhlIGdvYWwgaXMgdG8gcHJldmVudCBhIHNob3J0IHBhdXNlIG9yIHBsYXliYWNrIGludGVydmFsIGJldHdlZW4gYSBjbGljaywgdGhhdCB0b2dnbGVzIHBsYXliYWNrLCBhbmQgYVxuICAgICAqIGRvdWJsZSBjbGljaywgdGhhdCB0b2dnbGVzIGZ1bGxzY3JlZW4uIEluIHRoaXMgbmFpdmUgYXBwcm9hY2gsIHRoZSBmaXJzdCBjbGljayB3b3VsZCBlLmcuIHN0YXJ0IHBsYXliYWNrLFxuICAgICAqIHRoZSBzZWNvbmQgY2xpY2sgd291bGQgYmUgZGV0ZWN0ZWQgYXMgZG91YmxlIGNsaWNrIGFuZCB0b2dnbGUgdG8gZnVsbHNjcmVlbiwgYW5kIGFzIHNlY29uZCBub3JtYWwgY2xpY2sgc3RvcFxuICAgICAqIHBsYXliYWNrLCB3aGljaCByZXN1bHRzIGlzIGEgc2hvcnQgcGxheWJhY2sgaW50ZXJ2YWwgd2l0aCBtYXggbGVuZ3RoIG9mIHRoZSBkb3VibGUgY2xpY2sgZGV0ZWN0aW9uXG4gICAgICogcGVyaW9kICh1c3VhbGx5IDUwMG1zKS5cbiAgICAgKlxuICAgICAqIFRvIHNvbHZlIHRoaXMgaXNzdWUsIHdlIGRlZmVyIGhhbmRsaW5nIG9mIHRoZSBmaXJzdCBjbGljayBmb3IgMjAwbXMsIHdoaWNoIGlzIGFsbW9zdCB1bm5vdGljZWFibGUgdG8gdGhlIHVzZXIsXG4gICAgICogYW5kIGp1c3QgdG9nZ2xlIHBsYXliYWNrIGlmIG5vIHNlY29uZCBjbGljayAoZG91YmxlIGNsaWNrKSBoYXMgYmVlbiByZWdpc3RlcmVkIGR1cmluZyB0aGlzIHBlcmlvZC4gSWYgYSBkb3VibGVcbiAgICAgKiBjbGljayBpcyByZWdpc3RlcmVkLCB3ZSBqdXN0IHRvZ2dsZSB0aGUgZnVsbHNjcmVlbi4gSW4gdGhlIGZpcnN0IDIwMG1zLCB1bmRlc2lyZWQgcGxheWJhY2sgY2hhbmdlcyB0aHVzIGNhbm5vdFxuICAgICAqIGhhcHBlbi4gSWYgYSBkb3VibGUgY2xpY2sgaXMgcmVnaXN0ZXJlZCB3aXRoaW4gNTAwbXMsIHdlIHVuZG8gdGhlIHBsYXliYWNrIGNoYW5nZSBhbmQgc3dpdGNoIGZ1bGxzY3JlZW4gbW9kZS5cbiAgICAgKiBJbiB0aGUgZW5kLCB0aGlzIG1ldGhvZCBiYXNpY2FsbHkgaW50cm9kdWNlcyBhIDIwMG1zIG9ic2VydmluZyBpbnRlcnZhbCBpbiB3aGljaCBwbGF5YmFjayBjaGFuZ2VzIGFyZSBwcmV2ZW50ZWRcbiAgICAgKiBpZiBhIGRvdWJsZSBjbGljayBoYXBwZW5zLlxuICAgICAqL1xuICAgIHNlbGYub25DbGljay5zdWJzY3JpYmUoZnVuY3Rpb24oKSB7XG4gICAgICAgIHRvZ2dsZVBsYXliYWNrKCk7XG5cbiAgICAgIC8vIERpcmVjdGx5IHN0YXJ0IHBsYXliYWNrIG9uIGZpcnN0IGNsaWNrIG9mIHRoZSBidXR0b24uXG4gICAgICAvLyBUaGlzIGlzIGEgcmVxdWlyZWQgd29ya2Fyb3VuZCBmb3IgbW9iaWxlIGJyb3dzZXJzIHdoZXJlIHZpZGVvIHBsYXliYWNrIG5lZWRzIHRvIGJlIHRyaWdnZXJlZCBkaXJlY3RseVxuICAgICAgLy8gYnkgdGhlIHVzZXIuIEEgZGVmZXJyZWQgcGxheWJhY2sgc3RhcnQgdGhyb3VnaCB0aGUgdGltZW91dCBiZWxvdyBpcyBub3QgY29uc2lkZXJlZCBhcyB1c2VyIGFjdGlvbiBhbmRcbiAgICAgIC8vIHRoZXJlZm9yZSBpZ25vcmVkIGJ5IG1vYmlsZSBicm93c2Vycy5cbiAgICAgIC8vIGlmIChmaXJzdENsaWNrKSB7XG4gICAgICAvLyAgIHRvZ2dsZVBsYXliYWNrKCk7XG4gICAgICAvLyAgIGZpcnN0Q2xpY2sgPSBmYWxzZTtcbiAgICAgIC8vICAgcmV0dXJuO1xuICAgICAgLy8gfVxuICAgICAgLy9cbiAgICAgIC8vIGxldCBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgLy9cbiAgICAgIC8vIGlmIChub3cgLSBjbGlja1RpbWUgPCAyMDApIHtcbiAgICAgIC8vICAgLy8gV2UgaGF2ZSBhIGRvdWJsZSBjbGljayBpbnNpZGUgdGhlIDIwMG1zIGludGVydmFsLCBqdXN0IHRvZ2dsZSBmdWxsc2NyZWVuIG1vZGVcbiAgICAgIC8vICAgdG9nZ2xlRnVsbHNjcmVlbigpO1xuICAgICAgLy8gICBkb3VibGVDbGlja1RpbWUgPSBub3c7XG4gICAgICAvLyAgIHJldHVybjtcbiAgICAgIC8vIH0gZWxzZSBpZiAobm93IC0gY2xpY2tUaW1lIDwgNTAwKSB7XG4gICAgICAvLyAgIC8vIFdlIGhhdmUgYSBkb3VibGUgY2xpY2sgaW5zaWRlIHRoZSA1MDBtcyBpbnRlcnZhbCwgdW5kbyBwbGF5YmFjayB0b2dnbGUgYW5kIHRvZ2dsZSBmdWxsc2NyZWVuIG1vZGVcbiAgICAgIC8vICAgdG9nZ2xlRnVsbHNjcmVlbigpO1xuICAgICAgLy8gICB0b2dnbGVQbGF5YmFjaygpO1xuICAgICAgLy8gICBkb3VibGVDbGlja1RpbWUgPSBub3c7XG4gICAgICAvLyAgIHJldHVybjtcbiAgICAgIC8vIH1cbiAgICAgIC8vXG4gICAgICAvLyBjbGlja1RpbWUgPSBub3c7XG4gICAgICAvL1xuICAgICAgLy8gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIC8vICAgaWYgKERhdGUubm93KCkgLSBkb3VibGVDbGlja1RpbWUgPiAyMDApIHtcbiAgICAgIC8vICAgICAvLyBObyBkb3VibGUgY2xpY2sgZGV0ZWN0ZWQsIHNvIHdlIHRvZ2dsZSBwbGF5YmFjayBhbmQgd2FpdCB3aGF0IGhhcHBlbnMgbmV4dFxuICAgICAgLy8gICAgIHRvZ2dsZVBsYXliYWNrKCk7XG4gICAgICAvLyAgIH1cbiAgICAgIC8vIH0sIDIwMCk7XG4gICAgfSk7XG5cbiAgICAvLyBIaWRlIGJ1dHRvbiB3aGlsZSBpbml0aWFsaXppbmcgYSBDYXN0IHNlc3Npb25cbiAgICBsZXQgY2FzdEluaXRpYWxpemF0aW9uSGFuZGxlciA9IGZ1bmN0aW9uKGV2ZW50OiBQbGF5ZXJFdmVudCkge1xuICAgICAgaWYgKGV2ZW50LnR5cGUgPT09IGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9DQVNUX1NUQVJURUQpIHtcbiAgICAgICAgLy8gSGlkZSBidXR0b24gd2hlbiBzZXNzaW9uIGlzIGJlaW5nIGluaXRpYWxpemVkXG4gICAgICAgIHNlbGYuaGlkZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gU2hvdyBidXR0b24gd2hlbiBzZXNzaW9uIGlzIGVzdGFibGlzaGVkIG9yIGluaXRpYWxpemF0aW9uIHdhcyBhYm9ydGVkXG4gICAgICAgIHNlbGYuc2hvdygpO1xuICAgICAgfVxuICAgIH07XG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fQ0FTVF9TVEFSVCwgY2FzdEluaXRpYWxpemF0aW9uSGFuZGxlcik7XG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fQ0FTVF9TVEFSVEVELCBjYXN0SW5pdGlhbGl6YXRpb25IYW5kbGVyKTtcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9DQVNUX1NUT1BQRUQsIGNhc3RJbml0aWFsaXphdGlvbkhhbmRsZXIpO1xuICB9XG5cbiAgcHJvdGVjdGVkIHRvRG9tRWxlbWVudCgpOiBET00ge1xuICAgIGxldCBidXR0b25FbGVtZW50ID0gc3VwZXIudG9Eb21FbGVtZW50KCk7XG5cbiAgICAvLyBBZGQgY2hpbGQgdGhhdCBjb250YWlucyB0aGUgcGxheSBidXR0b24gaW1hZ2VcbiAgICAvLyBTZXR0aW5nIHRoZSBpbWFnZSBkaXJlY3RseSBvbiB0aGUgYnV0dG9uIGRvZXMgbm90IHdvcmsgdG9nZXRoZXIgd2l0aCBzY2FsaW5nIGFuaW1hdGlvbnMsIGJlY2F1c2UgdGhlIGJ1dHRvblxuICAgIC8vIGNhbiBjb3ZlciB0aGUgd2hvbGUgdmlkZW8gcGxheWVyIGFyZSBhbmQgc2NhbGluZyB3b3VsZCBleHRlbmQgaXQgYmV5b25kLiBCeSBhZGRpbmcgYW4gaW5uZXIgZWxlbWVudCwgY29uZmluZWRcbiAgICAvLyB0byB0aGUgc2l6ZSBpZiB0aGUgaW1hZ2UsIGl0IGNhbiBzY2FsZSBpbnNpZGUgdGhlIHBsYXllciB3aXRob3V0IG92ZXJzaG9vdGluZy5cbiAgICBidXR0b25FbGVtZW50LmFwcGVuZChuZXcgRE9NKCdkaXYnLCB7XG4gICAgICAnY2xhc3MnOiB0aGlzLnByZWZpeENzcygnaW1hZ2UnKVxuICAgIH0pKTtcblxuICAgIHJldHVybiBidXR0b25FbGVtZW50O1xuICB9XG59XG4iLCJpbXBvcnQge0J1dHRvbkNvbmZpZywgQnV0dG9ufSBmcm9tICcuL2J1dHRvbic7XG5pbXBvcnQge0RPTX0gZnJvbSAnLi4vZG9tJztcbmltcG9ydCB7VUlJbnN0YW5jZU1hbmFnZXJ9IGZyb20gJy4uL3VpbWFuYWdlcic7XG5pbXBvcnQgUGxheWVyRXZlbnQgPSBiaXRtb3Zpbi5wbGF5ZXIuUGxheWVyRXZlbnQ7XG5cbi8qKlxuICogQSBidXR0b24gdG8gcGxheS9yZXBsYXkgYSB2aWRlby5cbiAqL1xuZXhwb3J0IGNsYXNzIEh1Z2VSZXBsYXlCdXR0b24gZXh0ZW5kcyBCdXR0b248QnV0dG9uQ29uZmlnPiB7XG5cbiAgY29uc3RydWN0b3IoY29uZmlnOiBCdXR0b25Db25maWcgPSB7fSkge1xuICAgIHN1cGVyKGNvbmZpZyk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IHRoaXMubWVyZ2VDb25maWcoY29uZmlnLCB7XG4gICAgICBjc3NDbGFzczogJ3VpLWh1Z2VyZXBsYXlidXR0b24nLFxuICAgICAgdGV4dDogJ1JlcGxheSdcbiAgICB9LCB0aGlzLmNvbmZpZyk7XG4gIH1cblxuICBjb25maWd1cmUocGxheWVyOiBiaXRtb3Zpbi5wbGF5ZXIuUGxheWVyLCB1aW1hbmFnZXI6IFVJSW5zdGFuY2VNYW5hZ2VyKTogdm9pZCB7XG4gICAgc3VwZXIuY29uZmlndXJlKHBsYXllciwgdWltYW5hZ2VyKTtcblxuICAgIHRoaXMub25DbGljay5zdWJzY3JpYmUoZnVuY3Rpb24oKSB7XG4gICAgICBwbGF5ZXIucGxheSgndWktb3ZlcmxheScpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJvdGVjdGVkIHRvRG9tRWxlbWVudCgpOiBET00ge1xuICAgIGxldCBidXR0b25FbGVtZW50ID0gc3VwZXIudG9Eb21FbGVtZW50KCk7XG5cbiAgICAvLyBBZGQgY2hpbGQgdGhhdCBjb250YWlucyB0aGUgcGxheSBidXR0b24gaW1hZ2VcbiAgICAvLyBTZXR0aW5nIHRoZSBpbWFnZSBkaXJlY3RseSBvbiB0aGUgYnV0dG9uIGRvZXMgbm90IHdvcmsgdG9nZXRoZXIgd2l0aCBzY2FsaW5nIGFuaW1hdGlvbnMsIGJlY2F1c2UgdGhlIGJ1dHRvblxuICAgIC8vIGNhbiBjb3ZlciB0aGUgd2hvbGUgdmlkZW8gcGxheWVyIGFyZSBhbmQgc2NhbGluZyB3b3VsZCBleHRlbmQgaXQgYmV5b25kLiBCeSBhZGRpbmcgYW4gaW5uZXIgZWxlbWVudCwgY29uZmluZWRcbiAgICAvLyB0byB0aGUgc2l6ZSBpZiB0aGUgaW1hZ2UsIGl0IGNhbiBzY2FsZSBpbnNpZGUgdGhlIHBsYXllciB3aXRob3V0IG92ZXJzaG9vdGluZy5cbiAgICBidXR0b25FbGVtZW50LmFwcGVuZChuZXcgRE9NKCdkaXYnLCB7XG4gICAgICAnY2xhc3MnOiB0aGlzLnByZWZpeENzcygnaW1hZ2UnKVxuICAgIH0pKTtcblxuICAgIHJldHVybiBidXR0b25FbGVtZW50O1xuICB9XG59IiwiaW1wb3J0IHtDb21wb25lbnRDb25maWcsIENvbXBvbmVudH0gZnJvbSAnLi9jb21wb25lbnQnO1xuaW1wb3J0IHtET019IGZyb20gJy4uL2RvbSc7XG5pbXBvcnQge0V2ZW50RGlzcGF0Y2hlciwgRXZlbnQsIE5vQXJnc30gZnJvbSAnLi4vZXZlbnRkaXNwYXRjaGVyJztcblxuLyoqXG4gKiBDb25maWd1cmF0aW9uIGludGVyZmFjZSBmb3IgYSB7QGxpbmsgTGFiZWx9IGNvbXBvbmVudC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBMYWJlbENvbmZpZyBleHRlbmRzIENvbXBvbmVudENvbmZpZyB7XG4gIC8qKlxuICAgKiBUaGUgdGV4dCBvbiB0aGUgbGFiZWwuXG4gICAqL1xuICB0ZXh0Pzogc3RyaW5nO1xufVxuXG4vKipcbiAqIEEgc2ltcGxlIHRleHQgbGFiZWwuXG4gKlxuICogRE9NIGV4YW1wbGU6XG4gKiA8Y29kZT5cbiAqICAgICA8c3BhbiBjbGFzcz0ndWktbGFiZWwnPi4uLnNvbWUgdGV4dC4uLjwvc3Bhbj5cbiAqIDwvY29kZT5cbiAqL1xuZXhwb3J0IGNsYXNzIExhYmVsPENvbmZpZyBleHRlbmRzIExhYmVsQ29uZmlnPiBleHRlbmRzIENvbXBvbmVudDxMYWJlbENvbmZpZz4ge1xuXG4gIHByaXZhdGUgbGFiZWxFdmVudHMgPSB7XG4gICAgb25DbGljazogbmV3IEV2ZW50RGlzcGF0Y2hlcjxMYWJlbDxDb25maWc+LCBOb0FyZ3M+KClcbiAgfTtcblxuICBjb25zdHJ1Y3Rvcihjb25maWc6IExhYmVsQ29uZmlnID0ge30pIHtcbiAgICBzdXBlcihjb25maWcpO1xuXG4gICAgdGhpcy5jb25maWcgPSB0aGlzLm1lcmdlQ29uZmlnKGNvbmZpZywge1xuICAgICAgY3NzQ2xhc3M6ICd1aS1sYWJlbCdcbiAgICB9LCB0aGlzLmNvbmZpZyk7XG4gIH1cblxuICBwcm90ZWN0ZWQgdG9Eb21FbGVtZW50KCk6IERPTSB7XG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuXG4gICAgbGV0IGxhYmVsRWxlbWVudCA9IG5ldyBET00oJ3NwYW4nLCB7XG4gICAgICAnaWQnOiB0aGlzLmNvbmZpZy5pZCxcbiAgICAgICdjbGFzcyc6IHRoaXMuZ2V0Q3NzQ2xhc3NlcygpXG4gICAgfSkuaHRtbCh0aGlzLmNvbmZpZy50ZXh0KTtcblxuICAgIGxhYmVsRWxlbWVudC5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYub25DbGlja0V2ZW50KCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbGFiZWxFbGVtZW50O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgdGV4dCBvbiB0aGlzIGxhYmVsLlxuICAgKiBAcGFyYW0gdGV4dFxuICAgKi9cbiAgc2V0VGV4dCh0ZXh0OiBzdHJpbmcpIHtcbiAgICB0aGlzLmdldERvbUVsZW1lbnQoKS5odG1sKHRleHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFycyB0aGUgdGV4dCBvbiB0aGlzIGxhYmVsLlxuICAgKi9cbiAgY2xlYXJUZXh0KCkge1xuICAgIHRoaXMuZ2V0RG9tRWxlbWVudCgpLmh0bWwoJycpO1xuICB9XG5cbiAgcHJvdGVjdGVkIG9uQ2xpY2tFdmVudCgpIHtcbiAgICB0aGlzLmxhYmVsRXZlbnRzLm9uQ2xpY2suZGlzcGF0Y2godGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZXZlbnQgdGhhdCBpcyBmaXJlZCB3aGVuIHRoZSBsYWJlbCBpcyBjbGlja2VkLlxuICAgKiBAcmV0dXJucyB7RXZlbnQ8TGFiZWw8TGFiZWxDb25maWc+LCBOb0FyZ3M+fVxuICAgKi9cbiAgZ2V0IG9uQ2xpY2soKTogRXZlbnQ8TGFiZWw8TGFiZWxDb25maWc+LCBOb0FyZ3M+IHtcbiAgICByZXR1cm4gdGhpcy5sYWJlbEV2ZW50cy5vbkNsaWNrLmdldEV2ZW50KCk7XG4gIH1cbn0iLCJpbXBvcnQge0NvbXBvbmVudCwgQ29tcG9uZW50Q29uZmlnfSBmcm9tICcuL2NvbXBvbmVudCc7XG5pbXBvcnQge0V2ZW50RGlzcGF0Y2hlciwgRXZlbnR9IGZyb20gJy4uL2V2ZW50ZGlzcGF0Y2hlcic7XG5pbXBvcnQge0FycmF5VXRpbHN9IGZyb20gJy4uL3V0aWxzJztcblxuLyoqXG4gKiBBIG1hcCBvZiBpdGVtcyAoa2V5L3ZhbHVlIC0+IGxhYmVsfSBmb3IgYSB7QGxpbmsgTGlzdFNlbGVjdG9yfSBpbiBhIHtAbGluayBMaXN0U2VsZWN0b3JDb25maWd9LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIExpc3RJdGVtIHtcbiAga2V5OiBzdHJpbmc7XG4gIGxhYmVsOiBzdHJpbmc7XG59XG5cbi8qKlxuICogQ29uZmlndXJhdGlvbiBpbnRlcmZhY2UgZm9yIGEge0BsaW5rIExpc3RTZWxlY3Rvcn0uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTGlzdFNlbGVjdG9yQ29uZmlnIGV4dGVuZHMgQ29tcG9uZW50Q29uZmlnIHtcbiAgaXRlbXM/OiBMaXN0SXRlbVtdO1xufVxuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgTGlzdFNlbGVjdG9yPENvbmZpZyBleHRlbmRzIExpc3RTZWxlY3RvckNvbmZpZz4gZXh0ZW5kcyBDb21wb25lbnQ8TGlzdFNlbGVjdG9yQ29uZmlnPiB7XG5cbiAgcHJvdGVjdGVkIGl0ZW1zOiBMaXN0SXRlbVtdO1xuICBwcm90ZWN0ZWQgc2VsZWN0ZWRJdGVtOiBzdHJpbmc7XG5cbiAgcHJpdmF0ZSBsaXN0U2VsZWN0b3JFdmVudHMgPSB7XG4gICAgb25JdGVtQWRkZWQ6IG5ldyBFdmVudERpc3BhdGNoZXI8TGlzdFNlbGVjdG9yPENvbmZpZz4sIHN0cmluZz4oKSxcbiAgICBvbkl0ZW1SZW1vdmVkOiBuZXcgRXZlbnREaXNwYXRjaGVyPExpc3RTZWxlY3RvcjxDb25maWc+LCBzdHJpbmc+KCksXG4gICAgb25JdGVtU2VsZWN0ZWQ6IG5ldyBFdmVudERpc3BhdGNoZXI8TGlzdFNlbGVjdG9yPENvbmZpZz4sIHN0cmluZz4oKVxuICB9O1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogTGlzdFNlbGVjdG9yQ29uZmlnID0ge30pIHtcbiAgICBzdXBlcihjb25maWcpO1xuXG4gICAgdGhpcy5jb25maWcgPSB0aGlzLm1lcmdlQ29uZmlnKGNvbmZpZywge1xuICAgICAgaXRlbXM6IFtdLFxuICAgICAgY3NzQ2xhc3M6ICd1aS1saXN0c2VsZWN0b3InXG4gICAgfSwgdGhpcy5jb25maWcpO1xuXG4gICAgdGhpcy5pdGVtcyA9IHRoaXMuY29uZmlnLml0ZW1zO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRJdGVtSW5kZXgoa2V5OiBzdHJpbmcpOiBudW1iZXIge1xuICAgIGZvciAobGV0IGluZGV4IGluIHRoaXMuaXRlbXMpIHtcbiAgICAgIGlmIChrZXkgPT09IHRoaXMuaXRlbXNbaW5kZXhdLmtleSkge1xuICAgICAgICByZXR1cm4gcGFyc2VJbnQoaW5kZXgpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gLTE7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSBzcGVjaWZpZWQgaXRlbSBpcyBwYXJ0IG9mIHRoaXMgc2VsZWN0b3IuXG4gICAqIEBwYXJhbSBrZXkgdGhlIGtleSBvZiB0aGUgaXRlbSB0byBjaGVja1xuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgaXRlbSBpcyBwYXJ0IG9mIHRoaXMgc2VsZWN0b3IsIGVsc2UgZmFsc2VcbiAgICovXG4gIGhhc0l0ZW0oa2V5OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5nZXRJdGVtSW5kZXgoa2V5KSA+IC0xO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYW4gaXRlbSB0byB0aGlzIHNlbGVjdG9yIGJ5IGFwcGVuZGluZyBpdCB0byB0aGUgZW5kIG9mIHRoZSBsaXN0IG9mIGl0ZW1zLiBJZiBhbiBpdGVtIHdpdGggdGhlIHNwZWNpZmllZFxuICAgKiBrZXkgYWxyZWFkeSBleGlzdHMsIGl0IGlzIHJlcGxhY2VkLlxuICAgKiBAcGFyYW0ga2V5IHRoZSBrZXkgb2YgdGhlIGl0ZW0gdG8gYWRkXG4gICAqIEBwYXJhbSBsYWJlbCB0aGUgKGh1bWFuLXJlYWRhYmxlKSBsYWJlbCBvZiB0aGUgaXRlbSB0byBhZGRcbiAgICovXG4gIGFkZEl0ZW0oa2V5OiBzdHJpbmcsIGxhYmVsOiBzdHJpbmcpIHtcbiAgICB0aGlzLnJlbW92ZUl0ZW0oa2V5KTsgLy8gVHJ5IHRvIHJlbW92ZSBrZXkgZmlyc3QgdG8gZ2V0IG92ZXJ3cml0ZSBiZWhhdmlvciBhbmQgYXZvaWQgZHVwbGljYXRlIGtleXNcbiAgICB0aGlzLml0ZW1zLnB1c2goeyBrZXk6IGtleSwgbGFiZWw6IGxhYmVsIH0pO1xuICAgIHRoaXMub25JdGVtQWRkZWRFdmVudChrZXkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYW4gaXRlbSBmcm9tIHRoaXMgc2VsZWN0b3IuXG4gICAqIEBwYXJhbSBrZXkgdGhlIGtleSBvZiB0aGUgaXRlbSB0byByZW1vdmVcbiAgICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWYgcmVtb3ZhbCB3YXMgc3VjY2Vzc2Z1bCwgZmFsc2UgaWYgdGhlIGl0ZW0gaXMgbm90IHBhcnQgb2YgdGhpcyBzZWxlY3RvclxuICAgKi9cbiAgcmVtb3ZlSXRlbShrZXk6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGxldCBpbmRleCA9IHRoaXMuZ2V0SXRlbUluZGV4KGtleSk7XG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIEFycmF5VXRpbHMucmVtb3ZlKHRoaXMuaXRlbXMsIHRoaXMuaXRlbXNbaW5kZXhdKTtcbiAgICAgIHRoaXMub25JdGVtUmVtb3ZlZEV2ZW50KGtleSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogU2VsZWN0cyBhbiBpdGVtIGZyb20gdGhlIGl0ZW1zIGluIHRoaXMgc2VsZWN0b3IuXG4gICAqIEBwYXJhbSBrZXkgdGhlIGtleSBvZiB0aGUgaXRlbSB0byBzZWxlY3RcbiAgICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaXMgdGhlIHNlbGVjdGlvbiB3YXMgc3VjY2Vzc2Z1bCwgZmFsc2UgaWYgdGhlIHNlbGVjdGVkIGl0ZW0gaXMgbm90IHBhcnQgb2YgdGhlIHNlbGVjdG9yXG4gICAqL1xuICBzZWxlY3RJdGVtKGtleTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaWYgKGtleSA9PT0gdGhpcy5zZWxlY3RlZEl0ZW0pIHtcbiAgICAgIC8vIGl0ZW1Db25maWcgaXMgYWxyZWFkeSBzZWxlY3RlZCwgc3VwcHJlc3MgYW55IGZ1cnRoZXIgYWN0aW9uXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBsZXQgaW5kZXggPSB0aGlzLmdldEl0ZW1JbmRleChrZXkpO1xuXG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIHRoaXMuc2VsZWN0ZWRJdGVtID0ga2V5O1xuICAgICAgdGhpcy5vbkl0ZW1TZWxlY3RlZEV2ZW50KGtleSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUga2V5IG9mIHRoZSBzZWxlY3RlZCBpdGVtLlxuICAgKiBAcmV0dXJucyB7c3RyaW5nfSB0aGUga2V5IG9mIHRoZSBzZWxlY3RlZCBpdGVtIG9yIG51bGwgaWYgbm8gaXRlbSBpcyBzZWxlY3RlZFxuICAgKi9cbiAgZ2V0U2VsZWN0ZWRJdGVtKCk6IHN0cmluZyB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLnNlbGVjdGVkSXRlbTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGFsbCBpdGVtcyBmcm9tIHRoaXMgc2VsZWN0b3IuXG4gICAqL1xuICBjbGVhckl0ZW1zKCkge1xuICAgIGxldCBpdGVtcyA9IHRoaXMuaXRlbXM7IC8vIGxvY2FsIGNvcHkgZm9yIGl0ZXJhdGlvbiBhZnRlciBjbGVhclxuICAgIHRoaXMuaXRlbXMgPSBbXTsgLy8gY2xlYXIgaXRlbXNcblxuICAgIC8vIGZpcmUgZXZlbnRzXG4gICAgZm9yIChsZXQgaXRlbSBvZiBpdGVtcykge1xuICAgICAgdGhpcy5vbkl0ZW1SZW1vdmVkRXZlbnQoaXRlbS5rZXkpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBudW1iZXIgb2YgaXRlbXMgaW4gdGhpcyBzZWxlY3Rvci5cbiAgICogQHJldHVybnMge251bWJlcn1cbiAgICovXG4gIGl0ZW1Db3VudCgpOiBudW1iZXIge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLml0ZW1zKS5sZW5ndGg7XG4gIH1cblxuICBwcm90ZWN0ZWQgb25JdGVtQWRkZWRFdmVudChrZXk6IHN0cmluZykge1xuICAgIHRoaXMubGlzdFNlbGVjdG9yRXZlbnRzLm9uSXRlbUFkZGVkLmRpc3BhdGNoKHRoaXMsIGtleSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgb25JdGVtUmVtb3ZlZEV2ZW50KGtleTogc3RyaW5nKSB7XG4gICAgdGhpcy5saXN0U2VsZWN0b3JFdmVudHMub25JdGVtUmVtb3ZlZC5kaXNwYXRjaCh0aGlzLCBrZXkpO1xuICB9XG5cbiAgcHJvdGVjdGVkIG9uSXRlbVNlbGVjdGVkRXZlbnQoa2V5OiBzdHJpbmcpIHtcbiAgICB0aGlzLmxpc3RTZWxlY3RvckV2ZW50cy5vbkl0ZW1TZWxlY3RlZC5kaXNwYXRjaCh0aGlzLCBrZXkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGV2ZW50IHRoYXQgaXMgZmlyZWQgd2hlbiBhbiBpdGVtIGlzIGFkZGVkIHRvIHRoZSBsaXN0IG9mIGl0ZW1zLlxuICAgKiBAcmV0dXJucyB7RXZlbnQ8TGlzdFNlbGVjdG9yPENvbmZpZz4sIHN0cmluZz59XG4gICAqL1xuICBnZXQgb25JdGVtQWRkZWQoKTogRXZlbnQ8TGlzdFNlbGVjdG9yPENvbmZpZz4sIHN0cmluZz4ge1xuICAgIHJldHVybiB0aGlzLmxpc3RTZWxlY3RvckV2ZW50cy5vbkl0ZW1BZGRlZC5nZXRFdmVudCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGV2ZW50IHRoYXQgaXMgZmlyZWQgd2hlbiBhbiBpdGVtIGlzIHJlbW92ZWQgZnJvbSB0aGUgbGlzdCBvZiBpdGVtcy5cbiAgICogQHJldHVybnMge0V2ZW50PExpc3RTZWxlY3RvcjxDb25maWc+LCBzdHJpbmc+fVxuICAgKi9cbiAgZ2V0IG9uSXRlbVJlbW92ZWQoKTogRXZlbnQ8TGlzdFNlbGVjdG9yPENvbmZpZz4sIHN0cmluZz4ge1xuICAgIHJldHVybiB0aGlzLmxpc3RTZWxlY3RvckV2ZW50cy5vbkl0ZW1SZW1vdmVkLmdldEV2ZW50KCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZXZlbnQgdGhhdCBpcyBmaXJlZCB3aGVuIGFuIGl0ZW0gaXMgc2VsZWN0ZWQgZnJvbSB0aGUgbGlzdCBvZiBpdGVtcy5cbiAgICogQHJldHVybnMge0V2ZW50PExpc3RTZWxlY3RvcjxDb25maWc+LCBzdHJpbmc+fVxuICAgKi9cbiAgZ2V0IG9uSXRlbVNlbGVjdGVkKCk6IEV2ZW50PExpc3RTZWxlY3RvcjxDb25maWc+LCBzdHJpbmc+IHtcbiAgICByZXR1cm4gdGhpcy5saXN0U2VsZWN0b3JFdmVudHMub25JdGVtU2VsZWN0ZWQuZ2V0RXZlbnQoKTtcbiAgfVxufSIsImltcG9ydCB7TGFiZWxDb25maWcsIExhYmVsfSBmcm9tICcuL2xhYmVsJztcbmltcG9ydCB7VUlJbnN0YW5jZU1hbmFnZXJ9IGZyb20gJy4uL3VpbWFuYWdlcic7XG5cbi8qKlxuICogRW51bWVyYXRlcyB0aGUgdHlwZXMgb2YgY29udGVudCB0aGF0IHRoZSB7QGxpbmsgTWV0YWRhdGFMYWJlbH0gY2FuIGRpc3BsYXkuXG4gKi9cbmV4cG9ydCBlbnVtIE1ldGFkYXRhTGFiZWxDb250ZW50IHtcbiAgLyoqXG4gICAqIFRpdGxlIG9mIHRoZSBkYXRhIHNvdXJjZS5cbiAgICovXG4gIFRpdGxlLFxuICAvKipcbiAgICogRGVzY3JpcHRpb24gZm8gdGhlIGRhdGEgc291cmNlLlxuICAgKi9cbiAgRGVzY3JpcHRpb24sXG59XG5cbi8qKlxuICogQ29uZmlndXJhdGlvbiBpbnRlcmZhY2UgZm9yIHtAbGluayBNZXRhZGF0YUxhYmVsfS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBNZXRhZGF0YUxhYmVsQ29uZmlnIGV4dGVuZHMgTGFiZWxDb25maWcge1xuICAvKipcbiAgICogVGhlIHR5cGUgb2YgY29udGVudCB0aGF0IHNob3VsZCBiZSBkaXNwbGF5ZWQgaW4gdGhlIGxhYmVsLlxuICAgKi9cbiAgY29udGVudDogTWV0YWRhdGFMYWJlbENvbnRlbnQ7XG59XG5cbi8qKlxuICogQSBsYWJlbCB0aGF0IGNhbiBiZSBjb25maWd1cmVkIHRvIGRpc3BsYXkgY2VydGFpbiBtZXRhZGF0YS5cbiAqL1xuZXhwb3J0IGNsYXNzIE1ldGFkYXRhTGFiZWwgZXh0ZW5kcyBMYWJlbDxNZXRhZGF0YUxhYmVsQ29uZmlnPiB7XG5cbiAgY29uc3RydWN0b3IoY29uZmlnOiBNZXRhZGF0YUxhYmVsQ29uZmlnKSB7XG4gICAgc3VwZXIoY29uZmlnKTtcblxuICAgIHRoaXMuY29uZmlnID0gdGhpcy5tZXJnZUNvbmZpZyhjb25maWcsIHtcbiAgICAgIGNzc0NsYXNzZXM6IFsnbGFiZWwtbWV0YWRhdGEnLCAnbGFiZWwtbWV0YWRhdGEtJyArIE1ldGFkYXRhTGFiZWxDb250ZW50W2NvbmZpZy5jb250ZW50XS50b0xvd2VyQ2FzZSgpXVxuICAgIH0sIHRoaXMuY29uZmlnKTtcbiAgfVxuXG4gIGNvbmZpZ3VyZShwbGF5ZXI6IGJpdG1vdmluLnBsYXllci5QbGF5ZXIsIHVpbWFuYWdlcjogVUlJbnN0YW5jZU1hbmFnZXIpOiB2b2lkIHtcbiAgICBzdXBlci5jb25maWd1cmUocGxheWVyLCB1aW1hbmFnZXIpO1xuXG4gICAgbGV0IGNvbmZpZyA9IDxNZXRhZGF0YUxhYmVsQ29uZmlnPnRoaXMuZ2V0Q29uZmlnKCk7XG4gICAgbGV0IHVpY29uZmlnID0gdWltYW5hZ2VyLmdldENvbmZpZygpO1xuXG4gICAgc3dpdGNoIChjb25maWcuY29udGVudCkge1xuICAgICAgY2FzZSBNZXRhZGF0YUxhYmVsQ29udGVudC5UaXRsZTpcbiAgICAgICAgaWYgKHVpY29uZmlnICYmIHVpY29uZmlnLm1ldGFkYXRhICYmIHVpY29uZmlnLm1ldGFkYXRhLnRpdGxlKSB7XG4gICAgICAgICAgdGhpcy5zZXRUZXh0KHVpY29uZmlnLm1ldGFkYXRhLnRpdGxlKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgTWV0YWRhdGFMYWJlbENvbnRlbnQuRGVzY3JpcHRpb246XG4gICAgICAgIGlmICh1aWNvbmZpZyAmJiB1aWNvbmZpZy5tZXRhZGF0YSAmJiB1aWNvbmZpZy5tZXRhZGF0YS5kZXNjcmlwdGlvbikge1xuICAgICAgICAgIHRoaXMuc2V0VGV4dCh1aWNvbmZpZy5tZXRhZGF0YS5kZXNjcmlwdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG59IiwiaW1wb3J0IHtTZWxlY3RCb3h9IGZyb20gJy4vc2VsZWN0Ym94JztcbmltcG9ydCB7TGlzdFNlbGVjdG9yQ29uZmlnfSBmcm9tICcuL2xpc3RzZWxlY3Rvcic7XG5pbXBvcnQge1VJSW5zdGFuY2VNYW5hZ2VyfSBmcm9tICcuLi91aW1hbmFnZXInO1xuXG4vKipcbiAqIEEgc2VsZWN0IGJveCBwcm92aWRpbmcgYSBzZWxlY3Rpb24gb2YgZGlmZmVyZW50IHBsYXliYWNrIHNwZWVkcy5cbiAqL1xuZXhwb3J0IGNsYXNzIFBsYXliYWNrU3BlZWRTZWxlY3RCb3ggZXh0ZW5kcyBTZWxlY3RCb3gge1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogTGlzdFNlbGVjdG9yQ29uZmlnID0ge30pIHtcbiAgICBzdXBlcihjb25maWcpO1xuICB9XG5cbiAgY29uZmlndXJlKHBsYXllcjogYml0bW92aW4ucGxheWVyLlBsYXllciwgdWltYW5hZ2VyOiBVSUluc3RhbmNlTWFuYWdlcik6IHZvaWQge1xuICAgIHN1cGVyLmNvbmZpZ3VyZShwbGF5ZXIsIHVpbWFuYWdlcik7XG5cbiAgICBsZXQgc2VsZiA9IHRoaXM7XG5cbiAgICBzZWxmLmFkZEl0ZW0oJzAuMjUnLCAnMC4yNXgnKTtcbiAgICBzZWxmLmFkZEl0ZW0oJzAuNScsICcwLjV4Jyk7XG4gICAgc2VsZi5hZGRJdGVtKCcxJywgJ05vcm1hbCcpO1xuICAgIHNlbGYuYWRkSXRlbSgnMS41JywgJzEuNXgnKTtcbiAgICBzZWxmLmFkZEl0ZW0oJzInLCAnMngnKTtcblxuICAgIHNlbGYuc2VsZWN0SXRlbSgnMScpO1xuXG5cbiAgICBzZWxmLm9uSXRlbVNlbGVjdGVkLnN1YnNjcmliZShmdW5jdGlvbihzZW5kZXI6IFBsYXliYWNrU3BlZWRTZWxlY3RCb3gsIHZhbHVlOiBzdHJpbmcpIHtcbiAgICAgIHBsYXllci5zZXRQbGF5YmFja1NwZWVkKHBhcnNlRmxvYXQodmFsdWUpKTtcbiAgICB9KTtcbiAgfVxufSIsImltcG9ydCB7TGFiZWxDb25maWcsIExhYmVsfSBmcm9tICcuL2xhYmVsJztcbmltcG9ydCB7VUlJbnN0YW5jZU1hbmFnZXJ9IGZyb20gJy4uL3VpbWFuYWdlcic7XG5pbXBvcnQge1N0cmluZ1V0aWxzfSBmcm9tICcuLi91dGlscyc7XG5cbmV4cG9ydCBlbnVtIFRpbWVMYWJlbE1vZGUge1xuICBDdXJyZW50VGltZSxcbiAgVG90YWxUaW1lLFxuICBDdXJyZW50QW5kVG90YWxUaW1lLFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBsYXliYWNrVGltZUxhYmVsQ29uZmlnIGV4dGVuZHMgTGFiZWxDb25maWcge1xuICB0aW1lTGFiZWxNb2RlPzogVGltZUxhYmVsTW9kZTtcbiAgaGlkZUluTGl2ZVBsYXliYWNrPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBBIGxhYmVsIHRoYXQgZGlzcGxheSB0aGUgY3VycmVudCBwbGF5YmFjayB0aW1lIGFuZCB0aGUgdG90YWwgdGltZSB0aHJvdWdoIHtAbGluayBQbGF5YmFja1RpbWVMYWJlbCNzZXRUaW1lIHNldFRpbWV9XG4gKiBvciBhbnkgc3RyaW5nIHRocm91Z2gge0BsaW5rIFBsYXliYWNrVGltZUxhYmVsI3NldFRleHQgc2V0VGV4dH0uXG4gKi9cbmV4cG9ydCBjbGFzcyBQbGF5YmFja1RpbWVMYWJlbCBleHRlbmRzIExhYmVsPFBsYXliYWNrVGltZUxhYmVsQ29uZmlnPiB7XG5cbiAgcHJpdmF0ZSB0aW1lRm9ybWF0OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoY29uZmlnOiBQbGF5YmFja1RpbWVMYWJlbENvbmZpZyA9IHt9KSB7XG4gICAgc3VwZXIoY29uZmlnKTtcblxuICAgIHRoaXMuY29uZmlnID0gdGhpcy5tZXJnZUNvbmZpZyhjb25maWcsIDxQbGF5YmFja1RpbWVMYWJlbENvbmZpZz57XG4gICAgICBjc3NDbGFzczogJ3VpLXBsYXliYWNrdGltZWxhYmVsJyxcbiAgICAgIHRpbWVMYWJlbE1vZGU6IFRpbWVMYWJlbE1vZGUuQ3VycmVudEFuZFRvdGFsVGltZSxcbiAgICAgIGhpZGVJbkxpdmVQbGF5YmFjazogZmFsc2UsXG4gICAgfSwgdGhpcy5jb25maWcpO1xuICB9XG5cbiAgY29uZmlndXJlKHBsYXllcjogYml0bW92aW4ucGxheWVyLlBsYXllciwgdWltYW5hZ2VyOiBVSUluc3RhbmNlTWFuYWdlcik6IHZvaWQge1xuICAgIHN1cGVyLmNvbmZpZ3VyZShwbGF5ZXIsIHVpbWFuYWdlcik7XG5cbiAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgbGV0IGNvbmZpZyA9IDxQbGF5YmFja1RpbWVMYWJlbENvbmZpZz5zZWxmLmdldENvbmZpZygpO1xuICAgIGxldCBsaXZlID0gZmFsc2U7XG4gICAgbGV0IGxpdmVDc3NDbGFzcyA9IHNlbGYucHJlZml4Q3NzKCd1aS1wbGF5YmFja3RpbWVsYWJlbC1saXZlJyk7XG4gICAgbGV0IGxpdmVFZGdlQ3NzQ2xhc3MgPSBzZWxmLnByZWZpeENzcygndWktcGxheWJhY2t0aW1lbGFiZWwtbGl2ZS1lZGdlJyk7XG4gICAgbGV0IG1pbldpZHRoID0gMDtcblxuICAgIGxldCBsaXZlQ2xpY2tIYW5kbGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICBwbGF5ZXIudGltZVNoaWZ0KDApO1xuICAgIH07XG5cbiAgICBsZXQgdXBkYXRlTGl2ZVN0YXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAvLyBQbGF5ZXIgaXMgcGxheWluZyBhIGxpdmUgc3RyZWFtIHdoZW4gdGhlIGR1cmF0aW9uIGlzIGluZmluaXRlXG4gICAgICBsaXZlID0gKHBsYXllci5nZXREdXJhdGlvbigpID09PSBJbmZpbml0eSk7XG5cbiAgICAgIC8vIEF0dGFjaC9kZXRhY2ggbGl2ZSBtYXJrZXIgY2xhc3NcbiAgICAgIGlmIChsaXZlKSB7XG4gICAgICAgIHNlbGYuZ2V0RG9tRWxlbWVudCgpLmFkZENsYXNzKGxpdmVDc3NDbGFzcyk7XG4gICAgICAgIHNlbGYuc2V0VGV4dCgnTGl2ZScpO1xuICAgICAgICBpZiAoY29uZmlnLmhpZGVJbkxpdmVQbGF5YmFjaykge1xuICAgICAgICAgIHNlbGYuaGlkZSgpO1xuICAgICAgICB9XG4gICAgICAgIHNlbGYub25DbGljay5zdWJzY3JpYmUobGl2ZUNsaWNrSGFuZGxlcik7XG4gICAgICAgIHVwZGF0ZUxpdmVUaW1lc2hpZnRTdGF0ZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2VsZi5nZXREb21FbGVtZW50KCkucmVtb3ZlQ2xhc3MobGl2ZUNzc0NsYXNzKTtcbiAgICAgICAgc2VsZi5nZXREb21FbGVtZW50KCkucmVtb3ZlQ2xhc3MobGl2ZUVkZ2VDc3NDbGFzcyk7XG4gICAgICAgIHNlbGYuc2hvdygpO1xuICAgICAgICBzZWxmLm9uQ2xpY2sudW5zdWJzY3JpYmUobGl2ZUNsaWNrSGFuZGxlcik7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGxldCB1cGRhdGVMaXZlVGltZXNoaWZ0U3RhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChwbGF5ZXIuZ2V0VGltZVNoaWZ0KCkgPT09IDApIHtcbiAgICAgICAgc2VsZi5nZXREb21FbGVtZW50KCkuYWRkQ2xhc3MobGl2ZUVkZ2VDc3NDbGFzcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZWxmLmdldERvbUVsZW1lbnQoKS5yZW1vdmVDbGFzcyhsaXZlRWRnZUNzc0NsYXNzKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgbGV0IHBsYXliYWNrVGltZUhhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICgocGxheWVyLmdldER1cmF0aW9uKCkgPT09IEluZmluaXR5KSAhPT0gbGl2ZSkge1xuICAgICAgICB1cGRhdGVMaXZlU3RhdGUoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFsaXZlKSB7XG4gICAgICAgIHNlbGYuc2V0VGltZShwbGF5ZXIuZ2V0Q3VycmVudFRpbWUoKSwgcGxheWVyLmdldER1cmF0aW9uKCkpO1xuICAgICAgfVxuXG4gICAgICAvLyBUbyBhdm9pZCAnanVtcGluZycgaW4gdGhlIFVJIGJ5IHZhcnlpbmcgbGFiZWwgc2l6ZXMgZHVlIHRvIG5vbi1tb25vc3BhY2VkIGZvbnRzLFxuICAgICAgLy8gd2UgZ3JhZHVhbGx5IGluY3JlYXNlIHRoZSBtaW4td2lkdGggd2l0aCB0aGUgY29udGVudCB0byByZWFjaCBhIHN0YWJsZSBzaXplLlxuICAgICAgbGV0IHdpZHRoID0gc2VsZi5nZXREb21FbGVtZW50KCkud2lkdGgoKTtcbiAgICAgIGlmICh3aWR0aCA+IG1pbldpZHRoKSB7XG4gICAgICAgIG1pbldpZHRoID0gd2lkdGg7XG4gICAgICAgIHNlbGYuZ2V0RG9tRWxlbWVudCgpLmNzcyh7XG4gICAgICAgICAgJ21pbi13aWR0aCc6IG1pbldpZHRoICsgJ3B4J1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fVElNRV9DSEFOR0VELCBwbGF5YmFja1RpbWVIYW5kbGVyKTtcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9TRUVLRUQsIHBsYXliYWNrVGltZUhhbmRsZXIpO1xuICAgIHBsYXllci5hZGRFdmVudEhhbmRsZXIoYml0bW92aW4ucGxheWVyLkVWRU5ULk9OX0NBU1RfVElNRV9VUERBVEVELCBwbGF5YmFja1RpbWVIYW5kbGVyKTtcblxuICAgIHBsYXllci5hZGRFdmVudEhhbmRsZXIoYml0bW92aW4ucGxheWVyLkVWRU5ULk9OX1RJTUVfU0hJRlQsIHVwZGF0ZUxpdmVUaW1lc2hpZnRTdGF0ZSk7XG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fVElNRV9TSElGVEVELCB1cGRhdGVMaXZlVGltZXNoaWZ0U3RhdGUpO1xuXG4gICAgbGV0IGluaXQgPSBmdW5jdGlvbigpIHtcbiAgICAgIC8vIFJlc2V0IG1pbi13aWR0aCB3aGVuIGEgbmV3IHNvdXJjZSBpcyByZWFkeSAoZXNwZWNpYWxseSBmb3Igc3dpdGNoaW5nIFZPRC9MaXZlIG1vZGVzIHdoZXJlIHRoZSBsYWJlbCBjb250ZW50XG4gICAgICAvLyBjaGFuZ2VzKVxuICAgICAgbWluV2lkdGggPSAwO1xuICAgICAgc2VsZi5nZXREb21FbGVtZW50KCkuY3NzKHtcbiAgICAgICAgJ21pbi13aWR0aCc6IG51bGxcbiAgICAgIH0pO1xuXG4gICAgICAvLyBTZXQgdGltZSBmb3JtYXQgZGVwZW5kaW5nIG9uIHNvdXJjZSBkdXJhdGlvblxuICAgICAgc2VsZi50aW1lRm9ybWF0ID0gTWF0aC5hYnMocGxheWVyLmlzTGl2ZSgpID8gcGxheWVyLmdldE1heFRpbWVTaGlmdCgpIDogcGxheWVyLmdldER1cmF0aW9uKCkpID49IDM2MDAgP1xuICAgICAgICBTdHJpbmdVdGlscy5GT1JNQVRfSEhNTVNTIDogU3RyaW5nVXRpbHMuRk9STUFUX01NU1M7XG5cbiAgICAgIC8vIFVwZGF0ZSB0aW1lIGFmdGVyIHRoZSBmb3JtYXQgaGFzIGJlZW4gc2V0XG4gICAgICBwbGF5YmFja1RpbWVIYW5kbGVyKCk7XG4gICAgfTtcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9SRUFEWSwgaW5pdCk7XG5cbiAgICBpbml0KCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgY3VycmVudCBwbGF5YmFjayB0aW1lIGFuZCB0b3RhbCBkdXJhdGlvbi5cbiAgICogQHBhcmFtIHBsYXliYWNrU2Vjb25kcyB0aGUgY3VycmVudCBwbGF5YmFjayB0aW1lIGluIHNlY29uZHNcbiAgICogQHBhcmFtIGR1cmF0aW9uU2Vjb25kcyB0aGUgdG90YWwgZHVyYXRpb24gaW4gc2Vjb25kc1xuICAgKi9cbiAgc2V0VGltZShwbGF5YmFja1NlY29uZHM6IG51bWJlciwgZHVyYXRpb25TZWNvbmRzOiBudW1iZXIpIHtcbiAgICBsZXQgY3VycmVudFRpbWUgPSBTdHJpbmdVdGlscy5zZWNvbmRzVG9UaW1lKHBsYXliYWNrU2Vjb25kcywgdGhpcy50aW1lRm9ybWF0KTtcbiAgICBsZXQgdG90YWxUaW1lID0gU3RyaW5nVXRpbHMuc2Vjb25kc1RvVGltZShkdXJhdGlvblNlY29uZHMsIHRoaXMudGltZUZvcm1hdCk7XG5cbiAgICBzd2l0Y2ggKCg8UGxheWJhY2tUaW1lTGFiZWxDb25maWc+dGhpcy5jb25maWcpLnRpbWVMYWJlbE1vZGUpIHtcbiAgICAgIGNhc2UgVGltZUxhYmVsTW9kZS5DdXJyZW50VGltZTpcbiAgICAgICAgdGhpcy5zZXRUZXh0KGAke2N1cnJlbnRUaW1lfWApO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgVGltZUxhYmVsTW9kZS5Ub3RhbFRpbWU6XG4gICAgICAgIHRoaXMuc2V0VGV4dChgJHt0b3RhbFRpbWV9YCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBUaW1lTGFiZWxNb2RlLkN1cnJlbnRBbmRUb3RhbFRpbWU6XG4gICAgICAgIHRoaXMuc2V0VGV4dChgJHtjdXJyZW50VGltZX0gLyAke3RvdGFsVGltZX1gKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG59IiwiaW1wb3J0IHtUb2dnbGVCdXR0b24sIFRvZ2dsZUJ1dHRvbkNvbmZpZ30gZnJvbSAnLi90b2dnbGVidXR0b24nO1xuaW1wb3J0IHtVSUluc3RhbmNlTWFuYWdlcn0gZnJvbSAnLi4vdWltYW5hZ2VyJztcbmltcG9ydCBQbGF5ZXJFdmVudCA9IGJpdG1vdmluLnBsYXllci5QbGF5ZXJFdmVudDtcblxuLyoqXG4gKiBBIGJ1dHRvbiB0aGF0IHRvZ2dsZXMgYmV0d2VlbiBwbGF5YmFjayBhbmQgcGF1c2UuXG4gKi9cbmV4cG9ydCBjbGFzcyBQbGF5YmFja1RvZ2dsZUJ1dHRvbiBleHRlbmRzIFRvZ2dsZUJ1dHRvbjxUb2dnbGVCdXR0b25Db25maWc+IHtcblxuICBjb25zdHJ1Y3Rvcihjb25maWc6IFRvZ2dsZUJ1dHRvbkNvbmZpZyA9IHt9KSB7XG4gICAgc3VwZXIoY29uZmlnKTtcblxuICAgIHRoaXMuY29uZmlnID0gdGhpcy5tZXJnZUNvbmZpZyhjb25maWcsIHtcbiAgICAgIGNzc0NsYXNzOiAndWktcGxheWJhY2t0b2dnbGVidXR0b24nLFxuICAgICAgdGV4dDogJ1BsYXkvUGF1c2UnXG4gICAgfSwgdGhpcy5jb25maWcpO1xuICB9XG5cbiAgY29uZmlndXJlKHBsYXllcjogYml0bW92aW4ucGxheWVyLlBsYXllciwgdWltYW5hZ2VyOiBVSUluc3RhbmNlTWFuYWdlciwgaGFuZGxlQ2xpY2tFdmVudDogYm9vbGVhbiA9IHRydWUpOiB2b2lkIHtcbiAgICBzdXBlci5jb25maWd1cmUocGxheWVyLCB1aW1hbmFnZXIpO1xuXG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgIGxldCBpc1NlZWtpbmcgPSBmYWxzZTtcblxuICAgIC8vIEhhbmRsZXIgdG8gdXBkYXRlIGJ1dHRvbiBzdGF0ZSBiYXNlZCBvbiBwbGF5ZXIgc3RhdGVcbiAgICBsZXQgcGxheWJhY2tTdGF0ZUhhbmRsZXIgPSBmdW5jdGlvbihldmVudDogUGxheWVyRXZlbnQpIHtcbiAgICAgIC8vIElmIHRoZSBVSSBpcyBjdXJyZW50bHkgc2Vla2luZywgcGxheWJhY2sgaXMgdGVtcG9yYXJpbHkgc3RvcHBlZCBidXQgdGhlIGJ1dHRvbnMgc2hvdWxkXG4gICAgICAvLyBub3QgcmVmbGVjdCB0aGF0IGFuZCBzdGF5IGFzLWlzIChlLmcgaW5kaWNhdGUgcGxheWJhY2sgd2hpbGUgc2Vla2luZykuXG4gICAgICBpZiAoaXNTZWVraW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gVE9ETyByZXBsYWNlIHRoaXMgaGFjayB3aXRoIGEgc29sZSBwbGF5ZXIuaXNQbGF5aW5nKCkgY2FsbCBvbmNlIGlzc3VlICMxMjAzIGlzIGZpeGVkXG4gICAgICBsZXQgaXNQbGF5aW5nID0gcGxheWVyLmlzUGxheWluZygpO1xuICAgICAgaWYgKHBsYXllci5pc0Nhc3RpbmcoKSAmJiBldmVudCAmJlxuICAgICAgICAoZXZlbnQudHlwZSA9PT0gYml0bW92aW4ucGxheWVyLkVWRU5ULk9OX1BMQVlcbiAgICAgICAgfHwgZXZlbnQudHlwZSA9PT0gYml0bW92aW4ucGxheWVyLkVWRU5ULk9OX1BBVVNFRFxuICAgICAgICB8fCBldmVudC50eXBlID09PSBiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fQ0FTVF9QTEFZSU5HXG4gICAgICAgIHx8IGV2ZW50LnR5cGUgPT09IGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9DQVNUX1BBVVNFRCkpIHtcbiAgICAgICAgaXNQbGF5aW5nID0gIWlzUGxheWluZztcbiAgICAgIH1cblxuICAgICAgaWYgKGlzUGxheWluZykge1xuICAgICAgICBzZWxmLm9uKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZWxmLm9mZigpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBDYWxsIGhhbmRsZXIgdXBvbiB0aGVzZSBldmVudHNcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9QTEFZLCBwbGF5YmFja1N0YXRlSGFuZGxlcik7XG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fUEFVU0VELCBwbGF5YmFja1N0YXRlSGFuZGxlcik7XG4gICAgLy8gd2hlbiBwbGF5YmFjayBmaW5pc2hlcywgcGxheWVyIHR1cm5zIHRvIHBhdXNlZCBtb2RlXG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fUExBWUJBQ0tfRklOSVNIRUQsIHBsYXliYWNrU3RhdGVIYW5kbGVyKTtcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9DQVNUX1NUQVJURUQsIHBsYXliYWNrU3RhdGVIYW5kbGVyKTtcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9DQVNUX1BMQVlJTkcsIHBsYXliYWNrU3RhdGVIYW5kbGVyKTtcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9DQVNUX1BBVVNFRCwgcGxheWJhY2tTdGF0ZUhhbmRsZXIpO1xuICAgIHBsYXllci5hZGRFdmVudEhhbmRsZXIoYml0bW92aW4ucGxheWVyLkVWRU5ULk9OX0NBU1RfUExBWUJBQ0tfRklOSVNIRUQsIHBsYXliYWNrU3RhdGVIYW5kbGVyKTtcblxuICAgIGlmIChoYW5kbGVDbGlja0V2ZW50KSB7XG4gICAgICAvLyBDb250cm9sIHBsYXllciBieSBidXR0b24gZXZlbnRzXG4gICAgICAvLyBXaGVuIGEgYnV0dG9uIGV2ZW50IHRyaWdnZXJzIGEgcGxheWVyIEFQSSBjYWxsLCBldmVudHMgYXJlIGZpcmVkIHdoaWNoIGluIHR1cm4gY2FsbCB0aGUgZXZlbnQgaGFuZGxlclxuICAgICAgLy8gYWJvdmUgdGhhdCB1cGRhdGVkIHRoZSBidXR0b24gc3RhdGUuXG4gICAgICBzZWxmLm9uQ2xpY2suc3Vic2NyaWJlKGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAocGxheWVyLmlzUGxheWluZygpKSB7XG4gICAgICAgICAgcGxheWVyLnBhdXNlKCd1aS1idXR0b24nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwbGF5ZXIucGxheSgndWktYnV0dG9uJyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFRyYWNrIFVJIHNlZWtpbmcgc3RhdHVzXG4gICAgdWltYW5hZ2VyLm9uU2Vlay5zdWJzY3JpYmUoZnVuY3Rpb24oKSB7XG4gICAgICBpc1NlZWtpbmcgPSB0cnVlO1xuICAgIH0pO1xuICAgIHVpbWFuYWdlci5vblNlZWtlZC5zdWJzY3JpYmUoZnVuY3Rpb24oKSB7XG4gICAgICBpc1NlZWtpbmcgPSBmYWxzZTtcbiAgICB9KTtcblxuICAgIC8vIFN0YXJ0dXAgaW5pdFxuICAgIHBsYXliYWNrU3RhdGVIYW5kbGVyKG51bGwpO1xuICB9XG59IiwiaW1wb3J0IHtDb250YWluZXIsIENvbnRhaW5lckNvbmZpZ30gZnJvbSAnLi9jb250YWluZXInO1xuaW1wb3J0IHtIdWdlUGxheWJhY2tUb2dnbGVCdXR0b259IGZyb20gJy4vaHVnZXBsYXliYWNrdG9nZ2xlYnV0dG9uJztcblxuLyoqXG4gKiBPdmVybGF5cyB0aGUgcGxheWVyIGFuZCBkaXNwbGF5cyBlcnJvciBtZXNzYWdlcy5cbiAqL1xuZXhwb3J0IGNsYXNzIFBsYXliYWNrVG9nZ2xlT3ZlcmxheSBleHRlbmRzIENvbnRhaW5lcjxDb250YWluZXJDb25maWc+IHtcblxuICBwcml2YXRlIHBsYXliYWNrVG9nZ2xlQnV0dG9uOiBIdWdlUGxheWJhY2tUb2dnbGVCdXR0b247XG5cbiAgY29uc3RydWN0b3IoY29uZmlnOiBDb250YWluZXJDb25maWcgPSB7fSkge1xuICAgIHN1cGVyKGNvbmZpZyk7XG5cbiAgICB0aGlzLnBsYXliYWNrVG9nZ2xlQnV0dG9uID0gbmV3IEh1Z2VQbGF5YmFja1RvZ2dsZUJ1dHRvbigpO1xuXG4gICAgdGhpcy5jb25maWcgPSB0aGlzLm1lcmdlQ29uZmlnKGNvbmZpZywge1xuICAgICAgY3NzQ2xhc3M6ICd1aS1wbGF5YmFja3RvZ2dsZS1vdmVybGF5JyxcbiAgICAgIGNvbXBvbmVudHM6IFt0aGlzLnBsYXliYWNrVG9nZ2xlQnV0dG9uXVxuICAgIH0sIHRoaXMuY29uZmlnKTtcbiAgfVxufSIsImltcG9ydCB7Q29udGFpbmVyQ29uZmlnLCBDb250YWluZXJ9IGZyb20gJy4vY29udGFpbmVyJztcbmltcG9ydCB7Q29tcG9uZW50LCBDb21wb25lbnRDb25maWd9IGZyb20gJy4vY29tcG9uZW50JztcbmltcG9ydCB7RE9NfSBmcm9tICcuLi9kb20nO1xuaW1wb3J0IHtVSUluc3RhbmNlTWFuYWdlciwgVUlSZWNvbW1lbmRhdGlvbkNvbmZpZ30gZnJvbSAnLi4vdWltYW5hZ2VyJztcbmltcG9ydCB7U3RyaW5nVXRpbHN9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCB7SHVnZVJlcGxheUJ1dHRvbn0gZnJvbSAnLi9odWdlcmVwbGF5YnV0dG9uJztcblxuLyoqXG4gKiBPdmVybGF5cyB0aGUgcGxheWVyIGFuZCBkaXNwbGF5cyByZWNvbW1lbmRlZCB2aWRlb3MuXG4gKi9cbmV4cG9ydCBjbGFzcyBSZWNvbW1lbmRhdGlvbk92ZXJsYXkgZXh0ZW5kcyBDb250YWluZXI8Q29udGFpbmVyQ29uZmlnPiB7XG5cbiAgcHJpdmF0ZSByZXBsYXlCdXR0b246IEh1Z2VSZXBsYXlCdXR0b247XG5cbiAgY29uc3RydWN0b3IoY29uZmlnOiBDb250YWluZXJDb25maWcgPSB7fSkge1xuICAgIHN1cGVyKGNvbmZpZyk7XG5cbiAgICB0aGlzLnJlcGxheUJ1dHRvbiA9IG5ldyBIdWdlUmVwbGF5QnV0dG9uKCk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IHRoaXMubWVyZ2VDb25maWcoY29uZmlnLCB7XG4gICAgICBjc3NDbGFzczogJ3VpLXJlY29tbWVuZGF0aW9uLW92ZXJsYXknLFxuICAgICAgaGlkZGVuOiB0cnVlLFxuICAgICAgY29tcG9uZW50czogW3RoaXMucmVwbGF5QnV0dG9uXVxuICAgIH0sIHRoaXMuY29uZmlnKTtcbiAgfVxuXG4gIGNvbmZpZ3VyZShwbGF5ZXI6IGJpdG1vdmluLnBsYXllci5QbGF5ZXIsIHVpbWFuYWdlcjogVUlJbnN0YW5jZU1hbmFnZXIpOiB2b2lkIHtcbiAgICBzdXBlci5jb25maWd1cmUocGxheWVyLCB1aW1hbmFnZXIpO1xuXG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuXG4gICAgaWYgKHVpbWFuYWdlci5nZXRDb25maWcoKS5yZWNvbW1lbmRhdGlvbnMgJiYgdWltYW5hZ2VyLmdldENvbmZpZygpLnJlY29tbWVuZGF0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICBsZXQgaW5kZXggPSAxO1xuICAgICAgZm9yIChsZXQgaXRlbSBvZiB1aW1hbmFnZXIuZ2V0Q29uZmlnKCkucmVjb21tZW5kYXRpb25zKSB7XG4gICAgICAgIHRoaXMuYWRkQ29tcG9uZW50KG5ldyBSZWNvbW1lbmRhdGlvbkl0ZW0oe1xuICAgICAgICAgIGl0ZW1Db25maWc6IGl0ZW0sXG4gICAgICAgICAgY3NzQ2xhc3NlczogWydyZWNvbW1lbmRhdGlvbi1pdGVtLScgKyAoaW5kZXgrKyldXG4gICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICAgIHRoaXMudXBkYXRlQ29tcG9uZW50cygpOyAvLyBjcmVhdGUgY29udGFpbmVyIERPTSBlbGVtZW50c1xuXG4gICAgICB0aGlzLmdldERvbUVsZW1lbnQoKS5hZGRDbGFzcyh0aGlzLnByZWZpeENzcygncmVjb21tZW5kYXRpb25zJykpO1xuICAgIH1cblxuICAgIC8vIERpc3BsYXkgcmVjb21tZW5kYXRpb25zIHdoZW4gcGxheWJhY2sgaGFzIGZpbmlzaGVkXG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fUExBWUJBQ0tfRklOSVNIRUQsIGZ1bmN0aW9uKCkge1xuICAgICAgLy8gRGlzbWlzcyBPTl9QTEFZQkFDS19GSU5JU0hFRCBldmVudHMgYXQgdGhlIGVuZCBvZiBhZHNcbiAgICAgIC8vIFRPRE8gcmVtb3ZlIHRoaXMgd29ya2Fyb3VuZCBvbmNlIGlzc3VlICMxMjc4IGlzIHNvbHZlZFxuICAgICAgaWYgKHBsYXllci5pc0FkKCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBzZWxmLnNob3coKTtcbiAgICB9KTtcbiAgICAvLyBIaWRlIHJlY29tbWVuZGF0aW9ucyB3aGVuIHBsYXliYWNrIHN0YXJ0cywgZS5nLiBhIHJlc3RhcnRcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9QTEFZLCBmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYuaGlkZSgpO1xuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogQ29uZmlndXJhdGlvbiBpbnRlcmZhY2UgZm9yIHRoZSB7QGxpbmsgUmVjb21tZW5kYXRpb25JdGVtfVxuICovXG5pbnRlcmZhY2UgUmVjb21tZW5kYXRpb25JdGVtQ29uZmlnIGV4dGVuZHMgQ29tcG9uZW50Q29uZmlnIHtcbiAgaXRlbUNvbmZpZzogVUlSZWNvbW1lbmRhdGlvbkNvbmZpZztcbn1cblxuLyoqXG4gKiBBbiBpdGVtIG9mIHRoZSB7QGxpbmsgUmVjb21tZW5kYXRpb25PdmVybGF5fS4gVXNlZCBvbmx5IGludGVybmFsbHkgaW4ge0BsaW5rIFJlY29tbWVuZGF0aW9uT3ZlcmxheX0uXG4gKi9cbmNsYXNzIFJlY29tbWVuZGF0aW9uSXRlbSBleHRlbmRzIENvbXBvbmVudDxSZWNvbW1lbmRhdGlvbkl0ZW1Db25maWc+IHtcblxuICBjb25zdHJ1Y3Rvcihjb25maWc6IFJlY29tbWVuZGF0aW9uSXRlbUNvbmZpZykge1xuICAgIHN1cGVyKGNvbmZpZyk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IHRoaXMubWVyZ2VDb25maWcoY29uZmlnLCB7XG4gICAgICBjc3NDbGFzczogJ3VpLXJlY29tbWVuZGF0aW9uLWl0ZW0nLFxuICAgICAgaXRlbUNvbmZpZzogbnVsbCAvLyB0aGlzIG11c3QgYmUgcGFzc2VkIGluIGZyb20gb3V0c2lkZVxuICAgIH0sIHRoaXMuY29uZmlnKTtcbiAgfVxuXG4gIHByb3RlY3RlZCB0b0RvbUVsZW1lbnQoKTogRE9NIHtcbiAgICBsZXQgY29uZmlnID0gKDxSZWNvbW1lbmRhdGlvbkl0ZW1Db25maWc+dGhpcy5jb25maWcpLml0ZW1Db25maWc7IC8vIFRPRE8gZml4IGdlbmVyaWNzIGFuZCBnZXQgcmlkIG9mIGNhc3RcblxuICAgIGxldCBpdGVtRWxlbWVudCA9IG5ldyBET00oJ2EnLCB7XG4gICAgICAnaWQnOiB0aGlzLmNvbmZpZy5pZCxcbiAgICAgICdjbGFzcyc6IHRoaXMuZ2V0Q3NzQ2xhc3NlcygpLFxuICAgICAgJ2hyZWYnOiBjb25maWcudXJsXG4gICAgfSkuY3NzKHsgJ2JhY2tncm91bmQtaW1hZ2UnOiBgdXJsKCR7Y29uZmlnLnRodW1ibmFpbH0pYCB9KTtcblxuICAgIGxldCBiZ0VsZW1lbnQgPSBuZXcgRE9NKCdkaXYnLCB7XG4gICAgICAnY2xhc3MnOiB0aGlzLnByZWZpeENzcygnYmFja2dyb3VuZCcpXG4gICAgfSk7XG4gICAgaXRlbUVsZW1lbnQuYXBwZW5kKGJnRWxlbWVudCk7XG5cbiAgICBsZXQgdGl0bGVFbGVtZW50ID0gbmV3IERPTSgnc3BhbicsIHtcbiAgICAgICdjbGFzcyc6IHRoaXMucHJlZml4Q3NzKCd0aXRsZScpXG4gICAgfSkuYXBwZW5kKG5ldyBET00oJ3NwYW4nLCB7XG4gICAgICAnY2xhc3MnOiB0aGlzLnByZWZpeENzcygnaW5uZXJ0aXRsZScpXG4gICAgfSkuaHRtbChjb25maWcudGl0bGUpKTtcbiAgICBpdGVtRWxlbWVudC5hcHBlbmQodGl0bGVFbGVtZW50KTtcblxuICAgIGxldCB0aW1lRWxlbWVudCA9IG5ldyBET00oJ3NwYW4nLCB7XG4gICAgICAnY2xhc3MnOiB0aGlzLnByZWZpeENzcygnZHVyYXRpb24nKVxuICAgIH0pLmFwcGVuZChuZXcgRE9NKCdzcGFuJywge1xuICAgICAgJ2NsYXNzJzogdGhpcy5wcmVmaXhDc3MoJ2lubmVyZHVyYXRpb24nKVxuICAgIH0pLmh0bWwoY29uZmlnLmR1cmF0aW9uID8gU3RyaW5nVXRpbHMuc2Vjb25kc1RvVGltZShjb25maWcuZHVyYXRpb24pIDogJycpKTtcbiAgICBpdGVtRWxlbWVudC5hcHBlbmQodGltZUVsZW1lbnQpO1xuXG4gICAgcmV0dXJuIGl0ZW1FbGVtZW50O1xuICB9XG59IiwiaW1wb3J0IHtDb21wb25lbnQsIENvbXBvbmVudENvbmZpZ30gZnJvbSAnLi9jb21wb25lbnQnO1xuaW1wb3J0IHtET019IGZyb20gJy4uL2RvbSc7XG5pbXBvcnQge0V2ZW50LCBFdmVudERpc3BhdGNoZXIsIE5vQXJnc30gZnJvbSAnLi4vZXZlbnRkaXNwYXRjaGVyJztcbmltcG9ydCB7U2Vla0JhckxhYmVsfSBmcm9tICcuL3NlZWtiYXJsYWJlbCc7XG5pbXBvcnQge1VJSW5zdGFuY2VNYW5hZ2VyLCBUaW1lbGluZU1hcmtlciwgU2Vla1ByZXZpZXdBcmdzfSBmcm9tICcuLi91aW1hbmFnZXInO1xuaW1wb3J0IHtUaW1lb3V0fSBmcm9tICcuLi90aW1lb3V0JztcblxuLyoqXG4gKiBDb25maWd1cmF0aW9uIGludGVyZmFjZSBmb3IgdGhlIHtAbGluayBTZWVrQmFyfSBjb21wb25lbnQuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2Vla0JhckNvbmZpZyBleHRlbmRzIENvbXBvbmVudENvbmZpZyB7XG4gIC8qKlxuICAgKiBUaGUgbGFiZWwgYWJvdmUgdGhlIHNlZWsgcG9zaXRpb24uXG4gICAqL1xuICBsYWJlbD86IFNlZWtCYXJMYWJlbDtcbiAgLyoqXG4gICAqIEJhciB3aWxsIGJlIHZlcnRpY2FsIGluc3RlYWQgb2YgaG9yaXpvbnRhbCBpZiBzZXQgdG8gdHJ1ZS5cbiAgICovXG4gIHZlcnRpY2FsPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBFdmVudCBhcmd1bWVudCBpbnRlcmZhY2UgZm9yIGEgc2VlayBwcmV2aWV3IGV2ZW50LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFNlZWtQcmV2aWV3RXZlbnRBcmdzIGV4dGVuZHMgU2Vla1ByZXZpZXdBcmdzIHtcbiAgLyoqXG4gICAqIFRlbGxzIGlmIHRoZSBzZWVrIHByZXZpZXcgZXZlbnQgY29tZXMgZnJvbSBhIHNjcnViYmluZy5cbiAgICovXG4gIHNjcnViYmluZzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBBIHNlZWsgYmFyIHRvIHNlZWsgd2l0aGluIHRoZSBwbGF5ZXIncyBtZWRpYS4gSXQgZGlzcGxheXMgdGhlIGN1cnJlbnQgcGxheWJhY2sgcG9zaXRpb24sIGFtb3VudCBvZiBidWZmZWQgZGF0YSwgc2Vla1xuICogdGFyZ2V0LCBhbmQga2VlcHMgc3RhdHVzIGFib3V0IGFuIG9uZ29pbmcgc2Vlay5cbiAqXG4gKiBUaGUgc2VlayBiYXIgZGlzcGxheXMgZGlmZmVyZW50ICdiYXJzJzpcbiAqICAtIHRoZSBwbGF5YmFjayBwb3NpdGlvbiwgaS5lLiB0aGUgcG9zaXRpb24gaW4gdGhlIG1lZGlhIGF0IHdoaWNoIHRoZSBwbGF5ZXIgY3VycmVudCBwbGF5YmFjayBwb2ludGVyIGlzIHBvc2l0aW9uZWRcbiAqICAtIHRoZSBidWZmZXIgcG9zaXRpb24sIHdoaWNoIHVzdWFsbHkgaXMgdGhlIHBsYXliYWNrIHBvc2l0aW9uIHBsdXMgdGhlIHRpbWUgc3BhbiB0aGF0IGlzIGFscmVhZHkgYnVmZmVyZWQgYWhlYWRcbiAqICAtIHRoZSBzZWVrIHBvc2l0aW9uLCB1c2VkIHRvIHByZXZpZXcgdG8gd2hlcmUgaW4gdGhlIHRpbWVsaW5lIGEgc2VlayB3aWxsIGp1bXAgdG9cbiAqL1xuZXhwb3J0IGNsYXNzIFNlZWtCYXIgZXh0ZW5kcyBDb21wb25lbnQ8U2Vla0JhckNvbmZpZz4ge1xuXG4gIC8qKlxuICAgKiBUaGUgQ1NTIGNsYXNzIHRoYXQgaXMgYWRkZWQgdG8gdGhlIERPTSBlbGVtZW50IHdoaWxlIHRoZSBzZWVrIGJhciBpcyBpbiAnc2Vla2luZycgc3RhdGUuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBDTEFTU19TRUVLSU5HID0gJ3NlZWtpbmcnO1xuXG4gIHByaXZhdGUgc2Vla0JhcjogRE9NO1xuICBwcml2YXRlIHNlZWtCYXJQbGF5YmFja1Bvc2l0aW9uOiBET007XG4gIHByaXZhdGUgc2Vla0JhclBsYXliYWNrUG9zaXRpb25NYXJrZXI6IERPTTtcbiAgcHJpdmF0ZSBzZWVrQmFyQnVmZmVyUG9zaXRpb246IERPTTtcbiAgcHJpdmF0ZSBzZWVrQmFyU2Vla1Bvc2l0aW9uOiBET007XG4gIHByaXZhdGUgc2Vla0JhckJhY2tkcm9wOiBET007XG4gIHByaXZhdGUgc2Vla0Jhck1hcmtlcnNDb250YWluZXI6IERPTTtcblxuICBwcml2YXRlIGxhYmVsOiBTZWVrQmFyTGFiZWw7XG5cbiAgcHJpdmF0ZSB0aW1lbGluZU1hcmtlcnM6IFRpbWVsaW5lTWFya2VyW107XG5cbiAgLyoqXG4gICAqIEJ1ZmZlciBvZiB0aGUgdGhlIGN1cnJlbnQgcGxheWJhY2sgcG9zaXRpb24uIFRoZSBwb3NpdGlvbiBtdXN0IGJlIGJ1ZmZlcmVkIGluIGNhc2UgaXQgbmVlZHMgdGhlIGVsZW1lbnRcbiAgICogbmVlZHMgdG8gYmUgcmVmcmVzaGVkIHdpdGgge0BsaW5rICNyZWZyZXNoUGxheWJhY2tQb3NpdGlvbn0uXG4gICAqIEB0eXBlIHtudW1iZXJ9XG4gICAqL1xuICBwcml2YXRlIHBsYXliYWNrUG9zaXRpb25QZXJjZW50YWdlID0gMDtcblxuICAvLyBodHRwczovL2hhY2tzLm1vemlsbGEub3JnLzIwMTMvMDQvZGV0ZWN0aW5nLXRvdWNoLWl0cy10aGUtd2h5LW5vdC10aGUtaG93L1xuICBwcml2YXRlIHRvdWNoU3VwcG9ydGVkID0gKCdvbnRvdWNoc3RhcnQnIGluIHdpbmRvdyk7XG5cbiAgcHJpdmF0ZSBzZWVrQmFyRXZlbnRzID0ge1xuICAgIC8qKlxuICAgICAqIEZpcmVkIHdoZW4gYSBzY3J1YmJpbmcgc2VlayBvcGVyYXRpb24gaXMgc3RhcnRlZC5cbiAgICAgKi9cbiAgICBvblNlZWs6IG5ldyBFdmVudERpc3BhdGNoZXI8U2Vla0JhciwgTm9BcmdzPigpLFxuICAgIC8qKlxuICAgICAqIEZpcmVkIGR1cmluZyBhIHNjcnViYmluZyBzZWVrIHRvIGluZGljYXRlIHRoYXQgdGhlIHNlZWsgcHJldmlldyAoaS5lLiB0aGUgdmlkZW8gZnJhbWUpIHNob3VsZCBiZSB1cGRhdGVkLlxuICAgICAqL1xuICAgIG9uU2Vla1ByZXZpZXc6IG5ldyBFdmVudERpc3BhdGNoZXI8U2Vla0JhciwgU2Vla1ByZXZpZXdFdmVudEFyZ3M+KCksXG4gICAgLyoqXG4gICAgICogRmlyZWQgd2hlbiBhIHNjcnViYmluZyBzZWVrIGhhcyBmaW5pc2hlZCBvciB3aGVuIGEgZGlyZWN0IHNlZWsgaXMgaXNzdWVkLlxuICAgICAqL1xuICAgIG9uU2Vla2VkOiBuZXcgRXZlbnREaXNwYXRjaGVyPFNlZWtCYXIsIG51bWJlcj4oKVxuICB9O1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogU2Vla0JhckNvbmZpZyA9IHt9KSB7XG4gICAgc3VwZXIoY29uZmlnKTtcblxuICAgIHRoaXMuY29uZmlnID0gdGhpcy5tZXJnZUNvbmZpZyhjb25maWcsIHtcbiAgICAgIGNzc0NsYXNzOiAndWktc2Vla2JhcidcbiAgICB9LCB0aGlzLmNvbmZpZyk7XG5cbiAgICB0aGlzLmxhYmVsID0gdGhpcy5jb25maWcubGFiZWw7XG4gICAgdGhpcy50aW1lbGluZU1hcmtlcnMgPSBbXTtcbiAgfVxuXG4gIGluaXRpYWxpemUoKTogdm9pZCB7XG4gICAgc3VwZXIuaW5pdGlhbGl6ZSgpO1xuXG4gICAgaWYgKHRoaXMuaGFzTGFiZWwoKSkge1xuICAgICAgdGhpcy5nZXRMYWJlbCgpLmluaXRpYWxpemUoKTtcbiAgICB9XG4gIH1cblxuICBjb25maWd1cmUocGxheWVyOiBiaXRtb3Zpbi5wbGF5ZXIuUGxheWVyLCB1aW1hbmFnZXI6IFVJSW5zdGFuY2VNYW5hZ2VyLCBjb25maWd1cmVTZWVrOiBib29sZWFuID0gdHJ1ZSk6IHZvaWQge1xuICAgIHN1cGVyLmNvbmZpZ3VyZShwbGF5ZXIsIHVpbWFuYWdlcik7XG5cbiAgICBpZiAoIWNvbmZpZ3VyZVNlZWspIHtcbiAgICAgIC8vIFRoZSBjb25maWd1cmVTZWVrIGZsYWcgY2FuIGJlIHVzZWQgYnkgc3ViY2xhc3NlcyB0byBkaXNhYmxlIGNvbmZpZ3VyYXRpb24gYXMgc2VlayBiYXIuIEUuZy4gdGhlIHZvbHVtZVxuICAgICAgLy8gc2xpZGVyIGlzIHJldXNpbmcgdGhpcyBjb21wb25lbnQgYnV0IGFkZHMgaXRzIG93biBmdW5jdGlvbmFsaXR5LCBhbmQgZG9lcyBub3QgbmVlZCB0aGUgc2VlayBmdW5jdGlvbmFsaXR5LlxuICAgICAgLy8gVGhpcyBpcyBhY3R1YWxseSBhIGhhY2ssIHRoZSBwcm9wZXIgc29sdXRpb24gd291bGQgYmUgZm9yIGJvdGggc2VlayBiYXIgYW5kIHZvbHVtZSBzbGlkZXJzIHRvIGV4dGVuZFxuICAgICAgLy8gYSBjb21tb24gYmFzZSBzbGlkZXIgY29tcG9uZW50IGFuZCBpbXBsZW1lbnQgdGhlaXIgZnVuY3Rpb25hbGl0eSB0aGVyZS5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodWltYW5hZ2VyLmdldENvbmZpZygpLm1ldGFkYXRhICYmIHVpbWFuYWdlci5nZXRDb25maWcoKS5tZXRhZGF0YS5tYXJrZXJzXG4gICAgICAmJiB1aW1hbmFnZXIuZ2V0Q29uZmlnKCkubWV0YWRhdGEubWFya2Vycy5sZW5ndGggPiAwKSB7XG4gICAgICBmb3IgKGxldCBjaGFwdGVyIG9mIHVpbWFuYWdlci5nZXRDb25maWcoKS5tZXRhZGF0YS5tYXJrZXJzKSB7XG4gICAgICAgIHRoaXMudGltZWxpbmVNYXJrZXJzLnB1c2goe1xuICAgICAgICAgIHRpbWU6IDEwMCAvIHBsYXllci5nZXREdXJhdGlvbigpICogY2hhcHRlci50aW1lLCAvLyBjb252ZXJ0IHRpbWUgdG8gcGVyY2VudGFnZVxuICAgICAgICAgIHRpdGxlOiBjaGFwdGVyLnRpdGxlLFxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBzZWxmID0gdGhpcztcbiAgICBsZXQgcGxheWJhY2tOb3RJbml0aWFsaXplZCA9IHRydWU7XG4gICAgbGV0IGlzUGxheWluZyA9IGZhbHNlO1xuICAgIGxldCBpc1NlZWtpbmcgPSBmYWxzZTtcblxuICAgIC8vIFVwZGF0ZSBwbGF5YmFjayBhbmQgYnVmZmVyIHBvc2l0aW9uc1xuICAgIGxldCBwbGF5YmFja1Bvc2l0aW9uSGFuZGxlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgLy8gT25jZSB0aGlzIGhhbmRsZXIgb3MgY2FsbGVkLCBwbGF5YmFjayBoYXMgYmVlbiBzdGFydGVkIGFuZCB3ZSBzZXQgdGhlIGZsYWcgdG8gZmFsc2VcbiAgICAgIHBsYXliYWNrTm90SW5pdGlhbGl6ZWQgPSBmYWxzZTtcblxuICAgICAgaWYgKGlzU2Vla2luZykge1xuICAgICAgICAvLyBXZSBjYXVnaHQgYSBzZWVrIHByZXZpZXcgc2VlaywgZG8gbm90IHVwZGF0ZSB0aGUgc2Vla2JhclxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChwbGF5ZXIuaXNMaXZlKCkpIHtcbiAgICAgICAgaWYgKHBsYXllci5nZXRNYXhUaW1lU2hpZnQoKSA9PT0gMCkge1xuICAgICAgICAgIC8vIFRoaXMgY2FzZSBtdXN0IGJlIGV4cGxpY2l0bHkgaGFuZGxlZCB0byBhdm9pZCBkaXZpc2lvbiBieSB6ZXJvXG4gICAgICAgICAgc2VsZi5zZXRQbGF5YmFja1Bvc2l0aW9uKDEwMCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgbGV0IHBsYXliYWNrUG9zaXRpb25QZXJjZW50YWdlID0gMTAwIC0gKDEwMCAvIHBsYXllci5nZXRNYXhUaW1lU2hpZnQoKSAqIHBsYXllci5nZXRUaW1lU2hpZnQoKSk7XG4gICAgICAgICAgc2VsZi5zZXRQbGF5YmFja1Bvc2l0aW9uKHBsYXliYWNrUG9zaXRpb25QZXJjZW50YWdlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFsd2F5cyBzaG93IGZ1bGwgYnVmZmVyIGZvciBsaXZlIHN0cmVhbXNcbiAgICAgICAgc2VsZi5zZXRCdWZmZXJQb3NpdGlvbigxMDApO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGxldCBwbGF5YmFja1Bvc2l0aW9uUGVyY2VudGFnZSA9IDEwMCAvIHBsYXllci5nZXREdXJhdGlvbigpICogcGxheWVyLmdldEN1cnJlbnRUaW1lKCk7XG5cbiAgICAgICAgbGV0IHZpZGVvQnVmZmVyTGVuZ3RoID0gcGxheWVyLmdldFZpZGVvQnVmZmVyTGVuZ3RoKCk7XG4gICAgICAgIGxldCBhdWRpb0J1ZmZlckxlbmd0aCA9IHBsYXllci5nZXRBdWRpb0J1ZmZlckxlbmd0aCgpO1xuICAgICAgICAvLyBDYWxjdWxhdGUgdGhlIGJ1ZmZlciBsZW5ndGggd2hpY2ggaXMgdGhlIHNtYWxsZXIgbGVuZ3RoIG9mIHRoZSBhdWRpbyBhbmQgdmlkZW8gYnVmZmVycy4gSWYgb25lIG9mIHRoZXNlXG4gICAgICAgIC8vIGJ1ZmZlcnMgaXMgbm90IGF2YWlsYWJsZSwgd2Ugc2V0IGl0J3MgdmFsdWUgdG8gTUFYX1ZBTFVFIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSBvdGhlciByZWFsIHZhbHVlIGlzIHRha2VuXG4gICAgICAgIC8vIGFzIHRoZSBidWZmZXIgbGVuZ3RoLlxuICAgICAgICBsZXQgYnVmZmVyTGVuZ3RoID0gTWF0aC5taW4oXG4gICAgICAgICAgdmlkZW9CdWZmZXJMZW5ndGggIT0gbnVsbCA/IHZpZGVvQnVmZmVyTGVuZ3RoIDogTnVtYmVyLk1BWF9WQUxVRSxcbiAgICAgICAgICBhdWRpb0J1ZmZlckxlbmd0aCAhPSBudWxsID8gYXVkaW9CdWZmZXJMZW5ndGggOiBOdW1iZXIuTUFYX1ZBTFVFKTtcbiAgICAgICAgLy8gSWYgYm90aCBidWZmZXIgbGVuZ3RocyBhcmUgbWlzc2luZywgd2Ugc2V0IHRoZSBidWZmZXIgbGVuZ3RoIHRvIHplcm9cbiAgICAgICAgaWYgKGJ1ZmZlckxlbmd0aCA9PT0gTnVtYmVyLk1BWF9WQUxVRSkge1xuICAgICAgICAgIGJ1ZmZlckxlbmd0aCA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgYnVmZmVyUGVyY2VudGFnZSA9IDEwMCAvIHBsYXllci5nZXREdXJhdGlvbigpICogYnVmZmVyTGVuZ3RoO1xuXG4gICAgICAgIC8vIFVwZGF0ZSBwbGF5YmFjayBwb3NpdGlvbiBvbmx5IGluIHBhdXNlZCBzdGF0ZSwgcGxheWJhY2sgdXBkYXRlcyBhcmUgaGFuZGxlZCBpbiB0aGUgVGltZW91dCBiZWxvd1xuICAgICAgICBpZiAocGxheWVyLmlzUGF1c2VkKCkpIHtcbiAgICAgICAgICBzZWxmLnNldFBsYXliYWNrUG9zaXRpb24ocGxheWJhY2tQb3NpdGlvblBlcmNlbnRhZ2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5zZXRCdWZmZXJQb3NpdGlvbihwbGF5YmFja1Bvc2l0aW9uUGVyY2VudGFnZSArIGJ1ZmZlclBlcmNlbnRhZ2UpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9SRUFEWSwgZnVuY3Rpb24oKSB7XG4gICAgICAvLyBSZXNldCBmbGFnIHdoZW4gYSBuZXcgc291cmNlIGlzIGxvYWRlZFxuICAgICAgcGxheWJhY2tOb3RJbml0aWFsaXplZCA9IHRydWU7XG4gICAgfSk7XG5cbiAgICAvLyBVcGRhdGUgc2Vla2JhciB1cG9uIHRoZXNlIGV2ZW50c1xuICAgIC8vIHVwZGF0ZSBwbGF5YmFjayBwb3NpdGlvbiB3aGVuIGl0IGNoYW5nZXNcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9USU1FX0NIQU5HRUQsIHBsYXliYWNrUG9zaXRpb25IYW5kbGVyKTtcbiAgICAvLyB1cGRhdGUgYnVmZmVybGV2ZWwgd2hlbiBidWZmZXJpbmcgaXMgY29tcGxldGVcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9TVEFMTF9FTkRFRCwgcGxheWJhY2tQb3NpdGlvbkhhbmRsZXIpO1xuICAgIC8vIHVwZGF0ZSBwbGF5YmFjayBwb3NpdGlvbiB3aGVuIGEgc2VlayBoYXMgZmluaXNoZWRcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9TRUVLRUQsIHBsYXliYWNrUG9zaXRpb25IYW5kbGVyKTtcbiAgICAvLyB1cGRhdGUgcGxheWJhY2sgcG9zaXRpb24gd2hlbiBhIHRpbWVzaGlmdCBoYXMgZmluaXNoZWRcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9USU1FX1NISUZURUQsIHBsYXliYWNrUG9zaXRpb25IYW5kbGVyKTtcbiAgICAvLyB1cGRhdGUgYnVmZmVybGV2ZWwgd2hlbiBhIHNlZ21lbnQgaGFzIGJlZW4gZG93bmxvYWRlZFxuICAgIHBsYXllci5hZGRFdmVudEhhbmRsZXIoYml0bW92aW4ucGxheWVyLkVWRU5ULk9OX1NFR01FTlRfUkVRVUVTVF9GSU5JU0hFRCwgcGxheWJhY2tQb3NpdGlvbkhhbmRsZXIpO1xuICAgIC8vIHVwZGF0ZSBwbGF5YmFjayBwb3NpdGlvbiBvZiBDYXN0IHBsYXliYWNrXG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fQ0FTVF9USU1FX1VQREFURUQsIHBsYXliYWNrUG9zaXRpb25IYW5kbGVyKTtcblxuXG4gICAgLypcbiAgICAgKiBQbGF5YmFjayBwb3NpdGlvbiB1cGRhdGVcbiAgICAgKlxuICAgICAqIFdlIGRvIG5vdCB1cGRhdGUgdGhlIHBvc2l0aW9uIGRpcmVjdGx5IGZyb20gdGhlIE9OX1RJTUVfQ0hBTkdFRCBldmVudCwgYmVjYXVzZSBpdCBhcnJpdmVzIHZlcnkgaml0dGVyeSBhbmRcbiAgICAgKiByZXN1bHRzIGluIGEgaml0dGVyeSBwb3NpdGlvbiBpbmRpY2F0b3Igc2luY2UgdGhlIENTUyB0cmFuc2l0aW9uIHRpbWUgaXMgc3RhdGljYWxseSBzZXQuXG4gICAgICogVG8gd29yayBhcm91bmQgdGhpcyBpc3N1ZSwgd2UgbWFpbnRhaW4gYSBsb2NhbCBwbGF5YmFjayBwb3NpdGlvbiB0aGF0IGlzIHVwZGF0ZWQgaW4gYSBzdGFibGUgcmVndWxhciBpbnRlcnZhbFxuICAgICAqIGFuZCBrZXB0IGluIHN5bmMgd2l0aCB0aGUgcGxheWVyLlxuICAgICAqL1xuICAgIGxldCBjdXJyZW50VGltZVNlZWtCYXIgPSAwO1xuICAgIGxldCBjdXJyZW50VGltZVBsYXllciA9IDA7XG4gICAgbGV0IHVwZGF0ZUludGVydmFsTXMgPSAyNTtcbiAgICBsZXQgY3VycmVudFRpbWVVcGRhdGVEZWx0YVNlY3MgPSB1cGRhdGVJbnRlcnZhbE1zIC8gMTAwMDtcblxuICAgIGxldCBzbW9vdGhQbGF5YmFja1Bvc2l0aW9uVXBkYXRlciA9IG5ldyBUaW1lb3V0KHVwZGF0ZUludGVydmFsTXMsIGZ1bmN0aW9uKCkge1xuICAgICAgY3VycmVudFRpbWVTZWVrQmFyICs9IGN1cnJlbnRUaW1lVXBkYXRlRGVsdGFTZWNzO1xuICAgICAgY3VycmVudFRpbWVQbGF5ZXIgPSBwbGF5ZXIuZ2V0Q3VycmVudFRpbWUoKTtcblxuICAgICAgLy8gU3luYyBjdXJyZW50VGltZSBvZiBzZWVrYmFyIHRvIHBsYXllclxuICAgICAgbGV0IGN1cnJlbnRUaW1lRGVsdGEgPSBjdXJyZW50VGltZVNlZWtCYXIgLSBjdXJyZW50VGltZVBsYXllcjtcbiAgICAgIC8vIElmIGN1cnJlbnRUaW1lRGVsdGEgaXMgbmVnYXRpdmUgYW5kIGJlbG93IHRoZSBhZGp1c3RtZW50IHRocmVzaG9sZCxcbiAgICAgIC8vIHRoZSBwbGF5ZXIgaXMgYWhlYWQgb2YgdGhlIHNlZWtiYXIgYW5kIHdlICdmYXN0IGZvcndhcmQnIHRoZSBzZWVrYmFyXG4gICAgICBpZiAoY3VycmVudFRpbWVEZWx0YSA8PSAtY3VycmVudFRpbWVVcGRhdGVEZWx0YVNlY3MpIHtcbiAgICAgICAgY3VycmVudFRpbWVTZWVrQmFyICs9IGN1cnJlbnRUaW1lVXBkYXRlRGVsdGFTZWNzO1xuICAgICAgfVxuICAgICAgLy8gSWYgY3VycmVudFRpbWVEZWx0YSBpcyBwb3NpdGl2ZSBhbmQgYWJvdmUgdGhlIGFkanVzdG1lbnQgdGhyZXNob2xkLFxuICAgICAgLy8gdGhlIHBsYXllciBpcyBiZWhpbmQgdGhlIHNlZWtiYXIgYW5kIHdlICdyZXdpbmQnIHRoZSBzZWVrYmFyXG4gICAgICBlbHNlIGlmIChjdXJyZW50VGltZURlbHRhID49IGN1cnJlbnRUaW1lVXBkYXRlRGVsdGFTZWNzKSB7XG4gICAgICAgIGN1cnJlbnRUaW1lU2Vla0JhciAtPSBjdXJyZW50VGltZVVwZGF0ZURlbHRhU2VjcztcbiAgICAgIH1cblxuICAgICAgbGV0IHBsYXliYWNrUG9zaXRpb25QZXJjZW50YWdlID0gMTAwIC8gcGxheWVyLmdldER1cmF0aW9uKCkgKiBjdXJyZW50VGltZVNlZWtCYXI7XG4gICAgICBzZWxmLnNldFBsYXliYWNrUG9zaXRpb24ocGxheWJhY2tQb3NpdGlvblBlcmNlbnRhZ2UpO1xuICAgIH0sIHRydWUpO1xuXG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fUExBWSwgZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIXBsYXllci5pc0xpdmUoKSkge1xuICAgICAgICBjdXJyZW50VGltZVNlZWtCYXIgPSBwbGF5ZXIuZ2V0Q3VycmVudFRpbWUoKTtcbiAgICAgICAgc21vb3RoUGxheWJhY2tQb3NpdGlvblVwZGF0ZXIuc3RhcnQoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9QQVVTRUQsIGZ1bmN0aW9uKCkge1xuICAgICAgc21vb3RoUGxheWJhY2tQb3NpdGlvblVwZGF0ZXIuY2xlYXIoKTtcbiAgICB9KTtcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9TRUVLRUQsIGZ1bmN0aW9uKCkge1xuICAgICAgY3VycmVudFRpbWVTZWVrQmFyID0gcGxheWVyLmdldEN1cnJlbnRUaW1lKCk7XG4gICAgfSk7XG5cblxuICAgIC8vIFNlZWsgaGFuZGxpbmdcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9TRUVLLCBmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYuc2V0U2Vla2luZyh0cnVlKTtcbiAgICB9KTtcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9TRUVLRUQsIGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5zZXRTZWVraW5nKGZhbHNlKTtcbiAgICB9KTtcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9USU1FX1NISUZULCBmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYuc2V0U2Vla2luZyh0cnVlKTtcbiAgICB9KTtcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9USU1FX1NISUZURUQsIGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5zZXRTZWVraW5nKGZhbHNlKTtcbiAgICB9KTtcblxuICAgIGxldCBzZWVrID0gZnVuY3Rpb24ocGVyY2VudGFnZTogbnVtYmVyKSB7XG4gICAgICBpZiAocGxheWVyLmlzTGl2ZSgpKSB7XG4gICAgICAgIHBsYXllci50aW1lU2hpZnQocGxheWVyLmdldE1heFRpbWVTaGlmdCgpIC0gKHBsYXllci5nZXRNYXhUaW1lU2hpZnQoKSAqIChwZXJjZW50YWdlIC8gMTAwKSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGxheWVyLnNlZWsocGxheWVyLmdldER1cmF0aW9uKCkgKiAocGVyY2VudGFnZSAvIDEwMCkpO1xuICAgICAgfVxuICAgIH07XG4gICAgc2VsZi5vblNlZWsuc3Vic2NyaWJlKGZ1bmN0aW9uKHNlbmRlcikge1xuICAgICAgaXNTZWVraW5nID0gdHJ1ZTsgLy8gdHJhY2sgc2Vla2luZyBzdGF0dXMgc28gd2UgY2FuIGNhdGNoIGV2ZW50cyBmcm9tIHNlZWsgcHJldmlldyBzZWVrc1xuXG4gICAgICAvLyBOb3RpZnkgVUkgbWFuYWdlciBvZiBzdGFydGVkIHNlZWtcbiAgICAgIHVpbWFuYWdlci5vblNlZWsuZGlzcGF0Y2goc2VuZGVyKTtcblxuICAgICAgLy8gU2F2ZSBjdXJyZW50IHBsYXliYWNrIHN0YXRlXG4gICAgICBpc1BsYXlpbmcgPSBwbGF5ZXIuaXNQbGF5aW5nKCk7XG5cbiAgICAgIC8vIFBhdXNlIHBsYXliYWNrIHdoaWxlIHNlZWtpbmdcbiAgICAgIGlmIChpc1BsYXlpbmcpIHtcbiAgICAgICAgcGxheWVyLnBhdXNlKCd1aS1zZWVrJyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgc2VsZi5vblNlZWtQcmV2aWV3LnN1YnNjcmliZShmdW5jdGlvbihzZW5kZXI6IFNlZWtCYXIsIGFyZ3M6IFNlZWtQcmV2aWV3RXZlbnRBcmdzKSB7XG4gICAgICAvLyBOb3RpZnkgVUkgbWFuYWdlciBvZiBzZWVrIHByZXZpZXdcbiAgICAgIHVpbWFuYWdlci5vblNlZWtQcmV2aWV3LmRpc3BhdGNoKHNlbmRlciwgYXJncyk7XG4gICAgfSk7XG4gICAgc2VsZi5vblNlZWtQcmV2aWV3LnN1YnNjcmliZVJhdGVMaW1pdGVkKGZ1bmN0aW9uKHNlbmRlcjogU2Vla0JhciwgYXJnczogU2Vla1ByZXZpZXdFdmVudEFyZ3MpIHtcbiAgICAgIC8vIFJhdGUtbGltaXRlZCBzY3J1YmJpbmcgc2Vla1xuICAgICAgaWYgKGFyZ3Muc2NydWJiaW5nKSB7XG4gICAgICAgIHNlZWsoYXJncy5wb3NpdGlvbik7XG4gICAgICB9XG4gICAgfSwgMjAwKTtcbiAgICBzZWxmLm9uU2Vla2VkLnN1YnNjcmliZShmdW5jdGlvbihzZW5kZXIsIHBlcmNlbnRhZ2UpIHtcbiAgICAgIGlzU2Vla2luZyA9IGZhbHNlO1xuXG4gICAgICAvLyBJZiBwbGF5YmFjayBoYXMgbm90IGJlZW4gc3RhcnRlZCBiZWZvcmUsIHdlIG5lZWQgdG8gY2FsbCBwbGF5IHRvIGluIGl0IHRoZSBwbGF5YmFjayBlbmdpbmUgZm9yIHRoZVxuICAgICAgLy8gc2VlayB0byB3b3JrLiBXZSBjYWxsIHBhdXNlKCkgaW1tZWRpYXRlbHkgYWZ0ZXJ3YXJkcyBiZWNhdXNlIHdlIGFjdHVhbGx5IGRvIG5vdCB3YW50IHRvIHBsYXkgYmFjayBhbnl0aGluZy5cbiAgICAgIC8vIFRoZSBmbGFnIHNlcnZlcyB0byBjYWxsIHBsYXkvcGF1c2Ugb25seSBvbiB0aGUgZmlyc3Qgc2VlayBiZWZvcmUgcGxheWJhY2sgaGFzIHN0YXJ0ZWQsIGluc3RlYWQgb2YgZXZlcnlcbiAgICAgIC8vIHRpbWUgYSBzZWVrIGlzIGlzc3VlZC5cbiAgICAgIGlmIChwbGF5YmFja05vdEluaXRpYWxpemVkKSB7XG4gICAgICAgIHBsYXliYWNrTm90SW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgICAgICAgcGxheWVyLnBsYXkoJ3VpLXNlZWsnKTtcbiAgICAgICAgcGxheWVyLnBhdXNlKCd1aS1zZWVrJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIERvIHRoZSBzZWVrXG4gICAgICBzZWVrKHBlcmNlbnRhZ2UpO1xuXG4gICAgICAvLyBDb250aW51ZSBwbGF5YmFjayBhZnRlciBzZWVrIGlmIHBsYXllciB3YXMgcGxheWluZyB3aGVuIHNlZWsgc3RhcnRlZFxuICAgICAgaWYgKGlzUGxheWluZykge1xuICAgICAgICBwbGF5ZXIucGxheSgndWktc2VlaycpO1xuICAgICAgfVxuXG4gICAgICAvLyBOb3RpZnkgVUkgbWFuYWdlciBvZiBmaW5pc2hlZCBzZWVrXG4gICAgICB1aW1hbmFnZXIub25TZWVrZWQuZGlzcGF0Y2goc2VuZGVyKTtcbiAgICB9KTtcblxuICAgIGlmIChzZWxmLmhhc0xhYmVsKCkpIHtcbiAgICAgIC8vIENvbmZpZ3VyZSBhIHNlZWtiYXIgbGFiZWwgdGhhdCBpcyBpbnRlcm5hbCB0byB0aGUgc2Vla2JhcilcbiAgICAgIHNlbGYuZ2V0TGFiZWwoKS5jb25maWd1cmUocGxheWVyLCB1aW1hbmFnZXIpO1xuICAgIH1cblxuICAgIC8vIEhpZGUgc2Vla2JhciBmb3IgbGl2ZSBzb3VyY2VzIHdpdGhvdXQgdGltZXNoaWZ0XG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fUkVBRFksIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHBsYXllci5pc0xpdmUoKSAmJiBwbGF5ZXIuZ2V0TWF4VGltZVNoaWZ0KCkgPT09IDApIHtcbiAgICAgICAgc2VsZi5oaWRlKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZWxmLnNob3coKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHBsYXllci5hZGRFdmVudEhhbmRsZXIoYml0bW92aW4ucGxheWVyLkVWRU5ULk9OX1BMQVlFUl9SRVNJWkUsIGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5yZWZyZXNoUGxheWJhY2tQb3NpdGlvbigpO1xuICAgIH0pO1xuXG4gICAgLy8gSW5pdGlhbGl6ZSBzZWVrYmFyXG4gICAgdGhpcy5zZXRQbGF5YmFja1Bvc2l0aW9uKDApO1xuICAgIHRoaXMuc2V0QnVmZmVyUG9zaXRpb24oMCk7XG4gICAgdGhpcy5zZXRTZWVrUG9zaXRpb24oMCk7XG4gICAgdGhpcy51cGRhdGVNYXJrZXJzKCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgdG9Eb21FbGVtZW50KCk6IERPTSB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnZlcnRpY2FsKSB7XG4gICAgICB0aGlzLmNvbmZpZy5jc3NDbGFzc2VzLnB1c2goJ3ZlcnRpY2FsJyk7XG4gICAgfVxuXG4gICAgbGV0IHNlZWtCYXJDb250YWluZXIgPSBuZXcgRE9NKCdkaXYnLCB7XG4gICAgICAnaWQnOiB0aGlzLmNvbmZpZy5pZCxcbiAgICAgICdjbGFzcyc6IHRoaXMuZ2V0Q3NzQ2xhc3NlcygpXG4gICAgfSk7XG5cbiAgICBsZXQgc2Vla0JhciA9IG5ldyBET00oJ2RpdicsIHtcbiAgICAgICdjbGFzcyc6IHRoaXMucHJlZml4Q3NzKCdzZWVrYmFyJylcbiAgICB9KTtcbiAgICB0aGlzLnNlZWtCYXIgPSBzZWVrQmFyO1xuXG4gICAgLy8gSW5kaWNhdG9yIHRoYXQgc2hvd3MgdGhlIGJ1ZmZlciBmaWxsIGxldmVsXG4gICAgbGV0IHNlZWtCYXJCdWZmZXJMZXZlbCA9IG5ldyBET00oJ2RpdicsIHtcbiAgICAgICdjbGFzcyc6IHRoaXMucHJlZml4Q3NzKCdzZWVrYmFyLWJ1ZmZlcmxldmVsJylcbiAgICB9KTtcbiAgICB0aGlzLnNlZWtCYXJCdWZmZXJQb3NpdGlvbiA9IHNlZWtCYXJCdWZmZXJMZXZlbDtcblxuICAgIC8vIEluZGljYXRvciB0aGF0IHNob3dzIHRoZSBjdXJyZW50IHBsYXliYWNrIHBvc2l0aW9uXG4gICAgbGV0IHNlZWtCYXJQbGF5YmFja1Bvc2l0aW9uID0gbmV3IERPTSgnZGl2Jywge1xuICAgICAgJ2NsYXNzJzogdGhpcy5wcmVmaXhDc3MoJ3NlZWtiYXItcGxheWJhY2twb3NpdGlvbicpXG4gICAgfSk7XG4gICAgdGhpcy5zZWVrQmFyUGxheWJhY2tQb3NpdGlvbiA9IHNlZWtCYXJQbGF5YmFja1Bvc2l0aW9uO1xuXG4gICAgLy8gQSBtYXJrZXIgb2YgdGhlIGN1cnJlbnQgcGxheWJhY2sgcG9zaXRpb24sIGUuZy4gYSBkb3Qgb3IgbGluZVxuICAgIGxldCBzZWVrQmFyUGxheWJhY2tQb3NpdGlvbk1hcmtlciA9IG5ldyBET00oJ2RpdicsIHtcbiAgICAgICdjbGFzcyc6IHRoaXMucHJlZml4Q3NzKCdzZWVrYmFyLXBsYXliYWNrcG9zaXRpb24tbWFya2VyJylcbiAgICB9KTtcbiAgICB0aGlzLnNlZWtCYXJQbGF5YmFja1Bvc2l0aW9uTWFya2VyID0gc2Vla0JhclBsYXliYWNrUG9zaXRpb25NYXJrZXI7XG5cbiAgICAvLyBJbmRpY2F0b3IgdGhhdCBzaG93IHdoZXJlIGEgc2VlayB3aWxsIGdvIHRvXG4gICAgbGV0IHNlZWtCYXJTZWVrUG9zaXRpb24gPSBuZXcgRE9NKCdkaXYnLCB7XG4gICAgICAnY2xhc3MnOiB0aGlzLnByZWZpeENzcygnc2Vla2Jhci1zZWVrcG9zaXRpb24nKVxuICAgIH0pO1xuICAgIHRoaXMuc2Vla0JhclNlZWtQb3NpdGlvbiA9IHNlZWtCYXJTZWVrUG9zaXRpb247XG5cbiAgICAvLyBJbmRpY2F0b3IgdGhhdCBzaG93cyB0aGUgZnVsbCBzZWVrYmFyXG4gICAgbGV0IHNlZWtCYXJCYWNrZHJvcCA9IG5ldyBET00oJ2RpdicsIHtcbiAgICAgICdjbGFzcyc6IHRoaXMucHJlZml4Q3NzKCdzZWVrYmFyLWJhY2tkcm9wJylcbiAgICB9KTtcbiAgICB0aGlzLnNlZWtCYXJCYWNrZHJvcCA9IHNlZWtCYXJCYWNrZHJvcDtcblxuICAgIGxldCBzZWVrQmFyQ2hhcHRlck1hcmtlcnNDb250YWluZXIgPSBuZXcgRE9NKCdkaXYnLCB7XG4gICAgICAnY2xhc3MnOiB0aGlzLnByZWZpeENzcygnc2Vla2Jhci1tYXJrZXJzJylcbiAgICB9KTtcbiAgICB0aGlzLnNlZWtCYXJNYXJrZXJzQ29udGFpbmVyID0gc2Vla0JhckNoYXB0ZXJNYXJrZXJzQ29udGFpbmVyO1xuXG4gICAgc2Vla0Jhci5hcHBlbmQoc2Vla0JhckJhY2tkcm9wLCBzZWVrQmFyQnVmZmVyTGV2ZWwsIHNlZWtCYXJTZWVrUG9zaXRpb24sXG4gICAgICBzZWVrQmFyUGxheWJhY2tQb3NpdGlvbiwgc2Vla0JhckNoYXB0ZXJNYXJrZXJzQ29udGFpbmVyLCBzZWVrQmFyUGxheWJhY2tQb3NpdGlvbk1hcmtlcik7XG5cbiAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgbGV0IHNlZWtpbmcgPSBmYWxzZTtcblxuICAgIC8vIERlZmluZSBoYW5kbGVyIGZ1bmN0aW9ucyBzbyB3ZSBjYW4gYXR0YWNoL3JlbW92ZSB0aGVtIGxhdGVyXG4gICAgbGV0IG1vdXNlVG91Y2hNb3ZlSGFuZGxlciA9IGZ1bmN0aW9uKGU6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50KSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAvLyBBdm9pZCBwcm9wYWdhdGlvbiB0byBWUiBoYW5kbGVyXG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICBsZXQgdGFyZ2V0UGVyY2VudGFnZSA9IDEwMCAqIHNlbGYuZ2V0T2Zmc2V0KGUpO1xuICAgICAgc2VsZi5zZXRTZWVrUG9zaXRpb24odGFyZ2V0UGVyY2VudGFnZSk7XG4gICAgICBzZWxmLnNldFBsYXliYWNrUG9zaXRpb24odGFyZ2V0UGVyY2VudGFnZSk7XG4gICAgICBzZWxmLm9uU2Vla1ByZXZpZXdFdmVudCh0YXJnZXRQZXJjZW50YWdlLCB0cnVlKTtcbiAgICB9O1xuICAgIGxldCBtb3VzZVRvdWNoVXBIYW5kbGVyID0gZnVuY3Rpb24oZTogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgLy8gUmVtb3ZlIGhhbmRsZXJzLCBzZWVrIG9wZXJhdGlvbiBpcyBmaW5pc2hlZFxuICAgICAgbmV3IERPTShkb2N1bWVudCkub2ZmKCd0b3VjaG1vdmUgbW91c2Vtb3ZlJywgbW91c2VUb3VjaE1vdmVIYW5kbGVyKTtcbiAgICAgIG5ldyBET00oZG9jdW1lbnQpLm9mZigndG91Y2hlbmQgbW91c2V1cCcsIG1vdXNlVG91Y2hVcEhhbmRsZXIpO1xuXG4gICAgICBsZXQgdGFyZ2V0UGVyY2VudGFnZSA9IDEwMCAqIHNlbGYuZ2V0T2Zmc2V0KGUpO1xuICAgICAgbGV0IHNuYXBwZWRDaGFwdGVyID0gc2VsZi5nZXRNYXJrZXJBdFBvc2l0aW9uKHRhcmdldFBlcmNlbnRhZ2UpO1xuXG4gICAgICBzZWxmLnNldFNlZWtpbmcoZmFsc2UpO1xuICAgICAgc2Vla2luZyA9IGZhbHNlO1xuXG4gICAgICAvLyBGaXJlIHNlZWtlZCBldmVudFxuICAgICAgc2VsZi5vblNlZWtlZEV2ZW50KHNuYXBwZWRDaGFwdGVyID8gc25hcHBlZENoYXB0ZXIudGltZSA6IHRhcmdldFBlcmNlbnRhZ2UpO1xuICAgIH07XG5cbiAgICAvLyBBIHNlZWsgYWx3YXlzIHN0YXJ0IHdpdGggYSB0b3VjaHN0YXJ0IG9yIG1vdXNlZG93biBkaXJlY3RseSBvbiB0aGUgc2Vla2Jhci5cbiAgICAvLyBUbyB0cmFjayBhIG1vdXNlIHNlZWsgYWxzbyBvdXRzaWRlIHRoZSBzZWVrYmFyIChmb3IgdG91Y2ggZXZlbnRzIHRoaXMgd29ya3MgYXV0b21hdGljYWxseSksXG4gICAgLy8gc28gdGhlIHVzZXIgZG9lcyBub3QgbmVlZCB0byB0YWtlIGNhcmUgdGhhdCB0aGUgbW91c2UgYWx3YXlzIHN0YXlzIG9uIHRoZSBzZWVrYmFyLCB3ZSBhdHRhY2ggdGhlIG1vdXNlbW92ZVxuICAgIC8vIGFuZCBtb3VzZXVwIGhhbmRsZXJzIHRvIHRoZSB3aG9sZSBkb2N1bWVudC4gQSBzZWVrIGlzIHRyaWdnZXJlZCB3aGVuIHRoZSB1c2VyIGxpZnRzIHRoZSBtb3VzZSBrZXkuXG4gICAgLy8gQSBzZWVrIG1vdXNlIGdlc3R1cmUgaXMgdGh1cyBiYXNpY2FsbHkgYSBjbGljayB3aXRoIGEgbG9uZyB0aW1lIGZyYW1lIGJldHdlZW4gZG93biBhbmQgdXAgZXZlbnRzLlxuICAgIHNlZWtCYXIub24oJ3RvdWNoc3RhcnQgbW91c2Vkb3duJywgZnVuY3Rpb24oZTogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQpIHtcbiAgICAgIGxldCBpc1RvdWNoRXZlbnQgPSBzZWxmLnRvdWNoU3VwcG9ydGVkICYmIGUgaW5zdGFuY2VvZiBUb3VjaEV2ZW50O1xuXG4gICAgICAvLyBQcmV2ZW50IHNlbGVjdGlvbiBvZiBET00gZWxlbWVudHMgKGFsc28gcHJldmVudHMgbW91c2Vkb3duIGlmIGN1cnJlbnQgZXZlbnQgaXMgdG91Y2hzdGFydClcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIC8vIEF2b2lkIHByb3BhZ2F0aW9uIHRvIFZSIGhhbmRsZXJcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgIHNlbGYuc2V0U2Vla2luZyh0cnVlKTsgLy8gU2V0IHNlZWtpbmcgY2xhc3Mgb24gRE9NIGVsZW1lbnRcbiAgICAgIHNlZWtpbmcgPSB0cnVlOyAvLyBTZXQgc2VlayB0cmFja2luZyBmbGFnXG5cbiAgICAgIC8vIEZpcmUgc2Vla2VkIGV2ZW50XG4gICAgICBzZWxmLm9uU2Vla0V2ZW50KCk7XG5cbiAgICAgIC8vIEFkZCBoYW5kbGVyIHRvIHRyYWNrIHRoZSBzZWVrIG9wZXJhdGlvbiBvdmVyIHRoZSB3aG9sZSBkb2N1bWVudFxuICAgICAgbmV3IERPTShkb2N1bWVudCkub24oaXNUb3VjaEV2ZW50ID8gJ3RvdWNobW92ZScgOiAnbW91c2Vtb3ZlJywgbW91c2VUb3VjaE1vdmVIYW5kbGVyKTtcbiAgICAgIG5ldyBET00oZG9jdW1lbnQpLm9uKGlzVG91Y2hFdmVudCA/ICd0b3VjaGVuZCcgOiAnbW91c2V1cCcsIG1vdXNlVG91Y2hVcEhhbmRsZXIpO1xuICAgIH0pO1xuXG4gICAgLy8gRGlzcGxheSBzZWVrIHRhcmdldCBpbmRpY2F0b3Igd2hlbiBtb3VzZSBob3ZlcnMgb3IgZmluZ2VyIHNsaWRlcyBvdmVyIHNlZWtiYXJcbiAgICBzZWVrQmFyLm9uKCd0b3VjaG1vdmUgbW91c2Vtb3ZlJywgZnVuY3Rpb24oZTogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgaWYgKHNlZWtpbmcpIHtcbiAgICAgICAgLy8gRHVyaW5nIGEgc2VlayAod2hlbiBtb3VzZSBpcyBkb3duIG9yIHRvdWNoIG1vdmUgYWN0aXZlKSwgd2UgbmVlZCB0byBzdG9wIHByb3BhZ2F0aW9uIHRvIGF2b2lkXG4gICAgICAgIC8vIHRoZSBWUiB2aWV3cG9ydCByZWFjdGluZyB0byB0aGUgbW92ZXMuXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIC8vIEJlY2F1c2UgdGhlIHN0b3BwZWQgcHJvcGFnYXRpb24gaW5oaWJpdHMgdGhlIGV2ZW50IG9uIHRoZSBkb2N1bWVudCwgd2UgbmVlZCB0byBjYWxsIGl0IGZyb20gaGVyZVxuICAgICAgICBtb3VzZVRvdWNoTW92ZUhhbmRsZXIoZSk7XG4gICAgICB9XG5cbiAgICAgIGxldCBwb3NpdGlvbiA9IDEwMCAqIHNlbGYuZ2V0T2Zmc2V0KGUpO1xuICAgICAgc2VsZi5zZXRTZWVrUG9zaXRpb24ocG9zaXRpb24pO1xuICAgICAgc2VsZi5vblNlZWtQcmV2aWV3RXZlbnQocG9zaXRpb24sIGZhbHNlKTtcblxuICAgICAgaWYgKHNlbGYuaGFzTGFiZWwoKSAmJiBzZWxmLmdldExhYmVsKCkuaXNIaWRkZW4oKSkge1xuICAgICAgICBzZWxmLmdldExhYmVsKCkuc2hvdygpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gSGlkZSBzZWVrIHRhcmdldCBpbmRpY2F0b3Igd2hlbiBtb3VzZSBvciBmaW5nZXIgbGVhdmVzIHNlZWtiYXJcbiAgICBzZWVrQmFyLm9uKCd0b3VjaGVuZCBtb3VzZWxlYXZlJywgZnVuY3Rpb24oZTogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgc2VsZi5zZXRTZWVrUG9zaXRpb24oMCk7XG5cbiAgICAgIGlmIChzZWxmLmhhc0xhYmVsKCkpIHtcbiAgICAgICAgc2VsZi5nZXRMYWJlbCgpLmhpZGUoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHNlZWtCYXJDb250YWluZXIuYXBwZW5kKHNlZWtCYXIpO1xuXG4gICAgaWYgKHRoaXMubGFiZWwpIHtcbiAgICAgIHNlZWtCYXJDb250YWluZXIuYXBwZW5kKHRoaXMubGFiZWwuZ2V0RG9tRWxlbWVudCgpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc2Vla0JhckNvbnRhaW5lcjtcbiAgfVxuXG4gIHByb3RlY3RlZCB1cGRhdGVNYXJrZXJzKCk6IHZvaWQge1xuICAgIHRoaXMuc2Vla0Jhck1hcmtlcnNDb250YWluZXIuZW1wdHkoKTtcbiAgICBmb3IgKGxldCBtYXJrZXIgb2YgdGhpcy50aW1lbGluZU1hcmtlcnMpIHtcbiAgICAgIHRoaXMuc2Vla0Jhck1hcmtlcnNDb250YWluZXIuYXBwZW5kKG5ldyBET00oJ2RpdicsIHtcbiAgICAgICAgJ2NsYXNzJzogdGhpcy5wcmVmaXhDc3MoJ3NlZWtiYXItbWFya2VyJyksXG4gICAgICAgICdkYXRhLW1hcmtlci10aW1lJzogU3RyaW5nKG1hcmtlci50aW1lKSxcbiAgICAgICAgJ2RhdGEtbWFya2VyLXRpdGxlJzogU3RyaW5nKG1hcmtlci50aXRsZSksXG4gICAgICB9KS5jc3Moe1xuICAgICAgICAnd2lkdGgnOiBtYXJrZXIudGltZSArICclJyxcbiAgICAgIH0pKTtcbiAgICB9XG4gIH1cblxuICBwcm90ZWN0ZWQgZ2V0TWFya2VyQXRQb3NpdGlvbihwZXJjZW50YWdlOiBudW1iZXIpOiBUaW1lbGluZU1hcmtlciB8IG51bGwge1xuICAgIGxldCBzbmFwcGVkTWFya2VyOiBUaW1lbGluZU1hcmtlciA9IG51bGw7XG4gICAgbGV0IHNuYXBwaW5nUmFuZ2UgPSAxO1xuICAgIGlmICh0aGlzLnRpbWVsaW5lTWFya2Vycy5sZW5ndGggPiAwKSB7XG4gICAgICBmb3IgKGxldCBtYXJrZXIgb2YgdGhpcy50aW1lbGluZU1hcmtlcnMpIHtcbiAgICAgICAgaWYgKHBlcmNlbnRhZ2UgPj0gbWFya2VyLnRpbWUgLSBzbmFwcGluZ1JhbmdlICYmIHBlcmNlbnRhZ2UgPD0gbWFya2VyLnRpbWUgKyBzbmFwcGluZ1JhbmdlKSB7XG4gICAgICAgICAgc25hcHBlZE1hcmtlciA9IG1hcmtlcjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzbmFwcGVkTWFya2VyO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGhvcml6b250YWwgb2Zmc2V0IG9mIGEgbW91c2UvdG91Y2ggZXZlbnQgcG9pbnQgZnJvbSB0aGUgbGVmdCBlZGdlIG9mIHRoZSBzZWVrIGJhci5cbiAgICogQHBhcmFtIGV2ZW50UGFnZVggdGhlIHBhZ2VYIGNvb3JkaW5hdGUgb2YgYW4gZXZlbnQgdG8gY2FsY3VsYXRlIHRoZSBvZmZzZXQgZnJvbVxuICAgKiBAcmV0dXJucyB7bnVtYmVyfSBhIG51bWJlciBpbiB0aGUgcmFuZ2Ugb2YgWzAsIDFdLCB3aGVyZSAwIGlzIHRoZSBsZWZ0IGVkZ2UgYW5kIDEgaXMgdGhlIHJpZ2h0IGVkZ2VcbiAgICovXG4gIHByaXZhdGUgZ2V0SG9yaXpvbnRhbE9mZnNldChldmVudFBhZ2VYOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGxldCBlbGVtZW50T2Zmc2V0UHggPSB0aGlzLnNlZWtCYXIub2Zmc2V0KCkubGVmdDtcbiAgICBsZXQgd2lkdGhQeCA9IHRoaXMuc2Vla0Jhci53aWR0aCgpO1xuICAgIGxldCBvZmZzZXRQeCA9IGV2ZW50UGFnZVggLSBlbGVtZW50T2Zmc2V0UHg7XG4gICAgbGV0IG9mZnNldCA9IDEgLyB3aWR0aFB4ICogb2Zmc2V0UHg7XG5cbiAgICByZXR1cm4gdGhpcy5zYW5pdGl6ZU9mZnNldChvZmZzZXQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHZlcnRpY2FsIG9mZnNldCBvZiBhIG1vdXNlL3RvdWNoIGV2ZW50IHBvaW50IGZyb20gdGhlIGJvdHRvbSBlZGdlIG9mIHRoZSBzZWVrIGJhci5cbiAgICogQHBhcmFtIGV2ZW50UGFnZVkgdGhlIHBhZ2VYIGNvb3JkaW5hdGUgb2YgYW4gZXZlbnQgdG8gY2FsY3VsYXRlIHRoZSBvZmZzZXQgZnJvbVxuICAgKiBAcmV0dXJucyB7bnVtYmVyfSBhIG51bWJlciBpbiB0aGUgcmFuZ2Ugb2YgWzAsIDFdLCB3aGVyZSAwIGlzIHRoZSBib3R0b20gZWRnZSBhbmQgMSBpcyB0aGUgdG9wIGVkZ2VcbiAgICovXG4gIHByaXZhdGUgZ2V0VmVydGljYWxPZmZzZXQoZXZlbnRQYWdlWTogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBsZXQgZWxlbWVudE9mZnNldFB4ID0gdGhpcy5zZWVrQmFyLm9mZnNldCgpLnRvcDtcbiAgICBsZXQgd2lkdGhQeCA9IHRoaXMuc2Vla0Jhci5oZWlnaHQoKTtcbiAgICBsZXQgb2Zmc2V0UHggPSBldmVudFBhZ2VZIC0gZWxlbWVudE9mZnNldFB4O1xuICAgIGxldCBvZmZzZXQgPSAxIC8gd2lkdGhQeCAqIG9mZnNldFB4O1xuXG4gICAgcmV0dXJuIDEgLSB0aGlzLnNhbml0aXplT2Zmc2V0KG9mZnNldCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbW91c2Ugb3IgdG91Y2ggZXZlbnQgb2Zmc2V0IGZvciB0aGUgY3VycmVudCBjb25maWd1cmF0aW9uIChob3Jpem9udGFsIG9yIHZlcnRpY2FsKS5cbiAgICogQHBhcmFtIGUgdGhlIGV2ZW50IHRvIGNhbGN1bGF0ZSB0aGUgb2Zmc2V0IGZyb21cbiAgICogQHJldHVybnMge251bWJlcn0gYSBudW1iZXIgaW4gdGhlIHJhbmdlIG9mIFswLCAxXVxuICAgKiBAc2VlICNnZXRIb3Jpem9udGFsT2Zmc2V0XG4gICAqIEBzZWUgI2dldFZlcnRpY2FsT2Zmc2V0XG4gICAqL1xuICBwcml2YXRlIGdldE9mZnNldChlOiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCk6IG51bWJlciB7XG4gICAgaWYgKHRoaXMudG91Y2hTdXBwb3J0ZWQgJiYgZSBpbnN0YW5jZW9mIFRvdWNoRXZlbnQpIHtcbiAgICAgIGlmICh0aGlzLmNvbmZpZy52ZXJ0aWNhbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRWZXJ0aWNhbE9mZnNldChlLnR5cGUgPT09ICd0b3VjaGVuZCcgPyBlLmNoYW5nZWRUb3VjaGVzWzBdLnBhZ2VZIDogZS50b3VjaGVzWzBdLnBhZ2VZKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEhvcml6b250YWxPZmZzZXQoZS50eXBlID09PSAndG91Y2hlbmQnID8gZS5jaGFuZ2VkVG91Y2hlc1swXS5wYWdlWCA6IGUudG91Y2hlc1swXS5wYWdlWCk7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKGUgaW5zdGFuY2VvZiBNb3VzZUV2ZW50KSB7XG4gICAgICBpZiAodGhpcy5jb25maWcudmVydGljYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VmVydGljYWxPZmZzZXQoZS5wYWdlWSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRIb3Jpem9udGFsT2Zmc2V0KGUucGFnZVgpO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGlmIChjb25zb2xlKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignaW52YWxpZCBldmVudCcpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNhbml0aXplcyB0aGUgbW91c2Ugb2Zmc2V0IHRvIHRoZSByYW5nZSBvZiBbMCwgMV0uXG4gICAqXG4gICAqIFdoZW4gdHJhY2tpbmcgdGhlIG1vdXNlIG91dHNpZGUgdGhlIHNlZWsgYmFyLCB0aGUgb2Zmc2V0IGNhbiBiZSBvdXRzaWRlIHRoZSBkZXNpcmVkIHJhbmdlIGFuZCB0aGlzIG1ldGhvZFxuICAgKiBsaW1pdHMgaXQgdG8gdGhlIGRlc2lyZWQgcmFuZ2UuIEUuZy4gYSBtb3VzZSBldmVudCBsZWZ0IG9mIHRoZSBsZWZ0IGVkZ2Ugb2YgYSBzZWVrIGJhciB5aWVsZHMgYW4gb2Zmc2V0IGJlbG93XG4gICAqIHplcm8sIGJ1dCB0byBkaXNwbGF5IHRoZSBzZWVrIHRhcmdldCBvbiB0aGUgc2VlayBiYXIsIHdlIG5lZWQgdG8gbGltaXQgaXQgdG8gemVyby5cbiAgICpcbiAgICogQHBhcmFtIG9mZnNldCB0aGUgb2Zmc2V0IHRvIHNhbml0aXplXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9IHRoZSBzYW5pdGl6ZWQgb2Zmc2V0LlxuICAgKi9cbiAgcHJpdmF0ZSBzYW5pdGl6ZU9mZnNldChvZmZzZXQ6IG51bWJlcikge1xuICAgIC8vIFNpbmNlIHdlIHRyYWNrIG1vdXNlIG1vdmVzIG92ZXIgdGhlIHdob2xlIGRvY3VtZW50LCB0aGUgdGFyZ2V0IGNhbiBiZSBvdXRzaWRlIHRoZSBzZWVrIHJhbmdlLFxuICAgIC8vIGFuZCB3ZSBuZWVkIHRvIGxpbWl0IGl0IHRvIHRoZSBbMCwgMV0gcmFuZ2UuXG4gICAgaWYgKG9mZnNldCA8IDApIHtcbiAgICAgIG9mZnNldCA9IDA7XG4gICAgfSBlbHNlIGlmIChvZmZzZXQgPiAxKSB7XG4gICAgICBvZmZzZXQgPSAxO1xuICAgIH1cblxuICAgIHJldHVybiBvZmZzZXQ7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgcG9zaXRpb24gb2YgdGhlIHBsYXliYWNrIHBvc2l0aW9uIGluZGljYXRvci5cbiAgICogQHBhcmFtIHBlcmNlbnQgYSBudW1iZXIgYmV0d2VlbiAwIGFuZCAxMDAgYXMgcmV0dXJuZWQgYnkgdGhlIHBsYXllclxuICAgKi9cbiAgc2V0UGxheWJhY2tQb3NpdGlvbihwZXJjZW50OiBudW1iZXIpIHtcbiAgICB0aGlzLnBsYXliYWNrUG9zaXRpb25QZXJjZW50YWdlID0gcGVyY2VudDtcblxuICAgIC8vIFNldCBwb3NpdGlvbiBvZiB0aGUgYmFyXG4gICAgdGhpcy5zZXRQb3NpdGlvbih0aGlzLnNlZWtCYXJQbGF5YmFja1Bvc2l0aW9uLCBwZXJjZW50KTtcblxuICAgIC8vIFNldCBwb3NpdGlvbiBvZiB0aGUgbWFya2VyXG4gICAgbGV0IHB4ID0gKHRoaXMuY29uZmlnLnZlcnRpY2FsID8gdGhpcy5zZWVrQmFyLmhlaWdodCgpIDogdGhpcy5zZWVrQmFyLndpZHRoKCkpIC8gMTAwICogcGVyY2VudDtcbiAgICBpZiAodGhpcy5jb25maWcudmVydGljYWwpIHtcbiAgICAgIHB4ID0gdGhpcy5zZWVrQmFyLmhlaWdodCgpIC0gcHg7XG4gICAgfVxuICAgIGxldCBzdHlsZSA9IHRoaXMuY29uZmlnLnZlcnRpY2FsID9cbiAgICAgIC8vIC1tcy10cmFuc2Zvcm0gcmVxdWlyZWQgZm9yIElFOVxuICAgICAgeyAndHJhbnNmb3JtJzogJ3RyYW5zbGF0ZVkoJyArIHB4ICsgJ3B4KScsICctbXMtdHJhbnNmb3JtJzogJ3RyYW5zbGF0ZVkoJyArIHB4ICsgJ3B4KScgfSA6XG4gICAgICB7ICd0cmFuc2Zvcm0nOiAndHJhbnNsYXRlWCgnICsgcHggKyAncHgpJywgJy1tcy10cmFuc2Zvcm0nOiAndHJhbnNsYXRlWCgnICsgcHggKyAncHgpJyB9O1xuICAgIHRoaXMuc2Vla0JhclBsYXliYWNrUG9zaXRpb25NYXJrZXIuY3NzKHN0eWxlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWZyZXNoZXMgdGhlIHBsYXliYWNrIHBvc2l0aW9uLiBDYW4gYmUgdXNlZCBieSBzdWJjbGFzc2VzIHRvIHJlZnJlc2ggdGhlIHBvc2l0aW9uIHdoZW5cbiAgICogdGhlIHNpemUgb2YgdGhlIGNvbXBvbmVudCBjaGFuZ2VzLlxuICAgKi9cbiAgcHJvdGVjdGVkIHJlZnJlc2hQbGF5YmFja1Bvc2l0aW9uKCkge1xuICAgIHRoaXMuc2V0UGxheWJhY2tQb3NpdGlvbih0aGlzLnBsYXliYWNrUG9zaXRpb25QZXJjZW50YWdlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBwb3NpdGlvbiB1bnRpbCB3aGljaCBtZWRpYSBpcyBidWZmZXJlZC5cbiAgICogQHBhcmFtIHBlcmNlbnQgYSBudW1iZXIgYmV0d2VlbiAwIGFuZCAxMDBcbiAgICovXG4gIHNldEJ1ZmZlclBvc2l0aW9uKHBlcmNlbnQ6IG51bWJlcikge1xuICAgIHRoaXMuc2V0UG9zaXRpb24odGhpcy5zZWVrQmFyQnVmZmVyUG9zaXRpb24sIHBlcmNlbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHBvc2l0aW9uIHdoZXJlIGEgc2VlaywgaWYgZXhlY3V0ZWQsIHdvdWxkIGp1bXAgdG8uXG4gICAqIEBwYXJhbSBwZXJjZW50IGEgbnVtYmVyIGJldHdlZW4gMCBhbmQgMTAwXG4gICAqL1xuICBzZXRTZWVrUG9zaXRpb24ocGVyY2VudDogbnVtYmVyKSB7XG4gICAgdGhpcy5zZXRQb3NpdGlvbih0aGlzLnNlZWtCYXJTZWVrUG9zaXRpb24sIHBlcmNlbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgYWN0dWFsIHBvc2l0aW9uICh3aWR0aCBvciBoZWlnaHQpIG9mIGEgRE9NIGVsZW1lbnQgdGhhdCByZXByZXNlbnQgYSBiYXIgaW4gdGhlIHNlZWsgYmFyLlxuICAgKiBAcGFyYW0gZWxlbWVudCB0aGUgZWxlbWVudCB0byBzZXQgdGhlIHBvc2l0aW9uIGZvclxuICAgKiBAcGFyYW0gcGVyY2VudCBhIG51bWJlciBiZXR3ZWVuIDAgYW5kIDEwMFxuICAgKi9cbiAgcHJpdmF0ZSBzZXRQb3NpdGlvbihlbGVtZW50OiBET00sIHBlcmNlbnQ6IG51bWJlcikge1xuICAgIGxldCBzY2FsZSA9IHBlcmNlbnQgLyAxMDA7XG4gICAgbGV0IHN0eWxlID0gdGhpcy5jb25maWcudmVydGljYWwgP1xuICAgICAgLy8gLW1zLXRyYW5zZm9ybSByZXF1aXJlZCBmb3IgSUU5XG4gICAgICB7ICd0cmFuc2Zvcm0nOiAnc2NhbGVZKCcgKyBzY2FsZSArICcpJywgJy1tcy10cmFuc2Zvcm0nOiAnc2NhbGVZKCcgKyBzY2FsZSArICcpJyB9IDpcbiAgICAgIHsgJ3RyYW5zZm9ybSc6ICdzY2FsZVgoJyArIHNjYWxlICsgJyknLCAnLW1zLXRyYW5zZm9ybSc6ICdzY2FsZVgoJyArIHNjYWxlICsgJyknIH07XG4gICAgZWxlbWVudC5jc3Moc3R5bGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFB1dHMgdGhlIHNlZWsgYmFyIGludG8gb3Igb3V0IG9mIHNlZWtpbmcgc3RhdGUgYnkgYWRkaW5nL3JlbW92aW5nIGEgY2xhc3MgdG8gdGhlIERPTSBlbGVtZW50LiBUaGlzIGNhbiBiZSB1c2VkXG4gICAqIHRvIGFkanVzdCB0aGUgc3R5bGluZyB3aGlsZSBzZWVraW5nLlxuICAgKlxuICAgKiBAcGFyYW0gc2Vla2luZyBzaG91bGQgYmUgdHJ1ZSB3aGVuIGVudGVyaW5nIHNlZWsgc3RhdGUsIGZhbHNlIHdoZW4gZXhpdGluZyB0aGUgc2VlayBzdGF0ZVxuICAgKi9cbiAgc2V0U2Vla2luZyhzZWVraW5nOiBib29sZWFuKSB7XG4gICAgaWYgKHNlZWtpbmcpIHtcbiAgICAgIHRoaXMuZ2V0RG9tRWxlbWVudCgpLmFkZENsYXNzKHRoaXMucHJlZml4Q3NzKFNlZWtCYXIuQ0xBU1NfU0VFS0lORykpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmdldERvbUVsZW1lbnQoKS5yZW1vdmVDbGFzcyh0aGlzLnByZWZpeENzcyhTZWVrQmFyLkNMQVNTX1NFRUtJTkcpKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSBzZWVrIGJhciBpcyBjdXJyZW50bHkgaW4gdGhlIHNlZWsgc3RhdGUuXG4gICAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmIGluIHNlZWsgc3RhdGUsIGVsc2UgZmFsc2VcbiAgICovXG4gIGlzU2Vla2luZygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5nZXREb21FbGVtZW50KCkuaGFzQ2xhc3ModGhpcy5wcmVmaXhDc3MoU2Vla0Jhci5DTEFTU19TRUVLSU5HKSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSBzZWVrIGJhciBoYXMgYSB7QGxpbmsgU2Vla0JhckxhYmVsfS5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWYgdGhlIHNlZWsgYmFyIGhhcyBhIGxhYmVsLCBlbHNlIGZhbHNlXG4gICAqL1xuICBoYXNMYWJlbCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5sYWJlbCAhPSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGxhYmVsIG9mIHRoaXMgc2VlayBiYXIuXG4gICAqIEByZXR1cm5zIHtTZWVrQmFyTGFiZWx9IHRoZSBsYWJlbCBpZiB0aGlzIHNlZWsgYmFyIGhhcyBhIGxhYmVsLCBlbHNlIG51bGxcbiAgICovXG4gIGdldExhYmVsKCk6IFNlZWtCYXJMYWJlbCB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLmxhYmVsO1xuICB9XG5cbiAgcHJvdGVjdGVkIG9uU2Vla0V2ZW50KCkge1xuICAgIHRoaXMuc2Vla0JhckV2ZW50cy5vblNlZWsuZGlzcGF0Y2godGhpcyk7XG4gIH1cblxuICBwcm90ZWN0ZWQgb25TZWVrUHJldmlld0V2ZW50KHBlcmNlbnRhZ2U6IG51bWJlciwgc2NydWJiaW5nOiBib29sZWFuKSB7XG4gICAgbGV0IHNuYXBwZWRNYXJrZXIgPSB0aGlzLmdldE1hcmtlckF0UG9zaXRpb24ocGVyY2VudGFnZSk7XG5cbiAgICBpZiAodGhpcy5sYWJlbCkge1xuICAgICAgdGhpcy5sYWJlbC5zZXRUZXh0KHBlcmNlbnRhZ2UgKyAnJyk7XG4gICAgICB0aGlzLmxhYmVsLmdldERvbUVsZW1lbnQoKS5jc3Moe1xuICAgICAgICAnbGVmdCc6IChzbmFwcGVkTWFya2VyID8gc25hcHBlZE1hcmtlci50aW1lIDogcGVyY2VudGFnZSkgKyAnJSdcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRoaXMuc2Vla0JhckV2ZW50cy5vblNlZWtQcmV2aWV3LmRpc3BhdGNoKHRoaXMsIHtcbiAgICAgIHNjcnViYmluZzogc2NydWJiaW5nLFxuICAgICAgcG9zaXRpb246IHBlcmNlbnRhZ2UsXG4gICAgICBtYXJrZXI6IHNuYXBwZWRNYXJrZXIsXG4gICAgfSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgb25TZWVrZWRFdmVudChwZXJjZW50YWdlOiBudW1iZXIpIHtcbiAgICB0aGlzLnNlZWtCYXJFdmVudHMub25TZWVrZWQuZGlzcGF0Y2godGhpcywgcGVyY2VudGFnZSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZXZlbnQgdGhhdCBpcyBmaXJlZCB3aGVuIGEgc2NydWJiaW5nIHNlZWsgb3BlcmF0aW9uIGlzIHN0YXJ0ZWQuXG4gICAqIEByZXR1cm5zIHtFdmVudDxTZWVrQmFyLCBOb0FyZ3M+fVxuICAgKi9cbiAgZ2V0IG9uU2VlaygpOiBFdmVudDxTZWVrQmFyLCBOb0FyZ3M+IHtcbiAgICByZXR1cm4gdGhpcy5zZWVrQmFyRXZlbnRzLm9uU2Vlay5nZXRFdmVudCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGV2ZW50IHRoYXQgaXMgZmlyZWQgZHVyaW5nIGEgc2NydWJiaW5nIHNlZWsgKHRvIGluZGljYXRlIHRoYXQgdGhlIHNlZWsgcHJldmlldywgaS5lLiB0aGUgdmlkZW8gZnJhbWUsXG4gICAqIHNob3VsZCBiZSB1cGRhdGVkKSwgb3IgZHVyaW5nIGEgbm9ybWFsIHNlZWsgcHJldmlldyB3aGVuIHRoZSBzZWVrIGJhciBpcyBob3ZlcmVkIChhbmQgdGhlIHNlZWsgdGFyZ2V0LFxuICAgKiBpLmUuIHRoZSBzZWVrIGJhciBsYWJlbCwgc2hvdWxkIGJlIHVwZGF0ZWQpLlxuICAgKiBAcmV0dXJucyB7RXZlbnQ8U2Vla0JhciwgU2Vla1ByZXZpZXdFdmVudEFyZ3M+fVxuICAgKi9cbiAgZ2V0IG9uU2Vla1ByZXZpZXcoKTogRXZlbnQ8U2Vla0JhciwgU2Vla1ByZXZpZXdFdmVudEFyZ3M+IHtcbiAgICByZXR1cm4gdGhpcy5zZWVrQmFyRXZlbnRzLm9uU2Vla1ByZXZpZXcuZ2V0RXZlbnQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBldmVudCB0aGF0IGlzIGZpcmVkIHdoZW4gYSBzY3J1YmJpbmcgc2VlayBoYXMgZmluaXNoZWQgb3Igd2hlbiBhIGRpcmVjdCBzZWVrIGlzIGlzc3VlZC5cbiAgICogQHJldHVybnMge0V2ZW50PFNlZWtCYXIsIG51bWJlcj59XG4gICAqL1xuICBnZXQgb25TZWVrZWQoKTogRXZlbnQ8U2Vla0JhciwgbnVtYmVyPiB7XG4gICAgcmV0dXJuIHRoaXMuc2Vla0JhckV2ZW50cy5vblNlZWtlZC5nZXRFdmVudCgpO1xuICB9XG59IiwiaW1wb3J0IHtDb250YWluZXIsIENvbnRhaW5lckNvbmZpZ30gZnJvbSAnLi9jb250YWluZXInO1xuaW1wb3J0IHtMYWJlbCwgTGFiZWxDb25maWd9IGZyb20gJy4vbGFiZWwnO1xuaW1wb3J0IHtDb21wb25lbnQsIENvbXBvbmVudENvbmZpZ30gZnJvbSAnLi9jb21wb25lbnQnO1xuaW1wb3J0IHtVSUluc3RhbmNlTWFuYWdlciwgU2Vla1ByZXZpZXdBcmdzfSBmcm9tICcuLi91aW1hbmFnZXInO1xuaW1wb3J0IHtTdHJpbmdVdGlsc30gZnJvbSAnLi4vdXRpbHMnO1xuXG4vKipcbiAqIENvbmZpZ3VyYXRpb24gaW50ZXJmYWNlIGZvciBhIHtAbGluayBTZWVrQmFyTGFiZWx9LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFNlZWtCYXJMYWJlbENvbmZpZyBleHRlbmRzIENvbnRhaW5lckNvbmZpZyB7XG4gIC8vIG5vdGhpbmcgeWV0XG59XG5cbi8qKlxuICogQSBsYWJlbCBmb3IgYSB7QGxpbmsgU2Vla0Jhcn0gdGhhdCBjYW4gZGlzcGxheSB0aGUgc2VlayB0YXJnZXQgdGltZSBhbmQgYSB0aHVtYm5haWwuXG4gKi9cbmV4cG9ydCBjbGFzcyBTZWVrQmFyTGFiZWwgZXh0ZW5kcyBDb250YWluZXI8U2Vla0JhckxhYmVsQ29uZmlnPiB7XG5cbiAgcHJpdmF0ZSB0aW1lTGFiZWw6IExhYmVsPExhYmVsQ29uZmlnPjtcbiAgcHJpdmF0ZSB0aXRsZUxhYmVsOiBMYWJlbDxMYWJlbENvbmZpZz47XG4gIHByaXZhdGUgdGh1bWJuYWlsOiBDb21wb25lbnQ8Q29tcG9uZW50Q29uZmlnPjtcblxuICBwcml2YXRlIHRpbWVGb3JtYXQ6IHN0cmluZztcblxuICBjb25zdHJ1Y3Rvcihjb25maWc6IFNlZWtCYXJMYWJlbENvbmZpZyA9IHt9KSB7XG4gICAgc3VwZXIoY29uZmlnKTtcblxuICAgIHRoaXMudGltZUxhYmVsID0gbmV3IExhYmVsKHsgY3NzQ2xhc3NlczogWydzZWVrYmFyLWxhYmVsLXRpbWUnXSB9KTtcbiAgICB0aGlzLnRpdGxlTGFiZWwgPSBuZXcgTGFiZWwoeyBjc3NDbGFzc2VzOiBbJ3NlZWtiYXItbGFiZWwtdGl0bGUnXSB9KTtcbiAgICB0aGlzLnRodW1ibmFpbCA9IG5ldyBDb21wb25lbnQoeyBjc3NDbGFzc2VzOiBbJ3NlZWtiYXItdGh1bWJuYWlsJ10gfSk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IHRoaXMubWVyZ2VDb25maWcoY29uZmlnLCB7XG4gICAgICBjc3NDbGFzczogJ3VpLXNlZWtiYXItbGFiZWwnLFxuICAgICAgY29tcG9uZW50czogW25ldyBDb250YWluZXIoe1xuICAgICAgICBjb21wb25lbnRzOiBbXG4gICAgICAgICAgdGhpcy50aHVtYm5haWwsXG4gICAgICAgICAgbmV3IENvbnRhaW5lcih7XG4gICAgICAgICAgICBjb21wb25lbnRzOiBbdGhpcy50aXRsZUxhYmVsLCB0aGlzLnRpbWVMYWJlbF0sXG4gICAgICAgICAgICBjc3NDbGFzczogJ3NlZWtiYXItbGFiZWwtbWV0YWRhdGEnLFxuICAgICAgICAgIH0pXSxcbiAgICAgICAgY3NzQ2xhc3M6ICdzZWVrYmFyLWxhYmVsLWlubmVyJyxcbiAgICAgIH0pXSxcbiAgICAgIGhpZGRlbjogdHJ1ZVxuICAgIH0sIHRoaXMuY29uZmlnKTtcbiAgfVxuXG4gIGNvbmZpZ3VyZShwbGF5ZXI6IGJpdG1vdmluLnBsYXllci5QbGF5ZXIsIHVpbWFuYWdlcjogVUlJbnN0YW5jZU1hbmFnZXIpOiB2b2lkIHtcbiAgICBzdXBlci5jb25maWd1cmUocGxheWVyLCB1aW1hbmFnZXIpO1xuXG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuXG4gICAgdWltYW5hZ2VyLm9uU2Vla1ByZXZpZXcuc3Vic2NyaWJlKGZ1bmN0aW9uKHNlbmRlciwgYXJnczogU2Vla1ByZXZpZXdBcmdzKSB7XG4gICAgICBpZiAocGxheWVyLmlzTGl2ZSgpKSB7XG4gICAgICAgIGxldCB0aW1lID0gcGxheWVyLmdldE1heFRpbWVTaGlmdCgpIC0gcGxheWVyLmdldE1heFRpbWVTaGlmdCgpICogKGFyZ3MucG9zaXRpb24gLyAxMDApO1xuICAgICAgICBzZWxmLnNldFRpbWUodGltZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgdGltZSA9IDA7XG4gICAgICAgIGlmIChhcmdzLm1hcmtlcikge1xuICAgICAgICAgIHRpbWUgPSBhcmdzLm1hcmtlci50aW1lO1xuICAgICAgICAgIHNlbGYuc2V0VGl0bGVUZXh0KGFyZ3MubWFya2VyLnRpdGxlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aW1lID0gYXJncy5wb3NpdGlvbjtcbiAgICAgICAgICBzZWxmLnNldFRpdGxlVGV4dChudWxsKTtcbiAgICAgICAgfVxuICAgICAgICBzZWxmLnNldFRpbWUocGxheWVyLmdldER1cmF0aW9uKCkgKiAodGltZSAvIDEwMCkpO1xuICAgICAgICBzZWxmLnNldFRodW1ibmFpbChwbGF5ZXIuZ2V0VGh1bWIodGltZSkpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgbGV0IGluaXQgPSBmdW5jdGlvbigpIHtcbiAgICAgIC8vIFNldCB0aW1lIGZvcm1hdCBkZXBlbmRpbmcgb24gc291cmNlIGR1cmF0aW9uXG4gICAgICBzZWxmLnRpbWVGb3JtYXQgPSBNYXRoLmFicyhwbGF5ZXIuaXNMaXZlKCkgPyBwbGF5ZXIuZ2V0TWF4VGltZVNoaWZ0KCkgOiBwbGF5ZXIuZ2V0RHVyYXRpb24oKSkgPj0gMzYwMCA/XG4gICAgICAgIFN0cmluZ1V0aWxzLkZPUk1BVF9ISE1NU1MgOiBTdHJpbmdVdGlscy5GT1JNQVRfTU1TUztcbiAgICB9O1xuXG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fUkVBRFksIGluaXQpO1xuICAgIGluaXQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGFyYml0cmFyeSB0ZXh0IG9uIHRoZSBsYWJlbC5cbiAgICogQHBhcmFtIHRleHQgdGhlIHRleHQgdG8gc2hvdyBvbiB0aGUgbGFiZWxcbiAgICovXG4gIHNldFRleHQodGV4dDogc3RyaW5nKSB7XG4gICAgdGhpcy50aW1lTGFiZWwuc2V0VGV4dCh0ZXh0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGEgdGltZSB0byBiZSBkaXNwbGF5ZWQgb24gdGhlIGxhYmVsLlxuICAgKiBAcGFyYW0gc2Vjb25kcyB0aGUgdGltZSBpbiBzZWNvbmRzIHRvIGRpc3BsYXkgb24gdGhlIGxhYmVsXG4gICAqL1xuICBzZXRUaW1lKHNlY29uZHM6IG51bWJlcikge1xuICAgIHRoaXMuc2V0VGV4dChTdHJpbmdVdGlscy5zZWNvbmRzVG9UaW1lKHNlY29uZHMsIHRoaXMudGltZUZvcm1hdCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHRleHQgb24gdGhlIHRpdGxlIGxhYmVsLlxuICAgKiBAcGFyYW0gdGV4dCB0aGUgdGV4dCB0byBzaG93IG9uIHRoZSBsYWJlbFxuICAgKi9cbiAgc2V0VGl0bGVUZXh0KHRleHQ6IHN0cmluZykge1xuICAgIHRoaXMudGl0bGVMYWJlbC5zZXRUZXh0KHRleHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgb3IgcmVtb3ZlcyBhIHRodW1ibmFpbCBvbiB0aGUgbGFiZWwuXG4gICAqIEBwYXJhbSB0aHVtYm5haWwgdGhlIHRodW1ibmFpbCB0byBkaXNwbGF5IG9uIHRoZSBsYWJlbCBvciBudWxsIHRvIHJlbW92ZSBhIGRpc3BsYXllZCB0aHVtYm5haWxcbiAgICovXG4gIHNldFRodW1ibmFpbCh0aHVtYm5haWw6IGJpdG1vdmluLnBsYXllci5UaHVtYm5haWwgPSBudWxsKSB7XG4gICAgbGV0IHRodW1ibmFpbEVsZW1lbnQgPSB0aGlzLnRodW1ibmFpbC5nZXREb21FbGVtZW50KCk7XG5cbiAgICBpZiAodGh1bWJuYWlsID09IG51bGwpIHtcbiAgICAgIHRodW1ibmFpbEVsZW1lbnQuY3NzKHtcbiAgICAgICAgJ2JhY2tncm91bmQtaW1hZ2UnOiBudWxsLFxuICAgICAgICAnZGlzcGxheSc6IG51bGwsXG4gICAgICAgICd3aWR0aCc6IG51bGwsXG4gICAgICAgICdoZWlnaHQnOiBudWxsXG4gICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aHVtYm5haWxFbGVtZW50LmNzcyh7XG4gICAgICAgICdkaXNwbGF5JzogJ2luaGVyaXQnLFxuICAgICAgICAnYmFja2dyb3VuZC1pbWFnZSc6IGB1cmwoJHt0aHVtYm5haWwudXJsfSlgLFxuICAgICAgICAnd2lkdGgnOiB0aHVtYm5haWwudyArICdweCcsXG4gICAgICAgICdoZWlnaHQnOiB0aHVtYm5haWwuaCArICdweCcsXG4gICAgICAgICdiYWNrZ3JvdW5kLXBvc2l0aW9uJzogYC0ke3RodW1ibmFpbC54fXB4IC0ke3RodW1ibmFpbC55fXB4YFxuICAgICAgfSk7XG4gICAgfVxuICB9XG59IiwiaW1wb3J0IHtMaXN0U2VsZWN0b3IsIExpc3RTZWxlY3RvckNvbmZpZ30gZnJvbSAnLi9saXN0c2VsZWN0b3InO1xuaW1wb3J0IHtET019IGZyb20gJy4uL2RvbSc7XG5cbi8qKlxuICogQSBzaW1wbGUgc2VsZWN0IGJveCBwcm92aWRpbmcgdGhlIHBvc3NpYmlsaXR5IHRvIHNlbGVjdCBhIHNpbmdsZSBpdGVtIG91dCBvZiBhIGxpc3Qgb2YgYXZhaWxhYmxlIGl0ZW1zLlxuICpcbiAqIERPTSBleGFtcGxlOlxuICogPGNvZGU+XG4gKiAgICAgPHNlbGVjdCBjbGFzcz0ndWktc2VsZWN0Ym94Jz5cbiAqICAgICAgICAgPG9wdGlvbiB2YWx1ZT0na2V5Jz5sYWJlbDwvb3B0aW9uPlxuICogICAgICAgICAuLi5cbiAqICAgICA8L3NlbGVjdD5cbiAqIDwvY29kZT5cbiAqL1xuZXhwb3J0IGNsYXNzIFNlbGVjdEJveCBleHRlbmRzIExpc3RTZWxlY3RvcjxMaXN0U2VsZWN0b3JDb25maWc+IHtcblxuICBwcml2YXRlIHNlbGVjdEVsZW1lbnQ6IERPTTtcblxuICBjb25zdHJ1Y3Rvcihjb25maWc6IExpc3RTZWxlY3RvckNvbmZpZyA9IHt9KSB7XG4gICAgc3VwZXIoY29uZmlnKTtcblxuICAgIHRoaXMuY29uZmlnID0gdGhpcy5tZXJnZUNvbmZpZyhjb25maWcsIHtcbiAgICAgIGNzc0NsYXNzOiAndWktc2VsZWN0Ym94J1xuICAgIH0sIHRoaXMuY29uZmlnKTtcbiAgfVxuXG4gIHByb3RlY3RlZCB0b0RvbUVsZW1lbnQoKTogRE9NIHtcbiAgICBsZXQgc2VsZWN0RWxlbWVudCA9IG5ldyBET00oJ3NlbGVjdCcsIHtcbiAgICAgICdpZCc6IHRoaXMuY29uZmlnLmlkLFxuICAgICAgJ2NsYXNzJzogdGhpcy5nZXRDc3NDbGFzc2VzKClcbiAgICB9KTtcblxuICAgIHRoaXMuc2VsZWN0RWxlbWVudCA9IHNlbGVjdEVsZW1lbnQ7XG4gICAgdGhpcy51cGRhdGVEb21JdGVtcygpO1xuXG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgIHNlbGVjdEVsZW1lbnQub24oJ2NoYW5nZScsIGZ1bmN0aW9uKCkge1xuICAgICAgbGV0IHZhbHVlID0gbmV3IERPTSh0aGlzKS52YWwoKTtcbiAgICAgIHNlbGYub25JdGVtU2VsZWN0ZWRFdmVudCh2YWx1ZSwgZmFsc2UpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHNlbGVjdEVsZW1lbnQ7XG4gIH1cblxuICBwcm90ZWN0ZWQgdXBkYXRlRG9tSXRlbXMoc2VsZWN0ZWRWYWx1ZTogc3RyaW5nID0gbnVsbCkge1xuICAgIC8vIERlbGV0ZSBhbGwgY2hpbGRyZW5cbiAgICB0aGlzLnNlbGVjdEVsZW1lbnQuZW1wdHkoKTtcblxuICAgIC8vIEFkZCB1cGRhdGVkIGNoaWxkcmVuXG4gICAgZm9yIChsZXQgaXRlbSBvZiB0aGlzLml0ZW1zKSB7XG4gICAgICBsZXQgb3B0aW9uRWxlbWVudCA9IG5ldyBET00oJ29wdGlvbicsIHtcbiAgICAgICAgJ3ZhbHVlJzogaXRlbS5rZXlcbiAgICAgIH0pLmh0bWwoaXRlbS5sYWJlbCk7XG5cbiAgICAgIGlmIChpdGVtLmtleSA9PT0gc2VsZWN0ZWRWYWx1ZSArICcnKSB7IC8vIGNvbnZlcnQgc2VsZWN0ZWRWYWx1ZSB0byBzdHJpbmcgdG8gY2F0Y2ggJ251bGwnL251bGwgY2FzZVxuICAgICAgICBvcHRpb25FbGVtZW50LmF0dHIoJ3NlbGVjdGVkJywgJ3NlbGVjdGVkJyk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc2VsZWN0RWxlbWVudC5hcHBlbmQob3B0aW9uRWxlbWVudCk7XG4gICAgfVxuICB9XG5cbiAgcHJvdGVjdGVkIG9uSXRlbUFkZGVkRXZlbnQodmFsdWU6IHN0cmluZykge1xuICAgIHN1cGVyLm9uSXRlbUFkZGVkRXZlbnQodmFsdWUpO1xuICAgIHRoaXMudXBkYXRlRG9tSXRlbXModGhpcy5zZWxlY3RlZEl0ZW0pO1xuICB9XG5cbiAgcHJvdGVjdGVkIG9uSXRlbVJlbW92ZWRFdmVudCh2YWx1ZTogc3RyaW5nKSB7XG4gICAgc3VwZXIub25JdGVtUmVtb3ZlZEV2ZW50KHZhbHVlKTtcbiAgICB0aGlzLnVwZGF0ZURvbUl0ZW1zKHRoaXMuc2VsZWN0ZWRJdGVtKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBvbkl0ZW1TZWxlY3RlZEV2ZW50KHZhbHVlOiBzdHJpbmcsIHVwZGF0ZURvbUl0ZW1zOiBib29sZWFuID0gdHJ1ZSkge1xuICAgIHN1cGVyLm9uSXRlbVNlbGVjdGVkRXZlbnQodmFsdWUpO1xuICAgIGlmICh1cGRhdGVEb21JdGVtcykge1xuICAgICAgdGhpcy51cGRhdGVEb21JdGVtcyh2YWx1ZSk7XG4gICAgfVxuICB9XG59IiwiaW1wb3J0IHtDb250YWluZXJDb25maWcsIENvbnRhaW5lcn0gZnJvbSAnLi9jb250YWluZXInO1xuaW1wb3J0IHtTZWxlY3RCb3h9IGZyb20gJy4vc2VsZWN0Ym94JztcbmltcG9ydCB7TGFiZWwsIExhYmVsQ29uZmlnfSBmcm9tICcuL2xhYmVsJztcbmltcG9ydCB7VUlJbnN0YW5jZU1hbmFnZXJ9IGZyb20gJy4uL3VpbWFuYWdlcic7XG5pbXBvcnQge1ZpZGVvUXVhbGl0eVNlbGVjdEJveH0gZnJvbSAnLi92aWRlb3F1YWxpdHlzZWxlY3Rib3gnO1xuaW1wb3J0IHtBdWRpb1F1YWxpdHlTZWxlY3RCb3h9IGZyb20gJy4vYXVkaW9xdWFsaXR5c2VsZWN0Ym94JztcbmltcG9ydCB7VGltZW91dH0gZnJvbSAnLi4vdGltZW91dCc7XG5pbXBvcnQge0V2ZW50LCBFdmVudERpc3BhdGNoZXIsIE5vQXJnc30gZnJvbSAnLi4vZXZlbnRkaXNwYXRjaGVyJztcblxuLyoqXG4gKiBDb25maWd1cmF0aW9uIGludGVyZmFjZSBmb3IgYSB7QGxpbmsgU2V0dGluZ3NQYW5lbH0uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2V0dGluZ3NQYW5lbENvbmZpZyBleHRlbmRzIENvbnRhaW5lckNvbmZpZyB7XG4gIC8qKlxuICAgKiBUaGUgZGVsYXkgaW4gbWlsbGlzZWNvbmRzIGFmdGVyIHdoaWNoIHRoZSBzZXR0aW5ncyBwYW5lbCB3aWxsIGJlIGhpZGRlbiB3aGVuIHRoZXJlIGlzIG5vIHVzZXIgaW50ZXJhY3Rpb24uXG4gICAqIFNldCB0byAtMSB0byBkaXNhYmxlIGF1dG9tYXRpYyBoaWRpbmcuXG4gICAqIERlZmF1bHQ6IDMgc2Vjb25kcyAoMzAwMClcbiAgICovXG4gIGhpZGVEZWxheT86IG51bWJlcjtcbn1cblxuLyoqXG4gKiBBIHBhbmVsIGNvbnRhaW5pbmcgYSBsaXN0IG9mIHtAbGluayBTZXR0aW5nc1BhbmVsSXRlbSBpdGVtc30gdGhhdCByZXByZXNlbnQgbGFiZWxsZWQgc2V0dGluZ3MuXG4gKi9cbmV4cG9ydCBjbGFzcyBTZXR0aW5nc1BhbmVsIGV4dGVuZHMgQ29udGFpbmVyPFNldHRpbmdzUGFuZWxDb25maWc+IHtcblxuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBDTEFTU19MQVNUID0gJ2xhc3QnO1xuXG4gIHByaXZhdGUgc2V0dGluZ3NQYW5lbEV2ZW50cyA9IHtcbiAgICBvblNldHRpbmdzU3RhdGVDaGFuZ2VkOiBuZXcgRXZlbnREaXNwYXRjaGVyPFNldHRpbmdzUGFuZWwsIE5vQXJncz4oKVxuICB9O1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogU2V0dGluZ3NQYW5lbENvbmZpZykge1xuICAgIHN1cGVyKGNvbmZpZyk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IHRoaXMubWVyZ2VDb25maWc8U2V0dGluZ3NQYW5lbENvbmZpZz4oY29uZmlnLCB7XG4gICAgICBjc3NDbGFzczogJ3VpLXNldHRpbmdzLXBhbmVsJyxcbiAgICAgIGhpZGVEZWxheTogMzAwMFxuICAgIH0sIHRoaXMuY29uZmlnKTtcbiAgfVxuXG4gIGNvbmZpZ3VyZShwbGF5ZXI6IGJpdG1vdmluLnBsYXllci5QbGF5ZXIsIHVpbWFuYWdlcjogVUlJbnN0YW5jZU1hbmFnZXIpOiB2b2lkIHtcbiAgICBzdXBlci5jb25maWd1cmUocGxheWVyLCB1aW1hbmFnZXIpO1xuXG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgIGxldCBjb25maWcgPSA8U2V0dGluZ3NQYW5lbENvbmZpZz50aGlzLmdldENvbmZpZygpOyAvLyBUT0RPIGZpeCBnZW5lcmljcyB0eXBlIGluZmVyZW5jZVxuXG4gICAgaWYgKGNvbmZpZy5oaWRlRGVsYXkgPiAtMSkge1xuICAgICAgbGV0IHRpbWVvdXQgPSBuZXcgVGltZW91dChjb25maWcuaGlkZURlbGF5LCBmdW5jdGlvbigpIHtcbiAgICAgICAgc2VsZi5oaWRlKCk7XG4gICAgICB9KTtcblxuICAgICAgc2VsZi5vblNob3cuc3Vic2NyaWJlKGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBBY3RpdmF0ZSB0aW1lb3V0IHdoZW4gc2hvd25cbiAgICAgICAgdGltZW91dC5zdGFydCgpO1xuICAgICAgfSk7XG4gICAgICBzZWxmLmdldERvbUVsZW1lbnQoKS5vbignbW91c2Vtb3ZlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIFJlc2V0IHRpbWVvdXQgb24gaW50ZXJhY3Rpb25cbiAgICAgICAgdGltZW91dC5yZXNldCgpO1xuICAgICAgfSk7XG4gICAgICBzZWxmLm9uSGlkZS5zdWJzY3JpYmUoZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIENsZWFyIHRpbWVvdXQgd2hlbiBoaWRkZW4gZnJvbSBvdXRzaWRlXG4gICAgICAgIHRpbWVvdXQuY2xlYXIoKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIEZpcmUgZXZlbnQgd2hlbiB0aGUgc3RhdGUgb2YgYSBzZXR0aW5ncy1pdGVtIGhhcyBjaGFuZ2VkXG4gICAgbGV0IHNldHRpbmdzU3RhdGVDaGFuZ2VkSGFuZGxlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5vblNldHRpbmdzU3RhdGVDaGFuZ2VkRXZlbnQoKTtcblxuICAgICAgLy8gQXR0YWNoIG1hcmtlciBjbGFzcyB0byBsYXN0IHZpc2libGUgaXRlbVxuICAgICAgbGV0IGxhc3RTaG93bkl0ZW0gPSBudWxsO1xuICAgICAgZm9yIChsZXQgY29tcG9uZW50IG9mIHNlbGYuZ2V0SXRlbXMoKSkge1xuICAgICAgICBpZiAoY29tcG9uZW50IGluc3RhbmNlb2YgU2V0dGluZ3NQYW5lbEl0ZW0pIHtcbiAgICAgICAgICBjb21wb25lbnQuZ2V0RG9tRWxlbWVudCgpLnJlbW92ZUNsYXNzKHNlbGYucHJlZml4Q3NzKFNldHRpbmdzUGFuZWwuQ0xBU1NfTEFTVCkpO1xuICAgICAgICAgIGlmIChjb21wb25lbnQuaXNTaG93bigpKSB7XG4gICAgICAgICAgICBsYXN0U2hvd25JdGVtID0gY29tcG9uZW50O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGxhc3RTaG93bkl0ZW0pIHtcbiAgICAgICAgbGFzdFNob3duSXRlbS5nZXREb21FbGVtZW50KCkuYWRkQ2xhc3Moc2VsZi5wcmVmaXhDc3MoU2V0dGluZ3NQYW5lbC5DTEFTU19MQVNUKSk7XG4gICAgICB9XG4gICAgfTtcbiAgICBmb3IgKGxldCBjb21wb25lbnQgb2YgdGhpcy5nZXRJdGVtcygpKSB7XG4gICAgICBpZiAoY29tcG9uZW50IGluc3RhbmNlb2YgU2V0dGluZ3NQYW5lbEl0ZW0pIHtcbiAgICAgICAgY29tcG9uZW50Lm9uQWN0aXZlQ2hhbmdlZC5zdWJzY3JpYmUoc2V0dGluZ3NTdGF0ZUNoYW5nZWRIYW5kbGVyKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZXJlIGFyZSBhY3RpdmUgc2V0dGluZ3Mgd2l0aGluIHRoaXMgc2V0dGluZ3MgcGFuZWwuIEFuIGFjdGl2ZSBzZXR0aW5nIGlzIGEgc2V0dGluZyB0aGF0IGlzIHZpc2libGVcbiAgICogYW5kIGVuYWJsZWQsIHdoaWNoIHRoZSB1c2VyIGNhbiBpbnRlcmFjdCB3aXRoLlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGVyZSBhcmUgYWN0aXZlIHNldHRpbmdzLCBmYWxzZSBpZiB0aGUgcGFuZWwgaXMgZnVuY3Rpb25hbGx5IGVtcHR5IHRvIGEgdXNlclxuICAgKi9cbiAgaGFzQWN0aXZlU2V0dGluZ3MoKTogYm9vbGVhbiB7XG4gICAgZm9yIChsZXQgY29tcG9uZW50IG9mIHRoaXMuZ2V0SXRlbXMoKSkge1xuICAgICAgaWYgKGNvbXBvbmVudC5pc0FjdGl2ZSgpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0SXRlbXMoKTogU2V0dGluZ3NQYW5lbEl0ZW1bXSB7XG4gICAgcmV0dXJuIDxTZXR0aW5nc1BhbmVsSXRlbVtdPnRoaXMuY29uZmlnLmNvbXBvbmVudHM7XG4gIH1cblxuICBwcm90ZWN0ZWQgb25TZXR0aW5nc1N0YXRlQ2hhbmdlZEV2ZW50KCkge1xuICAgIHRoaXMuc2V0dGluZ3NQYW5lbEV2ZW50cy5vblNldHRpbmdzU3RhdGVDaGFuZ2VkLmRpc3BhdGNoKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGV2ZW50IHRoYXQgaXMgZmlyZWQgd2hlbiBvbmUgb3IgbW9yZSB7QGxpbmsgU2V0dGluZ3NQYW5lbEl0ZW0gaXRlbXN9IGhhdmUgY2hhbmdlZCBzdGF0ZS5cbiAgICogQHJldHVybnMge0V2ZW50PFNldHRpbmdzUGFuZWwsIE5vQXJncz59XG4gICAqL1xuICBnZXQgb25TZXR0aW5nc1N0YXRlQ2hhbmdlZCgpOiBFdmVudDxTZXR0aW5nc1BhbmVsLCBOb0FyZ3M+IHtcbiAgICByZXR1cm4gdGhpcy5zZXR0aW5nc1BhbmVsRXZlbnRzLm9uU2V0dGluZ3NTdGF0ZUNoYW5nZWQuZ2V0RXZlbnQoKTtcbiAgfVxufVxuXG4vKipcbiAqIEFuIGl0ZW0gZm9yIGEge0BsaW5rIFNldHRpbmdzUGFuZWx9LCBjb250YWluaW5nIGEge0BsaW5rIExhYmVsfSBhbmQgYSBjb21wb25lbnQgdGhhdCBjb25maWd1cmVzIGEgc2V0dGluZy5cbiAqIFN1cHBvcnRlZCBzZXR0aW5nIGNvbXBvbmVudHM6IHtAbGluayBTZWxlY3RCb3h9XG4gKi9cbmV4cG9ydCBjbGFzcyBTZXR0aW5nc1BhbmVsSXRlbSBleHRlbmRzIENvbnRhaW5lcjxDb250YWluZXJDb25maWc+IHtcblxuICBwcml2YXRlIGxhYmVsOiBMYWJlbDxMYWJlbENvbmZpZz47XG4gIHByaXZhdGUgc2V0dGluZzogU2VsZWN0Qm94O1xuXG4gIHByaXZhdGUgc2V0dGluZ3NQYW5lbEl0ZW1FdmVudHMgPSB7XG4gICAgb25BY3RpdmVDaGFuZ2VkOiBuZXcgRXZlbnREaXNwYXRjaGVyPFNldHRpbmdzUGFuZWxJdGVtLCBOb0FyZ3M+KClcbiAgfTtcblxuICBjb25zdHJ1Y3RvcihsYWJlbDogc3RyaW5nLCBzZWxlY3RCb3g6IFNlbGVjdEJveCwgY29uZmlnOiBDb250YWluZXJDb25maWcgPSB7fSkge1xuICAgIHN1cGVyKGNvbmZpZyk7XG5cbiAgICB0aGlzLmxhYmVsID0gbmV3IExhYmVsKHsgdGV4dDogbGFiZWwgfSk7XG4gICAgdGhpcy5zZXR0aW5nID0gc2VsZWN0Qm94O1xuXG4gICAgdGhpcy5jb25maWcgPSB0aGlzLm1lcmdlQ29uZmlnKGNvbmZpZywge1xuICAgICAgY3NzQ2xhc3M6ICd1aS1zZXR0aW5ncy1wYW5lbC1pdGVtJyxcbiAgICAgIGNvbXBvbmVudHM6IFt0aGlzLmxhYmVsLCB0aGlzLnNldHRpbmddXG4gICAgfSwgdGhpcy5jb25maWcpO1xuICB9XG5cbiAgY29uZmlndXJlKHBsYXllcjogYml0bW92aW4ucGxheWVyLlBsYXllciwgdWltYW5hZ2VyOiBVSUluc3RhbmNlTWFuYWdlcik6IHZvaWQge1xuICAgIGxldCBzZWxmID0gdGhpcztcblxuICAgIGxldCBoYW5kbGVDb25maWdJdGVtQ2hhbmdlZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgLy8gVGhlIG1pbmltdW0gbnVtYmVyIG9mIGl0ZW1zIHRoYXQgbXVzdCBiZSBhdmFpbGFibGUgZm9yIHRoZSBzZXR0aW5nIHRvIGJlIGRpc3BsYXllZFxuICAgICAgLy8gQnkgZGVmYXVsdCwgYXQgbGVhc3QgdHdvIGl0ZW1zIG11c3QgYmUgYXZhaWxhYmxlLCBlbHNlIGEgc2VsZWN0aW9uIGlzIG5vdCBwb3NzaWJsZVxuICAgICAgbGV0IG1pbkl0ZW1zVG9EaXNwbGF5ID0gMjtcbiAgICAgIC8vIEF1ZGlvL3ZpZGVvIHF1YWxpdHkgc2VsZWN0IGJveGVzIGNvbnRhaW4gYW4gYWRkaXRpb25hbCAnYXV0bycgbW9kZSwgd2hpY2ggaW4gY29tYmluYXRpb24gd2l0aCBhIHNpbmdsZVxuICAgICAgLy8gYXZhaWxhYmxlIHF1YWxpdHkgYWxzbyBkb2VzIG5vdCBtYWtlIHNlbnNlXG4gICAgICBpZiAoc2VsZi5zZXR0aW5nIGluc3RhbmNlb2YgVmlkZW9RdWFsaXR5U2VsZWN0Qm94IHx8IHNlbGYuc2V0dGluZyBpbnN0YW5jZW9mIEF1ZGlvUXVhbGl0eVNlbGVjdEJveCkge1xuICAgICAgICBtaW5JdGVtc1RvRGlzcGxheSA9IDM7XG4gICAgICB9XG5cbiAgICAgIC8vIEhpZGUgdGhlIHNldHRpbmcgaWYgbm8gbWVhbmluZ2Z1bCBjaG9pY2UgaXMgYXZhaWxhYmxlXG4gICAgICBpZiAoc2VsZi5zZXR0aW5nLml0ZW1Db3VudCgpIDwgbWluSXRlbXNUb0Rpc3BsYXkpIHtcbiAgICAgICAgc2VsZi5oaWRlKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZWxmLnNob3coKTtcbiAgICAgIH1cblxuICAgICAgLy8gVmlzaWJpbGl0eSBtaWdodCBoYXZlIGNoYW5nZWQgYW5kIHRoZXJlZm9yZSB0aGUgYWN0aXZlIHN0YXRlIG1pZ2h0IGhhdmUgY2hhbmdlZCBzbyB3ZSBmaXJlIHRoZSBldmVudFxuICAgICAgLy8gVE9ETyBmaXJlIG9ubHkgd2hlbiBzdGF0ZSBoYXMgcmVhbGx5IGNoYW5nZWQgKGUuZy4gY2hlY2sgaWYgdmlzaWJpbGl0eSBoYXMgcmVhbGx5IGNoYW5nZWQpXG4gICAgICBzZWxmLm9uQWN0aXZlQ2hhbmdlZEV2ZW50KCk7XG4gICAgfTtcblxuICAgIHNlbGYuc2V0dGluZy5vbkl0ZW1BZGRlZC5zdWJzY3JpYmUoaGFuZGxlQ29uZmlnSXRlbUNoYW5nZWQpO1xuICAgIHNlbGYuc2V0dGluZy5vbkl0ZW1SZW1vdmVkLnN1YnNjcmliZShoYW5kbGVDb25maWdJdGVtQ2hhbmdlZCk7XG5cbiAgICAvLyBJbml0aWFsaXplIGhpZGRlbiBzdGF0ZVxuICAgIGhhbmRsZUNvbmZpZ0l0ZW1DaGFuZ2VkKCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoaXMgc2V0dGluZ3MgcGFuZWwgaXRlbSBpcyBhY3RpdmUsIGkuZS4gdmlzaWJsZSBhbmQgZW5hYmxlZCBhbmQgYSB1c2VyIGNhbiBpbnRlcmFjdCB3aXRoIGl0LlxuICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgcGFuZWwgaXMgYWN0aXZlLCBlbHNlIGZhbHNlXG4gICAqL1xuICBpc0FjdGl2ZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5pc1Nob3duKCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgb25BY3RpdmVDaGFuZ2VkRXZlbnQoKSB7XG4gICAgdGhpcy5zZXR0aW5nc1BhbmVsSXRlbUV2ZW50cy5vbkFjdGl2ZUNoYW5nZWQuZGlzcGF0Y2godGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZXZlbnQgdGhhdCBpcyBmaXJlZCB3aGVuIHRoZSAnYWN0aXZlJyBzdGF0ZSBvZiB0aGlzIGl0ZW0gY2hhbmdlcy5cbiAgICogQHNlZSAjaXNBY3RpdmVcbiAgICogQHJldHVybnMge0V2ZW50PFNldHRpbmdzUGFuZWxJdGVtLCBOb0FyZ3M+fVxuICAgKi9cbiAgZ2V0IG9uQWN0aXZlQ2hhbmdlZCgpOiBFdmVudDxTZXR0aW5nc1BhbmVsSXRlbSwgTm9BcmdzPiB7XG4gICAgcmV0dXJuIHRoaXMuc2V0dGluZ3NQYW5lbEl0ZW1FdmVudHMub25BY3RpdmVDaGFuZ2VkLmdldEV2ZW50KCk7XG4gIH1cbn0iLCJpbXBvcnQge1RvZ2dsZUJ1dHRvbiwgVG9nZ2xlQnV0dG9uQ29uZmlnfSBmcm9tICcuL3RvZ2dsZWJ1dHRvbic7XG5pbXBvcnQge1NldHRpbmdzUGFuZWx9IGZyb20gJy4vc2V0dGluZ3NwYW5lbCc7XG5pbXBvcnQge1VJSW5zdGFuY2VNYW5hZ2VyfSBmcm9tICcuLi91aW1hbmFnZXInO1xuXG4vKipcbiAqIENvbmZpZ3VyYXRpb24gaW50ZXJmYWNlIGZvciB0aGUge0BsaW5rIFNldHRpbmdzVG9nZ2xlQnV0dG9ufS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTZXR0aW5nc1RvZ2dsZUJ1dHRvbkNvbmZpZyBleHRlbmRzIFRvZ2dsZUJ1dHRvbkNvbmZpZyB7XG4gIC8qKlxuICAgKiBUaGUgc2V0dGluZ3MgcGFuZWwgd2hvc2UgdmlzaWJpbGl0eSB0aGUgYnV0dG9uIHNob3VsZCB0b2dnbGUuXG4gICAqL1xuICBzZXR0aW5nc1BhbmVsOiBTZXR0aW5nc1BhbmVsO1xuXG4gIC8qKlxuICAgKiBEZWNpZGVzIGlmIHRoZSBidXR0b24gc2hvdWxkIGJlIGF1dG9tYXRpY2FsbHkgaGlkZGVuIHdoZW4gdGhlIHNldHRpbmdzIHBhbmVsIGRvZXMgbm90IGNvbnRhaW4gYW55IGFjdGl2ZSBzZXR0aW5ncy5cbiAgICogRGVmYXVsdDogdHJ1ZVxuICAgKi9cbiAgYXV0b0hpZGVXaGVuTm9BY3RpdmVTZXR0aW5ncz86IGJvb2xlYW47XG59XG5cbi8qKlxuICogQSBidXR0b24gdGhhdCB0b2dnbGVzIHZpc2liaWxpdHkgb2YgYSBzZXR0aW5ncyBwYW5lbC5cbiAqL1xuZXhwb3J0IGNsYXNzIFNldHRpbmdzVG9nZ2xlQnV0dG9uIGV4dGVuZHMgVG9nZ2xlQnV0dG9uPFNldHRpbmdzVG9nZ2xlQnV0dG9uQ29uZmlnPiB7XG5cbiAgY29uc3RydWN0b3IoY29uZmlnOiBTZXR0aW5nc1RvZ2dsZUJ1dHRvbkNvbmZpZykge1xuICAgIHN1cGVyKGNvbmZpZyk7XG5cbiAgICBpZiAoIWNvbmZpZy5zZXR0aW5nc1BhbmVsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlcXVpcmVkIFNldHRpbmdzUGFuZWwgaXMgbWlzc2luZycpO1xuICAgIH1cblxuICAgIHRoaXMuY29uZmlnID0gdGhpcy5tZXJnZUNvbmZpZyhjb25maWcsIHtcbiAgICAgIGNzc0NsYXNzOiAndWktc2V0dGluZ3N0b2dnbGVidXR0b24nLFxuICAgICAgdGV4dDogJ1NldHRpbmdzJyxcbiAgICAgIHNldHRpbmdzUGFuZWw6IG51bGwsXG4gICAgICBhdXRvSGlkZVdoZW5Ob0FjdGl2ZVNldHRpbmdzOiB0cnVlXG4gICAgfSwgPFNldHRpbmdzVG9nZ2xlQnV0dG9uQ29uZmlnPnRoaXMuY29uZmlnKTtcbiAgfVxuXG4gIGNvbmZpZ3VyZShwbGF5ZXI6IGJpdG1vdmluLnBsYXllci5QbGF5ZXIsIHVpbWFuYWdlcjogVUlJbnN0YW5jZU1hbmFnZXIpOiB2b2lkIHtcbiAgICBzdXBlci5jb25maWd1cmUocGxheWVyLCB1aW1hbmFnZXIpO1xuXG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgIGxldCBjb25maWcgPSA8U2V0dGluZ3NUb2dnbGVCdXR0b25Db25maWc+dGhpcy5nZXRDb25maWcoKTsgLy8gVE9ETyBmaXggZ2VuZXJpY3MgdHlwZSBpbmZlcmVuY2VcbiAgICBsZXQgc2V0dGluZ3NQYW5lbCA9IGNvbmZpZy5zZXR0aW5nc1BhbmVsO1xuXG4gICAgdGhpcy5vbkNsaWNrLnN1YnNjcmliZShmdW5jdGlvbigpIHtcbiAgICAgIHNldHRpbmdzUGFuZWwudG9nZ2xlSGlkZGVuKCk7XG4gICAgfSk7XG4gICAgc2V0dGluZ3NQYW5lbC5vblNob3cuc3Vic2NyaWJlKGZ1bmN0aW9uKCkge1xuICAgICAgLy8gU2V0IHRvZ2dsZSBzdGF0dXMgdG8gb24gd2hlbiB0aGUgc2V0dGluZ3MgcGFuZWwgc2hvd3NcbiAgICAgIHNlbGYub24oKTtcbiAgICB9KTtcbiAgICBzZXR0aW5nc1BhbmVsLm9uSGlkZS5zdWJzY3JpYmUoZnVuY3Rpb24oKSB7XG4gICAgICAvLyBTZXQgdG9nZ2xlIHN0YXR1cyB0byBvZmYgd2hlbiB0aGUgc2V0dGluZ3MgcGFuZWwgaGlkZXNcbiAgICAgIHNlbGYub2ZmKCk7XG4gICAgfSk7XG5cbiAgICAvLyBIYW5kbGUgYXV0b21hdGljIGhpZGluZyBvZiB0aGUgYnV0dG9uIGlmIHRoZXJlIGFyZSBubyBzZXR0aW5ncyBmb3IgdGhlIHVzZXIgdG8gaW50ZXJhY3Qgd2l0aFxuICAgIGlmIChjb25maWcuYXV0b0hpZGVXaGVuTm9BY3RpdmVTZXR0aW5ncykge1xuICAgICAgLy8gU2V0dXAgaGFuZGxlciB0byBzaG93L2hpZGUgYnV0dG9uIHdoZW4gdGhlIHNldHRpbmdzIGNoYW5nZVxuICAgICAgbGV0IHNldHRpbmdzUGFuZWxJdGVtc0NoYW5nZWRIYW5kbGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChzZXR0aW5nc1BhbmVsLmhhc0FjdGl2ZVNldHRpbmdzKCkpIHtcbiAgICAgICAgICBpZiAoc2VsZi5pc0hpZGRlbigpKSB7XG4gICAgICAgICAgICBzZWxmLnNob3coKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHNlbGYuaXNTaG93bigpKSB7XG4gICAgICAgICAgICBzZWxmLmhpZGUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICAvLyBXaXJlIHRoZSBoYW5kbGVyIHRvIHRoZSBldmVudFxuICAgICAgc2V0dGluZ3NQYW5lbC5vblNldHRpbmdzU3RhdGVDaGFuZ2VkLnN1YnNjcmliZShzZXR0aW5nc1BhbmVsSXRlbXNDaGFuZ2VkSGFuZGxlcik7XG4gICAgICAvLyBDYWxsIGhhbmRsZXIgZm9yIGZpcnN0IGluaXQgYXQgc3RhcnR1cFxuICAgICAgc2V0dGluZ3NQYW5lbEl0ZW1zQ2hhbmdlZEhhbmRsZXIoKTtcbiAgICB9XG4gIH1cbn0iLCJpbXBvcnQge0NvbnRhaW5lciwgQ29udGFpbmVyQ29uZmlnfSBmcm9tICcuL2NvbnRhaW5lcic7XG5pbXBvcnQge1VJSW5zdGFuY2VNYW5hZ2VyfSBmcm9tICcuLi91aW1hbmFnZXInO1xuaW1wb3J0IFN1YnRpdGxlQ3VlRXZlbnQgPSBiaXRtb3Zpbi5wbGF5ZXIuU3VidGl0bGVDdWVFdmVudDtcbmltcG9ydCB7TGFiZWwsIExhYmVsQ29uZmlnfSBmcm9tICcuL2xhYmVsJztcbmltcG9ydCB7Q29tcG9uZW50Q29uZmlnLCBDb21wb25lbnR9IGZyb20gJy4vY29tcG9uZW50JztcbmltcG9ydCB7Q29udHJvbEJhcn0gZnJvbSAnLi9jb250cm9sYmFyJztcblxuLyoqXG4gKiBPdmVybGF5cyB0aGUgcGxheWVyIHRvIGRpc3BsYXkgc3VidGl0bGVzLlxuICovXG5leHBvcnQgY2xhc3MgU3VidGl0bGVPdmVybGF5IGV4dGVuZHMgQ29udGFpbmVyPENvbnRhaW5lckNvbmZpZz4ge1xuXG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IENMQVNTX0NPTlRST0xCQVJfVklTSUJMRSA9ICdjb250cm9sYmFyLXZpc2libGUnO1xuXG4gIC8qKlxuICAgKiBJbm5lciBsYWJlbCB0aGF0IHJlbmRlcnMgdGhlIHN1YnRpdGxlIHRleHRcbiAgICovXG4gIHByaXZhdGUgc3VidGl0bGVMYWJlbDogTGFiZWw8TGFiZWxDb25maWc+O1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogQ29udGFpbmVyQ29uZmlnID0ge30pIHtcbiAgICBzdXBlcihjb25maWcpO1xuXG4gICAgdGhpcy5zdWJ0aXRsZUxhYmVsID0gbmV3IExhYmVsPExhYmVsQ29uZmlnPih7IGNzc0NsYXNzOiAndWktc3VidGl0bGUtbGFiZWwnIH0pO1xuXG4gICAgdGhpcy5jb25maWcgPSB0aGlzLm1lcmdlQ29uZmlnKGNvbmZpZywge1xuICAgICAgY3NzQ2xhc3M6ICd1aS1zdWJ0aXRsZS1vdmVybGF5JyxcbiAgICAgIGNvbXBvbmVudHM6IFt0aGlzLnN1YnRpdGxlTGFiZWxdXG4gICAgfSwgdGhpcy5jb25maWcpO1xuICB9XG5cbiAgY29uZmlndXJlKHBsYXllcjogYml0bW92aW4ucGxheWVyLlBsYXllciwgdWltYW5hZ2VyOiBVSUluc3RhbmNlTWFuYWdlcik6IHZvaWQge1xuICAgIHN1cGVyLmNvbmZpZ3VyZShwbGF5ZXIsIHVpbWFuYWdlcik7XG5cbiAgICBsZXQgc2VsZiA9IHRoaXM7XG5cbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9DVUVfRU5URVIsIGZ1bmN0aW9uKGV2ZW50OiBTdWJ0aXRsZUN1ZUV2ZW50KSB7XG4gICAgICBzZWxmLnN1YnRpdGxlTGFiZWwuc2V0VGV4dChldmVudC50ZXh0KTtcbiAgICB9KTtcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9DVUVfRVhJVCwgZnVuY3Rpb24oZXZlbnQ6IFN1YnRpdGxlQ3VlRXZlbnQpIHtcbiAgICAgIHNlbGYuc3VidGl0bGVMYWJlbC5zZXRUZXh0KCcnKTtcbiAgICB9KTtcblxuICAgIGxldCBzdWJ0aXRsZUNsZWFySGFuZGxlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5zdWJ0aXRsZUxhYmVsLnNldFRleHQoJycpO1xuICAgIH07XG5cbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9BVURJT19DSEFOR0VELCBzdWJ0aXRsZUNsZWFySGFuZGxlcik7XG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fU1VCVElUTEVfQ0hBTkdFRCwgc3VidGl0bGVDbGVhckhhbmRsZXIpO1xuICAgIHBsYXllci5hZGRFdmVudEhhbmRsZXIoYml0bW92aW4ucGxheWVyLkVWRU5ULk9OX1NFRUssIHN1YnRpdGxlQ2xlYXJIYW5kbGVyKTtcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9USU1FX1NISUZULCBzdWJ0aXRsZUNsZWFySGFuZGxlcik7XG5cbiAgICB1aW1hbmFnZXIub25Db21wb25lbnRTaG93LnN1YnNjcmliZShmdW5jdGlvbihjb21wb25lbnQ6IENvbXBvbmVudDxDb21wb25lbnRDb25maWc+KSB7XG4gICAgICBpZiAoY29tcG9uZW50IGluc3RhbmNlb2YgQ29udHJvbEJhcikge1xuICAgICAgICBzZWxmLmdldERvbUVsZW1lbnQoKS5hZGRDbGFzcyhzZWxmLnByZWZpeENzcyhTdWJ0aXRsZU92ZXJsYXkuQ0xBU1NfQ09OVFJPTEJBUl9WSVNJQkxFKSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdWltYW5hZ2VyLm9uQ29tcG9uZW50SGlkZS5zdWJzY3JpYmUoZnVuY3Rpb24oY29tcG9uZW50OiBDb21wb25lbnQ8Q29tcG9uZW50Q29uZmlnPikge1xuICAgICAgaWYgKGNvbXBvbmVudCBpbnN0YW5jZW9mIENvbnRyb2xCYXIpIHtcbiAgICAgICAgc2VsZi5nZXREb21FbGVtZW50KCkucmVtb3ZlQ2xhc3Moc2VsZi5wcmVmaXhDc3MoU3VidGl0bGVPdmVybGF5LkNMQVNTX0NPTlRST0xCQVJfVklTSUJMRSkpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59IiwiaW1wb3J0IHtTZWxlY3RCb3h9IGZyb20gJy4vc2VsZWN0Ym94JztcbmltcG9ydCB7TGlzdFNlbGVjdG9yQ29uZmlnfSBmcm9tICcuL2xpc3RzZWxlY3Rvcic7XG5pbXBvcnQge1VJSW5zdGFuY2VNYW5hZ2VyfSBmcm9tICcuLi91aW1hbmFnZXInO1xuaW1wb3J0IFN1YnRpdGxlQWRkZWRFdmVudCA9IGJpdG1vdmluLnBsYXllci5TdWJ0aXRsZUFkZGVkRXZlbnQ7XG5pbXBvcnQgU3VidGl0bGVDaGFuZ2VkRXZlbnQgPSBiaXRtb3Zpbi5wbGF5ZXIuU3VidGl0bGVDaGFuZ2VkRXZlbnQ7XG5pbXBvcnQgU3VidGl0bGVSZW1vdmVkRXZlbnQgPSBiaXRtb3Zpbi5wbGF5ZXIuU3VidGl0bGVSZW1vdmVkRXZlbnQ7XG5cbi8qKlxuICogQSBzZWxlY3QgYm94IHByb3ZpZGluZyBhIHNlbGVjdGlvbiBiZXR3ZWVuIGF2YWlsYWJsZSBzdWJ0aXRsZSBhbmQgY2FwdGlvbiB0cmFja3MuXG4gKi9cbmV4cG9ydCBjbGFzcyBTdWJ0aXRsZVNlbGVjdEJveCBleHRlbmRzIFNlbGVjdEJveCB7XG5cbiAgY29uc3RydWN0b3IoY29uZmlnOiBMaXN0U2VsZWN0b3JDb25maWcgPSB7fSkge1xuICAgIHN1cGVyKGNvbmZpZyk7XG4gIH1cblxuICBjb25maWd1cmUocGxheWVyOiBiaXRtb3Zpbi5wbGF5ZXIuUGxheWVyLCB1aW1hbmFnZXI6IFVJSW5zdGFuY2VNYW5hZ2VyKTogdm9pZCB7XG4gICAgc3VwZXIuY29uZmlndXJlKHBsYXllciwgdWltYW5hZ2VyKTtcblxuICAgIGxldCBzZWxmID0gdGhpcztcblxuICAgIGxldCB1cGRhdGVTdWJ0aXRsZXMgPSBmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYuY2xlYXJJdGVtcygpO1xuXG4gICAgICBmb3IgKGxldCBzdWJ0aXRsZSBvZiBwbGF5ZXIuZ2V0QXZhaWxhYmxlU3VidGl0bGVzKCkpIHtcbiAgICAgICAgc2VsZi5hZGRJdGVtKHN1YnRpdGxlLmlkLCBzdWJ0aXRsZS5sYWJlbCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHNlbGYub25JdGVtU2VsZWN0ZWQuc3Vic2NyaWJlKGZ1bmN0aW9uKHNlbmRlcjogU3VidGl0bGVTZWxlY3RCb3gsIHZhbHVlOiBzdHJpbmcpIHtcbiAgICAgIHBsYXllci5zZXRTdWJ0aXRsZSh2YWx1ZSA9PT0gJ251bGwnID8gbnVsbCA6IHZhbHVlKTtcbiAgICB9KTtcblxuICAgIC8vIFJlYWN0IHRvIEFQSSBldmVudHNcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9TVUJUSVRMRV9BRERFRCwgZnVuY3Rpb24oZXZlbnQ6IFN1YnRpdGxlQWRkZWRFdmVudCkge1xuICAgICAgc2VsZi5hZGRJdGVtKGV2ZW50LnN1YnRpdGxlLmlkLCBldmVudC5zdWJ0aXRsZS5sYWJlbCk7XG4gICAgfSk7XG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fU1VCVElUTEVfQ0hBTkdFRCwgZnVuY3Rpb24oZXZlbnQ6IFN1YnRpdGxlQ2hhbmdlZEV2ZW50KSB7XG4gICAgICBzZWxmLnNlbGVjdEl0ZW0oZXZlbnQudGFyZ2V0U3VidGl0bGUuaWQpO1xuICAgIH0pO1xuICAgIHBsYXllci5hZGRFdmVudEhhbmRsZXIoYml0bW92aW4ucGxheWVyLkVWRU5ULk9OX1NVQlRJVExFX1JFTU9WRUQsIGZ1bmN0aW9uKGV2ZW50OiBTdWJ0aXRsZVJlbW92ZWRFdmVudCkge1xuICAgICAgc2VsZi5yZW1vdmVJdGVtKGV2ZW50LnN1YnRpdGxlSWQpO1xuICAgIH0pO1xuXG4gICAgLy8gVXBkYXRlIHN1YnRpdGxlcyB3aGVuIHNvdXJjZSBnb2VzIGF3YXlcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9TT1VSQ0VfVU5MT0FERUQsIHVwZGF0ZVN1YnRpdGxlcyk7XG4gICAgLy8gVXBkYXRlIHN1YnRpdGxlcyB3aGVuIGEgbmV3IHNvdXJjZSBpcyBsb2FkZWRcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9SRUFEWSwgdXBkYXRlU3VidGl0bGVzKTtcblxuICAgIC8vIFBvcHVsYXRlIHN1YnRpdGxlcyBhdCBzdGFydHVwXG4gICAgdXBkYXRlU3VidGl0bGVzKCk7XG4gIH1cbn0iLCJpbXBvcnQge0NvbnRhaW5lciwgQ29udGFpbmVyQ29uZmlnfSBmcm9tICcuL2NvbnRhaW5lcic7XG5pbXBvcnQge1VJSW5zdGFuY2VNYW5hZ2VyfSBmcm9tICcuLi91aW1hbmFnZXInO1xuaW1wb3J0IHtNZXRhZGF0YUxhYmVsLCBNZXRhZGF0YUxhYmVsQ29udGVudH0gZnJvbSAnLi9tZXRhZGF0YWxhYmVsJztcblxuLyoqXG4gKiBDb25maWd1cmF0aW9uIGludGVyZmFjZSBmb3IgYSB7QGxpbmsgVGl0bGVCYXJ9LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRpdGxlQmFyQ29uZmlnIGV4dGVuZHMgQ29udGFpbmVyQ29uZmlnIHtcbiAgLy8gbm90aGluZyB5ZXRcbn1cblxuLyoqXG4gKiBEaXNwbGF5cyBhIHRpdGxlIGJhciBjb250YWluaW5nIGEgbGFiZWwgd2l0aCB0aGUgdGl0bGUgb2YgdGhlIHZpZGVvLlxuICovXG5leHBvcnQgY2xhc3MgVGl0bGVCYXIgZXh0ZW5kcyBDb250YWluZXI8VGl0bGVCYXJDb25maWc+IHtcblxuICBjb25zdHJ1Y3Rvcihjb25maWc6IFRpdGxlQmFyQ29uZmlnID0ge30pIHtcbiAgICBzdXBlcihjb25maWcpO1xuXG4gICAgdGhpcy5jb25maWcgPSB0aGlzLm1lcmdlQ29uZmlnKGNvbmZpZywge1xuICAgICAgY3NzQ2xhc3M6ICd1aS10aXRsZWJhcicsXG4gICAgICBoaWRkZW46IHRydWUsXG4gICAgICBjb21wb25lbnRzOiBbXG4gICAgICAgIG5ldyBNZXRhZGF0YUxhYmVsKHsgY29udGVudDogTWV0YWRhdGFMYWJlbENvbnRlbnQuVGl0bGUgfSksXG4gICAgICAgIG5ldyBNZXRhZGF0YUxhYmVsKHsgY29udGVudDogTWV0YWRhdGFMYWJlbENvbnRlbnQuRGVzY3JpcHRpb24gfSlcbiAgICAgIF1cbiAgICB9LCA8VGl0bGVCYXJDb25maWc+dGhpcy5jb25maWcpO1xuICB9XG5cbiAgY29uZmlndXJlKHBsYXllcjogYml0bW92aW4ucGxheWVyLlBsYXllciwgdWltYW5hZ2VyOiBVSUluc3RhbmNlTWFuYWdlcik6IHZvaWQge1xuICAgIHN1cGVyLmNvbmZpZ3VyZShwbGF5ZXIsIHVpbWFuYWdlcik7XG5cbiAgICBsZXQgc2VsZiA9IHRoaXM7XG5cbiAgICB1aW1hbmFnZXIub25Db250cm9sc1Nob3cuc3Vic2NyaWJlKGZ1bmN0aW9uICgpIHtcbiAgICAgIHNlbGYuc2hvdygpO1xuICAgIH0pO1xuICAgIHVpbWFuYWdlci5vbkNvbnRyb2xzSGlkZS5zdWJzY3JpYmUoZnVuY3Rpb24gKCkge1xuICAgICAgc2VsZi5oaWRlKCk7XG4gICAgfSk7XG4gIH1cbn0iLCJpbXBvcnQge0J1dHRvbiwgQnV0dG9uQ29uZmlnfSBmcm9tICcuL2J1dHRvbic7XG5pbXBvcnQge05vQXJncywgRXZlbnREaXNwYXRjaGVyLCBFdmVudH0gZnJvbSAnLi4vZXZlbnRkaXNwYXRjaGVyJztcblxuLyoqXG4gKiBDb25maWd1cmF0aW9uIGludGVyZmFjZSBmb3IgYSB0b2dnbGUgYnV0dG9uIGNvbXBvbmVudC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUb2dnbGVCdXR0b25Db25maWcgZXh0ZW5kcyBCdXR0b25Db25maWcge1xuICAvKipcbiAgICogVGhlIHRleHQgb24gdGhlIGJ1dHRvbi5cbiAgICovXG4gIHRleHQ/OiBzdHJpbmc7XG59XG5cbi8qKlxuICogQSBidXR0b24gdGhhdCBjYW4gYmUgdG9nZ2xlZCBiZXR3ZWVuICdvbicgYW5kICdvZmYnIHN0YXRlcy5cbiAqL1xuZXhwb3J0IGNsYXNzIFRvZ2dsZUJ1dHRvbjxDb25maWcgZXh0ZW5kcyBUb2dnbGVCdXR0b25Db25maWc+IGV4dGVuZHMgQnV0dG9uPFRvZ2dsZUJ1dHRvbkNvbmZpZz4ge1xuXG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IENMQVNTX09OID0gJ29uJztcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgQ0xBU1NfT0ZGID0gJ29mZic7XG5cbiAgcHJpdmF0ZSBvblN0YXRlOiBib29sZWFuO1xuXG4gIHByaXZhdGUgdG9nZ2xlQnV0dG9uRXZlbnRzID0ge1xuICAgIG9uVG9nZ2xlOiBuZXcgRXZlbnREaXNwYXRjaGVyPFRvZ2dsZUJ1dHRvbjxDb25maWc+LCBOb0FyZ3M+KCksXG4gICAgb25Ub2dnbGVPbjogbmV3IEV2ZW50RGlzcGF0Y2hlcjxUb2dnbGVCdXR0b248Q29uZmlnPiwgTm9BcmdzPigpLFxuICAgIG9uVG9nZ2xlT2ZmOiBuZXcgRXZlbnREaXNwYXRjaGVyPFRvZ2dsZUJ1dHRvbjxDb25maWc+LCBOb0FyZ3M+KClcbiAgfTtcblxuICBjb25zdHJ1Y3Rvcihjb25maWc6IFRvZ2dsZUJ1dHRvbkNvbmZpZykge1xuICAgIHN1cGVyKGNvbmZpZyk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IHRoaXMubWVyZ2VDb25maWcoY29uZmlnLCB7XG4gICAgICBjc3NDbGFzczogJ3VpLXRvZ2dsZWJ1dHRvbidcbiAgICB9LCB0aGlzLmNvbmZpZyk7XG4gIH1cblxuICAvKipcbiAgICogVG9nZ2xlcyB0aGUgYnV0dG9uIHRvIHRoZSAnb24nIHN0YXRlLlxuICAgKi9cbiAgb24oKSB7XG4gICAgaWYgKHRoaXMuaXNPZmYoKSkge1xuICAgICAgdGhpcy5vblN0YXRlID0gdHJ1ZTtcbiAgICAgIHRoaXMuZ2V0RG9tRWxlbWVudCgpLnJlbW92ZUNsYXNzKHRoaXMucHJlZml4Q3NzKFRvZ2dsZUJ1dHRvbi5DTEFTU19PRkYpKTtcbiAgICAgIHRoaXMuZ2V0RG9tRWxlbWVudCgpLmFkZENsYXNzKHRoaXMucHJlZml4Q3NzKFRvZ2dsZUJ1dHRvbi5DTEFTU19PTikpO1xuXG4gICAgICB0aGlzLm9uVG9nZ2xlRXZlbnQoKTtcbiAgICAgIHRoaXMub25Ub2dnbGVPbkV2ZW50KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRvZ2dsZXMgdGhlIGJ1dHRvbiB0byB0aGUgJ29mZicgc3RhdGUuXG4gICAqL1xuICBvZmYoKSB7XG4gICAgaWYgKHRoaXMuaXNPbigpKSB7XG4gICAgICB0aGlzLm9uU3RhdGUgPSBmYWxzZTtcbiAgICAgIHRoaXMuZ2V0RG9tRWxlbWVudCgpLnJlbW92ZUNsYXNzKHRoaXMucHJlZml4Q3NzKFRvZ2dsZUJ1dHRvbi5DTEFTU19PTikpO1xuICAgICAgdGhpcy5nZXREb21FbGVtZW50KCkuYWRkQ2xhc3ModGhpcy5wcmVmaXhDc3MoVG9nZ2xlQnV0dG9uLkNMQVNTX09GRikpO1xuXG4gICAgICB0aGlzLm9uVG9nZ2xlRXZlbnQoKTtcbiAgICAgIHRoaXMub25Ub2dnbGVPZmZFdmVudCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGUgdGhlIGJ1dHRvbiAnb24nIGlmIGl0IGlzICdvZmYnLCBvciAnb2ZmJyBpZiBpdCBpcyAnb24nLlxuICAgKi9cbiAgdG9nZ2xlKCkge1xuICAgIGlmICh0aGlzLmlzT24oKSkge1xuICAgICAgdGhpcy5vZmYoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5vbigpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhlIHRvZ2dsZSBidXR0b24gaXMgaW4gdGhlICdvbicgc3RhdGUuXG4gICAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmIGJ1dHRvbiBpcyAnb24nLCBmYWxzZSBpZiAnb2ZmJ1xuICAgKi9cbiAgaXNPbigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5vblN0YXRlO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgdG9nZ2xlIGJ1dHRvbiBpcyBpbiB0aGUgJ29mZicgc3RhdGUuXG4gICAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmIGJ1dHRvbiBpcyAnb2ZmJywgZmFsc2UgaWYgJ29uJ1xuICAgKi9cbiAgaXNPZmYoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICF0aGlzLmlzT24oKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBvbkNsaWNrRXZlbnQoKSB7XG4gICAgc3VwZXIub25DbGlja0V2ZW50KCk7XG5cbiAgICAvLyBGaXJlIHRoZSB0b2dnbGUgZXZlbnQgdG9nZXRoZXIgd2l0aCB0aGUgY2xpY2sgZXZlbnRcbiAgICAvLyAodGhleSBhcmUgdGVjaG5pY2FsbHkgdGhlIHNhbWUsIG9ubHkgdGhlIHNlbWFudGljcyBhcmUgZGlmZmVyZW50KVxuICAgIHRoaXMub25Ub2dnbGVFdmVudCgpO1xuICB9XG5cbiAgcHJvdGVjdGVkIG9uVG9nZ2xlRXZlbnQoKSB7XG4gICAgdGhpcy50b2dnbGVCdXR0b25FdmVudHMub25Ub2dnbGUuZGlzcGF0Y2godGhpcyk7XG4gIH1cblxuICBwcm90ZWN0ZWQgb25Ub2dnbGVPbkV2ZW50KCkge1xuICAgIHRoaXMudG9nZ2xlQnV0dG9uRXZlbnRzLm9uVG9nZ2xlT24uZGlzcGF0Y2godGhpcyk7XG4gIH1cblxuICBwcm90ZWN0ZWQgb25Ub2dnbGVPZmZFdmVudCgpIHtcbiAgICB0aGlzLnRvZ2dsZUJ1dHRvbkV2ZW50cy5vblRvZ2dsZU9mZi5kaXNwYXRjaCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBldmVudCB0aGF0IGlzIGZpcmVkIHdoZW4gdGhlIGJ1dHRvbiBpcyB0b2dnbGVkLlxuICAgKiBAcmV0dXJucyB7RXZlbnQ8VG9nZ2xlQnV0dG9uPENvbmZpZz4sIE5vQXJncz59XG4gICAqL1xuICBnZXQgb25Ub2dnbGUoKTogRXZlbnQ8VG9nZ2xlQnV0dG9uPENvbmZpZz4sIE5vQXJncz4ge1xuICAgIHJldHVybiB0aGlzLnRvZ2dsZUJ1dHRvbkV2ZW50cy5vblRvZ2dsZS5nZXRFdmVudCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGV2ZW50IHRoYXQgaXMgZmlyZWQgd2hlbiB0aGUgYnV0dG9uIGlzIHRvZ2dsZWQgJ29uJy5cbiAgICogQHJldHVybnMge0V2ZW50PFRvZ2dsZUJ1dHRvbjxDb25maWc+LCBOb0FyZ3M+fVxuICAgKi9cbiAgZ2V0IG9uVG9nZ2xlT24oKTogRXZlbnQ8VG9nZ2xlQnV0dG9uPENvbmZpZz4sIE5vQXJncz4ge1xuICAgIHJldHVybiB0aGlzLnRvZ2dsZUJ1dHRvbkV2ZW50cy5vblRvZ2dsZU9uLmdldEV2ZW50KCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZXZlbnQgdGhhdCBpcyBmaXJlZCB3aGVuIHRoZSBidXR0b24gaXMgdG9nZ2xlZCAnb2ZmJy5cbiAgICogQHJldHVybnMge0V2ZW50PFRvZ2dsZUJ1dHRvbjxDb25maWc+LCBOb0FyZ3M+fVxuICAgKi9cbiAgZ2V0IG9uVG9nZ2xlT2ZmKCk6IEV2ZW50PFRvZ2dsZUJ1dHRvbjxDb25maWc+LCBOb0FyZ3M+IHtcbiAgICByZXR1cm4gdGhpcy50b2dnbGVCdXR0b25FdmVudHMub25Ub2dnbGVPZmYuZ2V0RXZlbnQoKTtcbiAgfVxufSIsImltcG9ydCB7Q29tcG9uZW50LCBDb21wb25lbnRDb25maWd9IGZyb20gJy4vY29tcG9uZW50JztcbmltcG9ydCB7RE9NfSBmcm9tICcuLi9kb20nO1xuXG4vKipcbiAqIEFuaW1hdGVkIGFuYWxvZyBUViBzdGF0aWMgbm9pc2UuXG4gKi9cbmV4cG9ydCBjbGFzcyBUdk5vaXNlQ2FudmFzIGV4dGVuZHMgQ29tcG9uZW50PENvbXBvbmVudENvbmZpZz4ge1xuXG4gIHByaXZhdGUgY2FudmFzOiBET007XG5cbiAgcHJpdmF0ZSBjYW52YXNFbGVtZW50OiBIVE1MQ2FudmFzRWxlbWVudDtcbiAgcHJpdmF0ZSBjYW52YXNDb250ZXh0OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQ7XG4gIHByaXZhdGUgY2FudmFzV2lkdGggPSAxNjA7XG4gIHByaXZhdGUgY2FudmFzSGVpZ2h0ID0gOTA7XG4gIHByaXZhdGUgaW50ZXJmZXJlbmNlSGVpZ2h0ID0gNTA7XG4gIHByaXZhdGUgbGFzdEZyYW1lVXBkYXRlOiBudW1iZXIgPSAwO1xuICBwcml2YXRlIGZyYW1lSW50ZXJ2YWw6IG51bWJlciA9IDYwO1xuICBwcml2YXRlIHVzZUFuaW1hdGlvbkZyYW1lOiBib29sZWFuID0gISF3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xuICBwcml2YXRlIG5vaXNlQW5pbWF0aW9uV2luZG93UG9zOiBudW1iZXI7XG4gIHByaXZhdGUgZnJhbWVVcGRhdGVIYW5kbGVySWQ6IG51bWJlcjtcblxuICBjb25zdHJ1Y3Rvcihjb25maWc6IENvbXBvbmVudENvbmZpZyA9IHt9KSB7XG4gICAgc3VwZXIoY29uZmlnKTtcblxuICAgIHRoaXMuY29uZmlnID0gdGhpcy5tZXJnZUNvbmZpZyhjb25maWcsIHtcbiAgICAgIGNzc0NsYXNzOiAndWktdHZub2lzZWNhbnZhcydcbiAgICB9LCB0aGlzLmNvbmZpZyk7XG4gIH1cblxuICBwcm90ZWN0ZWQgdG9Eb21FbGVtZW50KCk6IERPTSB7XG4gICAgcmV0dXJuIHRoaXMuY2FudmFzID0gbmV3IERPTSgnY2FudmFzJywgeyAnY2xhc3MnOiB0aGlzLmdldENzc0NsYXNzZXMoKSB9KTtcbiAgfVxuXG4gIHN0YXJ0KCk6IHZvaWQge1xuICAgIHRoaXMuY2FudmFzRWxlbWVudCA9IDxIVE1MQ2FudmFzRWxlbWVudD50aGlzLmNhbnZhcy5nZXRFbGVtZW50cygpWzBdO1xuICAgIHRoaXMuY2FudmFzQ29udGV4dCA9IHRoaXMuY2FudmFzRWxlbWVudC5nZXRDb250ZXh0KCcyZCcpO1xuICAgIHRoaXMubm9pc2VBbmltYXRpb25XaW5kb3dQb3MgPSAtdGhpcy5jYW52YXNIZWlnaHQ7XG4gICAgdGhpcy5sYXN0RnJhbWVVcGRhdGUgPSAwO1xuXG4gICAgdGhpcy5jYW52YXNFbGVtZW50LndpZHRoID0gdGhpcy5jYW52YXNXaWR0aDtcbiAgICB0aGlzLmNhbnZhc0VsZW1lbnQuaGVpZ2h0ID0gdGhpcy5jYW52YXNIZWlnaHQ7XG5cbiAgICB0aGlzLnJlbmRlckZyYW1lKCk7XG4gIH1cblxuICBzdG9wKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnVzZUFuaW1hdGlvbkZyYW1lKSB7XG4gICAgICBjYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLmZyYW1lVXBkYXRlSGFuZGxlcklkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuZnJhbWVVcGRhdGVIYW5kbGVySWQpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyRnJhbWUoKTogdm9pZCB7XG4gICAgLy8gVGhpcyBjb2RlIGhhcyBiZWVuIGNvcGllZCBmcm9tIHRoZSBwbGF5ZXIgY29udHJvbHMuanMgYW5kIHNpbXBsaWZpZWRcblxuICAgIGlmICh0aGlzLmxhc3RGcmFtZVVwZGF0ZSArIHRoaXMuZnJhbWVJbnRlcnZhbCA+IG5ldyBEYXRlKCkuZ2V0VGltZSgpKSB7XG4gICAgICAvLyBJdCdzIHRvbyBlYXJseSB0byByZW5kZXIgdGhlIG5leHQgZnJhbWVcbiAgICAgIHRoaXMuc2NoZWR1bGVOZXh0UmVuZGVyKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IGN1cnJlbnRQaXhlbE9mZnNldDtcbiAgICBsZXQgY2FudmFzV2lkdGggPSB0aGlzLmNhbnZhc1dpZHRoO1xuICAgIGxldCBjYW52YXNIZWlnaHQgPSB0aGlzLmNhbnZhc0hlaWdodDtcblxuICAgIC8vIENyZWF0ZSB0ZXh0dXJlXG4gICAgbGV0IG5vaXNlSW1hZ2UgPSB0aGlzLmNhbnZhc0NvbnRleHQuY3JlYXRlSW1hZ2VEYXRhKGNhbnZhc1dpZHRoLCBjYW52YXNIZWlnaHQpO1xuXG4gICAgLy8gRmlsbCB0ZXh0dXJlIHdpdGggbm9pc2VcbiAgICBmb3IgKGxldCB5ID0gMDsgeSA8IGNhbnZhc0hlaWdodDsgeSsrKSB7XG4gICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGNhbnZhc1dpZHRoOyB4KyspIHtcbiAgICAgICAgY3VycmVudFBpeGVsT2Zmc2V0ID0gKGNhbnZhc1dpZHRoICogeSAqIDQpICsgeCAqIDQ7XG4gICAgICAgIG5vaXNlSW1hZ2UuZGF0YVtjdXJyZW50UGl4ZWxPZmZzZXRdID0gTWF0aC5yYW5kb20oKSAqIDI1NTtcbiAgICAgICAgaWYgKHkgPCB0aGlzLm5vaXNlQW5pbWF0aW9uV2luZG93UG9zIHx8IHkgPiB0aGlzLm5vaXNlQW5pbWF0aW9uV2luZG93UG9zICsgdGhpcy5pbnRlcmZlcmVuY2VIZWlnaHQpIHtcbiAgICAgICAgICBub2lzZUltYWdlLmRhdGFbY3VycmVudFBpeGVsT2Zmc2V0XSAqPSAwLjg1O1xuICAgICAgICB9XG4gICAgICAgIG5vaXNlSW1hZ2UuZGF0YVtjdXJyZW50UGl4ZWxPZmZzZXQgKyAxXSA9IG5vaXNlSW1hZ2UuZGF0YVtjdXJyZW50UGl4ZWxPZmZzZXRdO1xuICAgICAgICBub2lzZUltYWdlLmRhdGFbY3VycmVudFBpeGVsT2Zmc2V0ICsgMl0gPSBub2lzZUltYWdlLmRhdGFbY3VycmVudFBpeGVsT2Zmc2V0XTtcbiAgICAgICAgbm9pc2VJbWFnZS5kYXRhW2N1cnJlbnRQaXhlbE9mZnNldCArIDNdID0gNTA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUHV0IHRleHR1cmUgb250byBjYW52YXNcbiAgICB0aGlzLmNhbnZhc0NvbnRleHQucHV0SW1hZ2VEYXRhKG5vaXNlSW1hZ2UsIDAsIDApO1xuXG4gICAgdGhpcy5sYXN0RnJhbWVVcGRhdGUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICB0aGlzLm5vaXNlQW5pbWF0aW9uV2luZG93UG9zICs9IDc7XG4gICAgaWYgKHRoaXMubm9pc2VBbmltYXRpb25XaW5kb3dQb3MgPiBjYW52YXNIZWlnaHQpIHtcbiAgICAgIHRoaXMubm9pc2VBbmltYXRpb25XaW5kb3dQb3MgPSAtY2FudmFzSGVpZ2h0O1xuICAgIH1cblxuICAgIHRoaXMuc2NoZWR1bGVOZXh0UmVuZGVyKCk7XG4gIH1cblxuICBwcml2YXRlIHNjaGVkdWxlTmV4dFJlbmRlcigpOiB2b2lkIHtcbiAgICBpZiAodGhpcy51c2VBbmltYXRpb25GcmFtZSkge1xuICAgICAgdGhpcy5mcmFtZVVwZGF0ZUhhbmRsZXJJZCA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5yZW5kZXJGcmFtZS5iaW5kKHRoaXMpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5mcmFtZVVwZGF0ZUhhbmRsZXJJZCA9IHNldFRpbWVvdXQodGhpcy5yZW5kZXJGcmFtZS5iaW5kKHRoaXMpLCB0aGlzLmZyYW1lSW50ZXJ2YWwpO1xuICAgIH1cbiAgfVxufSIsImltcG9ydCB7Q29udGFpbmVyQ29uZmlnLCBDb250YWluZXJ9IGZyb20gJy4vY29udGFpbmVyJztcbmltcG9ydCB7VUlJbnN0YW5jZU1hbmFnZXJ9IGZyb20gJy4uL3VpbWFuYWdlcic7XG5pbXBvcnQge0RPTX0gZnJvbSAnLi4vZG9tJztcbmltcG9ydCB7VGltZW91dH0gZnJvbSAnLi4vdGltZW91dCc7XG5pbXBvcnQge1BsYXllclV0aWxzfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgUGxheWVyUmVzaXplRXZlbnQgPSBiaXRtb3Zpbi5wbGF5ZXIuUGxheWVyUmVzaXplRXZlbnQ7XG5cbi8qKlxuICogQ29uZmlndXJhdGlvbiBpbnRlcmZhY2UgZm9yIGEge0BsaW5rIFVJQ29udGFpbmVyfS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBVSUNvbnRhaW5lckNvbmZpZyBleHRlbmRzIENvbnRhaW5lckNvbmZpZyB7XG4gIC8qKlxuICAgKiBUaGUgZGVsYXkgaW4gbWlsbGlzZWNvbmRzIGFmdGVyIHdoaWNoIHRoZSBjb250cm9sIGJhciB3aWxsIGJlIGhpZGRlbiB3aGVuIHRoZXJlIGlzIG5vIHVzZXIgaW50ZXJhY3Rpb24uXG4gICAqIERlZmF1bHQ6IDUgc2Vjb25kcyAoNTAwMClcbiAgICovXG4gIGhpZGVEZWxheT86IG51bWJlcjtcbn1cblxuLyoqXG4gKiBUaGUgYmFzZSBjb250YWluZXIgdGhhdCBjb250YWlucyBhbGwgb2YgdGhlIFVJLiBUaGUgVUlDb250YWluZXIgaXMgcGFzc2VkIHRvIHRoZSB7QGxpbmsgVUlNYW5hZ2VyfSB0byBidWlsZCBhbmRcbiAqIHNldHVwIHRoZSBVSS5cbiAqL1xuZXhwb3J0IGNsYXNzIFVJQ29udGFpbmVyIGV4dGVuZHMgQ29udGFpbmVyPFVJQ29udGFpbmVyQ29uZmlnPiB7XG5cbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgU1RBVEVfSURMRSA9ICdwbGF5ZXItc3RhdGUtaWRsZSc7XG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IFNUQVRFX1BSRVBBUkVEID0gJ3BsYXllci1zdGF0ZS1wcmVwYXJlZCc7XG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IFNUQVRFX1BMQVlJTkcgPSAncGxheWVyLXN0YXRlLXBsYXlpbmcnO1xuICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBTVEFURV9QQVVTRUQgPSAncGxheWVyLXN0YXRlLXBhdXNlZCc7XG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IFNUQVRFX0ZJTklTSEVEID0gJ3BsYXllci1zdGF0ZS1maW5pc2hlZCc7XG5cbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgRlVMTFNDUkVFTiA9ICdmdWxsc2NyZWVuJztcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgQlVGRkVSSU5HID0gJ2J1ZmZlcmluZyc7XG4gIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IENPTlRST0xTX1NIT1dOID0gJ2NvbnRyb2xzLXNob3duJztcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgQ09OVFJPTFNfSElEREVOID0gJ2NvbnRyb2xzLWhpZGRlbic7XG5cbiAgY29uc3RydWN0b3IoY29uZmlnOiBVSUNvbnRhaW5lckNvbmZpZykge1xuICAgIHN1cGVyKGNvbmZpZyk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IHRoaXMubWVyZ2VDb25maWcoY29uZmlnLCA8VUlDb250YWluZXJDb25maWc+e1xuICAgICAgY3NzQ2xhc3M6ICd1aS11aWNvbnRhaW5lcicsXG4gICAgICBoaWRlRGVsYXk6IDUwMDAsXG4gICAgfSwgdGhpcy5jb25maWcpO1xuICB9XG5cbiAgY29uZmlndXJlKHBsYXllcjogYml0bW92aW4ucGxheWVyLlBsYXllciwgdWltYW5hZ2VyOiBVSUluc3RhbmNlTWFuYWdlcik6IHZvaWQge1xuICAgIHN1cGVyLmNvbmZpZ3VyZShwbGF5ZXIsIHVpbWFuYWdlcik7XG5cbiAgICB0aGlzLmNvbmZpZ3VyZVVJU2hvd0hpZGUocGxheWVyLCB1aW1hbmFnZXIpO1xuICAgIHRoaXMuY29uZmlndXJlUGxheWVyU3RhdGVzKHBsYXllciwgdWltYW5hZ2VyKTtcbiAgfVxuXG4gIHByaXZhdGUgY29uZmlndXJlVUlTaG93SGlkZShwbGF5ZXI6IGJpdG1vdmluLnBsYXllci5QbGF5ZXIsIHVpbWFuYWdlcjogVUlJbnN0YW5jZU1hbmFnZXIpOiB2b2lkIHtcbiAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgbGV0IGNvbnRhaW5lciA9IHRoaXMuZ2V0RG9tRWxlbWVudCgpO1xuICAgIGxldCBjb25maWcgPSA8VUlDb250YWluZXJDb25maWc+dGhpcy5nZXRDb25maWcoKTtcblxuICAgIGxldCBpc1VpU2hvd24gPSBmYWxzZTtcbiAgICBsZXQgaXNTZWVraW5nID0gZmFsc2U7XG5cbiAgICBsZXQgc2hvd1VpID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIWlzVWlTaG93bikge1xuICAgICAgICAvLyBMZXQgc3Vic2NyaWJlcnMga25vdyB0aGF0IHRoZXkgc2hvdWxkIHJldmVhbCB0aGVtc2VsdmVzXG4gICAgICAgIHVpbWFuYWdlci5vbkNvbnRyb2xzU2hvdy5kaXNwYXRjaChzZWxmKTtcbiAgICAgICAgaXNVaVNob3duID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIC8vIERvbid0IHRyaWdnZXIgdGltZW91dCB3aGlsZSBzZWVraW5nLCBpdCB3aWxsIGJlIHRyaWdnZXJlZCBvbmNlIHRoZSBzZWVrIGlzIGZpbmlzaGVkXG4gICAgICBpZiAoIWlzU2Vla2luZykge1xuICAgICAgICB1aUhpZGVUaW1lb3V0LnN0YXJ0KCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGxldCBoaWRlVWkgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChpc1VpU2hvd24pIHtcbiAgICAgICAgLy8gTGV0IHN1YnNjcmliZXJzIGtub3cgdGhhdCB0aGV5IHNob3VsZCBub3cgaGlkZSB0aGVtc2VsdmVzXG4gICAgICAgIHVpbWFuYWdlci5vbkNvbnRyb2xzSGlkZS5kaXNwYXRjaChzZWxmKTtcbiAgICAgICAgaXNVaVNob3duID0gZmFsc2U7XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8vIFRpbWVvdXQgdG8gZGVmZXIgVUkgaGlkaW5nIGJ5IHRoZSBjb25maWd1cmVkIGRlbGF5IHRpbWVcbiAgICBsZXQgdWlIaWRlVGltZW91dCA9IG5ldyBUaW1lb3V0KGNvbmZpZy5oaWRlRGVsYXksIGhpZGVVaSk7XG5cbiAgICAvLyBPbiB0b3VjaCBkaXNwbGF5cywgdGhlIGZpcnN0IHRvdWNoIHJldmVhbHMgdGhlIFVJXG4gICAgY29udGFpbmVyLm9uKCd0b3VjaGVuZCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmICghaXNVaVNob3duKSB7XG4gICAgICAgIC8vIE9ubHkgaWYgdGhlIFVJIGlzIGhpZGRlbiwgd2UgcHJldmVudCBvdGhlciBhY3Rpb25zIGFuZCByZXZlYWwgdGhlIFVJIGluc3RlYWRcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBzaG93VWkoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICAvLyBXaGVuIHRoZSBtb3VzZSBlbnRlcnMsIHdlIHNob3cgdGhlIFVJXG4gICAgY29udGFpbmVyLm9uKCdtb3VzZWVudGVyJywgZnVuY3Rpb24oKSB7XG4gICAgICBzaG93VWkoKTtcbiAgICB9KTtcbiAgICAvLyBXaGVuIHRoZSBtb3VzZSBtb3ZlcyB3aXRoaW4sIHdlIHNob3cgdGhlIFVJXG4gICAgY29udGFpbmVyLm9uKCdtb3VzZW1vdmUnLCBmdW5jdGlvbigpIHtcbiAgICAgIHNob3dVaSgpO1xuICAgIH0pO1xuICAgIC8vIFdoZW4gdGhlIG1vdXNlIGxlYXZlcywgd2UgY2FuIHByZXBhcmUgdG8gaGlkZSB0aGUgVUksIGV4Y2VwdCBhIHNlZWsgaXMgZ29pbmcgb25cbiAgICBjb250YWluZXIub24oJ21vdXNlbGVhdmUnLCBmdW5jdGlvbigpIHtcbiAgICAgIC8vIFdoZW4gYSBzZWVrIGlzIGdvaW5nIG9uLCB0aGUgc2VlayBzY3J1YiBwb2ludGVyIG1heSBleGl0IHRoZSBVSSBhcmVhIHdoaWxlIHN0aWxsIHNlZWtpbmcsIGFuZCB3ZSBkbyBub3QgaGlkZVxuICAgICAgLy8gdGhlIFVJIGluIHN1Y2ggY2FzZXNcbiAgICAgIGlmICghaXNTZWVraW5nKSB7XG4gICAgICAgIHVpSGlkZVRpbWVvdXQuc3RhcnQoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHVpbWFuYWdlci5vblNlZWsuc3Vic2NyaWJlKGZ1bmN0aW9uKCkge1xuICAgICAgdWlIaWRlVGltZW91dC5jbGVhcigpOyAvLyBEb24ndCBoaWRlIFVJIHdoaWxlIGEgc2VlayBpcyBpbiBwcm9ncmVzc1xuICAgICAgaXNTZWVraW5nID0gdHJ1ZTtcbiAgICB9KTtcbiAgICB1aW1hbmFnZXIub25TZWVrZWQuc3Vic2NyaWJlKGZ1bmN0aW9uKCkge1xuICAgICAgaXNTZWVraW5nID0gZmFsc2U7XG4gICAgICB1aUhpZGVUaW1lb3V0LnN0YXJ0KCk7IC8vIFJlLWVuYWJsZSBVSSBoaWRlIHRpbWVvdXQgYWZ0ZXIgYSBzZWVrXG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGNvbmZpZ3VyZVBsYXllclN0YXRlcyhwbGF5ZXI6IGJpdG1vdmluLnBsYXllci5QbGF5ZXIsIHVpbWFuYWdlcjogVUlJbnN0YW5jZU1hbmFnZXIpOiB2b2lkIHtcbiAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgbGV0IGNvbnRhaW5lciA9IHRoaXMuZ2V0RG9tRWxlbWVudCgpO1xuXG4gICAgbGV0IHJlbW92ZVN0YXRlcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgY29udGFpbmVyLnJlbW92ZUNsYXNzKHNlbGYucHJlZml4Q3NzKFVJQ29udGFpbmVyLlNUQVRFX0lETEUpKTtcbiAgICAgIGNvbnRhaW5lci5yZW1vdmVDbGFzcyhzZWxmLnByZWZpeENzcyhVSUNvbnRhaW5lci5TVEFURV9QUkVQQVJFRCkpO1xuICAgICAgY29udGFpbmVyLnJlbW92ZUNsYXNzKHNlbGYucHJlZml4Q3NzKFVJQ29udGFpbmVyLlNUQVRFX1BMQVlJTkcpKTtcbiAgICAgIGNvbnRhaW5lci5yZW1vdmVDbGFzcyhzZWxmLnByZWZpeENzcyhVSUNvbnRhaW5lci5TVEFURV9QQVVTRUQpKTtcbiAgICAgIGNvbnRhaW5lci5yZW1vdmVDbGFzcyhzZWxmLnByZWZpeENzcyhVSUNvbnRhaW5lci5TVEFURV9GSU5JU0hFRCkpO1xuICAgIH07XG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fUkVBRFksIGZ1bmN0aW9uKCkge1xuICAgICAgcmVtb3ZlU3RhdGVzKCk7XG4gICAgICBjb250YWluZXIuYWRkQ2xhc3Moc2VsZi5wcmVmaXhDc3MoVUlDb250YWluZXIuU1RBVEVfUFJFUEFSRUQpKTtcbiAgICB9KTtcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9QTEFZLCBmdW5jdGlvbigpIHtcbiAgICAgIHJlbW92ZVN0YXRlcygpO1xuICAgICAgY29udGFpbmVyLmFkZENsYXNzKHNlbGYucHJlZml4Q3NzKFVJQ29udGFpbmVyLlNUQVRFX1BMQVlJTkcpKTtcbiAgICB9KTtcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9QQVVTRUQsIGZ1bmN0aW9uKCkge1xuICAgICAgcmVtb3ZlU3RhdGVzKCk7XG4gICAgICBjb250YWluZXIuYWRkQ2xhc3Moc2VsZi5wcmVmaXhDc3MoVUlDb250YWluZXIuU1RBVEVfUEFVU0VEKSk7XG4gICAgfSk7XG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fUExBWUJBQ0tfRklOSVNIRUQsIGZ1bmN0aW9uKCkge1xuICAgICAgcmVtb3ZlU3RhdGVzKCk7XG4gICAgICBjb250YWluZXIuYWRkQ2xhc3Moc2VsZi5wcmVmaXhDc3MoVUlDb250YWluZXIuU1RBVEVfRklOSVNIRUQpKTtcbiAgICB9KTtcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9TT1VSQ0VfVU5MT0FERUQsIGZ1bmN0aW9uKCkge1xuICAgICAgcmVtb3ZlU3RhdGVzKCk7XG4gICAgICBjb250YWluZXIuYWRkQ2xhc3Moc2VsZi5wcmVmaXhDc3MoVUlDb250YWluZXIuU1RBVEVfSURMRSkpO1xuICAgIH0pO1xuICAgIC8vIEluaXQgaW4gaWRsZSBzdGF0ZSB3aXRob3V0IGEgc291cmNlIG9yIHByZXBhcmVkIGlmIGEgc291cmNlIGlzIHNldFxuICAgIGNvbnRhaW5lci5hZGRDbGFzcyhzZWxmLnByZWZpeENzcyhQbGF5ZXJVdGlscy5pc1NvdXJjZUxvYWRlZChwbGF5ZXIpID9cbiAgICAgIFVJQ29udGFpbmVyLlNUQVRFX1BSRVBBUkVEIDogVUlDb250YWluZXIuU1RBVEVfSURMRSkpO1xuXG4gICAgLy8gRnVsbHNjcmVlbiBtYXJrZXIgY2xhc3NcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9GVUxMU0NSRUVOX0VOVEVSLCBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnRhaW5lci5hZGRDbGFzcyhzZWxmLnByZWZpeENzcyhVSUNvbnRhaW5lci5GVUxMU0NSRUVOKSk7XG4gICAgfSk7XG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fRlVMTFNDUkVFTl9FWElULCBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnRhaW5lci5yZW1vdmVDbGFzcyhzZWxmLnByZWZpeENzcyhVSUNvbnRhaW5lci5GVUxMU0NSRUVOKSk7XG4gICAgfSk7XG4gICAgLy8gSW5pdCBmdWxsc2NyZWVuIHN0YXRlXG4gICAgaWYgKHBsYXllci5pc0Z1bGxzY3JlZW4oKSkge1xuICAgICAgY29udGFpbmVyLmFkZENsYXNzKHNlbGYucHJlZml4Q3NzKFVJQ29udGFpbmVyLkZVTExTQ1JFRU4pKTtcbiAgICB9XG5cbiAgICAvLyBCdWZmZXJpbmcgbWFya2VyIGNsYXNzXG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fU1RBTExfU1RBUlRFRCwgZnVuY3Rpb24oKSB7XG4gICAgICBjb250YWluZXIuYWRkQ2xhc3Moc2VsZi5wcmVmaXhDc3MoVUlDb250YWluZXIuQlVGRkVSSU5HKSk7XG4gICAgfSk7XG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fU1RBTExfRU5ERUQsIGZ1bmN0aW9uKCkge1xuICAgICAgY29udGFpbmVyLnJlbW92ZUNsYXNzKHNlbGYucHJlZml4Q3NzKFVJQ29udGFpbmVyLkJVRkZFUklORykpO1xuICAgIH0pO1xuICAgIC8vIEluaXQgYnVmZmVyaW5nIHN0YXRlXG4gICAgaWYgKHBsYXllci5pc1N0YWxsZWQoKSkge1xuICAgICAgY29udGFpbmVyLmFkZENsYXNzKHNlbGYucHJlZml4Q3NzKFVJQ29udGFpbmVyLkJVRkZFUklORykpO1xuICAgIH1cblxuICAgIC8vIENvbnRyb2xzIHZpc2liaWxpdHkgbWFya2VyIGNsYXNzXG4gICAgdWltYW5hZ2VyLm9uQ29udHJvbHNTaG93LnN1YnNjcmliZShmdW5jdGlvbigpIHtcbiAgICAgIGNvbnRhaW5lci5yZW1vdmVDbGFzcyhzZWxmLnByZWZpeENzcyhVSUNvbnRhaW5lci5DT05UUk9MU19ISURERU4pKTtcbiAgICAgIGNvbnRhaW5lci5hZGRDbGFzcyhzZWxmLnByZWZpeENzcyhVSUNvbnRhaW5lci5DT05UUk9MU19TSE9XTikpO1xuICAgIH0pO1xuICAgIHVpbWFuYWdlci5vbkNvbnRyb2xzSGlkZS5zdWJzY3JpYmUoZnVuY3Rpb24oKSB7XG4gICAgICBjb250YWluZXIucmVtb3ZlQ2xhc3Moc2VsZi5wcmVmaXhDc3MoVUlDb250YWluZXIuQ09OVFJPTFNfU0hPV04pKTtcbiAgICAgIGNvbnRhaW5lci5hZGRDbGFzcyhzZWxmLnByZWZpeENzcyhVSUNvbnRhaW5lci5DT05UUk9MU19ISURERU4pKTtcbiAgICB9KTtcblxuICAgIC8vIExheW91dCBzaXplIGNsYXNzZXNcbiAgICBsZXQgdXBkYXRlTGF5b3V0U2l6ZUNsYXNzZXMgPSBmdW5jdGlvbih3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcikge1xuICAgICAgY29udGFpbmVyLnJlbW92ZUNsYXNzKHNlbGYucHJlZml4Q3NzKCdsYXlvdXQtbWF4LXdpZHRoLTQwMCcpKTtcbiAgICAgIGNvbnRhaW5lci5yZW1vdmVDbGFzcyhzZWxmLnByZWZpeENzcygnbGF5b3V0LW1heC13aWR0aC02MDAnKSk7XG4gICAgICBjb250YWluZXIucmVtb3ZlQ2xhc3Moc2VsZi5wcmVmaXhDc3MoJ2xheW91dC1tYXgtd2lkdGgtODAwJykpO1xuICAgICAgY29udGFpbmVyLnJlbW92ZUNsYXNzKHNlbGYucHJlZml4Q3NzKCdsYXlvdXQtbWF4LXdpZHRoLTEyMDAnKSk7XG5cbiAgICAgIGlmICh3aWR0aCA8PSA0MDApIHtcbiAgICAgICAgY29udGFpbmVyLmFkZENsYXNzKHNlbGYucHJlZml4Q3NzKCdsYXlvdXQtbWF4LXdpZHRoLTQwMCcpKTtcbiAgICAgIH0gZWxzZSBpZiAod2lkdGggPD0gNjAwKSB7XG4gICAgICAgIGNvbnRhaW5lci5hZGRDbGFzcyhzZWxmLnByZWZpeENzcygnbGF5b3V0LW1heC13aWR0aC02MDAnKSk7XG4gICAgICB9IGVsc2UgaWYgKHdpZHRoIDw9IDgwMCkge1xuICAgICAgICBjb250YWluZXIuYWRkQ2xhc3Moc2VsZi5wcmVmaXhDc3MoJ2xheW91dC1tYXgtd2lkdGgtODAwJykpO1xuICAgICAgfSBlbHNlIGlmICh3aWR0aCA8PSAxMjAwKSB7XG4gICAgICAgIGNvbnRhaW5lci5hZGRDbGFzcyhzZWxmLnByZWZpeENzcygnbGF5b3V0LW1heC13aWR0aC0xMjAwJykpO1xuICAgICAgfVxuICAgIH07XG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fUExBWUVSX1JFU0laRSwgZnVuY3Rpb24oZTogUGxheWVyUmVzaXplRXZlbnQpIHtcbiAgICAgIC8vIENvbnZlcnQgc3RyaW5ncyAod2l0aCBcInB4XCIgc3VmZml4KSB0byBpbnRzXG4gICAgICBsZXQgd2lkdGggPSBNYXRoLnJvdW5kKE51bWJlcihlLndpZHRoLnN1YnN0cmluZygwLCBlLndpZHRoLmxlbmd0aCAtIDIpKSk7XG4gICAgICBsZXQgaGVpZ2h0ID0gTWF0aC5yb3VuZChOdW1iZXIoZS5oZWlnaHQuc3Vic3RyaW5nKDAsIGUuaGVpZ2h0Lmxlbmd0aCAtIDIpKSk7XG5cbiAgICAgIHVwZGF0ZUxheW91dFNpemVDbGFzc2VzKHdpZHRoLCBoZWlnaHQpO1xuICAgIH0pO1xuICAgIC8vIEluaXQgbGF5b3V0IHN0YXRlXG4gICAgdXBkYXRlTGF5b3V0U2l6ZUNsYXNzZXMobmV3IERPTShwbGF5ZXIuZ2V0RmlndXJlKCkpLndpZHRoKCksIG5ldyBET00ocGxheWVyLmdldEZpZ3VyZSgpKS5oZWlnaHQoKSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgdG9Eb21FbGVtZW50KCk6IERPTSB7XG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgIGxldCBjb250YWluZXIgPSBzdXBlci50b0RvbUVsZW1lbnQoKTtcblxuICAgIC8vIERldGVjdCBmbGV4Ym94IHN1cHBvcnQgKG5vdCBzdXBwb3J0ZWQgaW4gSUU5KVxuICAgIGlmIChkb2N1bWVudCAmJiB0eXBlb2YgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpLnN0eWxlLmZsZXggIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBjb250YWluZXIuYWRkQ2xhc3Moc2VsZi5wcmVmaXhDc3MoJ2ZsZXhib3gnKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRhaW5lci5hZGRDbGFzcyhzZWxmLnByZWZpeENzcygnbm8tZmxleGJveCcpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY29udGFpbmVyO1xuICB9XG59IiwiaW1wb3J0IHtTZWxlY3RCb3h9IGZyb20gJy4vc2VsZWN0Ym94JztcbmltcG9ydCB7TGlzdFNlbGVjdG9yQ29uZmlnfSBmcm9tICcuL2xpc3RzZWxlY3Rvcic7XG5pbXBvcnQge1VJSW5zdGFuY2VNYW5hZ2VyfSBmcm9tICcuLi91aW1hbmFnZXInO1xuXG4vKipcbiAqIEEgc2VsZWN0IGJveCBwcm92aWRpbmcgYSBzZWxlY3Rpb24gYmV0d2VlbiAnYXV0bycgYW5kIHRoZSBhdmFpbGFibGUgdmlkZW8gcXVhbGl0aWVzLlxuICovXG5leHBvcnQgY2xhc3MgVmlkZW9RdWFsaXR5U2VsZWN0Qm94IGV4dGVuZHMgU2VsZWN0Qm94IHtcblxuICBjb25zdHJ1Y3Rvcihjb25maWc6IExpc3RTZWxlY3RvckNvbmZpZyA9IHt9KSB7XG4gICAgc3VwZXIoY29uZmlnKTtcbiAgfVxuXG4gIGNvbmZpZ3VyZShwbGF5ZXI6IGJpdG1vdmluLnBsYXllci5QbGF5ZXIsIHVpbWFuYWdlcjogVUlJbnN0YW5jZU1hbmFnZXIpOiB2b2lkIHtcbiAgICBzdXBlci5jb25maWd1cmUocGxheWVyLCB1aW1hbmFnZXIpO1xuXG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuXG4gICAgbGV0IHVwZGF0ZVZpZGVvUXVhbGl0aWVzID0gZnVuY3Rpb24oKSB7XG4gICAgICBsZXQgdmlkZW9RdWFsaXRpZXMgPSBwbGF5ZXIuZ2V0QXZhaWxhYmxlVmlkZW9RdWFsaXRpZXMoKTtcblxuICAgICAgc2VsZi5jbGVhckl0ZW1zKCk7XG5cbiAgICAgIC8vIEFkZCBlbnRyeSBmb3IgYXV0b21hdGljIHF1YWxpdHkgc3dpdGNoaW5nIChkZWZhdWx0IHNldHRpbmcpXG4gICAgICBzZWxmLmFkZEl0ZW0oJ2F1dG8nLCAnYXV0bycpO1xuXG4gICAgICAvLyBBZGQgdmlkZW8gcXVhbGl0aWVzXG4gICAgICBmb3IgKGxldCB2aWRlb1F1YWxpdHkgb2YgdmlkZW9RdWFsaXRpZXMpIHtcbiAgICAgICAgc2VsZi5hZGRJdGVtKHZpZGVvUXVhbGl0eS5pZCwgdmlkZW9RdWFsaXR5LmxhYmVsKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgc2VsZi5vbkl0ZW1TZWxlY3RlZC5zdWJzY3JpYmUoZnVuY3Rpb24oc2VuZGVyOiBWaWRlb1F1YWxpdHlTZWxlY3RCb3gsIHZhbHVlOiBzdHJpbmcpIHtcbiAgICAgIHBsYXllci5zZXRWaWRlb1F1YWxpdHkodmFsdWUpO1xuICAgIH0pO1xuXG4gICAgLy8gVXBkYXRlIHF1YWxpdGllcyB3aGVuIHNvdXJjZSBnb2VzIGF3YXlcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9TT1VSQ0VfVU5MT0FERUQsIHVwZGF0ZVZpZGVvUXVhbGl0aWVzKTtcbiAgICAvLyBVcGRhdGUgcXVhbGl0aWVzIHdoZW4gYSBuZXcgc291cmNlIGlzIGxvYWRlZFxuICAgIHBsYXllci5hZGRFdmVudEhhbmRsZXIoYml0bW92aW4ucGxheWVyLkVWRU5ULk9OX1JFQURZLCB1cGRhdGVWaWRlb1F1YWxpdGllcyk7XG4gICAgLy8gVXBkYXRlIHF1YWxpdHkgc2VsZWN0aW9uIHdoZW4gcXVhbGl0eSBpcyBjaGFuZ2VkIChmcm9tIG91dHNpZGUpXG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fVklERU9fRE9XTkxPQURfUVVBTElUWV9DSEFOR0VELCBmdW5jdGlvbigpIHtcbiAgICAgIGxldCBkYXRhID0gcGxheWVyLmdldERvd25sb2FkZWRWaWRlb0RhdGEoKTtcbiAgICAgIHNlbGYuc2VsZWN0SXRlbShkYXRhLmlzQXV0byA/ICdhdXRvJyA6IGRhdGEuaWQpO1xuICAgIH0pO1xuXG4gICAgLy8gUG9wdWxhdGUgcXVhbGl0aWVzIGF0IHN0YXJ0dXBcbiAgICB1cGRhdGVWaWRlb1F1YWxpdGllcygpO1xuICB9XG59IiwiaW1wb3J0IHtDb250YWluZXIsIENvbnRhaW5lckNvbmZpZ30gZnJvbSAnLi9jb250YWluZXInO1xuaW1wb3J0IHtWb2x1bWVTbGlkZXJ9IGZyb20gJy4vdm9sdW1lc2xpZGVyJztcbmltcG9ydCB7Vm9sdW1lVG9nZ2xlQnV0dG9ufSBmcm9tICcuL3ZvbHVtZXRvZ2dsZWJ1dHRvbic7XG5pbXBvcnQge1VJSW5zdGFuY2VNYW5hZ2VyfSBmcm9tICcuLi91aW1hbmFnZXInO1xuaW1wb3J0IHtUaW1lb3V0fSBmcm9tICcuLi90aW1lb3V0JztcblxuLyoqXG4gKiBDb25maWd1cmF0aW9uIGludGVyZmFjZSBmb3IgYSB7QGxpbmsgVm9sdW1lQ29udHJvbEJ1dHRvbn0uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVm9sdW1lQ29udHJvbEJ1dHRvbkNvbmZpZyBleHRlbmRzIENvbnRhaW5lckNvbmZpZyB7XG4gIC8qKlxuICAgKiBUaGUgZGVsYXkgYWZ0ZXIgd2hpY2ggdGhlIHZvbHVtZSBzbGlkZXIgd2lsbCBiZSBoaWRkZW4gd2hlbiB0aGVyZSBpcyBubyB1c2VyIGludGVyYWN0aW9uLlxuICAgKiBDYXJlIG11c3QgYmUgdGFrZW4gdGhhdCB0aGUgZGVsYXkgaXMgbG9uZyBlbm91Z2ggc28gdXNlcnMgY2FuIHJlYWNoIHRoZSBzbGlkZXIgZnJvbSB0aGUgdG9nZ2xlIGJ1dHRvbiwgZS5nLiBieVxuICAgKiBtb3VzZSBtb3ZlbWVudC4gSWYgdGhlIGRlbGF5IGlzIHRvbyBzaG9ydCwgdGhlIHNsaWRlcnMgZGlzYXBwZWFycyBiZWZvcmUgdGhlIG1vdXNlIHBvaW50ZXIgaGFzIHJlYWNoZWQgaXQgYW5kXG4gICAqIHRoZSB1c2VyIGlzIG5vdCBhYmxlIHRvIHVzZSBpdC5cbiAgICogRGVmYXVsdDogNTAwbXNcbiAgICovXG4gIGhpZGVEZWxheT86IG51bWJlcjtcbiAgLyoqXG4gICAqIFNwZWNpZmllcyBpZiB0aGUgdm9sdW1lIHNsaWRlciBzaG91bGQgYmUgdmVydGljYWxseSBvciBob3Jpem9udGFsbHkgYWxpZ25lZC5cbiAgICogRGVmYXVsdDogdHJ1ZVxuICAgKi9cbiAgdmVydGljYWw/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIEEgY29tcG9zaXRlIHZvbHVtZSBjb250cm9sIHRoYXQgY29uc2lzdHMgb2YgYW5kIGludGVybmFsbHkgbWFuYWdlcyBhIHZvbHVtZSBjb250cm9sIGJ1dHRvbiB0aGF0IGNhbiBiZSB1c2VkXG4gKiBmb3IgbXV0aW5nLCBhbmQgYSAoZGVwZW5kaW5nIG9uIHRoZSBDU1Mgc3R5bGUsIGUuZy4gc2xpZGUtb3V0KSB2b2x1bWUgY29udHJvbCBiYXIuXG4gKi9cbmV4cG9ydCBjbGFzcyBWb2x1bWVDb250cm9sQnV0dG9uIGV4dGVuZHMgQ29udGFpbmVyPFZvbHVtZUNvbnRyb2xCdXR0b25Db25maWc+IHtcblxuICBwcml2YXRlIHZvbHVtZVRvZ2dsZUJ1dHRvbjogVm9sdW1lVG9nZ2xlQnV0dG9uO1xuICBwcml2YXRlIHZvbHVtZVNsaWRlcjogVm9sdW1lU2xpZGVyO1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogVm9sdW1lQ29udHJvbEJ1dHRvbkNvbmZpZyA9IHt9KSB7XG4gICAgc3VwZXIoY29uZmlnKTtcblxuICAgIHRoaXMudm9sdW1lVG9nZ2xlQnV0dG9uID0gbmV3IFZvbHVtZVRvZ2dsZUJ1dHRvbigpO1xuICAgIHRoaXMudm9sdW1lU2xpZGVyID0gbmV3IFZvbHVtZVNsaWRlcih7XG4gICAgICB2ZXJ0aWNhbDogY29uZmlnLnZlcnRpY2FsICE9IG51bGwgPyBjb25maWcudmVydGljYWwgOiB0cnVlLFxuICAgICAgaGlkZGVuOiB0cnVlXG4gICAgfSk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IHRoaXMubWVyZ2VDb25maWcoY29uZmlnLCB7XG4gICAgICBjc3NDbGFzczogJ3VpLXZvbHVtZWNvbnRyb2xidXR0b24nLFxuICAgICAgY29tcG9uZW50czogW3RoaXMudm9sdW1lVG9nZ2xlQnV0dG9uLCB0aGlzLnZvbHVtZVNsaWRlcl0sXG4gICAgICBoaWRlRGVsYXk6IDUwMFxuICAgIH0sIDxWb2x1bWVDb250cm9sQnV0dG9uQ29uZmlnPnRoaXMuY29uZmlnKTtcbiAgfVxuXG4gIGNvbmZpZ3VyZShwbGF5ZXI6IGJpdG1vdmluLnBsYXllci5QbGF5ZXIsIHVpbWFuYWdlcjogVUlJbnN0YW5jZU1hbmFnZXIpOiB2b2lkIHtcbiAgICBzdXBlci5jb25maWd1cmUocGxheWVyLCB1aW1hbmFnZXIpO1xuXG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgIGxldCB2b2x1bWVUb2dnbGVCdXR0b24gPSB0aGlzLmdldFZvbHVtZVRvZ2dsZUJ1dHRvbigpO1xuICAgIGxldCB2b2x1bWVTbGlkZXIgPSB0aGlzLmdldFZvbHVtZVNsaWRlcigpO1xuXG4gICAgbGV0IHRpbWVvdXQgPSBuZXcgVGltZW91dCgoPFZvbHVtZUNvbnRyb2xCdXR0b25Db25maWc+c2VsZi5nZXRDb25maWcoKSkuaGlkZURlbGF5LCBmdW5jdGlvbigpIHtcbiAgICAgIHZvbHVtZVNsaWRlci5oaWRlKCk7XG4gICAgfSk7XG5cbiAgICAvKlxuICAgICAqIFZvbHVtZSBTbGlkZXIgdmlzaWJpbGl0eSBoYW5kbGluZ1xuICAgICAqXG4gICAgICogVGhlIHZvbHVtZSBzbGlkZXIgc2hhbGwgYmUgdmlzaWJsZSB3aGlsZSB0aGUgdXNlciBob3ZlcnMgdGhlIG11dGUgdG9nZ2xlIGJ1dHRvbiwgd2hpbGUgdGhlIHVzZXIgaG92ZXJzIHRoZVxuICAgICAqIHZvbHVtZSBzbGlkZXIsIGFuZCB3aGlsZSB0aGUgdXNlciBzbGlkZXMgdGhlIHZvbHVtZSBzbGlkZXIuIElmIG5vbmUgb2YgdGhlc2Ugc2l0dWF0aW9ucyBhcmUgdHJ1ZSwgdGhlIHNsaWRlclxuICAgICAqIHNoYWxsIGRpc2FwcGVhci5cbiAgICAgKi9cbiAgICBsZXQgdm9sdW1lU2xpZGVySG92ZXJlZCA9IGZhbHNlO1xuICAgIHZvbHVtZVRvZ2dsZUJ1dHRvbi5nZXREb21FbGVtZW50KCkub24oJ21vdXNlZW50ZXInLCBmdW5jdGlvbigpIHtcbiAgICAgIC8vIFNob3cgdm9sdW1lIHNsaWRlciB3aGVuIG1vdXNlIGVudGVycyB0aGUgYnV0dG9uIGFyZWFcbiAgICAgIGlmICh2b2x1bWVTbGlkZXIuaXNIaWRkZW4oKSkge1xuICAgICAgICB2b2x1bWVTbGlkZXIuc2hvdygpO1xuICAgICAgfVxuICAgICAgLy8gQXZvaWQgaGlkaW5nIG9mIHRoZSBzbGlkZXIgd2hlbiBidXR0b24gaXMgaG92ZXJlZFxuICAgICAgdGltZW91dC5jbGVhcigpO1xuICAgIH0pO1xuICAgIHZvbHVtZVRvZ2dsZUJ1dHRvbi5nZXREb21FbGVtZW50KCkub24oJ21vdXNlbGVhdmUnLCBmdW5jdGlvbigpIHtcbiAgICAgIC8vIEhpZGUgc2xpZGVyIGRlbGF5ZWQgd2hlbiBidXR0b24gaXMgbGVmdFxuICAgICAgdGltZW91dC5yZXNldCgpO1xuICAgIH0pO1xuICAgIHZvbHVtZVNsaWRlci5nZXREb21FbGVtZW50KCkub24oJ21vdXNlZW50ZXInLCBmdW5jdGlvbigpIHtcbiAgICAgIC8vIFdoZW4gdGhlIHNsaWRlciBpcyBlbnRlcmVkLCBjYW5jZWwgdGhlIGhpZGUgdGltZW91dCBhY3RpdmF0ZWQgYnkgbGVhdmluZyB0aGUgYnV0dG9uXG4gICAgICB0aW1lb3V0LmNsZWFyKCk7XG4gICAgICB2b2x1bWVTbGlkZXJIb3ZlcmVkID0gdHJ1ZTtcbiAgICB9KTtcbiAgICB2b2x1bWVTbGlkZXIuZ2V0RG9tRWxlbWVudCgpLm9uKCdtb3VzZWxlYXZlJywgZnVuY3Rpb24oKSB7XG4gICAgICAvLyBXaGVuIG1vdXNlIGxlYXZlcyB0aGUgc2xpZGVyLCBvbmx5IGhpZGUgaXQgaWYgdGhlcmUgaXMgbm8gc2xpZGUgb3BlcmF0aW9uIGluIHByb2dyZXNzXG4gICAgICBpZiAodm9sdW1lU2xpZGVyLmlzU2Vla2luZygpKSB7XG4gICAgICAgIHRpbWVvdXQuY2xlYXIoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRpbWVvdXQucmVzZXQoKTtcbiAgICAgIH1cbiAgICAgIHZvbHVtZVNsaWRlckhvdmVyZWQgPSBmYWxzZTtcbiAgICB9KTtcbiAgICB2b2x1bWVTbGlkZXIub25TZWVrZWQuc3Vic2NyaWJlKGZ1bmN0aW9uKCkge1xuICAgICAgLy8gV2hlbiBhIHNsaWRlIG9wZXJhdGlvbiBpcyBkb25lIGFuZCB0aGUgc2xpZGVyIG5vdCBob3ZlcmVkIChtb3VzZSBvdXRzaWRlIHNsaWRlciksIGhpZGUgc2xpZGVyIGRlbGF5ZWRcbiAgICAgIGlmICghdm9sdW1lU2xpZGVySG92ZXJlZCkge1xuICAgICAgICB0aW1lb3V0LnJlc2V0KCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUHJvdmlkZXMgYWNjZXNzIHRvIHRoZSBpbnRlcm5hbGx5IG1hbmFnZWQgdm9sdW1lIHRvZ2dsZSBidXR0b24uXG4gICAqIEByZXR1cm5zIHtWb2x1bWVUb2dnbGVCdXR0b259XG4gICAqL1xuICBnZXRWb2x1bWVUb2dnbGVCdXR0b24oKTogVm9sdW1lVG9nZ2xlQnV0dG9uIHtcbiAgICByZXR1cm4gdGhpcy52b2x1bWVUb2dnbGVCdXR0b247XG4gIH1cblxuICAvKipcbiAgICogUHJvdmlkZXMgYWNjZXNzIHRvIHRoZSBpbnRlcm5hbGx5IG1hbmFnZWQgdm9sdW1lIHNpbGRlci5cbiAgICogQHJldHVybnMge1ZvbHVtZVNsaWRlcn1cbiAgICovXG4gIGdldFZvbHVtZVNsaWRlcigpOiBWb2x1bWVTbGlkZXIge1xuICAgIHJldHVybiB0aGlzLnZvbHVtZVNsaWRlcjtcbiAgfVxufSIsImltcG9ydCB7U2Vla0JhciwgU2Vla0JhckNvbmZpZ30gZnJvbSAnLi9zZWVrYmFyJztcbmltcG9ydCB7VUlJbnN0YW5jZU1hbmFnZXJ9IGZyb20gJy4uL3VpbWFuYWdlcic7XG5pbXBvcnQge1RpbWVvdXR9IGZyb20gJy4uL3RpbWVvdXQnO1xuXG4vKipcbiAqIEEgc2ltcGxlIHZvbHVtZSBzbGlkZXIgY29tcG9uZW50IHRvIGFkanVzdCB0aGUgcGxheWVyJ3Mgdm9sdW1lIHNldHRpbmcuXG4gKi9cbmV4cG9ydCBjbGFzcyBWb2x1bWVTbGlkZXIgZXh0ZW5kcyBTZWVrQmFyIHtcblxuICBjb25zdHJ1Y3Rvcihjb25maWc6IFNlZWtCYXJDb25maWcgPSB7fSkge1xuICAgIHN1cGVyKGNvbmZpZyk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IHRoaXMubWVyZ2VDb25maWcoY29uZmlnLCB7XG4gICAgICBjc3NDbGFzczogJ3VpLXZvbHVtZXNsaWRlcidcbiAgICB9LCB0aGlzLmNvbmZpZyk7XG4gIH1cblxuICBjb25maWd1cmUocGxheWVyOiBiaXRtb3Zpbi5wbGF5ZXIuUGxheWVyLCB1aW1hbmFnZXI6IFVJSW5zdGFuY2VNYW5hZ2VyKTogdm9pZCB7XG4gICAgc3VwZXIuY29uZmlndXJlKHBsYXllciwgdWltYW5hZ2VyLCBmYWxzZSk7XG5cbiAgICBsZXQgc2VsZiA9IHRoaXM7XG5cbiAgICBsZXQgdm9sdW1lQ2hhbmdlSGFuZGxlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHBsYXllci5pc011dGVkKCkpIHtcbiAgICAgICAgc2VsZi5zZXRQbGF5YmFja1Bvc2l0aW9uKDApO1xuICAgICAgICBzZWxmLnNldEJ1ZmZlclBvc2l0aW9uKDApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2VsZi5zZXRQbGF5YmFja1Bvc2l0aW9uKHBsYXllci5nZXRWb2x1bWUoKSk7XG5cbiAgICAgICAgc2VsZi5zZXRCdWZmZXJQb3NpdGlvbihwbGF5ZXIuZ2V0Vm9sdW1lKCkpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9WT0xVTUVfQ0hBTkdFRCwgdm9sdW1lQ2hhbmdlSGFuZGxlcik7XG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fTVVURUQsIHZvbHVtZUNoYW5nZUhhbmRsZXIpO1xuICAgIHBsYXllci5hZGRFdmVudEhhbmRsZXIoYml0bW92aW4ucGxheWVyLkVWRU5ULk9OX1VOTVVURUQsIHZvbHVtZUNoYW5nZUhhbmRsZXIpO1xuXG4gICAgdGhpcy5vblNlZWtQcmV2aWV3LnN1YnNjcmliZShmdW5jdGlvbihzZW5kZXIsIGFyZ3MpIHtcbiAgICAgIGlmIChhcmdzLnNjcnViYmluZykge1xuICAgICAgICBwbGF5ZXIuc2V0Vm9sdW1lKGFyZ3MucG9zaXRpb24pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMub25TZWVrZWQuc3Vic2NyaWJlKGZ1bmN0aW9uKHNlbmRlciwgcGVyY2VudGFnZSkge1xuICAgICAgcGxheWVyLnNldFZvbHVtZShwZXJjZW50YWdlKTtcbiAgICB9KTtcblxuICAgIHBsYXllci5hZGRFdmVudEhhbmRsZXIoYml0bW92aW4ucGxheWVyLkVWRU5ULk9OX1BMQVlFUl9SRVNJWkUsIGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5yZWZyZXNoUGxheWJhY2tQb3NpdGlvbigpO1xuICAgIH0pO1xuXG4gICAgLy8gSW5pdCB2b2x1bWUgYmFyXG4gICAgdm9sdW1lQ2hhbmdlSGFuZGxlcigpO1xuXG4gICAgLy8gVE9ETyBmaW5kIGEgYmV0dGVyIHNvbHV0aW9uIGZvciB0aGlzIGhhY2tcbiAgICAvKiBBdCB0aGUgdGltZSB3aGVyZSB0aGlzIGlzIGNhbGxlZCwgdGhlIERPTSBlbGVtZW50IGRvZXMgbm90IGhhdmUgYSBzaXplIHlldCwgcmVzdWx0aW5nIGluIGEgemVybyBvZmZzZXQgb2YgdGhlXG4gICAgICogdm9sdW1lIHNsaWRlciBrbm9iLCBubyBtYXR0ZXIgd2hhdCB0aGUgYWN0dWFsIHZvbHVtZSBzZXR0aW5nIG9uIHRoZSBwbGF5ZXIgaXMuIE91dCBvZiBsYWNrIG9mIGEgd2F5IHRvXG4gICAgICogZGV0ZWN0IHdoZW4gdGhlIGVsZW1lbnQgZ2V0cyBpdHMgc2l6ZSwgd2UgdXNlIHRoaXMgaGFjayB0aGF0IGFjdHVhbGx5IHNlZW1zIHRvIHdvcmsgb24gYWxsIGJyb3dzZXJzLlxuICAgICAqL1xuICAgIG5ldyBUaW1lb3V0KDEsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHNlbGYucmVmcmVzaFBsYXliYWNrUG9zaXRpb24oKTtcbiAgICB9KS5zdGFydCgpO1xuICB9XG59IiwiaW1wb3J0IHtUb2dnbGVCdXR0b24sIFRvZ2dsZUJ1dHRvbkNvbmZpZ30gZnJvbSAnLi90b2dnbGVidXR0b24nO1xuaW1wb3J0IHtVSUluc3RhbmNlTWFuYWdlcn0gZnJvbSAnLi4vdWltYW5hZ2VyJztcbmltcG9ydCBWb2x1bWVDaGFuZ2VFdmVudCA9IGJpdG1vdmluLnBsYXllci5Wb2x1bWVDaGFuZ2VFdmVudDtcblxuLyoqXG4gKiBBIGJ1dHRvbiB0aGF0IHRvZ2dsZXMgYXVkaW8gbXV0aW5nLlxuICovXG5leHBvcnQgY2xhc3MgVm9sdW1lVG9nZ2xlQnV0dG9uIGV4dGVuZHMgVG9nZ2xlQnV0dG9uPFRvZ2dsZUJ1dHRvbkNvbmZpZz4ge1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogVG9nZ2xlQnV0dG9uQ29uZmlnID0ge30pIHtcbiAgICBzdXBlcihjb25maWcpO1xuXG4gICAgdGhpcy5jb25maWcgPSB0aGlzLm1lcmdlQ29uZmlnKGNvbmZpZywge1xuICAgICAgY3NzQ2xhc3M6ICd1aS12b2x1bWV0b2dnbGVidXR0b24nLFxuICAgICAgdGV4dDogJ1ZvbHVtZS9NdXRlJ1xuICAgIH0sIHRoaXMuY29uZmlnKTtcbiAgfVxuXG4gIGNvbmZpZ3VyZShwbGF5ZXI6IGJpdG1vdmluLnBsYXllci5QbGF5ZXIsIHVpbWFuYWdlcjogVUlJbnN0YW5jZU1hbmFnZXIpOiB2b2lkIHtcbiAgICBzdXBlci5jb25maWd1cmUocGxheWVyLCB1aW1hbmFnZXIpO1xuXG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuXG4gICAgbGV0IG11dGVTdGF0ZUhhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChwbGF5ZXIuaXNNdXRlZCgpKSB7XG4gICAgICAgIHNlbGYub24oKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNlbGYub2ZmKCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHBsYXllci5hZGRFdmVudEhhbmRsZXIoYml0bW92aW4ucGxheWVyLkVWRU5ULk9OX01VVEVELCBtdXRlU3RhdGVIYW5kbGVyKTtcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9VTk1VVEVELCBtdXRlU3RhdGVIYW5kbGVyKTtcblxuICAgIHNlbGYub25DbGljay5zdWJzY3JpYmUoZnVuY3Rpb24oKSB7XG4gICAgICBpZiAocGxheWVyLmlzTXV0ZWQoKSkge1xuICAgICAgICBwbGF5ZXIudW5tdXRlKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwbGF5ZXIubXV0ZSgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fVk9MVU1FX0NIQU5HRUQsIGZ1bmN0aW9uKGV2ZW50OiBWb2x1bWVDaGFuZ2VFdmVudCkge1xuICAgICAgLy8gVG9nZ2xlIGxvdyBjbGFzcyB0byBkaXNwbGF5IGxvdyB2b2x1bWUgaWNvbiBiZWxvdyA1MCUgdm9sdW1lXG4gICAgICBpZiAoZXZlbnQudGFyZ2V0Vm9sdW1lIDwgNTApIHtcbiAgICAgICAgc2VsZi5nZXREb21FbGVtZW50KCkuYWRkQ2xhc3Moc2VsZi5wcmVmaXhDc3MoJ2xvdycpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNlbGYuZ2V0RG9tRWxlbWVudCgpLnJlbW92ZUNsYXNzKHNlbGYucHJlZml4Q3NzKCdsb3cnKSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBTdGFydHVwIGluaXRcbiAgICBtdXRlU3RhdGVIYW5kbGVyKCk7XG4gIH1cbn0iLCJpbXBvcnQge1RvZ2dsZUJ1dHRvbiwgVG9nZ2xlQnV0dG9uQ29uZmlnfSBmcm9tICcuL3RvZ2dsZWJ1dHRvbic7XG5pbXBvcnQge1VJSW5zdGFuY2VNYW5hZ2VyfSBmcm9tICcuLi91aW1hbmFnZXInO1xuXG4vKipcbiAqIEEgYnV0dG9uIHRoYXQgdG9nZ2xlcyB0aGUgdmlkZW8gdmlldyBiZXR3ZWVuIG5vcm1hbC9tb25vIGFuZCBWUi9zdGVyZW8uXG4gKi9cbmV4cG9ydCBjbGFzcyBWUlRvZ2dsZUJ1dHRvbiBleHRlbmRzIFRvZ2dsZUJ1dHRvbjxUb2dnbGVCdXR0b25Db25maWc+IHtcblxuICBjb25zdHJ1Y3Rvcihjb25maWc6IFRvZ2dsZUJ1dHRvbkNvbmZpZyA9IHt9KSB7XG4gICAgc3VwZXIoY29uZmlnKTtcblxuICAgIHRoaXMuY29uZmlnID0gdGhpcy5tZXJnZUNvbmZpZyhjb25maWcsIHtcbiAgICAgIGNzc0NsYXNzOiAndWktdnJ0b2dnbGVidXR0b24nLFxuICAgICAgdGV4dDogJ1ZSJ1xuICAgIH0sIHRoaXMuY29uZmlnKTtcbiAgfVxuXG4gIGNvbmZpZ3VyZShwbGF5ZXI6IGJpdG1vdmluLnBsYXllci5QbGF5ZXIsIHVpbWFuYWdlcjogVUlJbnN0YW5jZU1hbmFnZXIpOiB2b2lkIHtcbiAgICBzdXBlci5jb25maWd1cmUocGxheWVyLCB1aW1hbmFnZXIpO1xuXG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuXG4gICAgbGV0IGlzVlJDb25maWd1cmVkID0gZnVuY3Rpb24oKSB7XG4gICAgICAvLyBWUiBhdmFpbGFiaWxpdHkgY2Fubm90IGJlIGNoZWNrZWQgdGhyb3VnaCBnZXRWUlN0YXR1cygpIGJlY2F1c2UgaXQgaXMgYXN5bmNocm9ub3VzbHkgcG9wdWxhdGVkIGFuZCBub3RcbiAgICAgIC8vIGF2YWlsYWJsZSBhdCBVSSBpbml0aWFsaXphdGlvbi4gQXMgYW4gYWx0ZXJuYXRpdmUsIHdlIGNoZWNrIHRoZSBWUiBzZXR0aW5ncyBpbiB0aGUgY29uZmlnLlxuICAgICAgLy8gVE9ETyB1c2UgZ2V0VlJTdGF0dXMoKSB0aHJvdWdoIGlzVlJTdGVyZW9BdmFpbGFibGUoKSBvbmNlIHRoZSBwbGF5ZXIgaGFzIGJlZW4gcmV3cml0dGVuIGFuZCB0aGUgc3RhdHVzIGlzXG4gICAgICAvLyBhdmFpbGFibGUgaW4gT05fUkVBRFlcbiAgICAgIGxldCBjb25maWcgPSBwbGF5ZXIuZ2V0Q29uZmlnKCk7XG4gICAgICByZXR1cm4gY29uZmlnLnNvdXJjZSAmJiBjb25maWcuc291cmNlLnZyICYmIGNvbmZpZy5zb3VyY2UudnIuY29udGVudFR5cGUgIT09ICdub25lJztcbiAgICB9O1xuXG4gICAgbGV0IGlzVlJTdGVyZW9BdmFpbGFibGUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBwbGF5ZXIuZ2V0VlJTdGF0dXMoKS5jb250ZW50VHlwZSAhPT0gJ25vbmUnO1xuICAgIH07XG5cbiAgICBsZXQgdnJTdGF0ZUhhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChpc1ZSQ29uZmlndXJlZCgpICYmIGlzVlJTdGVyZW9BdmFpbGFibGUoKSkge1xuICAgICAgICBzZWxmLnNob3coKTsgLy8gc2hvdyBidXR0b24gaW4gY2FzZSBpdCBpcyBoaWRkZW5cblxuICAgICAgICBpZiAocGxheWVyLmdldFZSU3RhdHVzKCkuaXNTdGVyZW8pIHtcbiAgICAgICAgICBzZWxmLm9uKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2VsZi5vZmYoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2VsZi5oaWRlKCk7IC8vIGhpZGUgYnV0dG9uIGlmIG5vIHN0ZXJlbyBtb2RlIGF2YWlsYWJsZVxuICAgICAgfVxuICAgIH07XG5cbiAgICBsZXQgdnJCdXR0b25WaXNpYmlsaXR5SGFuZGxlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKGlzVlJDb25maWd1cmVkKCkpIHtcbiAgICAgICAgc2VsZi5zaG93KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZWxmLmhpZGUoKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fVlJfTU9ERV9DSEFOR0VELCB2clN0YXRlSGFuZGxlcik7XG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fVlJfU1RFUkVPX0NIQU5HRUQsIHZyU3RhdGVIYW5kbGVyKTtcbiAgICBwbGF5ZXIuYWRkRXZlbnRIYW5kbGVyKGJpdG1vdmluLnBsYXllci5FVkVOVC5PTl9WUl9FUlJPUiwgdnJTdGF0ZUhhbmRsZXIpO1xuICAgIC8vIEhpZGUgYnV0dG9uIHdoZW4gVlIgc291cmNlIGdvZXMgYXdheVxuICAgIHBsYXllci5hZGRFdmVudEhhbmRsZXIoYml0bW92aW4ucGxheWVyLkVWRU5ULk9OX1NPVVJDRV9VTkxPQURFRCwgdnJCdXR0b25WaXNpYmlsaXR5SGFuZGxlcik7XG4gICAgLy8gU2hvdyBidXR0b24gd2hlbiBhIG5ldyBzb3VyY2UgaXMgbG9hZGVkIGFuZCBpdCdzIFZSXG4gICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQuT05fUkVBRFksIHZyQnV0dG9uVmlzaWJpbGl0eUhhbmRsZXIpO1xuXG4gICAgc2VsZi5vbkNsaWNrLnN1YnNjcmliZShmdW5jdGlvbigpIHtcbiAgICAgIGlmICghaXNWUlN0ZXJlb0F2YWlsYWJsZSgpKSB7XG4gICAgICAgIGlmIChjb25zb2xlKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ05vIFZSIGNvbnRlbnQnKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHBsYXllci5nZXRWUlN0YXR1cygpLmlzU3RlcmVvKSB7XG4gICAgICAgICAgcGxheWVyLnNldFZSU3RlcmVvKGZhbHNlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwbGF5ZXIuc2V0VlJTdGVyZW8odHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFNldCBzdGFydHVwIHZpc2liaWxpdHlcbiAgICB2ckJ1dHRvblZpc2liaWxpdHlIYW5kbGVyKCk7XG4gIH1cbn0iLCJpbXBvcnQge0NsaWNrT3ZlcmxheSwgQ2xpY2tPdmVybGF5Q29uZmlnfSBmcm9tICcuL2NsaWNrb3ZlcmxheSc7XG5cbi8qKlxuICogQ29uZmlndXJhdGlvbiBpbnRlcmZhY2UgZm9yIGEge0BsaW5rIENsaWNrT3ZlcmxheX0uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgV2F0ZXJtYXJrQ29uZmlnIGV4dGVuZHMgQ2xpY2tPdmVybGF5Q29uZmlnIHtcbiAgLy8gbm90aGluZyB5ZXRcbn1cblxuLyoqXG4gKiBBIHdhdGVybWFyayBvdmVybGF5IHdpdGggYSBjbGlja2FibGUgbG9nby5cbiAqL1xuZXhwb3J0IGNsYXNzIFdhdGVybWFyayBleHRlbmRzIENsaWNrT3ZlcmxheSB7XG5cbiAgY29uc3RydWN0b3IoY29uZmlnOiBXYXRlcm1hcmtDb25maWcgPSB7fSkge1xuICAgIHN1cGVyKGNvbmZpZyk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IHRoaXMubWVyZ2VDb25maWcoY29uZmlnLCB7XG4gICAgICBjc3NDbGFzczogJ3VpLXdhdGVybWFyaycsXG4gICAgICB1cmw6ICdodHRwOi8vYml0bW92aW4uY29tJ1xuICAgIH0sIDxXYXRlcm1hcmtDb25maWc+dGhpcy5jb25maWcpO1xuICB9XG59IiwiZXhwb3J0IGludGVyZmFjZSBPZmZzZXQge1xuICBsZWZ0OiBudW1iZXI7XG4gIHRvcDogbnVtYmVyO1xufVxuXG4vKipcbiAqIFNpbXBsZSBET00gbWFuaXB1bGF0aW9uIGFuZCBET00gZWxlbWVudCBldmVudCBoYW5kbGluZyBtb2RlbGVkIGFmdGVyIGpRdWVyeSAoYXMgcmVwbGFjZW1lbnQgZm9yIGpRdWVyeSkuXG4gKlxuICogTGlrZSBqUXVlcnksIERPTSBvcGVyYXRlcyBvbiBzaW5nbGUgZWxlbWVudHMgYW5kIGxpc3RzIG9mIGVsZW1lbnRzLiBGb3IgZXhhbXBsZTogY3JlYXRpbmcgYW4gZWxlbWVudCByZXR1cm5zIGEgRE9NXG4gKiBpbnN0YW5jZSB3aXRoIGEgc2luZ2xlIGVsZW1lbnQsIHNlbGVjdGluZyBlbGVtZW50cyByZXR1cm5zIGEgRE9NIGluc3RhbmNlIHdpdGggemVybywgb25lLCBvciBtYW55IGVsZW1lbnRzLiBTaW1pbGFyXG4gKiB0byBqUXVlcnksIHNldHRlcnMgdXN1YWxseSBhZmZlY3QgYWxsIGVsZW1lbnRzLCB3aGlsZSBnZXR0ZXJzIG9wZXJhdGUgb24gb25seSB0aGUgZmlyc3QgZWxlbWVudC5cbiAqIEFsc28gc2ltaWxhciB0byBqUXVlcnksIG1vc3QgbWV0aG9kcyAoZXhjZXB0IGdldHRlcnMpIHJldHVybiB0aGUgRE9NIGluc3RhbmNlIGZhY2lsaXRhdGluZyBlYXN5IGNoYWluaW5nIG9mIG1ldGhvZFxuICogY2FsbHMuXG4gKlxuICogQnVpbHQgd2l0aCB0aGUgaGVscCBvZjogaHR0cDovL3lvdW1pZ2h0bm90bmVlZGpxdWVyeS5jb20vXG4gKi9cbmV4cG9ydCBjbGFzcyBET00ge1xuXG4gIHByaXZhdGUgZG9jdW1lbnQ6IERvY3VtZW50O1xuXG4gIC8qKlxuICAgKiBUaGUgbGlzdCBvZiBlbGVtZW50cyB0aGF0IHRoZSBpbnN0YW5jZSB3cmFwcy4gVGFrZSBjYXJlIHRoYXQgbm90IGFsbCBtZXRob2RzIGNhbiBvcGVyYXRlIG9uIHRoZSB3aG9sZSBsaXN0LFxuICAgKiBnZXR0ZXJzIHVzdWFsbHkganVzdCB3b3JrIG9uIHRoZSBmaXJzdCBlbGVtZW50LlxuICAgKi9cbiAgcHJpdmF0ZSBlbGVtZW50czogSFRNTEVsZW1lbnRbXTtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIERPTSBlbGVtZW50LlxuICAgKiBAcGFyYW0gdGFnTmFtZSB0aGUgdGFnIG5hbWUgb2YgdGhlIERPTSBlbGVtZW50XG4gICAqIEBwYXJhbSBhdHRyaWJ1dGVzIGEgbGlzdCBvZiBhdHRyaWJ1dGVzIG9mIHRoZSBlbGVtZW50XG4gICAqL1xuICBjb25zdHJ1Y3Rvcih0YWdOYW1lOiBzdHJpbmcsIGF0dHJpYnV0ZXM6IHtbbmFtZTogc3RyaW5nXTogc3RyaW5nfSk7XG4gIC8qKlxuICAgKiBTZWxlY3RzIGFsbCBlbGVtZW50cyBmcm9tIHRoZSBET00gdGhhdCBtYXRjaCB0aGUgc3BlY2lmaWVkIHNlbGVjdG9yLlxuICAgKiBAcGFyYW0gc2VsZWN0b3IgdGhlIHNlbGVjdG9yIHRvIG1hdGNoIERPTSBlbGVtZW50cyB3aXRoXG4gICAqL1xuICBjb25zdHJ1Y3RvcihzZWxlY3Rvcjogc3RyaW5nKTtcbiAgLyoqXG4gICAqIFdyYXBzIGEgcGxhaW4gSFRNTEVsZW1lbnQgd2l0aCBhIERPTSBpbnN0YW5jZS5cbiAgICogQHBhcmFtIGVsZW1lbnQgdGhlIEhUTUxFbGVtZW50IHRvIHdyYXAgd2l0aCBET01cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQ6IEhUTUxFbGVtZW50KTtcbiAgLyoqXG4gICAqIFdyYXBzIGEgbGlzdCBvZiBwbGFpbiBIVE1MRWxlbWVudHMgd2l0aCBhIERPTSBpbnN0YW5jZS5cbiAgICogQHBhcmFtIGVsZW1lbnQgdGhlIEhUTUxFbGVtZW50cyB0byB3cmFwIHdpdGggRE9NXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50czogSFRNTEVsZW1lbnRbXSk7XG4gIC8qKlxuICAgKiBXcmFwcyB0aGUgZG9jdW1lbnQgd2l0aCBhIERPTSBpbnN0YW5jZS4gVXNlZnVsIHRvIGF0dGFjaCBldmVudCBsaXN0ZW5lcnMgdG8gdGhlIGRvY3VtZW50LlxuICAgKiBAcGFyYW0gZG9jdW1lbnQgdGhlIGRvY3VtZW50IHRvIHdyYXBcbiAgICovXG4gIGNvbnN0cnVjdG9yKGRvY3VtZW50OiBEb2N1bWVudCk7XG4gIGNvbnN0cnVjdG9yKHNvbWV0aGluZzogc3RyaW5nIHwgSFRNTEVsZW1lbnQgfCBIVE1MRWxlbWVudFtdIHwgRG9jdW1lbnQsIGF0dHJpYnV0ZXM/OiB7W25hbWU6IHN0cmluZ106IHN0cmluZ30pIHtcbiAgICB0aGlzLmRvY3VtZW50ID0gZG9jdW1lbnQ7IC8vIFNldCB0aGUgZ2xvYmFsIGRvY3VtZW50IHRvIHRoZSBsb2NhbCBkb2N1bWVudCBmaWVsZFxuXG4gICAgaWYgKHNvbWV0aGluZyBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICBpZiAoc29tZXRoaW5nLmxlbmd0aCA+IDAgJiYgc29tZXRoaW5nWzBdIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIHtcbiAgICAgICAgbGV0IGVsZW1lbnRzID0gc29tZXRoaW5nO1xuICAgICAgICB0aGlzLmVsZW1lbnRzID0gZWxlbWVudHM7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKHNvbWV0aGluZyBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSB7XG4gICAgICBsZXQgZWxlbWVudCA9IHNvbWV0aGluZztcbiAgICAgIHRoaXMuZWxlbWVudHMgPSBbZWxlbWVudF07XG4gICAgfVxuICAgIGVsc2UgaWYgKHNvbWV0aGluZyBpbnN0YW5jZW9mIERvY3VtZW50KSB7XG4gICAgICAvLyBXaGVuIGEgZG9jdW1lbnQgaXMgcGFzc2VkIGluLCB3ZSBkbyBub3QgZG8gYW55dGhpbmcgd2l0aCBpdCwgYnV0IGJ5IHNldHRpbmcgdGhpcy5lbGVtZW50cyB0byBudWxsXG4gICAgICAvLyB3ZSBnaXZlIHRoZSBldmVudCBoYW5kbGluZyBtZXRob2QgYSBtZWFucyB0byBkZXRlY3QgaWYgdGhlIGV2ZW50cyBzaG91bGQgYmUgcmVnaXN0ZXJlZCBvbiB0aGUgZG9jdW1lbnRcbiAgICAgIC8vIGluc3RlYWQgb2YgZWxlbWVudHMuXG4gICAgICB0aGlzLmVsZW1lbnRzID0gbnVsbDtcbiAgICB9XG4gICAgZWxzZSBpZiAoYXR0cmlidXRlcykge1xuICAgICAgbGV0IHRhZ05hbWUgPSBzb21ldGhpbmc7XG4gICAgICBsZXQgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnTmFtZSk7XG5cbiAgICAgIGZvciAobGV0IGF0dHJpYnV0ZU5hbWUgaW4gYXR0cmlidXRlcykge1xuICAgICAgICBsZXQgYXR0cmlidXRlVmFsdWUgPSBhdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdO1xuICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShhdHRyaWJ1dGVOYW1lLCBhdHRyaWJ1dGVWYWx1ZSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuZWxlbWVudHMgPSBbZWxlbWVudF07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbGV0IHNlbGVjdG9yID0gc29tZXRoaW5nO1xuICAgICAgdGhpcy5lbGVtZW50cyA9IHRoaXMuZmluZENoaWxkRWxlbWVudHMoc2VsZWN0b3IpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBudW1iZXIgb2YgZWxlbWVudHMgdGhhdCB0aGlzIERPTSBpbnN0YW5jZSBjdXJyZW50bHkgaG9sZHMuXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9IHRoZSBudW1iZXIgb2YgZWxlbWVudHNcbiAgICovXG4gIGdldCBsZW5ndGgoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5lbGVtZW50cyA/IHRoaXMuZWxlbWVudHMubGVuZ3RoIDogMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBIVE1MIGVsZW1lbnRzIHRoYXQgdGhpcyBET00gaW5zdGFuY2UgY3VycmVudGx5IGhvbGRzLlxuICAgKiBAcmV0dXJucyB7SFRNTEVsZW1lbnRbXX0gdGhlIHJhdyBIVE1MIGVsZW1lbnRzXG4gICAqL1xuICBnZXRFbGVtZW50cygpOiBIVE1MRWxlbWVudFtdIHtcbiAgICByZXR1cm4gdGhpcy5lbGVtZW50cztcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHNob3J0Y3V0IG1ldGhvZCBmb3IgaXRlcmF0aW5nIGFsbCBlbGVtZW50cy4gU2hvcnRzIHRoaXMuZWxlbWVudHMuZm9yRWFjaCguLi4pIHRvIHRoaXMuZm9yRWFjaCguLi4pLlxuICAgKiBAcGFyYW0gaGFuZGxlciB0aGUgaGFuZGxlciB0byBleGVjdXRlIGFuIG9wZXJhdGlvbiBvbiBhbiBlbGVtZW50XG4gICAqL1xuICBwcml2YXRlIGZvckVhY2goaGFuZGxlcjogKGVsZW1lbnQ6IEhUTUxFbGVtZW50KSA9PiB2b2lkKTogdm9pZCB7XG4gICAgdGhpcy5lbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgIGhhbmRsZXIoZWxlbWVudCk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGZpbmRDaGlsZEVsZW1lbnRzT2ZFbGVtZW50KGVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgRG9jdW1lbnQsIHNlbGVjdG9yOiBzdHJpbmcpOiBIVE1MRWxlbWVudFtdIHtcbiAgICBsZXQgY2hpbGRFbGVtZW50cyA9IGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG5cbiAgICAvLyBDb252ZXJ0IE5vZGVMaXN0IHRvIEFycmF5XG4gICAgLy8gaHR0cHM6Ly90b2RkbW90dG8uY29tL2EtY29tcHJlaGVuc2l2ZS1kaXZlLWludG8tbm9kZWxpc3RzLWFycmF5cy1jb252ZXJ0aW5nLW5vZGVsaXN0cy1hbmQtdW5kZXJzdGFuZGluZy10aGUtZG9tL1xuICAgIHJldHVybiBbXS5zbGljZS5jYWxsKGNoaWxkRWxlbWVudHMpO1xuICB9XG5cbiAgcHJpdmF0ZSBmaW5kQ2hpbGRFbGVtZW50cyhzZWxlY3Rvcjogc3RyaW5nKTogSFRNTEVsZW1lbnRbXSB7XG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgIGxldCBhbGxDaGlsZEVsZW1lbnRzID0gPEhUTUxFbGVtZW50W10+W107XG5cbiAgICBpZiAodGhpcy5lbGVtZW50cykge1xuICAgICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgICAgYWxsQ2hpbGRFbGVtZW50cyA9IGFsbENoaWxkRWxlbWVudHMuY29uY2F0KHNlbGYuZmluZENoaWxkRWxlbWVudHNPZkVsZW1lbnQoZWxlbWVudCwgc2VsZWN0b3IpKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLmZpbmRDaGlsZEVsZW1lbnRzT2ZFbGVtZW50KGRvY3VtZW50LCBzZWxlY3Rvcik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGFsbENoaWxkRWxlbWVudHM7XG4gIH1cblxuICAvKipcbiAgICogRmluZHMgYWxsIGNoaWxkIGVsZW1lbnRzIG9mIGFsbCBlbGVtZW50cyBtYXRjaGluZyB0aGUgc3VwcGxpZWQgc2VsZWN0b3IuXG4gICAqIEBwYXJhbSBzZWxlY3RvciB0aGUgc2VsZWN0b3IgdG8gbWF0Y2ggd2l0aCBjaGlsZCBlbGVtZW50c1xuICAgKiBAcmV0dXJucyB7RE9NfSBhIG5ldyBET00gaW5zdGFuY2UgcmVwcmVzZW50aW5nIGFsbCBtYXRjaGVkIGNoaWxkcmVuXG4gICAqL1xuICBmaW5kKHNlbGVjdG9yOiBzdHJpbmcpOiBET00ge1xuICAgIGxldCBhbGxDaGlsZEVsZW1lbnRzID0gdGhpcy5maW5kQ2hpbGRFbGVtZW50cyhzZWxlY3Rvcik7XG4gICAgcmV0dXJuIG5ldyBET00oYWxsQ2hpbGRFbGVtZW50cyk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHN0cmluZyBvZiB0aGUgaW5uZXIgSFRNTCBjb250ZW50IG9mIHRoZSBmaXJzdCBlbGVtZW50LlxuICAgKi9cbiAgaHRtbCgpOiBzdHJpbmc7XG4gIC8qKlxuICAgKiBTZXRzIHRoZSBpbm5lciBIVE1MIGNvbnRlbnQgb2YgYWxsIGVsZW1lbnRzLlxuICAgKiBAcGFyYW0gY29udGVudCBhIHN0cmluZyBvZiBwbGFpbiB0ZXh0IG9yIEhUTUwgbWFya3VwXG4gICAqL1xuICBodG1sKGNvbnRlbnQ6IHN0cmluZyk6IERPTTtcbiAgaHRtbChjb250ZW50Pzogc3RyaW5nKTogc3RyaW5nIHwgRE9NIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybiB0aGlzLnNldEh0bWwoY29udGVudCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0SHRtbCgpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0SHRtbCgpOiBzdHJpbmcgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5lbGVtZW50c1swXS5pbm5lckhUTUw7XG4gIH1cblxuICBwcml2YXRlIHNldEh0bWwoY29udGVudDogc3RyaW5nKTogRE9NIHtcbiAgICBpZiAoY29udGVudCA9PT0gdW5kZWZpbmVkIHx8IGNvbnRlbnQgPT0gbnVsbCkge1xuICAgICAgLy8gU2V0IHRvIGVtcHR5IHN0cmluZyB0byBhdm9pZCBpbm5lckhUTUwgZ2V0dGluZyBzZXQgdG8gJ3VuZGVmaW5lZCcgKGFsbCBicm93c2Vycykgb3IgJ251bGwnIChJRTkpXG4gICAgICBjb250ZW50ID0gJyc7XG4gICAgfVxuXG4gICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgIGVsZW1lbnQuaW5uZXJIVE1MID0gY29udGVudDtcbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFycyB0aGUgaW5uZXIgSFRNTCBvZiBhbGwgZWxlbWVudHMgKGRlbGV0ZXMgYWxsIGNoaWxkcmVuKS5cbiAgICogQHJldHVybnMge0RPTX1cbiAgICovXG4gIGVtcHR5KCk6IERPTSB7XG4gICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgIGVsZW1lbnQuaW5uZXJIVE1MID0gJyc7XG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgY3VycmVudCB2YWx1ZSBvZiB0aGUgZmlyc3QgZm9ybSBlbGVtZW50LCBlLmcuIHRoZSBzZWxlY3RlZCB2YWx1ZSBvZiBhIHNlbGVjdCBib3ggb3IgdGhlIHRleHQgaWYgYW5cbiAgICogaW5wdXQgZmllbGQuXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9IHRoZSB2YWx1ZSBvZiBhIGZvcm0gZWxlbWVudFxuICAgKi9cbiAgdmFsKCk6IHN0cmluZyB7XG4gICAgbGV0IGVsZW1lbnQgPSB0aGlzLmVsZW1lbnRzWzBdO1xuXG4gICAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBIVE1MU2VsZWN0RWxlbWVudCB8fCBlbGVtZW50IGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCkge1xuICAgICAgcmV0dXJuIGVsZW1lbnQudmFsdWU7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgLy8gVE9ETyBhZGQgc3VwcG9ydCBmb3IgbWlzc2luZyBmb3JtIGVsZW1lbnRzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYHZhbCgpIG5vdCBzdXBwb3J0ZWQgZm9yICR7dHlwZW9mIGVsZW1lbnR9YCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHZhbHVlIG9mIGFuIGF0dHJpYnV0ZSBvbiB0aGUgZmlyc3QgZWxlbWVudC5cbiAgICogQHBhcmFtIGF0dHJpYnV0ZVxuICAgKi9cbiAgYXR0cihhdHRyaWJ1dGU6IHN0cmluZyk6IHN0cmluZyB8IG51bGw7XG4gIC8qKlxuICAgKiBTZXRzIGFuIGF0dHJpYnV0ZSBvbiBhbGwgZWxlbWVudHMuXG4gICAqIEBwYXJhbSBhdHRyaWJ1dGUgdGhlIG5hbWUgb2YgdGhlIGF0dHJpYnV0ZVxuICAgKiBAcGFyYW0gdmFsdWUgdGhlIHZhbHVlIG9mIHRoZSBhdHRyaWJ1dGVcbiAgICovXG4gIGF0dHIoYXR0cmlidXRlOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpOiBET007XG4gIGF0dHIoYXR0cmlidXRlOiBzdHJpbmcsIHZhbHVlPzogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB8IERPTSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICByZXR1cm4gdGhpcy5zZXRBdHRyKGF0dHJpYnV0ZSwgdmFsdWUpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLmdldEF0dHIoYXR0cmlidXRlKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldEF0dHIoYXR0cmlidXRlOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5lbGVtZW50c1swXS5nZXRBdHRyaWJ1dGUoYXR0cmlidXRlKTtcbiAgfVxuXG4gIHByaXZhdGUgc2V0QXR0cihhdHRyaWJ1dGU6IHN0cmluZywgdmFsdWU6IHN0cmluZyk6IERPTSB7XG4gICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKGF0dHJpYnV0ZSwgdmFsdWUpO1xuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHZhbHVlIG9mIGEgZGF0YSBlbGVtZW50IG9uIHRoZSBmaXJzdCBlbGVtZW50LlxuICAgKiBAcGFyYW0gZGF0YUF0dHJpYnV0ZSB0aGUgbmFtZSBvZiB0aGUgZGF0YSBhdHRyaWJ1dGUgd2l0aG91dCB0aGUgJ2RhdGEtJyBwcmVmaXhcbiAgICovXG4gIGRhdGEoZGF0YUF0dHJpYnV0ZTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbDtcbiAgLyoqXG4gICAqIFNldHMgYSBkYXRhIGF0dHJpYnV0ZSBvbiBhbGwgZWxlbWVudHMuXG4gICAqIEBwYXJhbSBkYXRhQXR0cmlidXRlIHRoZSBuYW1lIG9mIHRoZSBkYXRhIGF0dHJpYnV0ZSB3aXRob3V0IHRoZSAnZGF0YS0nIHByZWZpeFxuICAgKiBAcGFyYW0gdmFsdWUgdGhlIHZhbHVlIG9mIHRoZSBkYXRhIGF0dHJpYnV0ZVxuICAgKi9cbiAgZGF0YShkYXRhQXR0cmlidXRlOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpOiBET007XG4gIGRhdGEoZGF0YUF0dHJpYnV0ZTogc3RyaW5nLCB2YWx1ZT86IHN0cmluZyk6IHN0cmluZyB8IG51bGwgfCBET00ge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgcmV0dXJuIHRoaXMuc2V0RGF0YShkYXRhQXR0cmlidXRlLCB2YWx1ZSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0RGF0YShkYXRhQXR0cmlidXRlKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldERhdGEoZGF0YUF0dHJpYnV0ZTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudHNbMF0uZ2V0QXR0cmlidXRlKCdkYXRhLScgKyBkYXRhQXR0cmlidXRlKTtcbiAgfVxuXG4gIHByaXZhdGUgc2V0RGF0YShkYXRhQXR0cmlidXRlOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpOiBET00ge1xuICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnZGF0YS0nICsgZGF0YUF0dHJpYnV0ZSwgdmFsdWUpO1xuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcGVuZHMgb25lIG9yIG1vcmUgRE9NIGVsZW1lbnRzIGFzIGNoaWxkcmVuIHRvIGFsbCBlbGVtZW50cy5cbiAgICogQHBhcmFtIGNoaWxkRWxlbWVudHMgdGhlIGNocmlsZCBlbGVtZW50cyB0byBhcHBlbmRcbiAgICogQHJldHVybnMge0RPTX1cbiAgICovXG4gIGFwcGVuZCguLi5jaGlsZEVsZW1lbnRzOiBET01bXSk6IERPTSB7XG4gICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgIGNoaWxkRWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbihjaGlsZEVsZW1lbnQpIHtcbiAgICAgICAgY2hpbGRFbGVtZW50LmVsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24oXywgaW5kZXgpIHtcbiAgICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGNoaWxkRWxlbWVudC5lbGVtZW50c1tpbmRleF0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYWxsIGVsZW1lbnRzIGZyb20gdGhlIERPTS5cbiAgICovXG4gIHJlbW92ZSgpOiB2b2lkIHtcbiAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgbGV0IHBhcmVudCA9IGVsZW1lbnQucGFyZW50Tm9kZTtcbiAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKGVsZW1lbnQpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIG9mZnNldCBvZiB0aGUgZmlyc3QgZWxlbWVudCBmcm9tIHRoZSBkb2N1bWVudCdzIHRvcCBsZWZ0IGNvcm5lci5cbiAgICogQHJldHVybnMge09mZnNldH1cbiAgICovXG4gIG9mZnNldCgpOiBPZmZzZXQge1xuICAgIGxldCBlbGVtZW50ID0gdGhpcy5lbGVtZW50c1swXTtcbiAgICBsZXQgZWxlbWVudFJlY3QgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGxldCBodG1sUmVjdCA9IGRvY3VtZW50LmJvZHkucGFyZW50RWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgIC8vIFZpcnR1YWwgdmlld3BvcnQgc2Nyb2xsIGhhbmRsaW5nIChlLmcuIHBpbmNoIHpvb21lZCB2aWV3cG9ydHMgaW4gbW9iaWxlIGJyb3dzZXJzIG9yIGRlc2t0b3AgQ2hyb21lL0VkZ2UpXG4gICAgLy8gJ25vcm1hbCcgem9vbXMgYW5kIHZpcnR1YWwgdmlld3BvcnQgem9vbXMgKGFrYSBsYXlvdXQgdmlld3BvcnQpIHJlc3VsdCBpbiBkaWZmZXJlbnRcbiAgICAvLyBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpIHJlc3VsdHM6XG4gICAgLy8gIC0gd2l0aCBub3JtYWwgc2Nyb2xscywgdGhlIGNsaWVudFJlY3QgZGVjcmVhc2VzIHdpdGggYW4gaW5jcmVhc2UgaW4gc2Nyb2xsKFRvcHxMZWZ0KS9wYWdlKFh8WSlPZmZzZXRcbiAgICAvLyAgLSB3aXRoIHBpbmNoIHpvb20gc2Nyb2xscywgdGhlIGNsaWVudFJlY3Qgc3RheXMgdGhlIHNhbWUgd2hpbGUgc2Nyb2xsL3BhZ2VPZmZzZXQgY2hhbmdlc1xuICAgIC8vIFRoaXMgbWVhbnMsIHRoYXQgdGhlIGNvbWJpbmF0aW9uIG9mIGNsaWVudFJlY3QgKyBzY3JvbGwvcGFnZU9mZnNldCBkb2VzIG5vdCB3b3JrIHRvIGNhbGN1bGF0ZSB0aGUgb2Zmc2V0XG4gICAgLy8gZnJvbSB0aGUgZG9jdW1lbnQncyB1cHBlciBsZWZ0IG9yaWdpbiB3aGVuIHBpbmNoIHpvb20gaXMgdXNlZC5cbiAgICAvLyBUbyB3b3JrIGFyb3VuZCB0aGlzIGlzc3VlLCB3ZSBkbyBub3QgdXNlIHNjcm9sbC9wYWdlT2Zmc2V0IGJ1dCBnZXQgdGhlIGNsaWVudFJlY3Qgb2YgdGhlIGh0bWwgZWxlbWVudCBhbmRcbiAgICAvLyBzdWJ0cmFjdCBpdCBmcm9tIHRoZSBlbGVtZW50J3MgcmVjdCwgd2hpY2ggYWx3YXlzIHJlc3VsdHMgaW4gdGhlIG9mZnNldCBmcm9tIHRoZSBkb2N1bWVudCBvcmlnaW4uXG4gICAgLy8gTk9URTogdGhlIGN1cnJlbnQgd2F5IG9mIG9mZnNldCBjYWxjdWxhdGlvbiB3YXMgaW1wbGVtZW50ZWQgc3BlY2lmaWNhbGx5IHRvIHRyYWNrIGV2ZW50IHBvc2l0aW9ucyBvbiB0aGVcbiAgICAvLyBzZWVrIGJhciwgYW5kIGl0IG1pZ2h0IGJyZWFrIGNvbXBhdGliaWxpdHkgd2l0aCBqUXVlcnkncyBvZmZzZXQoKSBtZXRob2QuIElmIHRoaXMgZXZlciB0dXJucyBvdXQgdG8gYmUgYVxuICAgIC8vIHByb2JsZW0sIHRoaXMgbWV0aG9kIHNob3VsZCBiZSByZXZlcnRlZCB0byB0aGUgb2xkIHZlcnNpb24gYW5kIHRoZSBvZmZzZXQgY2FsY3VsYXRpb24gbW92ZWQgdG8gdGhlIHNlZWsgYmFyLlxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHRvcDogZWxlbWVudFJlY3QudG9wIC0gaHRtbFJlY3QudG9wLFxuICAgICAgbGVmdDogZWxlbWVudFJlY3QubGVmdCAtIGh0bWxSZWN0LmxlZnRcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHdpZHRoIG9mIHRoZSBmaXJzdCBlbGVtZW50LlxuICAgKiBAcmV0dXJucyB7bnVtYmVyfSB0aGUgd2lkdGggb2YgdGhlIGZpcnN0IGVsZW1lbnRcbiAgICovXG4gIHdpZHRoKCk6IG51bWJlciB7XG4gICAgLy8gVE9ETyBjaGVjayBpZiB0aGlzIGlzIHRoZSBzYW1lIGFzIGpRdWVyeSdzIHdpZHRoKCkgKHByb2JhYmx5IG5vdClcbiAgICByZXR1cm4gdGhpcy5lbGVtZW50c1swXS5vZmZzZXRXaWR0aDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBoZWlnaHQgb2YgdGhlIGZpcnN0IGVsZW1lbnQuXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9IHRoZSBoZWlnaHQgb2YgdGhlIGZpcnN0IGVsZW1lbnRcbiAgICovXG4gIGhlaWdodCgpOiBudW1iZXIge1xuICAgIC8vIFRPRE8gY2hlY2sgaWYgdGhpcyBpcyB0aGUgc2FtZSBhcyBqUXVlcnkncyBoZWlnaHQoKSAocHJvYmFibHkgbm90KVxuICAgIHJldHVybiB0aGlzLmVsZW1lbnRzWzBdLm9mZnNldEhlaWdodDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdHRhY2hlcyBhbiBldmVudCBoYW5kbGVyIHRvIG9uZSBvciBtb3JlIGV2ZW50cyBvbiBhbGwgZWxlbWVudHMuXG4gICAqIEBwYXJhbSBldmVudE5hbWUgdGhlIGV2ZW50IG5hbWUgKG9yIG11bHRpcGxlIG5hbWVzIHNlcGFyYXRlZCBieSBzcGFjZSkgdG8gbGlzdGVuIHRvXG4gICAqIEBwYXJhbSBldmVudEhhbmRsZXIgdGhlIGV2ZW50IGhhbmRsZXIgdG8gY2FsbCB3aGVuIHRoZSBldmVudCBmaXJlc1xuICAgKiBAcmV0dXJucyB7RE9NfVxuICAgKi9cbiAgb24oZXZlbnROYW1lOiBzdHJpbmcsIGV2ZW50SGFuZGxlcjogRXZlbnRMaXN0ZW5lck9yRXZlbnRMaXN0ZW5lck9iamVjdCk6IERPTSB7XG4gICAgbGV0IGV2ZW50cyA9IGV2ZW50TmFtZS5zcGxpdCgnICcpO1xuICAgIGxldCBzZWxmID0gdGhpcztcblxuICAgIGV2ZW50cy5mb3JFYWNoKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICBpZiAoc2VsZi5lbGVtZW50cyA9PSBudWxsKSB7XG4gICAgICAgIHNlbGYuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgZXZlbnRIYW5kbGVyKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBzZWxmLmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgZXZlbnRIYW5kbGVyKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGFuIGV2ZW50IGhhbmRsZXIgZnJvbSBvbmUgb3IgbW9yZSBldmVudHMgb24gYWxsIGVsZW1lbnRzLlxuICAgKiBAcGFyYW0gZXZlbnROYW1lIHRoZSBldmVudCBuYW1lIChvciBtdWx0aXBsZSBuYW1lcyBzZXBhcmF0ZWQgYnkgc3BhY2UpIHRvIHJlbW92ZSB0aGUgaGFuZGxlciBmcm9tXG4gICAqIEBwYXJhbSBldmVudEhhbmRsZXIgdGhlIGV2ZW50IGhhbmRsZXIgdG8gcmVtb3ZlXG4gICAqIEByZXR1cm5zIHtET019XG4gICAqL1xuICBvZmYoZXZlbnROYW1lOiBzdHJpbmcsIGV2ZW50SGFuZGxlcjogRXZlbnRMaXN0ZW5lck9yRXZlbnRMaXN0ZW5lck9iamVjdCk6IERPTSB7XG4gICAgbGV0IGV2ZW50cyA9IGV2ZW50TmFtZS5zcGxpdCgnICcpO1xuICAgIGxldCBzZWxmID0gdGhpcztcblxuICAgIGV2ZW50cy5mb3JFYWNoKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICBpZiAoc2VsZi5lbGVtZW50cyA9PSBudWxsKSB7XG4gICAgICAgIHNlbGYuZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgZXZlbnRIYW5kbGVyKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBzZWxmLmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgZXZlbnRIYW5kbGVyKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIHRoZSBzcGVjaWZpZWQgY2xhc3MoZXMpIHRvIGFsbCBlbGVtZW50cy5cbiAgICogQHBhcmFtIGNsYXNzTmFtZSB0aGUgY2xhc3MoZXMpIHRvIGFkZCwgbXVsdGlwbGUgY2xhc3NlcyBzZXBhcmF0ZWQgYnkgc3BhY2VcbiAgICogQHJldHVybnMge0RPTX1cbiAgICovXG4gIGFkZENsYXNzKGNsYXNzTmFtZTogc3RyaW5nKTogRE9NIHtcbiAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgaWYgKGVsZW1lbnQuY2xhc3NMaXN0KSB7XG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChjbGFzc05hbWUpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGVsZW1lbnQuY2xhc3NOYW1lICs9ICcgJyArIGNsYXNzTmFtZTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZWQgdGhlIHNwZWNpZmllZCBjbGFzcyhlcykgZnJvbSBhbGwgZWxlbWVudHMuXG4gICAqIEBwYXJhbSBjbGFzc05hbWUgdGhlIGNsYXNzKGVzKSB0byByZW1vdmUsIG11bHRpcGxlIGNsYXNzZXMgc2VwYXJhdGVkIGJ5IHNwYWNlXG4gICAqIEByZXR1cm5zIHtET019XG4gICAqL1xuICByZW1vdmVDbGFzcyhjbGFzc05hbWU6IHN0cmluZyk6IERPTSB7XG4gICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgIGlmIChlbGVtZW50LmNsYXNzTGlzdCkge1xuICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoY2xhc3NOYW1lKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBlbGVtZW50LmNsYXNzTmFtZSA9IGVsZW1lbnQuY2xhc3NOYW1lLnJlcGxhY2UoXG4gICAgICAgICAgbmV3IFJlZ0V4cCgnKF58XFxcXGIpJyArIGNsYXNzTmFtZS5zcGxpdCgnICcpLmpvaW4oJ3wnKSArICcoXFxcXGJ8JCknLCAnZ2knKSwgJyAnKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhbnkgb2YgdGhlIGVsZW1lbnRzIGhhcyB0aGUgc3BlY2lmaWVkIGNsYXNzLlxuICAgKiBAcGFyYW0gY2xhc3NOYW1lIHRoZSBjbGFzcyBuYW1lIHRvIGNoZWNrXG4gICAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmIG9uZSBvZiB0aGUgZWxlbWVudHMgaGFzIHRoZSBjbGFzcyBhdHRhY2hlZCwgZWxzZSBpZiBubyBlbGVtZW50IGhhcyBpdCBhdHRhY2hlZFxuICAgKi9cbiAgaGFzQ2xhc3MoY2xhc3NOYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBsZXQgaGFzQ2xhc3MgPSBmYWxzZTtcblxuICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICBpZiAoZWxlbWVudC5jbGFzc0xpc3QpIHtcbiAgICAgICAgaWYgKGVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKGNsYXNzTmFtZSkpIHtcbiAgICAgICAgICAvLyBTaW5jZSB3ZSBhcmUgaW5zaWRlIGEgaGFuZGxlciwgd2UgY2FuJ3QganVzdCAncmV0dXJuIHRydWUnLiBJbnN0ZWFkLCB3ZSBzYXZlIGl0IHRvIGEgdmFyaWFibGVcbiAgICAgICAgICAvLyBhbmQgcmV0dXJuIGl0IGF0IHRoZSBlbmQgb2YgdGhlIGZ1bmN0aW9uIGJvZHkuXG4gICAgICAgICAgaGFzQ2xhc3MgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgaWYgKG5ldyBSZWdFeHAoJyhefCApJyArIGNsYXNzTmFtZSArICcoIHwkKScsICdnaScpLnRlc3QoZWxlbWVudC5jbGFzc05hbWUpKSB7XG4gICAgICAgICAgLy8gU2VlIGNvbW1lbnQgYWJvdmVcbiAgICAgICAgICBoYXNDbGFzcyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBoYXNDbGFzcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSB2YWx1ZSBvZiBhIENTUyBwcm9wZXJ0eSBvZiB0aGUgZmlyc3QgZWxlbWVudC5cbiAgICogQHBhcmFtIHByb3BlcnR5TmFtZSB0aGUgbmFtZSBvZiB0aGUgQ1NTIHByb3BlcnR5IHRvIHJldHJpZXZlIHRoZSB2YWx1ZSBvZlxuICAgKi9cbiAgY3NzKHByb3BlcnR5TmFtZTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbDtcbiAgLyoqXG4gICAqIFNldHMgdGhlIHZhbHVlIG9mIGEgQ1NTIHByb3BlcnR5IG9uIGFsbCBlbGVtZW50cy5cbiAgICogQHBhcmFtIHByb3BlcnR5TmFtZSB0aGUgbmFtZSBvZiB0aGUgQ1NTIHByb3BlcnR5IHRvIHNldCB0aGUgdmFsdWUgZm9yXG4gICAqIEBwYXJhbSB2YWx1ZSB0aGUgdmFsdWUgdG8gc2V0IGZvciB0aGUgZ2l2ZW4gQ1NTIHByb3BlcnR5XG4gICAqL1xuICBjc3MocHJvcGVydHlOYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpOiBET007XG4gIC8qKlxuICAgKiBTZXRzIGEgY29sbGVjdGlvbiBvZiBDU1MgcHJvcGVydGllcyBhbmQgdGhlaXIgdmFsdWVzIG9uIGFsbCBlbGVtZW50cy5cbiAgICogQHBhcmFtIHByb3BlcnR5VmFsdWVDb2xsZWN0aW9uIGFuIG9iamVjdCBjb250YWluaW5nIHBhaXJzIG9mIHByb3BlcnR5IG5hbWVzIGFuZCB0aGVpciB2YWx1ZXNcbiAgICovXG4gIGNzcyhwcm9wZXJ0eVZhbHVlQ29sbGVjdGlvbjoge1twcm9wZXJ0eU5hbWU6IHN0cmluZ106IHN0cmluZ30pOiBET007XG4gIGNzcyhwcm9wZXJ0eU5hbWVPckNvbGxlY3Rpb246IHN0cmluZyB8IHtbcHJvcGVydHlOYW1lOiBzdHJpbmddOiBzdHJpbmd9LCB2YWx1ZT86IHN0cmluZyk6IHN0cmluZyB8IG51bGwgfCBET00ge1xuICAgIGlmICh0eXBlb2YgcHJvcGVydHlOYW1lT3JDb2xsZWN0aW9uID09PSAnc3RyaW5nJykge1xuICAgICAgbGV0IHByb3BlcnR5TmFtZSA9IHByb3BlcnR5TmFtZU9yQ29sbGVjdGlvbjtcblxuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0Q3NzKHByb3BlcnR5TmFtZSwgdmFsdWUpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldENzcyhwcm9wZXJ0eU5hbWUpO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGxldCBwcm9wZXJ0eVZhbHVlQ29sbGVjdGlvbiA9IHByb3BlcnR5TmFtZU9yQ29sbGVjdGlvbjtcbiAgICAgIHJldHVybiB0aGlzLnNldENzc0NvbGxlY3Rpb24ocHJvcGVydHlWYWx1ZUNvbGxlY3Rpb24pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0Q3NzKHByb3BlcnR5TmFtZTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgcmV0dXJuIGdldENvbXB1dGVkU3R5bGUodGhpcy5lbGVtZW50c1swXSlbPGFueT5wcm9wZXJ0eU5hbWVdO1xuICB9XG5cbiAgcHJpdmF0ZSBzZXRDc3MocHJvcGVydHlOYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpOiBET00ge1xuICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICAvLyA8YW55PiBjYXN0IHRvIHJlc29sdmUgVFM3MDE1OiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8zNjYyNzExNC8zNzAyNTJcbiAgICAgIGVsZW1lbnQuc3R5bGVbPGFueT5wcm9wZXJ0eU5hbWVdID0gdmFsdWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBwcml2YXRlIHNldENzc0NvbGxlY3Rpb24ocnVsZVZhbHVlQ29sbGVjdGlvbjoge1tydWxlTmFtZTogc3RyaW5nXTogc3RyaW5nfSk6IERPTSB7XG4gICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzM0NDkwNTczLzM3MDI1MlxuICAgICAgT2JqZWN0LmFzc2lnbihlbGVtZW50LnN0eWxlLCBydWxlVmFsdWVDb2xsZWN0aW9uKTtcbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG4iLCJpbXBvcnQge0FycmF5VXRpbHN9IGZyb20gJy4vdXRpbHMnO1xuLyoqXG4gKiBGdW5jdGlvbiBpbnRlcmZhY2UgZm9yIGV2ZW50IGxpc3RlbmVycyBvbiB0aGUge0BsaW5rIEV2ZW50RGlzcGF0Y2hlcn0uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRXZlbnRMaXN0ZW5lcjxTZW5kZXIsIEFyZ3M+IHtcbiAgKHNlbmRlcjogU2VuZGVyLCBhcmdzOiBBcmdzKTogdm9pZDtcbn1cblxuLyoqXG4gKiBFbXB0eSB0eXBlIGZvciBjcmVhdGluZyB7QGxpbmsgRXZlbnREaXNwYXRjaGVyIGV2ZW50IGRpc3BhdGNoZXJzfSB0aGF0IGRvIG5vdCBjYXJyeSBhbnkgYXJndW1lbnRzLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIE5vQXJncyB7XG59XG5cbi8qKlxuICogUHVibGljIGludGVyZmFjZSB0aGF0IHJlcHJlc2VudHMgYW4gZXZlbnQuIENhbiBiZSB1c2VkIHRvIHN1YnNjcmliZSB0byBhbmQgdW5zdWJzY3JpYmUgZnJvbSBldmVudHMuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRXZlbnQ8U2VuZGVyLCBBcmdzPiB7XG4gIC8qKlxuICAgKiBTdWJzY3JpYmVzIGFuIGV2ZW50IGxpc3RlbmVyIHRvIHRoaXMgZXZlbnQgZGlzcGF0Y2hlci5cbiAgICogQHBhcmFtIGxpc3RlbmVyIHRoZSBsaXN0ZW5lciB0byBhZGRcbiAgICovXG4gIHN1YnNjcmliZShsaXN0ZW5lcjogRXZlbnRMaXN0ZW5lcjxTZW5kZXIsIEFyZ3M+KTogdm9pZDtcblxuICAvKipcbiAgICogU3Vic2NyaWJlcyBhbiBldmVudCBsaXN0ZW5lciB0byB0aGlzIGV2ZW50IGRpc3BhdGNoZXIgdGhhdCBpcyBvbmx5IGNhbGxlZCBvbmNlLlxuICAgKiBAcGFyYW0gbGlzdGVuZXIgdGhlIGxpc3RlbmVyIHRvIGFkZFxuICAgKi9cbiAgc3Vic2NyaWJlT25jZShsaXN0ZW5lcjogRXZlbnRMaXN0ZW5lcjxTZW5kZXIsIEFyZ3M+KTogdm9pZDtcblxuICAvKipcbiAgICogU3Vic2NyaWJlcyBhbiBldmVudCBsaXN0ZW5lciB0byB0aGlzIGV2ZW50IGRpc3BhdGNoZXIgdGhhdCB3aWxsIGJlIGNhbGxlZCBhdCBhIGxpbWl0ZWQgcmF0ZSB3aXRoIGEgbWluaW11bVxuICAgKiBpbnRlcnZhbCBvZiB0aGUgc3BlY2lmaWVkIG1pbGxpc2Vjb25kcy5cbiAgICogQHBhcmFtIGxpc3RlbmVyIHRoZSBsaXN0ZW5lciB0byBhZGRcbiAgICogQHBhcmFtIHJhdGVNcyB0aGUgcmF0ZSBpbiBtaWxsaXNlY29uZHMgdG8gd2hpY2ggY2FsbGluZyBvZiB0aGUgbGlzdGVuZXJzIHNob3VsZCBiZSBsaW1pdGVkXG4gICAqL1xuICBzdWJzY3JpYmVSYXRlTGltaXRlZChsaXN0ZW5lcjogRXZlbnRMaXN0ZW5lcjxTZW5kZXIsIEFyZ3M+LCByYXRlTXM6IG51bWJlcik6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIFVuc3Vic2NyaWJlcyBhIHN1YnNjcmliZWQgZXZlbnQgbGlzdGVuZXIgZnJvbSB0aGlzIGRpc3BhdGNoZXIuXG4gICAqIEBwYXJhbSBsaXN0ZW5lciB0aGUgbGlzdGVuZXIgdG8gcmVtb3ZlXG4gICAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmIHRoZSBsaXN0ZW5lciB3YXMgc3VjY2Vzc2Z1bGx5IHVuc3Vic2NyaWJlZCwgZmFsc2UgaWYgaXQgaXNuJ3Qgc3Vic2NyaWJlZCBvbiB0aGlzXG4gICAqICAgZGlzcGF0Y2hlclxuICAgKi9cbiAgdW5zdWJzY3JpYmUobGlzdGVuZXI6IEV2ZW50TGlzdGVuZXI8U2VuZGVyLCBBcmdzPik6IGJvb2xlYW47XG59XG5cbi8qKlxuICogRXZlbnQgZGlzcGF0Y2hlciB0byBzdWJzY3JpYmUgYW5kIHRyaWdnZXIgZXZlbnRzLiBFYWNoIGV2ZW50IHNob3VsZCBoYXZlIGl0cyBvd24gZGlzcGF0Y2hlci5cbiAqL1xuZXhwb3J0IGNsYXNzIEV2ZW50RGlzcGF0Y2hlcjxTZW5kZXIsIEFyZ3M+IGltcGxlbWVudHMgRXZlbnQ8U2VuZGVyLCBBcmdzPiB7XG5cbiAgcHJpdmF0ZSBsaXN0ZW5lcnM6IEV2ZW50TGlzdGVuZXJXcmFwcGVyPFNlbmRlciwgQXJncz5bXSA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICB9XG5cbiAgLyoqXG4gICAqIHtAaW5oZXJpdERvY31cbiAgICovXG4gIHN1YnNjcmliZShsaXN0ZW5lcjogRXZlbnRMaXN0ZW5lcjxTZW5kZXIsIEFyZ3M+KSB7XG4gICAgdGhpcy5saXN0ZW5lcnMucHVzaChuZXcgRXZlbnRMaXN0ZW5lcldyYXBwZXIobGlzdGVuZXIpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiB7QGluaGVyaXREb2N9XG4gICAqL1xuICBzdWJzY3JpYmVPbmNlKGxpc3RlbmVyOiBFdmVudExpc3RlbmVyPFNlbmRlciwgQXJncz4pIHtcbiAgICB0aGlzLmxpc3RlbmVycy5wdXNoKG5ldyBFdmVudExpc3RlbmVyV3JhcHBlcihsaXN0ZW5lciwgdHJ1ZSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIHtAaW5oZXJpdERvY31cbiAgICovXG4gIHN1YnNjcmliZVJhdGVMaW1pdGVkKGxpc3RlbmVyOiBFdmVudExpc3RlbmVyPFNlbmRlciwgQXJncz4sIHJhdGVNczogbnVtYmVyKSB7XG4gICAgdGhpcy5saXN0ZW5lcnMucHVzaChuZXcgUmF0ZUxpbWl0ZWRFdmVudExpc3RlbmVyV3JhcHBlcihsaXN0ZW5lciwgcmF0ZU1zKSk7XG4gIH1cblxuICAvKipcbiAgICoge0Bpbmhlcml0RG9jfVxuICAgKi9cbiAgdW5zdWJzY3JpYmUobGlzdGVuZXI6IEV2ZW50TGlzdGVuZXI8U2VuZGVyLCBBcmdzPik6IGJvb2xlYW4ge1xuICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBsaXN0ZW5lcnMsIGNvbXBhcmUgd2l0aCBwYXJhbWV0ZXIsIGFuZCByZW1vdmUgaWYgZm91bmRcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubGlzdGVuZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgc3Vic2NyaWJlZExpc3RlbmVyID0gdGhpcy5saXN0ZW5lcnNbaV07XG4gICAgICBpZiAoc3Vic2NyaWJlZExpc3RlbmVyLmxpc3RlbmVyID09PSBsaXN0ZW5lcikge1xuICAgICAgICBBcnJheVV0aWxzLnJlbW92ZSh0aGlzLmxpc3RlbmVycywgc3Vic2NyaWJlZExpc3RlbmVyKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYWxsIGxpc3RlbmVycyBmcm9tIHRoaXMgZGlzcGF0Y2hlci5cbiAgICovXG4gIHVuc3Vic2NyaWJlQWxsKCk6IHZvaWQge1xuICAgIHRoaXMubGlzdGVuZXJzID0gW107XG4gIH1cblxuICAvKipcbiAgICogRGlzcGF0Y2hlcyBhbiBldmVudCB0byBhbGwgc3Vic2NyaWJlZCBsaXN0ZW5lcnMuXG4gICAqIEBwYXJhbSBzZW5kZXIgdGhlIHNvdXJjZSBvZiB0aGUgZXZlbnRcbiAgICogQHBhcmFtIGFyZ3MgdGhlIGFyZ3VtZW50cyBmb3IgdGhlIGV2ZW50XG4gICAqL1xuICBkaXNwYXRjaChzZW5kZXI6IFNlbmRlciwgYXJnczogQXJncyA9IG51bGwpIHtcbiAgICBsZXQgbGlzdGVuZXJzVG9SZW1vdmUgPSBbXTtcblxuICAgIC8vIENhbGwgZXZlcnkgbGlzdGVuZXJcbiAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiB0aGlzLmxpc3RlbmVycykge1xuICAgICAgbGlzdGVuZXIuZmlyZShzZW5kZXIsIGFyZ3MpO1xuXG4gICAgICBpZiAobGlzdGVuZXIuaXNPbmNlKCkpIHtcbiAgICAgICAgbGlzdGVuZXJzVG9SZW1vdmUucHVzaChsaXN0ZW5lcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlIG9uZS10aW1lIGxpc3RlbmVyXG4gICAgZm9yIChsZXQgbGlzdGVuZXJUb1JlbW92ZSBvZiBsaXN0ZW5lcnNUb1JlbW92ZSkge1xuICAgICAgQXJyYXlVdGlscy5yZW1vdmUodGhpcy5saXN0ZW5lcnMsIGxpc3RlbmVyVG9SZW1vdmUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBldmVudCB0aGF0IHRoaXMgZGlzcGF0Y2hlciBtYW5hZ2VzIGFuZCBvbiB3aGljaCBsaXN0ZW5lcnMgY2FuIHN1YnNjcmliZSBhbmQgdW5zdWJzY3JpYmUgZXZlbnQgaGFuZGxlcnMuXG4gICAqIEByZXR1cm5zIHtFdmVudH1cbiAgICovXG4gIGdldEV2ZW50KCk6IEV2ZW50PFNlbmRlciwgQXJncz4ge1xuICAgIC8vIEZvciBub3csIGp1c3QgY2FzZSB0aGUgZXZlbnQgZGlzcGF0Y2hlciB0byB0aGUgZXZlbnQgaW50ZXJmYWNlLiBBdCBzb21lIHBvaW50IGluIHRoZSBmdXR1cmUgd2hlbiB0aGVcbiAgICAvLyBjb2RlYmFzZSBncm93cywgaXQgbWlnaHQgbWFrZSBzZW5zZSB0byBzcGxpdCB0aGUgZGlzcGF0Y2hlciBpbnRvIHNlcGFyYXRlIGRpc3BhdGNoZXIgYW5kIGV2ZW50IGNsYXNzZXMuXG4gICAgcmV0dXJuIDxFdmVudDxTZW5kZXIsIEFyZ3M+PnRoaXM7XG4gIH1cbn1cblxuLyoqXG4gKiBBIGJhc2ljIGV2ZW50IGxpc3RlbmVyIHdyYXBwZXIgdG8gbWFuYWdlIGxpc3RlbmVycyB3aXRoaW4gdGhlIHtAbGluayBFdmVudERpc3BhdGNoZXJ9LiBUaGlzIGlzIGEgJ3ByaXZhdGUnIGNsYXNzXG4gKiBmb3IgaW50ZXJuYWwgZGlzcGF0Y2hlciB1c2UgYW5kIGl0IGlzIHRoZXJlZm9yZSBub3QgZXhwb3J0ZWQuXG4gKi9cbmNsYXNzIEV2ZW50TGlzdGVuZXJXcmFwcGVyPFNlbmRlciwgQXJncz4ge1xuXG4gIHByaXZhdGUgZXZlbnRMaXN0ZW5lcjogRXZlbnRMaXN0ZW5lcjxTZW5kZXIsIEFyZ3M+O1xuICBwcml2YXRlIG9uY2U6IGJvb2xlYW47XG5cbiAgY29uc3RydWN0b3IobGlzdGVuZXI6IEV2ZW50TGlzdGVuZXI8U2VuZGVyLCBBcmdzPiwgb25jZTogYm9vbGVhbiA9IGZhbHNlKSB7XG4gICAgdGhpcy5ldmVudExpc3RlbmVyID0gbGlzdGVuZXI7XG4gICAgdGhpcy5vbmNlID0gb25jZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSB3cmFwcGVkIGV2ZW50IGxpc3RlbmVyLlxuICAgKiBAcmV0dXJucyB7RXZlbnRMaXN0ZW5lcjxTZW5kZXIsIEFyZ3M+fVxuICAgKi9cbiAgZ2V0IGxpc3RlbmVyKCk6IEV2ZW50TGlzdGVuZXI8U2VuZGVyLCBBcmdzPiB7XG4gICAgcmV0dXJuIHRoaXMuZXZlbnRMaXN0ZW5lcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBGaXJlcyB0aGUgd3JhcHBlZCBldmVudCBsaXN0ZW5lciB3aXRoIHRoZSBnaXZlbiBhcmd1bWVudHMuXG4gICAqIEBwYXJhbSBzZW5kZXJcbiAgICogQHBhcmFtIGFyZ3NcbiAgICovXG4gIGZpcmUoc2VuZGVyOiBTZW5kZXIsIGFyZ3M6IEFyZ3MpIHtcbiAgICB0aGlzLmV2ZW50TGlzdGVuZXIoc2VuZGVyLCBhcmdzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhpcyBsaXN0ZW5lciBpcyBzY2hlZHVsZWQgdG8gYmUgY2FsbGVkIG9ubHkgb25jZS5cbiAgICogQHJldHVybnMge2Jvb2xlYW59IG9uY2UgaWYgdHJ1ZVxuICAgKi9cbiAgaXNPbmNlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLm9uY2U7XG4gIH1cbn1cblxuLyoqXG4gKiBFeHRlbmRzIHRoZSBiYXNpYyB7QGxpbmsgRXZlbnRMaXN0ZW5lcldyYXBwZXJ9IHdpdGggcmF0ZS1saW1pdGluZyBmdW5jdGlvbmFsaXR5LlxuICovXG5jbGFzcyBSYXRlTGltaXRlZEV2ZW50TGlzdGVuZXJXcmFwcGVyPFNlbmRlciwgQXJncz4gZXh0ZW5kcyBFdmVudExpc3RlbmVyV3JhcHBlcjxTZW5kZXIsIEFyZ3M+IHtcblxuICBwcml2YXRlIHJhdGVNczogbnVtYmVyO1xuICBwcml2YXRlIHJhdGVMaW1pdGluZ0V2ZW50TGlzdGVuZXI6IEV2ZW50TGlzdGVuZXI8U2VuZGVyLCBBcmdzPjtcblxuICBwcml2YXRlIGxhc3RGaXJlVGltZTogbnVtYmVyO1xuXG4gIGNvbnN0cnVjdG9yKGxpc3RlbmVyOiBFdmVudExpc3RlbmVyPFNlbmRlciwgQXJncz4sIHJhdGVNczogbnVtYmVyKSB7XG4gICAgc3VwZXIobGlzdGVuZXIpOyAvLyBzZXRzIHRoZSBldmVudCBsaXN0ZW5lciBzaW5rXG5cbiAgICB0aGlzLnJhdGVNcyA9IHJhdGVNcztcbiAgICB0aGlzLmxhc3RGaXJlVGltZSA9IDA7XG5cbiAgICAvLyBXcmFwIHRoZSBldmVudCBsaXN0ZW5lciB3aXRoIGFuIGV2ZW50IGxpc3RlbmVyIHRoYXQgZG9lcyB0aGUgcmF0ZS1saW1pdGluZ1xuICAgIHRoaXMucmF0ZUxpbWl0aW5nRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uKHNlbmRlcjogU2VuZGVyLCBhcmdzOiBBcmdzKSB7XG4gICAgICBpZiAoRGF0ZS5ub3coKSAtIHRoaXMubGFzdEZpcmVUaW1lID4gdGhpcy5yYXRlTXMpIHtcbiAgICAgICAgLy8gT25seSBpZiBlbm91Z2ggdGltZSBzaW5jZSB0aGUgcHJldmlvdXMgY2FsbCBoYXMgcGFzc2VkLCBjYWxsIHRoZVxuICAgICAgICAvLyBhY3R1YWwgZXZlbnQgbGlzdGVuZXIgYW5kIHJlY29yZCB0aGUgY3VycmVudCB0aW1lXG4gICAgICAgIHRoaXMuZmlyZVN1cGVyKHNlbmRlciwgYXJncyk7XG4gICAgICAgIHRoaXMubGFzdEZpcmVUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBmaXJlU3VwZXIoc2VuZGVyOiBTZW5kZXIsIGFyZ3M6IEFyZ3MpIHtcbiAgICAvLyBGaXJlIHRoZSBhY3R1YWwgZXh0ZXJuYWwgZXZlbnQgbGlzdGVuZXJcbiAgICBzdXBlci5maXJlKHNlbmRlciwgYXJncyk7XG4gIH1cblxuICBmaXJlKHNlbmRlcjogU2VuZGVyLCBhcmdzOiBBcmdzKSB7XG4gICAgLy8gRmlyZSB0aGUgaW50ZXJuYWwgcmF0ZS1saW1pdGluZyBsaXN0ZW5lciBpbnN0ZWFkIG9mIHRoZSBleHRlcm5hbCBldmVudCBsaXN0ZW5lclxuICAgIHRoaXMucmF0ZUxpbWl0aW5nRXZlbnRMaXN0ZW5lcihzZW5kZXIsIGFyZ3MpO1xuICB9XG59IiwiZXhwb3J0IG5hbWVzcGFjZSBHdWlkIHtcblxuICBsZXQgZ3VpZCA9IDE7XG5cbiAgZXhwb3J0IGZ1bmN0aW9uIG5leHQoKSB7XG4gICAgcmV0dXJuIGd1aWQrKztcbiAgfVxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD0ncGxheWVyLmQudHMnIC8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPScuLi8uLi9ub2RlX21vZHVsZXMvQHR5cGVzL2NvcmUtanMvaW5kZXguZC50cycgLz5cbmltcG9ydCB7VUlNYW5hZ2VyfSBmcm9tICcuL3VpbWFuYWdlcic7XG5pbXBvcnQge0J1dHRvbn0gZnJvbSAnLi9jb21wb25lbnRzL2J1dHRvbic7XG5pbXBvcnQge0NvbnRyb2xCYXJ9IGZyb20gJy4vY29tcG9uZW50cy9jb250cm9sYmFyJztcbmltcG9ydCB7RnVsbHNjcmVlblRvZ2dsZUJ1dHRvbn0gZnJvbSAnLi9jb21wb25lbnRzL2Z1bGxzY3JlZW50b2dnbGVidXR0b24nO1xuaW1wb3J0IHtIdWdlUGxheWJhY2tUb2dnbGVCdXR0b259IGZyb20gJy4vY29tcG9uZW50cy9odWdlcGxheWJhY2t0b2dnbGVidXR0b24nO1xuaW1wb3J0IHtQbGF5YmFja1RpbWVMYWJlbH0gZnJvbSAnLi9jb21wb25lbnRzL3BsYXliYWNrdGltZWxhYmVsJztcbmltcG9ydCB7UGxheWJhY2tUb2dnbGVCdXR0b259IGZyb20gJy4vY29tcG9uZW50cy9wbGF5YmFja3RvZ2dsZWJ1dHRvbic7XG5pbXBvcnQge1NlZWtCYXJ9IGZyb20gJy4vY29tcG9uZW50cy9zZWVrYmFyJztcbmltcG9ydCB7U2VsZWN0Qm94fSBmcm9tICcuL2NvbXBvbmVudHMvc2VsZWN0Ym94JztcbmltcG9ydCB7U2V0dGluZ3NQYW5lbH0gZnJvbSAnLi9jb21wb25lbnRzL3NldHRpbmdzcGFuZWwnO1xuaW1wb3J0IHtTZXR0aW5nc1RvZ2dsZUJ1dHRvbn0gZnJvbSAnLi9jb21wb25lbnRzL3NldHRpbmdzdG9nZ2xlYnV0dG9uJztcbmltcG9ydCB7VG9nZ2xlQnV0dG9ufSBmcm9tICcuL2NvbXBvbmVudHMvdG9nZ2xlYnV0dG9uJztcbmltcG9ydCB7VmlkZW9RdWFsaXR5U2VsZWN0Qm94fSBmcm9tICcuL2NvbXBvbmVudHMvdmlkZW9xdWFsaXR5c2VsZWN0Ym94JztcbmltcG9ydCB7Vm9sdW1lVG9nZ2xlQnV0dG9ufSBmcm9tICcuL2NvbXBvbmVudHMvdm9sdW1ldG9nZ2xlYnV0dG9uJztcbmltcG9ydCB7VlJUb2dnbGVCdXR0b259IGZyb20gJy4vY29tcG9uZW50cy92cnRvZ2dsZWJ1dHRvbic7XG5pbXBvcnQge1dhdGVybWFya30gZnJvbSAnLi9jb21wb25lbnRzL3dhdGVybWFyayc7XG5pbXBvcnQge1VJQ29udGFpbmVyfSBmcm9tICcuL2NvbXBvbmVudHMvdWljb250YWluZXInO1xuaW1wb3J0IHtDb250YWluZXJ9IGZyb20gJy4vY29tcG9uZW50cy9jb250YWluZXInO1xuaW1wb3J0IHtMYWJlbH0gZnJvbSAnLi9jb21wb25lbnRzL2xhYmVsJztcbmltcG9ydCB7QXVkaW9RdWFsaXR5U2VsZWN0Qm94fSBmcm9tICcuL2NvbXBvbmVudHMvYXVkaW9xdWFsaXR5c2VsZWN0Ym94JztcbmltcG9ydCB7QXVkaW9UcmFja1NlbGVjdEJveH0gZnJvbSAnLi9jb21wb25lbnRzL2F1ZGlvdHJhY2tzZWxlY3Rib3gnO1xuaW1wb3J0IHtDYXN0U3RhdHVzT3ZlcmxheX0gZnJvbSAnLi9jb21wb25lbnRzL2Nhc3RzdGF0dXNvdmVybGF5JztcbmltcG9ydCB7Q2FzdFRvZ2dsZUJ1dHRvbn0gZnJvbSAnLi9jb21wb25lbnRzL2Nhc3R0b2dnbGVidXR0b24nO1xuaW1wb3J0IHtDb21wb25lbnR9IGZyb20gJy4vY29tcG9uZW50cy9jb21wb25lbnQnO1xuaW1wb3J0IHtFcnJvck1lc3NhZ2VPdmVybGF5fSBmcm9tICcuL2NvbXBvbmVudHMvZXJyb3JtZXNzYWdlb3ZlcmxheSc7XG5pbXBvcnQge1JlY29tbWVuZGF0aW9uT3ZlcmxheX0gZnJvbSAnLi9jb21wb25lbnRzL3JlY29tbWVuZGF0aW9ub3ZlcmxheSc7XG5pbXBvcnQge1NlZWtCYXJMYWJlbH0gZnJvbSAnLi9jb21wb25lbnRzL3NlZWtiYXJsYWJlbCc7XG5pbXBvcnQge1N1YnRpdGxlT3ZlcmxheX0gZnJvbSAnLi9jb21wb25lbnRzL3N1YnRpdGxlb3ZlcmxheSc7XG5pbXBvcnQge1N1YnRpdGxlU2VsZWN0Qm94fSBmcm9tICcuL2NvbXBvbmVudHMvc3VidGl0bGVzZWxlY3Rib3gnO1xuaW1wb3J0IHtUaXRsZUJhcn0gZnJvbSAnLi9jb21wb25lbnRzL3RpdGxlYmFyJztcbmltcG9ydCB7Vm9sdW1lQ29udHJvbEJ1dHRvbn0gZnJvbSAnLi9jb21wb25lbnRzL3ZvbHVtZWNvbnRyb2xidXR0b24nO1xuaW1wb3J0IHtDbGlja092ZXJsYXl9IGZyb20gJy4vY29tcG9uZW50cy9jbGlja292ZXJsYXknO1xuaW1wb3J0IHtBZFNraXBCdXR0b259IGZyb20gJy4vY29tcG9uZW50cy9hZHNraXBidXR0b24nO1xuaW1wb3J0IHtBZE1lc3NhZ2VMYWJlbH0gZnJvbSAnLi9jb21wb25lbnRzL2FkbWVzc2FnZWxhYmVsJztcbmltcG9ydCB7QWRDbGlja092ZXJsYXl9IGZyb20gJy4vY29tcG9uZW50cy9hZGNsaWNrb3ZlcmxheSc7XG5pbXBvcnQge1BsYXliYWNrU3BlZWRTZWxlY3RCb3h9IGZyb20gJy4vY29tcG9uZW50cy9wbGF5YmFja3NwZWVkc2VsZWN0Ym94JztcbmltcG9ydCB7SHVnZVJlcGxheUJ1dHRvbn0gZnJvbSAnLi9jb21wb25lbnRzL2h1Z2VyZXBsYXlidXR0b24nO1xuaW1wb3J0IHtCdWZmZXJpbmdPdmVybGF5fSBmcm9tICcuL2NvbXBvbmVudHMvYnVmZmVyaW5nb3ZlcmxheSc7XG5pbXBvcnQge0Nhc3RVSUNvbnRhaW5lcn0gZnJvbSAnLi9jb21wb25lbnRzL2Nhc3R1aWNvbnRhaW5lcic7XG5pbXBvcnQge1BsYXliYWNrVG9nZ2xlT3ZlcmxheX0gZnJvbSAnLi9jb21wb25lbnRzL3BsYXliYWNrdG9nZ2xlb3ZlcmxheSc7XG5pbXBvcnQge0Nsb3NlQnV0dG9ufSBmcm9tICcuL2NvbXBvbmVudHMvY2xvc2VidXR0b24nO1xuaW1wb3J0IHtNZXRhZGF0YUxhYmVsLCBNZXRhZGF0YUxhYmVsQ29udGVudH0gZnJvbSAnLi9jb21wb25lbnRzL21ldGFkYXRhbGFiZWwnO1xuXG4vLyBPYmplY3QuYXNzaWduIHBvbHlmaWxsIGZvciBFUzUvSUU5XG4vLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9kZS9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9PYmplY3QvYXNzaWduXG5pZiAodHlwZW9mIE9iamVjdC5hc3NpZ24gIT09ICdmdW5jdGlvbicpIHtcbiAgT2JqZWN0LmFzc2lnbiA9IGZ1bmN0aW9uKHRhcmdldDogYW55KSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIGlmICh0YXJnZXQgPT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNvbnZlcnQgdW5kZWZpbmVkIG9yIG51bGwgdG8gb2JqZWN0Jyk7XG4gICAgfVxuXG4gICAgdGFyZ2V0ID0gT2JqZWN0KHRhcmdldCk7XG4gICAgZm9yIChsZXQgaW5kZXggPSAxOyBpbmRleCA8IGFyZ3VtZW50cy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIGxldCBzb3VyY2UgPSBhcmd1bWVudHNbaW5kZXhdO1xuICAgICAgaWYgKHNvdXJjZSAhPSBudWxsKSB7XG4gICAgICAgIGZvciAobGV0IGtleSBpbiBzb3VyY2UpIHtcbiAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkge1xuICAgICAgICAgICAgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRhcmdldDtcbiAgfTtcbn1cblxuLy8gRXhwb3NlIGNsYXNzZXMgdG8gd2luZG93XG4od2luZG93IGFzIGFueSkuYml0bW92aW4ucGxheWVydWkgPSB7XG4gIC8vIE1hbmFnZW1lbnRcbiAgVUlNYW5hZ2VyLFxuICAvLyBDb21wb25lbnRzXG4gIEFkQ2xpY2tPdmVybGF5LFxuICBBZE1lc3NhZ2VMYWJlbCxcbiAgQWRTa2lwQnV0dG9uLFxuICBBdWRpb1F1YWxpdHlTZWxlY3RCb3gsXG4gIEF1ZGlvVHJhY2tTZWxlY3RCb3gsXG4gIEJ1dHRvbixcbiAgQ2FzdFN0YXR1c092ZXJsYXksXG4gIENhc3RUb2dnbGVCdXR0b24sXG4gIENsaWNrT3ZlcmxheSxcbiAgQ29tcG9uZW50LFxuICBDb250YWluZXIsXG4gIENvbnRyb2xCYXIsXG4gIEVycm9yTWVzc2FnZU92ZXJsYXksXG4gIEZ1bGxzY3JlZW5Ub2dnbGVCdXR0b24sXG4gIEh1Z2VQbGF5YmFja1RvZ2dsZUJ1dHRvbixcbiAgTGFiZWwsXG4gIFBsYXliYWNrVGltZUxhYmVsLFxuICBQbGF5YmFja1RvZ2dsZUJ1dHRvbixcbiAgUmVjb21tZW5kYXRpb25PdmVybGF5LFxuICBTZWVrQmFyLFxuICBTZWVrQmFyTGFiZWwsXG4gIFNlbGVjdEJveCxcbiAgU2V0dGluZ3NQYW5lbCxcbiAgU2V0dGluZ3NUb2dnbGVCdXR0b24sXG4gIFN1YnRpdGxlT3ZlcmxheSxcbiAgU3VidGl0bGVTZWxlY3RCb3gsXG4gIFRpdGxlQmFyLFxuICBUb2dnbGVCdXR0b24sXG4gIFVJQ29udGFpbmVyLFxuICBWaWRlb1F1YWxpdHlTZWxlY3RCb3gsXG4gIFZvbHVtZUNvbnRyb2xCdXR0b24sXG4gIFZvbHVtZVRvZ2dsZUJ1dHRvbixcbiAgVlJUb2dnbGVCdXR0b24sXG4gIFdhdGVybWFyayxcbiAgUGxheWJhY2tTcGVlZFNlbGVjdEJveCxcbiAgSHVnZVJlcGxheUJ1dHRvbixcbiAgQnVmZmVyaW5nT3ZlcmxheSxcbiAgQ2FzdFVJQ29udGFpbmVyLFxuICBQbGF5YmFja1RvZ2dsZU92ZXJsYXksXG4gIENsb3NlQnV0dG9uLFxuICBNZXRhZGF0YUxhYmVsLFxuICBNZXRhZGF0YUxhYmVsQ29udGVudCxcbn07IiwiLy8gVE9ETyBjaGFuZ2UgdG8gaW50ZXJuYWwgKG5vdCBleHBvcnRlZCkgY2xhc3MsIGhvdyB0byB1c2UgaW4gb3RoZXIgZmlsZXM/XG4vKipcbiAqIEV4ZWN1dGVzIGEgY2FsbGJhY2sgYWZ0ZXIgYSBzcGVjaWZpZWQgYW1vdW50IG9mIHRpbWUsIG9wdGlvbmFsbHkgcmVwZWF0ZWRseSB1bnRpbCBzdG9wcGVkLlxuICovXG5leHBvcnQgY2xhc3MgVGltZW91dCB7XG5cbiAgcHJpdmF0ZSBkZWxheTogbnVtYmVyO1xuICBwcml2YXRlIGNhbGxiYWNrOiAoKSA9PiB2b2lkO1xuICBwcml2YXRlIHJlcGVhdDogYm9vbGVhbjtcbiAgcHJpdmF0ZSB0aW1lb3V0SGFuZGxlOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgdGltZW91dCBjYWxsYmFjayBoYW5kbGVyLlxuICAgKiBAcGFyYW0gZGVsYXkgdGhlIGRlbGF5IGluIG1pbGxpc2Vjb25kcyBhZnRlciB3aGljaCB0aGUgY2FsbGJhY2sgc2hvdWxkIGJlIGV4ZWN1dGVkXG4gICAqIEBwYXJhbSBjYWxsYmFjayB0aGUgY2FsbGJhY2sgdG8gZXhlY3V0ZSBhZnRlciB0aGUgZGVsYXkgdGltZVxuICAgKiBAcGFyYW0gcmVwZWF0IGlmIHRydWUsIGNhbGwgdGhlIGNhbGxiYWNrIHJlcGVhdGVkbHkgaW4gZGVsYXkgaW50ZXJ2YWxzXG4gICAqL1xuICBjb25zdHJ1Y3RvcihkZWxheTogbnVtYmVyLCBjYWxsYmFjazogKCkgPT4gdm9pZCwgcmVwZWF0OiBib29sZWFuID0gZmFsc2UpIHtcbiAgICB0aGlzLmRlbGF5ID0gZGVsYXk7XG4gICAgdGhpcy5jYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgIHRoaXMucmVwZWF0ID0gcmVwZWF0O1xuICAgIHRoaXMudGltZW91dEhhbmRsZSA9IDA7XG4gIH1cblxuICAvKipcbiAgICogU3RhcnRzIHRoZSB0aW1lb3V0IGFuZCBjYWxscyB0aGUgY2FsbGJhY2sgd2hlbiB0aGUgdGltZW91dCBkZWxheSBoYXMgcGFzc2VkLlxuICAgKi9cbiAgc3RhcnQoKTogdm9pZCB7XG4gICAgdGhpcy5yZXNldCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFycyB0aGUgdGltZW91dC4gVGhlIGNhbGxiYWNrIHdpbGwgbm90IGJlIGNhbGxlZCBpZiBjbGVhciBpcyBjYWxsZWQgZHVyaW5nIHRoZSB0aW1lb3V0LlxuICAgKi9cbiAgY2xlYXIoKTogdm9pZCB7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dEhhbmRsZSk7XG4gIH1cblxuICAvKipcbiAgICogUmVzZXRzIHRoZSBwYXNzZWQgdGltZW91dCBkZWxheSB0byB6ZXJvLiBDYW4gYmUgdXNlZCB0byBkZWZlciB0aGUgY2FsbGluZyBvZiB0aGUgY2FsbGJhY2suXG4gICAqL1xuICByZXNldCgpOiB2b2lkIHtcbiAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgbGV0IGxhc3RTY2hlZHVsZVRpbWUgPSAwO1xuICAgIGxldCBkZWxheUFkanVzdCA9IDA7XG5cbiAgICB0aGlzLmNsZWFyKCk7XG5cbiAgICBsZXQgaW50ZXJuYWxDYWxsYmFjayA9IGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5jYWxsYmFjaygpO1xuXG4gICAgICBpZiAoc2VsZi5yZXBlYXQpIHtcbiAgICAgICAgbGV0IG5vdyA9IERhdGUubm93KCk7XG5cbiAgICAgICAgLy8gVGhlIHRpbWUgb2Ygb25lIGl0ZXJhdGlvbiBmcm9tIHNjaGVkdWxpbmcgdG8gZXhlY3V0aW5nIHRoZSBjYWxsYmFjayAodXN1YWxseSBhIGJpdCBsb25nZXIgdGhhbiB0aGUgZGVsYXlcbiAgICAgICAgLy8gdGltZSlcbiAgICAgICAgbGV0IGRlbHRhID0gbm93IC0gbGFzdFNjaGVkdWxlVGltZTtcblxuICAgICAgICAvLyBDYWxjdWxhdGUgdGhlIGRlbGF5IGFkanVzdG1lbnQgZm9yIHRoZSBuZXh0IHNjaGVkdWxlIHRvIGtlZXAgYSBzdGVhZHkgZGVsYXkgaW50ZXJ2YWwgb3ZlciB0aW1lXG4gICAgICAgIGRlbGF5QWRqdXN0ID0gc2VsZi5kZWxheSAtIGRlbHRhICsgZGVsYXlBZGp1c3Q7XG5cbiAgICAgICAgbGFzdFNjaGVkdWxlVGltZSA9IG5vdztcblxuICAgICAgICAvLyBTY2hlZHVsZSBuZXh0IGV4ZWN1dGlvbiBieSB0aGUgYWRqdXN0ZWQgZGVsYXlcbiAgICAgICAgc2VsZi50aW1lb3V0SGFuZGxlID0gc2V0VGltZW91dChpbnRlcm5hbENhbGxiYWNrLCBzZWxmLmRlbGF5ICsgZGVsYXlBZGp1c3QpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBsYXN0U2NoZWR1bGVUaW1lID0gRGF0ZS5ub3coKTtcbiAgICB0aGlzLnRpbWVvdXRIYW5kbGUgPSBzZXRUaW1lb3V0KGludGVybmFsQ2FsbGJhY2ssIHRoaXMuZGVsYXkpO1xuICB9XG59IiwiaW1wb3J0IHtVSUNvbnRhaW5lcn0gZnJvbSAnLi9jb21wb25lbnRzL3VpY29udGFpbmVyJztcbmltcG9ydCB7RE9NfSBmcm9tICcuL2RvbSc7XG5pbXBvcnQge0NvbXBvbmVudCwgQ29tcG9uZW50Q29uZmlnfSBmcm9tICcuL2NvbXBvbmVudHMvY29tcG9uZW50JztcbmltcG9ydCB7Q29udGFpbmVyfSBmcm9tICcuL2NvbXBvbmVudHMvY29udGFpbmVyJztcbmltcG9ydCB7UGxheWJhY2tUb2dnbGVCdXR0b259IGZyb20gJy4vY29tcG9uZW50cy9wbGF5YmFja3RvZ2dsZWJ1dHRvbic7XG5pbXBvcnQge0Z1bGxzY3JlZW5Ub2dnbGVCdXR0b259IGZyb20gJy4vY29tcG9uZW50cy9mdWxsc2NyZWVudG9nZ2xlYnV0dG9uJztcbmltcG9ydCB7VlJUb2dnbGVCdXR0b259IGZyb20gJy4vY29tcG9uZW50cy92cnRvZ2dsZWJ1dHRvbic7XG5pbXBvcnQge1ZvbHVtZVRvZ2dsZUJ1dHRvbn0gZnJvbSAnLi9jb21wb25lbnRzL3ZvbHVtZXRvZ2dsZWJ1dHRvbic7XG5pbXBvcnQge1NlZWtCYXJ9IGZyb20gJy4vY29tcG9uZW50cy9zZWVrYmFyJztcbmltcG9ydCB7UGxheWJhY2tUaW1lTGFiZWwsIFRpbWVMYWJlbE1vZGV9IGZyb20gJy4vY29tcG9uZW50cy9wbGF5YmFja3RpbWVsYWJlbCc7XG5pbXBvcnQge0NvbnRyb2xCYXJ9IGZyb20gJy4vY29tcG9uZW50cy9jb250cm9sYmFyJztcbmltcG9ydCB7Tm9BcmdzLCBFdmVudERpc3BhdGNoZXJ9IGZyb20gJy4vZXZlbnRkaXNwYXRjaGVyJztcbmltcG9ydCB7U2V0dGluZ3NUb2dnbGVCdXR0b259IGZyb20gJy4vY29tcG9uZW50cy9zZXR0aW5nc3RvZ2dsZWJ1dHRvbic7XG5pbXBvcnQge1NldHRpbmdzUGFuZWwsIFNldHRpbmdzUGFuZWxJdGVtfSBmcm9tICcuL2NvbXBvbmVudHMvc2V0dGluZ3NwYW5lbCc7XG5pbXBvcnQge1ZpZGVvUXVhbGl0eVNlbGVjdEJveH0gZnJvbSAnLi9jb21wb25lbnRzL3ZpZGVvcXVhbGl0eXNlbGVjdGJveCc7XG5pbXBvcnQge1dhdGVybWFya30gZnJvbSAnLi9jb21wb25lbnRzL3dhdGVybWFyayc7XG5pbXBvcnQge0F1ZGlvUXVhbGl0eVNlbGVjdEJveH0gZnJvbSAnLi9jb21wb25lbnRzL2F1ZGlvcXVhbGl0eXNlbGVjdGJveCc7XG5pbXBvcnQge0F1ZGlvVHJhY2tTZWxlY3RCb3h9IGZyb20gJy4vY29tcG9uZW50cy9hdWRpb3RyYWNrc2VsZWN0Ym94JztcbmltcG9ydCB7U2Vla0JhckxhYmVsfSBmcm9tICcuL2NvbXBvbmVudHMvc2Vla2JhcmxhYmVsJztcbmltcG9ydCB7Vm9sdW1lU2xpZGVyfSBmcm9tICcuL2NvbXBvbmVudHMvdm9sdW1lc2xpZGVyJztcbmltcG9ydCB7U3VidGl0bGVTZWxlY3RCb3h9IGZyb20gJy4vY29tcG9uZW50cy9zdWJ0aXRsZXNlbGVjdGJveCc7XG5pbXBvcnQge1N1YnRpdGxlT3ZlcmxheX0gZnJvbSAnLi9jb21wb25lbnRzL3N1YnRpdGxlb3ZlcmxheSc7XG5pbXBvcnQge1ZvbHVtZUNvbnRyb2xCdXR0b259IGZyb20gJy4vY29tcG9uZW50cy92b2x1bWVjb250cm9sYnV0dG9uJztcbmltcG9ydCB7Q2FzdFRvZ2dsZUJ1dHRvbn0gZnJvbSAnLi9jb21wb25lbnRzL2Nhc3R0b2dnbGVidXR0b24nO1xuaW1wb3J0IHtDYXN0U3RhdHVzT3ZlcmxheX0gZnJvbSAnLi9jb21wb25lbnRzL2Nhc3RzdGF0dXNvdmVybGF5JztcbmltcG9ydCB7RXJyb3JNZXNzYWdlT3ZlcmxheX0gZnJvbSAnLi9jb21wb25lbnRzL2Vycm9ybWVzc2FnZW92ZXJsYXknO1xuaW1wb3J0IHtUaXRsZUJhcn0gZnJvbSAnLi9jb21wb25lbnRzL3RpdGxlYmFyJztcbmltcG9ydCBQbGF5ZXIgPSBiaXRtb3Zpbi5wbGF5ZXIuUGxheWVyO1xuaW1wb3J0IHtSZWNvbW1lbmRhdGlvbk92ZXJsYXl9IGZyb20gJy4vY29tcG9uZW50cy9yZWNvbW1lbmRhdGlvbm92ZXJsYXknO1xuaW1wb3J0IHtBZE1lc3NhZ2VMYWJlbH0gZnJvbSAnLi9jb21wb25lbnRzL2FkbWVzc2FnZWxhYmVsJztcbmltcG9ydCB7QWRTa2lwQnV0dG9ufSBmcm9tICcuL2NvbXBvbmVudHMvYWRza2lwYnV0dG9uJztcbmltcG9ydCB7QWRDbGlja092ZXJsYXl9IGZyb20gJy4vY29tcG9uZW50cy9hZGNsaWNrb3ZlcmxheSc7XG5pbXBvcnQgRVZFTlQgPSBiaXRtb3Zpbi5wbGF5ZXIuRVZFTlQ7XG5pbXBvcnQgUGxheWVyRXZlbnRDYWxsYmFjayA9IGJpdG1vdmluLnBsYXllci5QbGF5ZXJFdmVudENhbGxiYWNrO1xuaW1wb3J0IEFkU3RhcnRlZEV2ZW50ID0gYml0bW92aW4ucGxheWVyLkFkU3RhcnRlZEV2ZW50O1xuaW1wb3J0IHtBcnJheVV0aWxzfSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCB7UGxheWJhY2tTcGVlZFNlbGVjdEJveH0gZnJvbSAnLi9jb21wb25lbnRzL3BsYXliYWNrc3BlZWRzZWxlY3Rib3gnO1xuaW1wb3J0IHtCdWZmZXJpbmdPdmVybGF5fSBmcm9tICcuL2NvbXBvbmVudHMvYnVmZmVyaW5nb3ZlcmxheSc7XG5pbXBvcnQge0Nhc3RVSUNvbnRhaW5lcn0gZnJvbSAnLi9jb21wb25lbnRzL2Nhc3R1aWNvbnRhaW5lcic7XG5pbXBvcnQge1BsYXliYWNrVG9nZ2xlT3ZlcmxheX0gZnJvbSAnLi9jb21wb25lbnRzL3BsYXliYWNrdG9nZ2xlb3ZlcmxheSc7XG5pbXBvcnQge0Nsb3NlQnV0dG9ufSBmcm9tICcuL2NvbXBvbmVudHMvY2xvc2VidXR0b24nO1xuaW1wb3J0IHtNZXRhZGF0YUxhYmVsLCBNZXRhZGF0YUxhYmVsQ29udGVudH0gZnJvbSAnLi9jb21wb25lbnRzL21ldGFkYXRhbGFiZWwnO1xuaW1wb3J0IHtMYWJlbH0gZnJvbSAnLi9jb21wb25lbnRzL2xhYmVsJztcbmltcG9ydCBQbGF5ZXJFdmVudCA9IGJpdG1vdmluLnBsYXllci5QbGF5ZXJFdmVudDtcblxuZXhwb3J0IGludGVyZmFjZSBVSVJlY29tbWVuZGF0aW9uQ29uZmlnIHtcbiAgdGl0bGU6IHN0cmluZztcbiAgdXJsOiBzdHJpbmc7XG4gIHRodW1ibmFpbD86IHN0cmluZztcbiAgZHVyYXRpb24/OiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGltZWxpbmVNYXJrZXIge1xuICB0aW1lOiBudW1iZXI7XG4gIHRpdGxlPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFVJQ29uZmlnIHtcbiAgbWV0YWRhdGE/OiB7XG4gICAgdGl0bGU/OiBzdHJpbmc7XG4gICAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG4gICAgbWFya2Vycz86IFRpbWVsaW5lTWFya2VyW107XG4gIH07XG4gIHJlY29tbWVuZGF0aW9ucz86IFVJUmVjb21tZW5kYXRpb25Db25maWdbXTtcbn1cblxuZXhwb3J0IGNsYXNzIFVJTWFuYWdlciB7XG5cbiAgcHJpdmF0ZSBwbGF5ZXI6IFBsYXllcjtcbiAgcHJpdmF0ZSBwbGF5ZXJFbGVtZW50OiBET007XG4gIHByaXZhdGUgcGxheWVyVWk6IEludGVybmFsVUlJbnN0YW5jZU1hbmFnZXI7XG4gIHByaXZhdGUgYWRzVWk6IEludGVybmFsVUlJbnN0YW5jZU1hbmFnZXI7XG4gIHByaXZhdGUgY29uZmlnOiBVSUNvbmZpZztcbiAgcHJpdmF0ZSBtYW5hZ2VyUGxheWVyV3JhcHBlcjogUGxheWVyV3JhcHBlcjtcblxuICBjb25zdHJ1Y3RvcihwbGF5ZXI6IFBsYXllciwgcGxheWVyVWk6IFVJQ29udGFpbmVyLCBhZHNVaTogVUlDb250YWluZXIsIGNvbmZpZzogVUlDb25maWcgPSB7fSkge1xuICAgIHRoaXMucGxheWVyID0gcGxheWVyO1xuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuXG4gICAgaWYgKCFjb25maWcubWV0YWRhdGEpIHtcbiAgICAgIGNvbmZpZy5tZXRhZGF0YSA9IHtcbiAgICAgICAgdGl0bGU6IHBsYXllci5nZXRDb25maWcoKS5zb3VyY2UgPyBwbGF5ZXIuZ2V0Q29uZmlnKCkuc291cmNlLnRpdGxlIDogbnVsbCxcbiAgICAgICAgZGVzY3JpcHRpb246IHBsYXllci5nZXRDb25maWcoKS5zb3VyY2UgPyBwbGF5ZXIuZ2V0Q29uZmlnKCkuc291cmNlLmRlc2NyaXB0aW9uIDogbnVsbCxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgdGhpcy5wbGF5ZXJVaSA9IG5ldyBJbnRlcm5hbFVJSW5zdGFuY2VNYW5hZ2VyKHBsYXllciwgcGxheWVyVWksIGNvbmZpZyk7XG5cbiAgICB0aGlzLm1hbmFnZXJQbGF5ZXJXcmFwcGVyID0gbmV3IFBsYXllcldyYXBwZXIocGxheWVyKTtcblxuICAgIHRoaXMucGxheWVyRWxlbWVudCA9IG5ldyBET00ocGxheWVyLmdldEZpZ3VyZSgpKTtcblxuICAgIC8vIEFkZCBVSSBlbGVtZW50cyB0byBwbGF5ZXJcbiAgICB0aGlzLmFkZFVpKHRoaXMucGxheWVyVWkpO1xuXG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuXG4gICAgLy8gQWRzIFVJXG4gICAgaWYgKGFkc1VpKSB7XG4gICAgICB0aGlzLmFkc1VpID0gbmV3IEludGVybmFsVUlJbnN0YW5jZU1hbmFnZXIocGxheWVyLCBhZHNVaSwgY29uZmlnKTtcbiAgICAgIGxldCBhZHNVaUFkZGVkID0gZmFsc2U7XG5cbiAgICAgIGxldCBlbnRlckFkc1VpID0gZnVuY3Rpb24oZXZlbnQ6IEFkU3RhcnRlZEV2ZW50KSB7XG4gICAgICAgIHBsYXllclVpLmhpZGUoKTtcblxuICAgICAgICAvLyBEaXNwbGF5IHRoZSBhZHMgVUkgKG9ubHkgZm9yIFZBU1QgYWRzLCBvdGhlciBjbGllbnRzIGJyaW5nIHRoZWlyIG93biBVSSlcbiAgICAgICAgaWYgKGV2ZW50LmNsaWVudFR5cGUgPT09ICd2YXN0Jykge1xuICAgICAgICAgIC8vIEFkZCBhZHMgVUkgd2hlbiBpdCBpcyBuZWVkZWQgZm9yIHRoZSBmaXJzdCB0aW1lXG4gICAgICAgICAgaWYgKCFhZHNVaUFkZGVkKSB7XG4gICAgICAgICAgICBzZWxmLmFkZFVpKHNlbGYuYWRzVWkpO1xuICAgICAgICAgICAgYWRzVWlBZGRlZCA9IHRydWU7XG5cbiAgICAgICAgICAgIC8qIFJlbGF5IHRoZSBPTl9BRF9TVEFSVEVEIGV2ZW50IHRvIHRoZSBhZHMgVUlcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBCZWNhdXNlIHRoZSBhZHMgVUkgaXMgaW5pdGlhbGl6ZWQgaW4gdGhlIE9OX0FEX1NUQVJURUQgaGFuZGxlciwgaS5lLiB3aGVuIHRoZSBPTl9BRF9TVEFSVEVEIGV2ZW50IGhhc1xuICAgICAgICAgICAgICogYWxyZWFkeSBiZWVuIGZpcmVkLCBjb21wb25lbnRzIGluIHRoZSBhZHMgVUkgdGhhdCBsaXN0ZW4gZm9yIHRoZSBPTl9BRF9TVEFSVEVEIGV2ZW50IG5ldmVyIHJlY2VpdmUgaXQuXG4gICAgICAgICAgICAgKiBTaW5jZSB0aGlzIGNhbiBicmVhayBmdW5jdGlvbmFsaXR5IG9mIGNvbXBvbmVudHMgdGhhdCByZWx5IG9uIHRoaXMgZXZlbnQsIHdlIHJlbGF5IHRoZSBldmVudCB0byB0aGVcbiAgICAgICAgICAgICAqIGFkcyBVSSBjb21wb25lbnRzIHdpdGggdGhlIGZvbGxvd2luZyBjYWxsLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzZWxmLmFkc1VpLmdldFBsYXllcigpLmZpcmVFdmVudEluVUkoYml0bW92aW4ucGxheWVyLkVWRU5ULk9OX0FEX1NUQVJURUQsIGV2ZW50KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBhZHNVaS5zaG93KCk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGxldCBleGl0QWRzVWkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGFkc1VpQWRkZWQpIHtcbiAgICAgICAgICBhZHNVaS5oaWRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgcGxheWVyVWkuc2hvdygpO1xuICAgICAgfTtcblxuICAgICAgLy8gUmVhY3QgdG8gYWQgZXZlbnRzIGZyb20gdGhlIHBsYXllclxuICAgICAgdGhpcy5tYW5hZ2VyUGxheWVyV3JhcHBlci5nZXRQbGF5ZXIoKS5hZGRFdmVudEhhbmRsZXIoRVZFTlQuT05fQURfU1RBUlRFRCwgZW50ZXJBZHNVaSk7XG4gICAgICB0aGlzLm1hbmFnZXJQbGF5ZXJXcmFwcGVyLmdldFBsYXllcigpLmFkZEV2ZW50SGFuZGxlcihFVkVOVC5PTl9BRF9GSU5JU0hFRCwgZXhpdEFkc1VpKTtcbiAgICAgIHRoaXMubWFuYWdlclBsYXllcldyYXBwZXIuZ2V0UGxheWVyKCkuYWRkRXZlbnRIYW5kbGVyKEVWRU5ULk9OX0FEX1NLSVBQRUQsIGV4aXRBZHNVaSk7XG4gICAgICB0aGlzLm1hbmFnZXJQbGF5ZXJXcmFwcGVyLmdldFBsYXllcigpLmFkZEV2ZW50SGFuZGxlcihFVkVOVC5PTl9BRF9FUlJPUiwgZXhpdEFkc1VpKTtcbiAgICB9XG4gIH1cblxuICBnZXRDb25maWcoKTogVUlDb25maWcge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZztcbiAgfVxuXG4gIHByaXZhdGUgY29uZmlndXJlQ29udHJvbHMoY29tcG9uZW50OiBDb21wb25lbnQ8Q29tcG9uZW50Q29uZmlnPiwgbWFuYWdlcjogVUlJbnN0YW5jZU1hbmFnZXIpIHtcbiAgICBjb21wb25lbnQuaW5pdGlhbGl6ZSgpO1xuICAgIGNvbXBvbmVudC5jb25maWd1cmUobWFuYWdlci5nZXRQbGF5ZXIoKSwgbWFuYWdlcik7XG5cbiAgICBpZiAoY29tcG9uZW50IGluc3RhbmNlb2YgQ29udGFpbmVyKSB7XG4gICAgICBmb3IgKGxldCBjaGlsZENvbXBvbmVudCBvZiBjb21wb25lbnQuZ2V0Q29tcG9uZW50cygpKSB7XG4gICAgICAgIHRoaXMuY29uZmlndXJlQ29udHJvbHMoY2hpbGRDb21wb25lbnQsIG1hbmFnZXIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYWRkVWkodWk6IEludGVybmFsVUlJbnN0YW5jZU1hbmFnZXIpOiB2b2lkIHtcbiAgICBsZXQgZG9tID0gdWkuZ2V0VUkoKS5nZXREb21FbGVtZW50KCk7XG4gICAgdGhpcy5jb25maWd1cmVDb250cm9scyh1aS5nZXRVSSgpLCB1aSk7XG4gICAgLyogQXBwZW5kIHRoZSBVSSBET00gYWZ0ZXIgY29uZmlndXJhdGlvbiB0byBhdm9pZCBDU1MgdHJhbnNpdGlvbnMgYXQgaW5pdGlhbGl6YXRpb25cbiAgICAgKiBFeGFtcGxlOiBDb21wb25lbnRzIGFyZSBoaWRkZW4gZHVyaW5nIGNvbmZpZ3VyYXRpb24gYW5kIHRoZXNlIGhpZGVzIG1heSB0cmlnZ2VyIENTUyB0cmFuc2l0aW9ucyB0aGF0IGFyZVxuICAgICAqIHVuZGVzaXJhYmxlIGF0IHRoaXMgdGltZS4gKi9cbiAgICB0aGlzLnBsYXllckVsZW1lbnQuYXBwZW5kKGRvbSk7XG4gIH1cblxuICBwcml2YXRlIHJlbGVhc2VVaSh1aTogSW50ZXJuYWxVSUluc3RhbmNlTWFuYWdlcik6IHZvaWQge1xuICAgIHVpLmdldFVJKCkuZ2V0RG9tRWxlbWVudCgpLnJlbW92ZSgpO1xuICAgIHVpLmNsZWFyRXZlbnRIYW5kbGVycygpO1xuICB9XG5cbiAgcmVsZWFzZSgpOiB2b2lkIHtcbiAgICB0aGlzLnJlbGVhc2VVaSh0aGlzLnBsYXllclVpKTtcbiAgICBpZiAodGhpcy5hZHNVaSkge1xuICAgICAgdGhpcy5yZWxlYXNlVWkodGhpcy5hZHNVaSk7XG4gICAgfVxuICAgIHRoaXMubWFuYWdlclBsYXllcldyYXBwZXIuY2xlYXJFdmVudEhhbmRsZXJzKCk7XG4gIH1cblxuICBzdGF0aWMgRmFjdG9yeSA9IGNsYXNzIHtcbiAgICBzdGF0aWMgYnVpbGREZWZhdWx0VUkocGxheWVyOiBQbGF5ZXIsIGNvbmZpZzogVUlDb25maWcgPSB7fSk6IFVJTWFuYWdlciB7XG4gICAgICByZXR1cm4gVUlNYW5hZ2VyLkZhY3RvcnkuYnVpbGRNb2Rlcm5VSShwbGF5ZXIsIGNvbmZpZyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGJ1aWxkRGVmYXVsdFNtYWxsU2NyZWVuVUkocGxheWVyOiBQbGF5ZXIsIGNvbmZpZzogVUlDb25maWcgPSB7fSk6IFVJTWFuYWdlciB7XG4gICAgICByZXR1cm4gVUlNYW5hZ2VyLkZhY3RvcnkuYnVpbGRNb2Rlcm5TbWFsbFNjcmVlblVJKHBsYXllciwgY29uZmlnKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgYnVpbGREZWZhdWx0Q2FzdFJlY2VpdmVyVUkocGxheWVyOiBQbGF5ZXIsIGNvbmZpZzogVUlDb25maWcgPSB7fSk6IFVJTWFuYWdlciB7XG4gICAgICByZXR1cm4gVUlNYW5hZ2VyLkZhY3RvcnkuYnVpbGRNb2Rlcm5DYXN0UmVjZWl2ZXJVSShwbGF5ZXIsIGNvbmZpZyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGJ1aWxkTW9kZXJuVUkocGxheWVyOiBQbGF5ZXIsIGNvbmZpZzogVUlDb25maWcgPSB7fSk6IFVJTWFuYWdlciB7XG4gICAgICBsZXQgc2V0dGluZ3NQYW5lbCA9IG5ldyBTZXR0aW5nc1BhbmVsKHtcbiAgICAgICAgY29tcG9uZW50czogW1xuICAgICAgICAgIG5ldyBTZXR0aW5nc1BhbmVsSXRlbSgnVmlkZW8gUXVhbGl0eScsIG5ldyBWaWRlb1F1YWxpdHlTZWxlY3RCb3goKSksXG4gICAgICAgICAgbmV3IFNldHRpbmdzUGFuZWxJdGVtKCdTcGVlZCcsIG5ldyBQbGF5YmFja1NwZWVkU2VsZWN0Qm94KCkpLFxuICAgICAgICAgIG5ldyBTZXR0aW5nc1BhbmVsSXRlbSgnQXVkaW8gVHJhY2snLCBuZXcgQXVkaW9UcmFja1NlbGVjdEJveCgpKSxcbiAgICAgICAgICBuZXcgU2V0dGluZ3NQYW5lbEl0ZW0oJ0F1ZGlvIFF1YWxpdHknLCBuZXcgQXVkaW9RdWFsaXR5U2VsZWN0Qm94KCkpLFxuICAgICAgICAgIG5ldyBTZXR0aW5nc1BhbmVsSXRlbSgnU3VidGl0bGVzJywgbmV3IFN1YnRpdGxlU2VsZWN0Qm94KCkpXG4gICAgICAgIF0sXG4gICAgICAgIGhpZGRlbjogdHJ1ZVxuICAgICAgfSk7XG5cbiAgICAgIGxldCBjb250cm9sQmFyID0gbmV3IENvbnRyb2xCYXIoe1xuICAgICAgICBjb21wb25lbnRzOiBbXG4gICAgICAgICAgc2V0dGluZ3NQYW5lbCxcbiAgICAgICAgICBuZXcgQ29udGFpbmVyKHtcbiAgICAgICAgICAgIGNvbXBvbmVudHM6IFtcbiAgICAgICAgICAgICAgbmV3IFBsYXliYWNrVGltZUxhYmVsKHsgdGltZUxhYmVsTW9kZTogVGltZUxhYmVsTW9kZS5DdXJyZW50VGltZSwgaGlkZUluTGl2ZVBsYXliYWNrOiB0cnVlIH0pLFxuICAgICAgICAgICAgICBuZXcgU2Vla0Jhcih7IGxhYmVsOiBuZXcgU2Vla0JhckxhYmVsKCkgfSksXG4gICAgICAgICAgICAgIG5ldyBQbGF5YmFja1RpbWVMYWJlbCh7IHRpbWVMYWJlbE1vZGU6IFRpbWVMYWJlbE1vZGUuVG90YWxUaW1lLCBjc3NDbGFzc2VzOiBbJ3RleHQtcmlnaHQnXSB9KSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBjc3NDbGFzc2VzOiBbJ2NvbnRyb2xiYXItdG9wJ11cbiAgICAgICAgICB9KSxcbiAgICAgICAgICBuZXcgQ29udGFpbmVyKHtcbiAgICAgICAgICAgIGNvbXBvbmVudHM6IFtcbiAgICAgICAgICAgICAgbmV3IFBsYXliYWNrVG9nZ2xlQnV0dG9uKCksXG4gICAgICAgICAgICAgIG5ldyBWb2x1bWVUb2dnbGVCdXR0b24oKSxcbiAgICAgICAgICAgICAgbmV3IFZvbHVtZVNsaWRlcigpLFxuICAgICAgICAgICAgICBuZXcgQ29tcG9uZW50KHsgY3NzQ2xhc3M6ICdzcGFjZXInIH0pLFxuICAgICAgICAgICAgICBuZXcgQ2FzdFRvZ2dsZUJ1dHRvbigpLFxuICAgICAgICAgICAgICBuZXcgVlJUb2dnbGVCdXR0b24oKSxcbiAgICAgICAgICAgICAgbmV3IFNldHRpbmdzVG9nZ2xlQnV0dG9uKHsgc2V0dGluZ3NQYW5lbDogc2V0dGluZ3NQYW5lbCB9KSxcbiAgICAgICAgICAgICAgbmV3IEZ1bGxzY3JlZW5Ub2dnbGVCdXR0b24oKSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBjc3NDbGFzc2VzOiBbJ2NvbnRyb2xiYXItYm90dG9tJ11cbiAgICAgICAgICB9KSxcbiAgICAgICAgXVxuICAgICAgfSk7XG5cbiAgICAgIGxldCB1aSA9IG5ldyBVSUNvbnRhaW5lcih7XG4gICAgICAgIGNvbXBvbmVudHM6IFtcbiAgICAgICAgICBuZXcgU3VidGl0bGVPdmVybGF5KCksXG4gICAgICAgICAgbmV3IEJ1ZmZlcmluZ092ZXJsYXkoKSxcbiAgICAgICAgICBuZXcgUGxheWJhY2tUb2dnbGVPdmVybGF5KCksXG4gICAgICAgICAgbmV3IENhc3RTdGF0dXNPdmVybGF5KCksXG4gICAgICAgICAgY29udHJvbEJhcixcbiAgICAgICAgICBuZXcgVGl0bGVCYXIoKSxcbiAgICAgICAgICBuZXcgUmVjb21tZW5kYXRpb25PdmVybGF5KCksXG4gICAgICAgICAgbmV3IFdhdGVybWFyaygpLFxuICAgICAgICAgIG5ldyBFcnJvck1lc3NhZ2VPdmVybGF5KClcbiAgICAgICAgXSwgY3NzQ2xhc3NlczogWyd1aS1za2luLW1vZGVybiddXG4gICAgICB9KTtcblxuICAgICAgbGV0IGFkc1VpID0gbmV3IFVJQ29udGFpbmVyKHtcbiAgICAgICAgY29tcG9uZW50czogW1xuICAgICAgICAgIG5ldyBCdWZmZXJpbmdPdmVybGF5KCksXG4gICAgICAgICAgbmV3IEFkQ2xpY2tPdmVybGF5KCksXG4gICAgICAgICAgbmV3IFBsYXliYWNrVG9nZ2xlT3ZlcmxheSgpLFxuICAgICAgICAgIG5ldyBDb250YWluZXIoe1xuICAgICAgICAgICAgY29tcG9uZW50czogW1xuICAgICAgICAgICAgICBuZXcgQWRNZXNzYWdlTGFiZWwoeyB0ZXh0OiAnQWQ6IHtyZW1haW5pbmdUaW1lfSBzZWNzJyB9KSxcbiAgICAgICAgICAgICAgbmV3IEFkU2tpcEJ1dHRvbigpXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgY3NzQ2xhc3M6ICd1aS1hZHMtc3RhdHVzJ1xuICAgICAgICAgIH0pLFxuICAgICAgICAgIG5ldyBDb250cm9sQmFyKHtcbiAgICAgICAgICAgIGNvbXBvbmVudHM6IFtcbiAgICAgICAgICAgICAgbmV3IENvbnRhaW5lcih7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50czogW1xuICAgICAgICAgICAgICAgICAgbmV3IFBsYXliYWNrVG9nZ2xlQnV0dG9uKCksXG4gICAgICAgICAgICAgICAgICBuZXcgVm9sdW1lVG9nZ2xlQnV0dG9uKCksXG4gICAgICAgICAgICAgICAgICBuZXcgVm9sdW1lU2xpZGVyKCksXG4gICAgICAgICAgICAgICAgICBuZXcgQ29tcG9uZW50KHsgY3NzQ2xhc3M6ICdzcGFjZXInIH0pLFxuICAgICAgICAgICAgICAgICAgbmV3IEZ1bGxzY3JlZW5Ub2dnbGVCdXR0b24oKSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIGNzc0NsYXNzZXM6IFsnY29udHJvbGJhci1ib3R0b20nXVxuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIF1cbiAgICAgICAgICB9KVxuICAgICAgICBdLCBjc3NDbGFzc2VzOiBbJ3VpLXNraW4tbW9kZXJuJywgJ3VpLXNraW4tYWRzJ11cbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gbmV3IFVJTWFuYWdlcihwbGF5ZXIsIHVpLCBhZHNVaSwgY29uZmlnKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgYnVpbGRNb2Rlcm5TbWFsbFNjcmVlblVJKHBsYXllcjogUGxheWVyLCBjb25maWc6IFVJQ29uZmlnID0ge30pOiBVSU1hbmFnZXIge1xuICAgICAgbGV0IHNldHRpbmdzUGFuZWwgPSBuZXcgU2V0dGluZ3NQYW5lbCh7XG4gICAgICAgIGNvbXBvbmVudHM6IFtcbiAgICAgICAgICBuZXcgU2V0dGluZ3NQYW5lbEl0ZW0oJ1ZpZGVvIFF1YWxpdHknLCBuZXcgVmlkZW9RdWFsaXR5U2VsZWN0Qm94KCkpLFxuICAgICAgICAgIG5ldyBTZXR0aW5nc1BhbmVsSXRlbSgnU3BlZWQnLCBuZXcgUGxheWJhY2tTcGVlZFNlbGVjdEJveCgpKSxcbiAgICAgICAgICBuZXcgU2V0dGluZ3NQYW5lbEl0ZW0oJ0F1ZGlvIFRyYWNrJywgbmV3IEF1ZGlvVHJhY2tTZWxlY3RCb3goKSksXG4gICAgICAgICAgbmV3IFNldHRpbmdzUGFuZWxJdGVtKCdBdWRpbyBRdWFsaXR5JywgbmV3IEF1ZGlvUXVhbGl0eVNlbGVjdEJveCgpKSxcbiAgICAgICAgICBuZXcgU2V0dGluZ3NQYW5lbEl0ZW0oJ1N1YnRpdGxlcycsIG5ldyBTdWJ0aXRsZVNlbGVjdEJveCgpKVxuICAgICAgICBdLFxuICAgICAgICBoaWRkZW46IHRydWUsXG4gICAgICAgIGhpZGVEZWxheTogLTEsXG4gICAgICB9KTtcbiAgICAgIHNldHRpbmdzUGFuZWwuYWRkQ29tcG9uZW50KG5ldyBDbG9zZUJ1dHRvbih7IHRhcmdldDogc2V0dGluZ3NQYW5lbCB9KSk7XG5cbiAgICAgIGxldCBjb250cm9sQmFyID0gbmV3IENvbnRyb2xCYXIoe1xuICAgICAgICBjb21wb25lbnRzOiBbXG4gICAgICAgICAgbmV3IENvbnRhaW5lcih7XG4gICAgICAgICAgICBjb21wb25lbnRzOiBbXG4gICAgICAgICAgICAgIG5ldyBQbGF5YmFja1RpbWVMYWJlbCh7IHRpbWVMYWJlbE1vZGU6IFRpbWVMYWJlbE1vZGUuQ3VycmVudFRpbWUsIGhpZGVJbkxpdmVQbGF5YmFjazogdHJ1ZSB9KSxcbiAgICAgICAgICAgICAgbmV3IFNlZWtCYXIoeyBsYWJlbDogbmV3IFNlZWtCYXJMYWJlbCgpIH0pLFxuICAgICAgICAgICAgICBuZXcgUGxheWJhY2tUaW1lTGFiZWwoeyB0aW1lTGFiZWxNb2RlOiBUaW1lTGFiZWxNb2RlLlRvdGFsVGltZSwgY3NzQ2xhc3NlczogWyd0ZXh0LXJpZ2h0J10gfSksXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgY3NzQ2xhc3NlczogWydjb250cm9sYmFyLXRvcCddXG4gICAgICAgICAgfSksXG4gICAgICAgIF1cbiAgICAgIH0pO1xuXG4gICAgICBsZXQgdWkgPSBuZXcgVUlDb250YWluZXIoe1xuICAgICAgICBjb21wb25lbnRzOiBbXG4gICAgICAgICAgbmV3IFN1YnRpdGxlT3ZlcmxheSgpLFxuICAgICAgICAgIG5ldyBCdWZmZXJpbmdPdmVybGF5KCksXG4gICAgICAgICAgbmV3IFBsYXliYWNrVG9nZ2xlT3ZlcmxheSgpLFxuICAgICAgICAgIG5ldyBDYXN0U3RhdHVzT3ZlcmxheSgpLFxuICAgICAgICAgIGNvbnRyb2xCYXIsXG4gICAgICAgICAgbmV3IFRpdGxlQmFyKHtcbiAgICAgICAgICAgIGNvbXBvbmVudHM6IFtcbiAgICAgICAgICAgICAgbmV3IE1ldGFkYXRhTGFiZWwoeyBjb250ZW50OiBNZXRhZGF0YUxhYmVsQ29udGVudC5UaXRsZSB9KSxcbiAgICAgICAgICAgICAgbmV3IENhc3RUb2dnbGVCdXR0b24oKSxcbiAgICAgICAgICAgICAgbmV3IFZSVG9nZ2xlQnV0dG9uKCksXG4gICAgICAgICAgICAgIG5ldyBTZXR0aW5nc1RvZ2dsZUJ1dHRvbih7IHNldHRpbmdzUGFuZWw6IHNldHRpbmdzUGFuZWwgfSksXG4gICAgICAgICAgICAgIG5ldyBGdWxsc2NyZWVuVG9nZ2xlQnV0dG9uKCksXG4gICAgICAgICAgICBdXG4gICAgICAgICAgfSksXG4gICAgICAgICAgc2V0dGluZ3NQYW5lbCxcbiAgICAgICAgICBuZXcgUmVjb21tZW5kYXRpb25PdmVybGF5KCksXG4gICAgICAgICAgbmV3IFdhdGVybWFyaygpLFxuICAgICAgICAgIG5ldyBFcnJvck1lc3NhZ2VPdmVybGF5KClcbiAgICAgICAgXSwgY3NzQ2xhc3NlczogWyd1aS1za2luLW1vZGVybicsICd1aS1za2luLXNtYWxsc2NyZWVuJ11cbiAgICAgIH0pO1xuXG4gICAgICBsZXQgYWRzVWkgPSBuZXcgVUlDb250YWluZXIoe1xuICAgICAgICBjb21wb25lbnRzOiBbXG4gICAgICAgICAgbmV3IEJ1ZmZlcmluZ092ZXJsYXkoKSxcbiAgICAgICAgICBuZXcgQWRDbGlja092ZXJsYXkoKSxcbiAgICAgICAgICBuZXcgUGxheWJhY2tUb2dnbGVPdmVybGF5KCksXG4gICAgICAgICAgbmV3IFRpdGxlQmFyKHtcbiAgICAgICAgICAgIGNvbXBvbmVudHM6IFtcbiAgICAgICAgICAgICAgLy8gZHVtbXkgbGFiZWwgd2l0aCBubyBjb250ZW50IHRvIG1vdmUgYnV0dG9ucyB0byB0aGUgcmlnaHRcbiAgICAgICAgICAgICAgbmV3IExhYmVsKHsgY3NzQ2xhc3M6ICdsYWJlbC1tZXRhZGF0YS10aXRsZScgfSksXG4gICAgICAgICAgICAgIG5ldyBGdWxsc2NyZWVuVG9nZ2xlQnV0dG9uKCksXG4gICAgICAgICAgICBdXG4gICAgICAgICAgfSksXG4gICAgICAgICAgbmV3IENvbnRhaW5lcih7XG4gICAgICAgICAgICBjb21wb25lbnRzOiBbXG4gICAgICAgICAgICAgIG5ldyBBZE1lc3NhZ2VMYWJlbCh7IHRleHQ6ICdBZDoge3JlbWFpbmluZ1RpbWV9IHNlY3MnIH0pLFxuICAgICAgICAgICAgICBuZXcgQWRTa2lwQnV0dG9uKClcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBjc3NDbGFzczogJ3VpLWFkcy1zdGF0dXMnXG4gICAgICAgICAgfSksXG4gICAgICAgIF0sIGNzc0NsYXNzZXM6IFsndWktc2tpbi1tb2Rlcm4nLCAndWktc2tpbi1hZHMnLCAndWktc2tpbi1zbWFsbHNjcmVlbiddXG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIG5ldyBVSU1hbmFnZXIocGxheWVyLCB1aSwgYWRzVWksIGNvbmZpZyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGJ1aWxkTW9kZXJuQ2FzdFJlY2VpdmVyVUkocGxheWVyOiBQbGF5ZXIsIGNvbmZpZzogVUlDb25maWcgPSB7fSk6IFVJTWFuYWdlciB7XG4gICAgICBsZXQgY29udHJvbEJhciA9IG5ldyBDb250cm9sQmFyKHtcbiAgICAgICAgY29tcG9uZW50czogW1xuICAgICAgICAgIG5ldyBDb250YWluZXIoe1xuICAgICAgICAgICAgY29tcG9uZW50czogW1xuICAgICAgICAgICAgICBuZXcgUGxheWJhY2tUaW1lTGFiZWwoeyB0aW1lTGFiZWxNb2RlOiBUaW1lTGFiZWxNb2RlLkN1cnJlbnRUaW1lLCBoaWRlSW5MaXZlUGxheWJhY2s6IHRydWUgfSksXG4gICAgICAgICAgICAgIG5ldyBTZWVrQmFyKHsgbGFiZWw6IG5ldyBTZWVrQmFyTGFiZWwoKSB9KSxcbiAgICAgICAgICAgICAgbmV3IFBsYXliYWNrVGltZUxhYmVsKHsgdGltZUxhYmVsTW9kZTogVGltZUxhYmVsTW9kZS5Ub3RhbFRpbWUsIGNzc0NsYXNzZXM6IFsndGV4dC1yaWdodCddIH0pLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIGNzc0NsYXNzZXM6IFsnY29udHJvbGJhci10b3AnXVxuICAgICAgICAgIH0pLFxuICAgICAgICBdXG4gICAgICB9KTtcblxuICAgICAgbGV0IHVpID0gbmV3IENhc3RVSUNvbnRhaW5lcih7XG4gICAgICAgIGNvbXBvbmVudHM6IFtcbiAgICAgICAgICBuZXcgU3VidGl0bGVPdmVybGF5KCksXG4gICAgICAgICAgbmV3IEJ1ZmZlcmluZ092ZXJsYXkoKSxcbiAgICAgICAgICBuZXcgUGxheWJhY2tUb2dnbGVPdmVybGF5KCksXG4gICAgICAgICAgbmV3IFdhdGVybWFyaygpLFxuICAgICAgICAgIGNvbnRyb2xCYXIsXG4gICAgICAgICAgbmV3IFRpdGxlQmFyKCksXG4gICAgICAgICAgbmV3IEVycm9yTWVzc2FnZU92ZXJsYXkoKVxuICAgICAgICBdLCBjc3NDbGFzc2VzOiBbJ3VpLXNraW4tbW9kZXJuJywgJ3VpLXNraW4tY2FzdC1yZWNlaXZlciddXG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIG5ldyBVSU1hbmFnZXIocGxheWVyLCB1aSwgbnVsbCwgY29uZmlnKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgYnVpbGRMZWdhY3lVSShwbGF5ZXI6IFBsYXllciwgY29uZmlnOiBVSUNvbmZpZyA9IHt9KTogVUlNYW5hZ2VyIHtcbiAgICAgIGxldCBzZXR0aW5nc1BhbmVsID0gbmV3IFNldHRpbmdzUGFuZWwoe1xuICAgICAgICBjb21wb25lbnRzOiBbXG4gICAgICAgICAgbmV3IFNldHRpbmdzUGFuZWxJdGVtKCdWaWRlbyBRdWFsaXR5JywgbmV3IFZpZGVvUXVhbGl0eVNlbGVjdEJveCgpKSxcbiAgICAgICAgICBuZXcgU2V0dGluZ3NQYW5lbEl0ZW0oJ0F1ZGlvIFRyYWNrJywgbmV3IEF1ZGlvVHJhY2tTZWxlY3RCb3goKSksXG4gICAgICAgICAgbmV3IFNldHRpbmdzUGFuZWxJdGVtKCdBdWRpbyBRdWFsaXR5JywgbmV3IEF1ZGlvUXVhbGl0eVNlbGVjdEJveCgpKSxcbiAgICAgICAgICBuZXcgU2V0dGluZ3NQYW5lbEl0ZW0oJ1N1YnRpdGxlcycsIG5ldyBTdWJ0aXRsZVNlbGVjdEJveCgpKVxuICAgICAgICBdLFxuICAgICAgICBoaWRkZW46IHRydWVcbiAgICAgIH0pO1xuXG4gICAgICBsZXQgY29udHJvbEJhciA9IG5ldyBDb250cm9sQmFyKHtcbiAgICAgICAgY29tcG9uZW50czogW1xuICAgICAgICAgIHNldHRpbmdzUGFuZWwsXG4gICAgICAgICAgbmV3IFBsYXliYWNrVG9nZ2xlQnV0dG9uKCksXG4gICAgICAgICAgbmV3IFNlZWtCYXIoeyBsYWJlbDogbmV3IFNlZWtCYXJMYWJlbCgpIH0pLFxuICAgICAgICAgIG5ldyBQbGF5YmFja1RpbWVMYWJlbCgpLFxuICAgICAgICAgIG5ldyBWUlRvZ2dsZUJ1dHRvbigpLFxuICAgICAgICAgIG5ldyBWb2x1bWVDb250cm9sQnV0dG9uKCksXG4gICAgICAgICAgbmV3IFNldHRpbmdzVG9nZ2xlQnV0dG9uKHsgc2V0dGluZ3NQYW5lbDogc2V0dGluZ3NQYW5lbCB9KSxcbiAgICAgICAgICBuZXcgQ2FzdFRvZ2dsZUJ1dHRvbigpLFxuICAgICAgICAgIG5ldyBGdWxsc2NyZWVuVG9nZ2xlQnV0dG9uKClcbiAgICAgICAgXVxuICAgICAgfSk7XG5cbiAgICAgIGxldCB1aSA9IG5ldyBVSUNvbnRhaW5lcih7XG4gICAgICAgIGNvbXBvbmVudHM6IFtcbiAgICAgICAgICBuZXcgU3VidGl0bGVPdmVybGF5KCksXG4gICAgICAgICAgbmV3IENhc3RTdGF0dXNPdmVybGF5KCksXG4gICAgICAgICAgbmV3IFBsYXliYWNrVG9nZ2xlT3ZlcmxheSgpLFxuICAgICAgICAgIG5ldyBXYXRlcm1hcmsoKSxcbiAgICAgICAgICBuZXcgUmVjb21tZW5kYXRpb25PdmVybGF5KCksXG4gICAgICAgICAgY29udHJvbEJhcixcbiAgICAgICAgICBuZXcgVGl0bGVCYXIoKSxcbiAgICAgICAgICBuZXcgRXJyb3JNZXNzYWdlT3ZlcmxheSgpXG4gICAgICAgIF0sIGNzc0NsYXNzZXM6IFsndWktc2tpbi1sZWdhY3knXVxuICAgICAgfSk7XG5cbiAgICAgIGxldCBhZHNVaSA9IG5ldyBVSUNvbnRhaW5lcih7XG4gICAgICAgIGNvbXBvbmVudHM6IFtcbiAgICAgICAgICBuZXcgQWRDbGlja092ZXJsYXkoKSxcbiAgICAgICAgICBuZXcgQ29udHJvbEJhcih7XG4gICAgICAgICAgICBjb21wb25lbnRzOiBbXG4gICAgICAgICAgICAgIG5ldyBQbGF5YmFja1RvZ2dsZUJ1dHRvbigpLFxuICAgICAgICAgICAgICBuZXcgQWRNZXNzYWdlTGFiZWwoKSxcbiAgICAgICAgICAgICAgbmV3IFZvbHVtZUNvbnRyb2xCdXR0b24oKSxcbiAgICAgICAgICAgICAgbmV3IEZ1bGxzY3JlZW5Ub2dnbGVCdXR0b24oKVxuICAgICAgICAgICAgXVxuICAgICAgICAgIH0pLFxuICAgICAgICAgIG5ldyBBZFNraXBCdXR0b24oKVxuICAgICAgICBdLCBjc3NDbGFzc2VzOiBbJ3VpLXNraW4tbGVnYWN5JywgJ3VpLXNraW4tYWRzJ11cbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gbmV3IFVJTWFuYWdlcihwbGF5ZXIsIHVpLCBhZHNVaSwgY29uZmlnKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgYnVpbGRMZWdhY3lDYXN0UmVjZWl2ZXJVSShwbGF5ZXI6IFBsYXllciwgY29uZmlnOiBVSUNvbmZpZyA9IHt9KTogVUlNYW5hZ2VyIHtcbiAgICAgIGxldCBjb250cm9sQmFyID0gbmV3IENvbnRyb2xCYXIoe1xuICAgICAgICBjb21wb25lbnRzOiBbXG4gICAgICAgICAgbmV3IFNlZWtCYXIoKSxcbiAgICAgICAgICBuZXcgUGxheWJhY2tUaW1lTGFiZWwoKSxcbiAgICAgICAgXVxuICAgICAgfSk7XG5cbiAgICAgIGxldCB1aSA9IG5ldyBVSUNvbnRhaW5lcih7XG4gICAgICAgIGNvbXBvbmVudHM6IFtcbiAgICAgICAgICBuZXcgU3VidGl0bGVPdmVybGF5KCksXG4gICAgICAgICAgbmV3IFBsYXliYWNrVG9nZ2xlT3ZlcmxheSgpLFxuICAgICAgICAgIG5ldyBXYXRlcm1hcmsoKSxcbiAgICAgICAgICBjb250cm9sQmFyLFxuICAgICAgICAgIG5ldyBUaXRsZUJhcigpLFxuICAgICAgICAgIG5ldyBFcnJvck1lc3NhZ2VPdmVybGF5KClcbiAgICAgICAgXSwgY3NzQ2xhc3NlczogWyd1aS1za2luLWxlZ2FjeScsICd1aS1za2luLWNhc3QtcmVjZWl2ZXInXVxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBuZXcgVUlNYW5hZ2VyKHBsYXllciwgdWksIG51bGwsIGNvbmZpZyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGJ1aWxkTGVnYWN5VGVzdFVJKHBsYXllcjogUGxheWVyLCBjb25maWc6IFVJQ29uZmlnID0ge30pOiBVSU1hbmFnZXIge1xuICAgICAgbGV0IHNldHRpbmdzUGFuZWwgPSBuZXcgU2V0dGluZ3NQYW5lbCh7XG4gICAgICAgIGNvbXBvbmVudHM6IFtcbiAgICAgICAgICBuZXcgU2V0dGluZ3NQYW5lbEl0ZW0oJ1ZpZGVvIFF1YWxpdHknLCBuZXcgVmlkZW9RdWFsaXR5U2VsZWN0Qm94KCkpLFxuICAgICAgICAgIG5ldyBTZXR0aW5nc1BhbmVsSXRlbSgnQXVkaW8gVHJhY2snLCBuZXcgQXVkaW9UcmFja1NlbGVjdEJveCgpKSxcbiAgICAgICAgICBuZXcgU2V0dGluZ3NQYW5lbEl0ZW0oJ0F1ZGlvIFF1YWxpdHknLCBuZXcgQXVkaW9RdWFsaXR5U2VsZWN0Qm94KCkpLFxuICAgICAgICAgIG5ldyBTZXR0aW5nc1BhbmVsSXRlbSgnU3VidGl0bGVzJywgbmV3IFN1YnRpdGxlU2VsZWN0Qm94KCkpXG4gICAgICAgIF0sXG4gICAgICAgIGhpZGRlbjogdHJ1ZVxuICAgICAgfSk7XG5cbiAgICAgIGxldCBjb250cm9sQmFyID0gbmV3IENvbnRyb2xCYXIoe1xuICAgICAgICBjb21wb25lbnRzOiBbc2V0dGluZ3NQYW5lbCxcbiAgICAgICAgICBuZXcgUGxheWJhY2tUb2dnbGVCdXR0b24oKSxcbiAgICAgICAgICBuZXcgU2Vla0Jhcih7IGxhYmVsOiBuZXcgU2Vla0JhckxhYmVsKCkgfSksXG4gICAgICAgICAgbmV3IFBsYXliYWNrVGltZUxhYmVsKCksXG4gICAgICAgICAgbmV3IFZSVG9nZ2xlQnV0dG9uKCksXG4gICAgICAgICAgbmV3IFZvbHVtZVRvZ2dsZUJ1dHRvbigpLFxuICAgICAgICAgIG5ldyBWb2x1bWVTbGlkZXIoKSxcbiAgICAgICAgICBuZXcgVm9sdW1lQ29udHJvbEJ1dHRvbigpLFxuICAgICAgICAgIG5ldyBWb2x1bWVDb250cm9sQnV0dG9uKHsgdmVydGljYWw6IGZhbHNlIH0pLFxuICAgICAgICAgIG5ldyBTZXR0aW5nc1RvZ2dsZUJ1dHRvbih7IHNldHRpbmdzUGFuZWw6IHNldHRpbmdzUGFuZWwgfSksXG4gICAgICAgICAgbmV3IENhc3RUb2dnbGVCdXR0b24oKSxcbiAgICAgICAgICBuZXcgRnVsbHNjcmVlblRvZ2dsZUJ1dHRvbigpXG4gICAgICAgIF1cbiAgICAgIH0pO1xuXG4gICAgICBsZXQgdWkgPSBuZXcgVUlDb250YWluZXIoe1xuICAgICAgICBjb21wb25lbnRzOiBbXG4gICAgICAgICAgbmV3IFN1YnRpdGxlT3ZlcmxheSgpLFxuICAgICAgICAgIG5ldyBDYXN0U3RhdHVzT3ZlcmxheSgpLFxuICAgICAgICAgIG5ldyBQbGF5YmFja1RvZ2dsZU92ZXJsYXkoKSxcbiAgICAgICAgICBuZXcgV2F0ZXJtYXJrKCksXG4gICAgICAgICAgbmV3IFJlY29tbWVuZGF0aW9uT3ZlcmxheSgpLFxuICAgICAgICAgIGNvbnRyb2xCYXIsXG4gICAgICAgICAgbmV3IFRpdGxlQmFyKCksXG4gICAgICAgICAgbmV3IEVycm9yTWVzc2FnZU92ZXJsYXkoKVxuICAgICAgICBdLCBjc3NDbGFzc2VzOiBbJ3VpLXNraW4tbGVnYWN5J11cbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gbmV3IFVJTWFuYWdlcihwbGF5ZXIsIHVpLCBudWxsLCBjb25maWcpO1xuICAgIH1cbiAgfTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTZWVrUHJldmlld0FyZ3MgZXh0ZW5kcyBOb0FyZ3Mge1xuICAvKipcbiAgICogVGhlIHRpbWVsaW5lIHBvc2l0aW9uIGluIHBlcmNlbnQgd2hlcmUgdGhlIGV2ZW50IG9yaWdpbmF0ZXMgZnJvbS5cbiAgICovXG4gIHBvc2l0aW9uOiBudW1iZXI7XG4gIC8qKlxuICAgKiBUaGUgdGltZWxpbmUgbWFya2VyIGFzc29jaWF0ZWQgd2l0aCB0aGUgY3VycmVudCBwb3NpdGlvbiwgaWYgZXhpc3RpbmcuXG4gICAqL1xuICBtYXJrZXI/OiBUaW1lbGluZU1hcmtlcjtcbn1cblxuLyoqXG4gKiBFbmNhcHN1bGF0ZXMgZnVuY3Rpb25hbGl0eSB0byBtYW5hZ2UgYSBVSSBpbnN0YW5jZS4gVXNlZCBieSB0aGUge0BsaW5rIFVJTWFuYWdlcn0gdG8gbWFuYWdlIG11bHRpcGxlIFVJIGluc3RhbmNlcy5cbiAqL1xuZXhwb3J0IGNsYXNzIFVJSW5zdGFuY2VNYW5hZ2VyIHtcbiAgcHJpdmF0ZSBwbGF5ZXJXcmFwcGVyOiBQbGF5ZXJXcmFwcGVyO1xuICBwcml2YXRlIHVpOiBVSUNvbnRhaW5lcjtcbiAgcHJpdmF0ZSBjb25maWc6IFVJQ29uZmlnO1xuXG4gIHByaXZhdGUgZXZlbnRzID0ge1xuICAgIG9uU2VlazogbmV3IEV2ZW50RGlzcGF0Y2hlcjxTZWVrQmFyLCBOb0FyZ3M+KCksXG4gICAgb25TZWVrUHJldmlldzogbmV3IEV2ZW50RGlzcGF0Y2hlcjxTZWVrQmFyLCBTZWVrUHJldmlld0FyZ3M+KCksXG4gICAgb25TZWVrZWQ6IG5ldyBFdmVudERpc3BhdGNoZXI8U2Vla0JhciwgTm9BcmdzPigpLFxuICAgIG9uQ29tcG9uZW50U2hvdzogbmV3IEV2ZW50RGlzcGF0Y2hlcjxDb21wb25lbnQ8Q29tcG9uZW50Q29uZmlnPiwgTm9BcmdzPigpLFxuICAgIG9uQ29tcG9uZW50SGlkZTogbmV3IEV2ZW50RGlzcGF0Y2hlcjxDb21wb25lbnQ8Q29tcG9uZW50Q29uZmlnPiwgTm9BcmdzPigpLFxuICAgIG9uQ29udHJvbHNTaG93OiBuZXcgRXZlbnREaXNwYXRjaGVyPFVJQ29udGFpbmVyLCBOb0FyZ3M+KCksXG4gICAgb25Db250cm9sc0hpZGU6IG5ldyBFdmVudERpc3BhdGNoZXI8VUlDb250YWluZXIsIE5vQXJncz4oKSxcbiAgfTtcblxuICBjb25zdHJ1Y3RvcihwbGF5ZXI6IFBsYXllciwgdWk6IFVJQ29udGFpbmVyLCBjb25maWc6IFVJQ29uZmlnID0ge30pIHtcbiAgICB0aGlzLnBsYXllcldyYXBwZXIgPSBuZXcgUGxheWVyV3JhcHBlcihwbGF5ZXIpO1xuICAgIHRoaXMudWkgPSB1aTtcbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgfVxuXG4gIGdldENvbmZpZygpOiBVSUNvbmZpZyB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnO1xuICB9XG5cbiAgZ2V0VUkoKTogVUlDb250YWluZXIge1xuICAgIHJldHVybiB0aGlzLnVpO1xuICB9XG5cbiAgZ2V0UGxheWVyKCk6IFdyYXBwZWRQbGF5ZXIge1xuICAgIHJldHVybiB0aGlzLnBsYXllcldyYXBwZXIuZ2V0UGxheWVyKCk7XG4gIH1cblxuICAvKipcbiAgICogRmlyZXMgd2hlbiBhIHNlZWsgc3RhcnRzLlxuICAgKiBAcmV0dXJucyB7RXZlbnREaXNwYXRjaGVyfVxuICAgKi9cbiAgZ2V0IG9uU2VlaygpOiBFdmVudERpc3BhdGNoZXI8U2Vla0JhciwgTm9BcmdzPiB7XG4gICAgcmV0dXJuIHRoaXMuZXZlbnRzLm9uU2VlaztcbiAgfVxuXG4gIC8qKlxuICAgKiBGaXJlcyB3aGVuIHRoZSBzZWVrIHRpbWVsaW5lIGlzIHNjcnViYmVkLlxuICAgKiBAcmV0dXJucyB7RXZlbnREaXNwYXRjaGVyfVxuICAgKi9cbiAgZ2V0IG9uU2Vla1ByZXZpZXcoKTogRXZlbnREaXNwYXRjaGVyPFNlZWtCYXIsIFNlZWtQcmV2aWV3QXJncz4ge1xuICAgIHJldHVybiB0aGlzLmV2ZW50cy5vblNlZWtQcmV2aWV3O1xuICB9XG5cbiAgLyoqXG4gICAqIEZpcmVzIHdoZW4gYSBzZWVrIGlzIGZpbmlzaGVkLlxuICAgKiBAcmV0dXJucyB7RXZlbnREaXNwYXRjaGVyfVxuICAgKi9cbiAgZ2V0IG9uU2Vla2VkKCk6IEV2ZW50RGlzcGF0Y2hlcjxTZWVrQmFyLCBOb0FyZ3M+IHtcbiAgICByZXR1cm4gdGhpcy5ldmVudHMub25TZWVrZWQ7XG4gIH1cblxuICAvKipcbiAgICogRmlyZXMgd2hlbiBhIGNvbXBvbmVudCBpcyBzaG93aW5nLlxuICAgKiBAcmV0dXJucyB7RXZlbnREaXNwYXRjaGVyfVxuICAgKi9cbiAgZ2V0IG9uQ29tcG9uZW50U2hvdygpOiBFdmVudERpc3BhdGNoZXI8Q29tcG9uZW50PENvbXBvbmVudENvbmZpZz4sIE5vQXJncz4ge1xuICAgIHJldHVybiB0aGlzLmV2ZW50cy5vbkNvbXBvbmVudFNob3c7XG4gIH1cblxuICAvKipcbiAgICogRmlyZXMgd2hlbiBhIGNvbXBvbmVudCBpcyBoaWRpbmcuXG4gICAqIEByZXR1cm5zIHtFdmVudERpc3BhdGNoZXJ9XG4gICAqL1xuICBnZXQgb25Db21wb25lbnRIaWRlKCk6IEV2ZW50RGlzcGF0Y2hlcjxDb21wb25lbnQ8Q29tcG9uZW50Q29uZmlnPiwgTm9BcmdzPiB7XG4gICAgcmV0dXJuIHRoaXMuZXZlbnRzLm9uQ29tcG9uZW50SGlkZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGaXJlcyB3aGVuIHRoZSBVSSBjb250cm9scyBhcmUgc2hvd2luZy5cbiAgICogQHJldHVybnMge0V2ZW50RGlzcGF0Y2hlcn1cbiAgICovXG4gIGdldCBvbkNvbnRyb2xzU2hvdygpOiBFdmVudERpc3BhdGNoZXI8VUlDb250YWluZXIsIE5vQXJncz4ge1xuICAgIHJldHVybiB0aGlzLmV2ZW50cy5vbkNvbnRyb2xzU2hvdztcbiAgfVxuXG4gIC8qKlxuICAgKiBGaXJlcyB3aGVuIHRoZSBVSSBjb250cm9scyBhcmUgaGlkaW5nLlxuICAgKiBAcmV0dXJucyB7RXZlbnREaXNwYXRjaGVyfVxuICAgKi9cbiAgZ2V0IG9uQ29udHJvbHNIaWRlKCk6IEV2ZW50RGlzcGF0Y2hlcjxVSUNvbnRhaW5lciwgTm9BcmdzPiB7XG4gICAgcmV0dXJuIHRoaXMuZXZlbnRzLm9uQ29udHJvbHNIaWRlO1xuICB9XG5cbiAgcHJvdGVjdGVkIGNsZWFyRXZlbnRIYW5kbGVycygpOiB2b2lkIHtcbiAgICB0aGlzLnBsYXllcldyYXBwZXIuY2xlYXJFdmVudEhhbmRsZXJzKCk7XG5cbiAgICBsZXQgZXZlbnRzID0gPGFueT50aGlzLmV2ZW50czsgLy8gYXZvaWQgVFM3MDE3XG4gICAgZm9yIChsZXQgZXZlbnQgaW4gZXZlbnRzKSB7XG4gICAgICBsZXQgZGlzcGF0Y2hlciA9IDxFdmVudERpc3BhdGNoZXI8T2JqZWN0LCBPYmplY3Q+PmV2ZW50c1tldmVudF07XG4gICAgICBkaXNwYXRjaGVyLnVuc3Vic2NyaWJlQWxsKCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogRXh0ZW5kcyB0aGUge0BsaW5rIFVJSW5zdGFuY2VNYW5hZ2VyfSBmb3IgaW50ZXJuYWwgdXNlIGluIHRoZSB7QGxpbmsgVUlNYW5hZ2VyfSBhbmQgcHJvdmlkZXMgYWNjZXNzIHRvIGZ1bmN0aW9uYWxpdHlcbiAqIHRoYXQgY29tcG9uZW50cyByZWNlaXZpbmcgYSByZWZlcmVuY2UgdG8gdGhlIHtAbGluayBVSUluc3RhbmNlTWFuYWdlcn0gc2hvdWxkIG5vdCBoYXZlIGFjY2VzcyB0by5cbiAqL1xuY2xhc3MgSW50ZXJuYWxVSUluc3RhbmNlTWFuYWdlciBleHRlbmRzIFVJSW5zdGFuY2VNYW5hZ2VyIHtcbiAgY2xlYXJFdmVudEhhbmRsZXJzKCk6IHZvaWQge1xuICAgIHN1cGVyLmNsZWFyRXZlbnRIYW5kbGVycygpO1xuICB9XG59XG5cbi8qKlxuICogRXh0ZW5kZWQgaW50ZXJmYWNlIG9mIHRoZSB7QGxpbmsgUGxheWVyfSBmb3IgdXNlIGluIHRoZSBVSS5cbiAqL1xuaW50ZXJmYWNlIFdyYXBwZWRQbGF5ZXIgZXh0ZW5kcyBQbGF5ZXIge1xuICAvKipcbiAgICogRmlyZXMgYW4gZXZlbnQgb24gdGhlIHBsYXllciB0aGF0IHRhcmdldHMgYWxsIGhhbmRsZXJzIGluIHRoZSBVSSBidXQgbmV2ZXIgZW50ZXJzIHRoZSByZWFsIHBsYXllci5cbiAgICogQHBhcmFtIGV2ZW50IHRoZSBldmVudCB0byBmaXJlXG4gICAqIEBwYXJhbSBkYXRhIGRhdGEgdG8gc2VuZCB3aXRoIHRoZSBldmVudFxuICAgKi9cbiAgZmlyZUV2ZW50SW5VSShldmVudDogRVZFTlQsIGRhdGE6IHt9KTogdm9pZDtcbn1cblxuLyoqXG4gKiBXcmFwcyB0aGUgcGxheWVyIHRvIHRyYWNrIGV2ZW50IGhhbmRsZXJzIGFuZCBwcm92aWRlIGEgc2ltcGxlIG1ldGhvZCB0byByZW1vdmUgYWxsIHJlZ2lzdGVyZWQgZXZlbnRcbiAqIGhhbmRsZXJzIGZyb20gdGhlIHBsYXllci5cbiAqL1xuY2xhc3MgUGxheWVyV3JhcHBlciB7XG5cbiAgcHJpdmF0ZSBwbGF5ZXI6IFBsYXllcjtcbiAgcHJpdmF0ZSB3cmFwcGVyOiBXcmFwcGVkUGxheWVyO1xuXG4gIHByaXZhdGUgZXZlbnRIYW5kbGVyczogeyBbZXZlbnRUeXBlOiBzdHJpbmddOiBQbGF5ZXJFdmVudENhbGxiYWNrW107IH0gPSB7fTtcblxuICBjb25zdHJ1Y3RvcihwbGF5ZXI6IFBsYXllcikge1xuICAgIHRoaXMucGxheWVyID0gcGxheWVyO1xuXG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuXG4gICAgLy8gQ29sbGVjdCBhbGwgcHVibGljIEFQSSBtZXRob2RzIG9mIHRoZSBwbGF5ZXJcbiAgICBsZXQgbWV0aG9kcyA9IDxhbnlbXT5bXTtcbiAgICBmb3IgKGxldCBtZW1iZXIgaW4gcGxheWVyKSB7XG4gICAgICBpZiAodHlwZW9mICg8YW55PnBsYXllcilbbWVtYmVyXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBtZXRob2RzLnB1c2gobWVtYmVyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgd3JhcHBlciBvYmplY3QgYW5kIGFkZCBmdW5jdGlvbiB3cmFwcGVycyBmb3IgYWxsIEFQSSBtZXRob2RzIHRoYXQgZG8gbm90aGluZyBidXQgY2FsbGluZyB0aGUgYmFzZSBtZXRob2RcbiAgICAvLyBvbiB0aGUgcGxheWVyXG4gICAgbGV0IHdyYXBwZXIgPSA8YW55Pnt9O1xuICAgIGZvciAobGV0IG1lbWJlciBvZiBtZXRob2RzKSB7XG4gICAgICB3cmFwcGVyW21lbWJlcl0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ2NhbGxlZCAnICsgbWVtYmVyKTsgLy8gdHJhY2sgbWV0aG9kIGNhbGxzIG9uIHRoZSBwbGF5ZXJcbiAgICAgICAgcmV0dXJuICg8YW55PnBsYXllcilbbWVtYmVyXS5hcHBseShwbGF5ZXIsIGFyZ3VtZW50cyk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIEV4cGxpY2l0bHkgYWRkIGEgd3JhcHBlciBtZXRob2QgZm9yICdhZGRFdmVudEhhbmRsZXInIHRoYXQgYWRkcyBhZGRlZCBldmVudCBoYW5kbGVycyB0byB0aGUgZXZlbnQgbGlzdFxuICAgIHdyYXBwZXIuYWRkRXZlbnRIYW5kbGVyID0gZnVuY3Rpb24oZXZlbnRUeXBlOiBFVkVOVCwgY2FsbGJhY2s6IFBsYXllckV2ZW50Q2FsbGJhY2spOiBQbGF5ZXIge1xuICAgICAgcGxheWVyLmFkZEV2ZW50SGFuZGxlcihldmVudFR5cGUsIGNhbGxiYWNrKTtcblxuICAgICAgaWYgKCFzZWxmLmV2ZW50SGFuZGxlcnNbZXZlbnRUeXBlXSkge1xuICAgICAgICBzZWxmLmV2ZW50SGFuZGxlcnNbZXZlbnRUeXBlXSA9IFtdO1xuICAgICAgfVxuXG4gICAgICBzZWxmLmV2ZW50SGFuZGxlcnNbZXZlbnRUeXBlXS5wdXNoKGNhbGxiYWNrKTtcblxuICAgICAgcmV0dXJuIHdyYXBwZXI7XG4gICAgfTtcblxuICAgIC8vIEV4cGxpY2l0bHkgYWRkIGEgd3JhcHBlciBtZXRob2QgZm9yICdyZW1vdmVFdmVudEhhbmRsZXInIHRoYXQgcmVtb3ZlcyByZW1vdmVkIGV2ZW50IGhhbmRsZXJzIGZyb20gdGhlIGV2ZW50IGxpc3RcbiAgICB3cmFwcGVyLnJlbW92ZUV2ZW50SGFuZGxlciA9IGZ1bmN0aW9uKGV2ZW50VHlwZTogRVZFTlQsIGNhbGxiYWNrOiBQbGF5ZXJFdmVudENhbGxiYWNrKTogUGxheWVyIHtcbiAgICAgIHBsYXllci5yZW1vdmVFdmVudEhhbmRsZXIoZXZlbnRUeXBlLCBjYWxsYmFjayk7XG5cbiAgICAgIGlmIChzZWxmLmV2ZW50SGFuZGxlcnNbZXZlbnRUeXBlXSkge1xuICAgICAgICBBcnJheVV0aWxzLnJlbW92ZShzZWxmLmV2ZW50SGFuZGxlcnNbZXZlbnRUeXBlXSwgY2FsbGJhY2spO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gd3JhcHBlcjtcbiAgICB9O1xuXG4gICAgd3JhcHBlci5maXJlRXZlbnRJblVJID0gZnVuY3Rpb24oZXZlbnQ6IEVWRU5ULCBkYXRhOiB7fSk6IHZvaWQge1xuICAgICAgaWYgKHNlbGYuZXZlbnRIYW5kbGVyc1tldmVudF0pIHsgLy8gY2hlY2sgaWYgdGhlcmUgYXJlIGhhbmRsZXJzIGZvciB0aGlzIGV2ZW50IHJlZ2lzdGVyZWRcbiAgICAgICAgLy8gRXh0ZW5kIHRoZSBkYXRhIG9iamVjdCB3aXRoIGRlZmF1bHQgdmFsdWVzIHRvIGNvbnZlcnQgaXQgdG8gYSB7QGxpbmsgUGxheWVyRXZlbnR9IG9iamVjdC5cbiAgICAgICAgbGV0IHBsYXllckV2ZW50RGF0YSA9IDxQbGF5ZXJFdmVudD5PYmplY3QuYXNzaWduKHt9LCB7XG4gICAgICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpLFxuICAgICAgICAgIHR5cGU6IGV2ZW50LFxuICAgICAgICAgIC8vIEFkZCBhIG1hcmtlciBwcm9wZXJ0eSBzbyB0aGUgVUkgY2FuIGRldGVjdCBVSS1pbnRlcm5hbCBwbGF5ZXIgZXZlbnRzXG4gICAgICAgICAgdWlTb3VyY2VkOiB0cnVlLFxuICAgICAgICB9LCBkYXRhKTtcblxuICAgICAgICAvLyBFeGVjdXRlIHRoZSByZWdpc3RlcmVkIGNhbGxiYWNrc1xuICAgICAgICBmb3IgKGxldCBjYWxsYmFjayBvZiBzZWxmLmV2ZW50SGFuZGxlcnNbZXZlbnRdKSB7XG4gICAgICAgICAgY2FsbGJhY2socGxheWVyRXZlbnREYXRhKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLndyYXBwZXIgPSA8V3JhcHBlZFBsYXllcj53cmFwcGVyO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSB3cmFwcGVkIHBsYXllciBvYmplY3QgdGhhdCBjYW4gYmUgdXNlZCBvbiBwbGFjZSBvZiB0aGUgbm9ybWFsIHBsYXllciBvYmplY3QuXG4gICAqIEByZXR1cm5zIHtXcmFwcGVkUGxheWVyfSBhIHdyYXBwZWQgcGxheWVyXG4gICAqL1xuICBnZXRQbGF5ZXIoKTogV3JhcHBlZFBsYXllciB7XG4gICAgcmV0dXJuIHRoaXMud3JhcHBlcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhcnMgYWxsIHJlZ2lzdGVyZWQgZXZlbnQgaGFuZGxlcnMgZnJvbSB0aGUgcGxheWVyIHRoYXQgd2VyZSBhZGRlZCB0aHJvdWdoIHRoZSB3cmFwcGVkIHBsYXllci5cbiAgICovXG4gIGNsZWFyRXZlbnRIYW5kbGVycygpOiB2b2lkIHtcbiAgICBmb3IgKGxldCBldmVudFR5cGUgaW4gdGhpcy5ldmVudEhhbmRsZXJzKSB7XG4gICAgICBmb3IgKGxldCBjYWxsYmFjayBvZiB0aGlzLmV2ZW50SGFuZGxlcnNbZXZlbnRUeXBlXSkge1xuICAgICAgICB0aGlzLnBsYXllci5yZW1vdmVFdmVudEhhbmRsZXIoZXZlbnRUeXBlLCBjYWxsYmFjayk7XG4gICAgICB9XG4gICAgfVxuICB9XG59IiwiZXhwb3J0IG5hbWVzcGFjZSBBcnJheVV0aWxzIHtcbiAgLyoqXG4gICAqIFJlbW92ZXMgYW4gaXRlbSBmcm9tIGFuIGFycmF5LlxuICAgKiBAcGFyYW0gYXJyYXkgdGhlIGFycmF5IHRoYXQgbWF5IGNvbnRhaW4gdGhlIGl0ZW0gdG8gcmVtb3ZlXG4gICAqIEBwYXJhbSBpdGVtIHRoZSBpdGVtIHRvIHJlbW92ZSBmcm9tIHRoZSBhcnJheVxuICAgKiBAcmV0dXJucyB7YW55fSB0aGUgcmVtb3ZlZCBpdGVtIG9yIG51bGwgaWYgaXQgd2Fzbid0IHBhcnQgb2YgdGhlIGFycmF5XG4gICAqL1xuICBleHBvcnQgZnVuY3Rpb24gcmVtb3ZlPFQ+KGFycmF5OiBUW10sIGl0ZW06IFQpOiBUIHwgbnVsbCB7XG4gICAgbGV0IGluZGV4ID0gYXJyYXkuaW5kZXhPZihpdGVtKTtcblxuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICByZXR1cm4gYXJyYXkuc3BsaWNlKGluZGV4LCAxKVswXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBuYW1lc3BhY2UgU3RyaW5nVXRpbHMge1xuXG4gIGV4cG9ydCBsZXQgRk9STUFUX0hITU1TUzogc3RyaW5nID0gJ2hoOm1tOnNzJztcbiAgZXhwb3J0IGxldCBGT1JNQVRfTU1TUzogc3RyaW5nID0gJ21tOnNzJztcblxuICAvKipcbiAgICogRm9ybWF0cyBhIG51bWJlciBvZiBzZWNvbmRzIGludG8gYSB0aW1lIHN0cmluZyB3aXRoIHRoZSBwYXR0ZXJuIGhoOm1tOnNzLlxuICAgKlxuICAgKiBAcGFyYW0gdG90YWxTZWNvbmRzIHRoZSB0b3RhbCBudW1iZXIgb2Ygc2Vjb25kcyB0byBmb3JtYXQgdG8gc3RyaW5nXG4gICAqIEBwYXJhbSBmb3JtYXQgdGhlIHRpbWUgZm9ybWF0IHRvIG91dHB1dCAoZGVmYXVsdDogaGg6bW06c3MpXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9IHRoZSBmb3JtYXR0ZWQgdGltZSBzdHJpbmdcbiAgICovXG4gIGV4cG9ydCBmdW5jdGlvbiBzZWNvbmRzVG9UaW1lKHRvdGFsU2Vjb25kczogbnVtYmVyLCBmb3JtYXQ6IHN0cmluZyA9IEZPUk1BVF9ISE1NU1MpOiBzdHJpbmcge1xuICAgIGxldCBpc05lZ2F0aXZlID0gdG90YWxTZWNvbmRzIDwgMDtcblxuICAgIGlmIChpc05lZ2F0aXZlKSB7XG4gICAgICAvLyBJZiB0aGUgdGltZSBpcyBuZWdhdGl2ZSwgd2UgbWFrZSBpdCBwb3NpdGl2ZSBmb3IgdGhlIGNhbGN1bGF0aW9uIGJlbG93XG4gICAgICAvLyAoZWxzZSB3ZSdkIGdldCBhbGwgbmVnYXRpdmUgbnVtYmVycykgYW5kIHJlYXR0YWNoIHRoZSBuZWdhdGl2ZSBzaWduIGxhdGVyLlxuICAgICAgdG90YWxTZWNvbmRzID0gLXRvdGFsU2Vjb25kcztcbiAgICB9XG5cbiAgICAvLyBTcGxpdCBpbnRvIHNlcGFyYXRlIHRpbWUgcGFydHNcbiAgICBsZXQgaG91cnMgPSBNYXRoLmZsb29yKHRvdGFsU2Vjb25kcyAvIDM2MDApO1xuICAgIGxldCBtaW51dGVzID0gTWF0aC5mbG9vcih0b3RhbFNlY29uZHMgLyA2MCkgLSBob3VycyAqIDYwO1xuICAgIGxldCBzZWNvbmRzID0gTWF0aC5mbG9vcih0b3RhbFNlY29uZHMpICUgNjA7XG5cbiAgICByZXR1cm4gKGlzTmVnYXRpdmUgPyAnLScgOiAnJykgKyBmb3JtYXRcbiAgICAgICAgLnJlcGxhY2UoJ2hoJywgbGVmdFBhZFdpdGhaZXJvcyhob3VycywgMikpXG4gICAgICAgIC5yZXBsYWNlKCdtbScsIGxlZnRQYWRXaXRoWmVyb3MobWludXRlcywgMikpXG4gICAgICAgIC5yZXBsYWNlKCdzcycsIGxlZnRQYWRXaXRoWmVyb3Moc2Vjb25kcywgMikpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGEgbnVtYmVyIHRvIGEgc3RyaW5nIGFuZCBsZWZ0LXBhZHMgaXQgd2l0aCB6ZXJvcyB0byB0aGUgc3BlY2lmaWVkIGxlbmd0aC5cbiAgICogRXhhbXBsZTogbGVmdFBhZFdpdGhaZXJvcygxMjMsIDUpID0+ICcwMDEyMydcbiAgICpcbiAgICogQHBhcmFtIG51bSB0aGUgbnVtYmVyIHRvIGNvbnZlcnQgdG8gc3RyaW5nIGFuZCBwYWQgd2l0aCB6ZXJvc1xuICAgKiBAcGFyYW0gbGVuZ3RoIHRoZSBkZXNpcmVkIGxlbmd0aCBvZiB0aGUgcGFkZGVkIHN0cmluZ1xuICAgKiBAcmV0dXJucyB7c3RyaW5nfSB0aGUgcGFkZGVkIG51bWJlciBhcyBzdHJpbmdcbiAgICovXG4gIGZ1bmN0aW9uIGxlZnRQYWRXaXRoWmVyb3MobnVtOiBudW1iZXIgfCBzdHJpbmcsIGxlbmd0aDogbnVtYmVyKTogc3RyaW5nIHtcbiAgICBsZXQgdGV4dCA9IG51bSArICcnO1xuICAgIGxldCBwYWRkaW5nID0gJzAwMDAwMDAwMDAnLnN1YnN0cigwLCBsZW5ndGggLSB0ZXh0Lmxlbmd0aCk7XG4gICAgcmV0dXJuIHBhZGRpbmcgKyB0ZXh0O1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbGxzIG91dCBwbGFjZWhvbGRlcnMgaW4gYW4gYWQgbWVzc2FnZS5cbiAgICpcbiAgICogSGFzIHRoZSBwbGFjZWhvbGRlcnMgJ3tyZW1haW5pbmdUaW1lW2Zvcm1hdFN0cmluZ119JywgJ3twbGF5ZWRUaW1lW2Zvcm1hdFN0cmluZ119JyBhbmRcbiAgICogJ3thZER1cmF0aW9uW2Zvcm1hdFN0cmluZ119Jywgd2hpY2ggYXJlIHJlcGxhY2VkIGJ5IHRoZSByZW1haW5pbmcgdGltZSB1bnRpbCB0aGUgYWQgY2FuIGJlIHNraXBwZWQsIHRoZSBjdXJyZW50XG4gICAqIHRpbWUgb3IgdGhlIGFkIGR1cmF0aW9uLiBUaGUgZm9ybWF0IHN0cmluZyBpcyBvcHRpb25hbC4gSWYgbm90IHNwZWNpZmllZCwgdGhlIHBsYWNlaG9sZGVyIGlzIHJlcGxhY2VkIGJ5IHRoZSB0aW1lXG4gICAqIGluIHNlY29uZHMuIElmIHNwZWNpZmllZCwgaXQgbXVzdCBiZSBvZiB0aGUgZm9sbG93aW5nIGZvcm1hdDpcbiAgICogLSAlZCAtIEluc2VydHMgdGhlIHRpbWUgYXMgYW4gaW50ZWdlci5cbiAgICogLSAlME5kIC0gSW5zZXJ0cyB0aGUgdGltZSBhcyBhbiBpbnRlZ2VyIHdpdGggbGVhZGluZyB6ZXJvZXMsIGlmIHRoZSBsZW5ndGggb2YgdGhlIHRpbWUgc3RyaW5nIGlzIHNtYWxsZXIgdGhhbiBOLlxuICAgKiAtICVmIC0gSW5zZXJ0cyB0aGUgdGltZSBhcyBhIGZsb2F0LlxuICAgKiAtICUwTmYgLSBJbnNlcnRzIHRoZSB0aW1lIGFzIGEgZmxvYXQgd2l0aCBsZWFkaW5nIHplcm9lcy5cbiAgICogLSAlLk1mIC0gSW5zZXJ0cyB0aGUgdGltZSBhcyBhIGZsb2F0IHdpdGggTSBkZWNpbWFsIHBsYWNlcy4gQ2FuIGJlIGNvbWJpbmVkIHdpdGggJTBOZiwgZS5nLiAlMDQuMmYgKHRoZSB0aW1lXG4gICAqIDEwLjEyM1xuICAgKiB3b3VsZCBiZSBwcmludGVkIGFzIDAwMTAuMTIpLlxuICAgKiAtICVoaDptbTpzc1xuICAgKiAtICVtbTpzc1xuICAgKlxuICAgKiBAcGFyYW0gYWRNZXNzYWdlIGFuIGFkIG1lc3NhZ2Ugd2l0aCBvcHRpb25hbCBwbGFjZWhvbGRlcnMgdG8gZmlsbFxuICAgKiBAcGFyYW0gc2tpcE9mZnNldCBpZiBzcGVjaWZpZWQsIHtyZW1haW5pbmdUaW1lfSB3aWxsIGJlIGZpbGxlZCB3aXRoIHRoZSByZW1haW5pbmcgdGltZSB1bnRpbCB0aGUgYWQgY2FuIGJlIHNraXBwZWRcbiAgICogQHBhcmFtIHBsYXllciB0aGUgcGxheWVyIHRvIGdldCB0aGUgdGltZSBkYXRhIGZyb21cbiAgICogQHJldHVybnMge3N0cmluZ30gdGhlIGFkIG1lc3NhZ2Ugd2l0aCBmaWxsZWQgcGxhY2Vob2xkZXJzXG4gICAqL1xuICBleHBvcnQgZnVuY3Rpb24gcmVwbGFjZUFkTWVzc2FnZVBsYWNlaG9sZGVycyhhZE1lc3NhZ2U6IHN0cmluZywgc2tpcE9mZnNldDogbnVtYmVyLCBwbGF5ZXI6IGJpdG1vdmluLnBsYXllci5QbGF5ZXIpIHtcbiAgICBsZXQgYWRNZXNzYWdlUGxhY2Vob2xkZXJSZWdleCA9IG5ldyBSZWdFeHAoXG4gICAgICAnXFxcXHsocmVtYWluaW5nVGltZXxwbGF5ZWRUaW1lfGFkRHVyYXRpb24pKH18JSgoMFsxLTldXFxcXGQqKFxcXFwuXFxcXGQrKGR8Zil8ZHxmKXxcXFxcLlxcXFxkK2Z8ZHxmKXxoaDptbTpzc3xtbTpzcyl9KScsXG4gICAgICAnZydcbiAgICApO1xuXG4gICAgcmV0dXJuIGFkTWVzc2FnZS5yZXBsYWNlKGFkTWVzc2FnZVBsYWNlaG9sZGVyUmVnZXgsIGZ1bmN0aW9uKGZvcm1hdFN0cmluZykge1xuICAgICAgbGV0IHRpbWUgPSAwO1xuICAgICAgaWYgKGZvcm1hdFN0cmluZy5pbmRleE9mKCdyZW1haW5pbmdUaW1lJykgPiAtMSkge1xuICAgICAgICBpZiAoc2tpcE9mZnNldCkge1xuICAgICAgICAgIHRpbWUgPSBNYXRoLmNlaWwoc2tpcE9mZnNldCAtIHBsYXllci5nZXRDdXJyZW50VGltZSgpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aW1lID0gcGxheWVyLmdldER1cmF0aW9uKCkgLSBwbGF5ZXIuZ2V0Q3VycmVudFRpbWUoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChmb3JtYXRTdHJpbmcuaW5kZXhPZigncGxheWVkVGltZScpID4gLTEpIHtcbiAgICAgICAgdGltZSA9IHBsYXllci5nZXRDdXJyZW50VGltZSgpO1xuICAgICAgfSBlbHNlIGlmIChmb3JtYXRTdHJpbmcuaW5kZXhPZignYWREdXJhdGlvbicpID4gLTEpIHtcbiAgICAgICAgdGltZSA9IHBsYXllci5nZXREdXJhdGlvbigpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZvcm1hdE51bWJlcih0aW1lLCBmb3JtYXRTdHJpbmcpO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gZm9ybWF0TnVtYmVyKHRpbWU6IG51bWJlciwgZm9ybWF0OiBzdHJpbmcpIHtcbiAgICBsZXQgZm9ybWF0U3RyaW5nVmFsaWRhdGlvblJlZ2V4ID0gLyUoKDBbMS05XVxcZCooXFwuXFxkKyhkfGYpfGR8Zil8XFwuXFxkK2Z8ZHxmKXxoaDptbTpzc3xtbTpzcykvO1xuICAgIGxldCBsZWFkaW5nWmVyb2VzUmVnZXggPSAvKCUwWzEtOV1cXGQqKSg/PShcXC5cXGQrZnxmfGQpKS87XG4gICAgbGV0IGRlY2ltYWxQbGFjZXNSZWdleCA9IC9cXC5cXGQqKD89ZikvO1xuXG4gICAgaWYgKCFmb3JtYXRTdHJpbmdWYWxpZGF0aW9uUmVnZXgudGVzdChmb3JtYXQpKSB7XG4gICAgICAvLyBJZiB0aGUgZm9ybWF0IGlzIGludmFsaWQsIHdlIHNldCBhIGRlZmF1bHQgZmFsbGJhY2sgZm9ybWF0XG4gICAgICBmb3JtYXQgPSAnJWQnO1xuICAgIH1cblxuICAgIC8vIERldGVybWluZSB0aGUgbnVtYmVyIG9mIGxlYWRpbmcgemVyb3NcbiAgICBsZXQgbGVhZGluZ1plcm9lcyA9IDA7XG4gICAgbGV0IGxlYWRpbmdaZXJvZXNNYXRjaGVzID0gZm9ybWF0Lm1hdGNoKGxlYWRpbmdaZXJvZXNSZWdleCk7XG4gICAgaWYgKGxlYWRpbmdaZXJvZXNNYXRjaGVzKSB7XG4gICAgICBsZWFkaW5nWmVyb2VzID0gcGFyc2VJbnQobGVhZGluZ1plcm9lc01hdGNoZXNbMF0uc3Vic3RyaW5nKDIpKTtcbiAgICB9XG5cbiAgICAvLyBEZXRlcm1pbmUgdGhlIG51bWJlciBvZiBkZWNpbWFsIHBsYWNlc1xuICAgIGxldCBudW1EZWNpbWFsUGxhY2VzID0gbnVsbDtcbiAgICBsZXQgZGVjaW1hbFBsYWNlc01hdGNoZXMgPSBmb3JtYXQubWF0Y2goZGVjaW1hbFBsYWNlc1JlZ2V4KTtcbiAgICBpZiAoZGVjaW1hbFBsYWNlc01hdGNoZXMgJiYgIWlzTmFOKHBhcnNlSW50KGRlY2ltYWxQbGFjZXNNYXRjaGVzWzBdLnN1YnN0cmluZygxKSkpKSB7XG4gICAgICBudW1EZWNpbWFsUGxhY2VzID0gcGFyc2VJbnQoZGVjaW1hbFBsYWNlc01hdGNoZXNbMF0uc3Vic3RyaW5nKDEpKTtcbiAgICAgIGlmIChudW1EZWNpbWFsUGxhY2VzID4gMjApIHtcbiAgICAgICAgbnVtRGVjaW1hbFBsYWNlcyA9IDIwO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEZsb2F0IGZvcm1hdFxuICAgIGlmIChmb3JtYXQuaW5kZXhPZignZicpID4gLTEpIHtcbiAgICAgIGxldCB0aW1lU3RyaW5nID0gJyc7XG5cbiAgICAgIGlmIChudW1EZWNpbWFsUGxhY2VzICE9PSBudWxsKSB7XG4gICAgICAgIC8vIEFwcGx5IGZpeGVkIG51bWJlciBvZiBkZWNpbWFsIHBsYWNlc1xuICAgICAgICB0aW1lU3RyaW5nID0gdGltZS50b0ZpeGVkKG51bURlY2ltYWxQbGFjZXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGltZVN0cmluZyA9ICcnICsgdGltZTtcbiAgICAgIH1cblxuICAgICAgLy8gQXBwbHkgbGVhZGluZyB6ZXJvc1xuICAgICAgaWYgKHRpbWVTdHJpbmcuaW5kZXhPZignLicpID4gLTEpIHtcbiAgICAgICAgcmV0dXJuIGxlZnRQYWRXaXRoWmVyb3ModGltZVN0cmluZywgdGltZVN0cmluZy5sZW5ndGggKyAobGVhZGluZ1plcm9lcyAtIHRpbWVTdHJpbmcuaW5kZXhPZignLicpKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbGVmdFBhZFdpdGhaZXJvcyh0aW1lU3RyaW5nLCBsZWFkaW5nWmVyb2VzKTtcbiAgICAgIH1cblxuICAgIH1cbiAgICAvLyBUaW1lIGZvcm1hdFxuICAgIGVsc2UgaWYgKGZvcm1hdC5pbmRleE9mKCc6JykgPiAtMSkge1xuICAgICAgbGV0IHRvdGFsU2Vjb25kcyA9IE1hdGguY2VpbCh0aW1lKTtcblxuICAgICAgLy8gaGg6bW06c3MgZm9ybWF0XG4gICAgICBpZiAoZm9ybWF0LmluZGV4T2YoJ2hoJykgPiAtMSkge1xuICAgICAgICByZXR1cm4gc2Vjb25kc1RvVGltZSh0b3RhbFNlY29uZHMpO1xuICAgICAgfVxuICAgICAgLy8gbW06c3MgZm9ybWF0XG4gICAgICBlbHNlIHtcbiAgICAgICAgbGV0IG1pbnV0ZXMgPSBNYXRoLmZsb29yKHRvdGFsU2Vjb25kcyAvIDYwKTtcbiAgICAgICAgbGV0IHNlY29uZHMgPSB0b3RhbFNlY29uZHMgJSA2MDtcblxuICAgICAgICByZXR1cm4gbGVmdFBhZFdpdGhaZXJvcyhtaW51dGVzLCAyKSArICc6JyArIGxlZnRQYWRXaXRoWmVyb3Moc2Vjb25kcywgMik7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIEludGVnZXIgZm9ybWF0XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm4gbGVmdFBhZFdpdGhaZXJvcyhNYXRoLmNlaWwodGltZSksIGxlYWRpbmdaZXJvZXMpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgbmFtZXNwYWNlIFBsYXllclV0aWxzIHtcblxuICBpbXBvcnQgUGxheWVyID0gYml0bW92aW4ucGxheWVyLlBsYXllcjtcblxuICBleHBvcnQgZnVuY3Rpb24gaXNTb3VyY2VMb2FkZWQocGxheWVyOiBQbGF5ZXIpOiBib29sZWFuIHtcbiAgICByZXR1cm4gcGxheWVyLmdldENvbmZpZygpLnNvdXJjZSAhPT0gdW5kZWZpbmVkO1xuICB9XG59Il19
