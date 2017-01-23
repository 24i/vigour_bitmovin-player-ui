/// <reference path='player.d.ts' />
/// <reference path='../../node_modules/@types/core-js/index.d.ts' />
import {UIManager} from './uimanager';
import {Button} from './components/button';
import {ControlBar} from './components/controlbar';
import {FullscreenToggleButton} from './components/fullscreentogglebutton';
import {HugePlaybackToggleButton} from './components/hugeplaybacktogglebutton';
import {PlaybackTimeLabel} from './components/playbacktimelabel';
import {PlaybackToggleButton} from './components/playbacktogglebutton';
import {SeekBar} from './components/seekbar';
import {SelectBox} from './components/selectbox';
import {SettingsPanel} from './components/settingspanel';
import {SettingsToggleButton} from './components/settingstogglebutton';
import {ToggleButton} from './components/togglebutton';
import {VideoQualitySelectBox} from './components/videoqualityselectbox';
import {VolumeToggleButton} from './components/volumetogglebutton';
import {VRToggleButton} from './components/vrtogglebutton';
import {Watermark} from './components/watermark';
import {UIContainer} from './components/uicontainer';
import {Container} from './components/container';
import {Label} from './components/label';
import {AudioQualitySelectBox} from './components/audioqualityselectbox';
import {AudioTrackSelectBox} from './components/audiotrackselectbox';
import {CastStatusOverlay} from './components/caststatusoverlay';
import {CastToggleButton} from './components/casttogglebutton';
import {Component} from './components/component';
import {ErrorMessageOverlay} from './components/errormessageoverlay';
import {RecommendationOverlay} from './components/recommendationoverlay';
import {SeekBarLabel} from './components/seekbarlabel';
import {SubtitleOverlay} from './components/subtitleoverlay';
import {SubtitleSelectBox} from './components/subtitleselectbox';
import {TitleBar} from './components/titlebar';
import {VolumeControlButton} from './components/volumecontrolbutton';
import {ClickOverlay} from './components/clickoverlay';
import {AdSkipButton} from './components/adskipbutton';
import {AdMessageLabel} from './components/admessagelabel';
import {AdClickOverlay} from './components/adclickoverlay';
import {PlaybackSpeedSelectBox} from './components/playbackspeedselectbox';
import {HugeReplayButton} from './components/hugereplaybutton';
import {BufferingOverlay} from './components/bufferingoverlay';
import {CastUIContainer} from './components/castuicontainer';
import {PlaybackToggleOverlay} from './components/playbacktoggleoverlay';
import {CloseButton} from './components/closebutton';
import {MetadataLabel, MetadataLabelContent} from './components/metadatalabel';
import {AirPlayToggleButton} from './components/airplaytogglebutton';

// Object.assign polyfill for ES5/IE9
// https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
if (typeof Object.assign !== 'function') {
  Object.assign = function(target: any) {
    'use strict';
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object');
    }

    target = Object(target);
    for (let index = 1; index < arguments.length; index++) {
      let source = arguments[index];
      if (source != null) {
        for (let key in source) {
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
(window as any).bitmovin.playerui = {
  // Management
  UIManager,
  // Components
  AdClickOverlay,
  AdMessageLabel,
  AdSkipButton,
  AudioQualitySelectBox,
  AudioTrackSelectBox,
  Button,
  CastStatusOverlay,
  CastToggleButton,
  ClickOverlay,
  Component,
  Container,
  ControlBar,
  ErrorMessageOverlay,
  FullscreenToggleButton,
  HugePlaybackToggleButton,
  Label,
  PlaybackTimeLabel,
  PlaybackToggleButton,
  RecommendationOverlay,
  SeekBar,
  SeekBarLabel,
  SelectBox,
  SettingsPanel,
  SettingsToggleButton,
  SubtitleOverlay,
  SubtitleSelectBox,
  TitleBar,
  ToggleButton,
  UIContainer,
  VideoQualitySelectBox,
  VolumeControlButton,
  VolumeToggleButton,
  VRToggleButton,
  Watermark,
  PlaybackSpeedSelectBox,
  HugeReplayButton,
  BufferingOverlay,
  CastUIContainer,
  PlaybackToggleOverlay,
  CloseButton,
  MetadataLabel,
  MetadataLabelContent,
  AirPlayToggleButton,
};