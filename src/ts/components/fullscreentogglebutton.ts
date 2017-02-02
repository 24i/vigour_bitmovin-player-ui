import {ToggleButton, ToggleButtonConfig} from './togglebutton';
import {UIInstanceManager} from '../uimanager';

/**
 * A button that toggles the player between windowed and fullscreen view.
 */
export class FullscreenToggleButton extends ToggleButton<ToggleButtonConfig> {

  constructor(config: ToggleButtonConfig = {}) {
    super(config);

    this.config = this.mergeConfig(config, {
      cssClass: 'ui-fullscreentogglebutton',
      text: 'Fullscreen'
    }, this.config);
  }

  configure(player: bitmovin.player.Player, uimanager: UIInstanceManager): void {
    super.configure(player, uimanager);

    let self = this;

    let fullscreenStateHandler = function() {
      if (player.isFullscreen()) {
        self.on();
      } else {
        self.off();
      }
    };

    player.addEventHandler(bitmovin.player.EVENT.ON_FULLSCREEN_ENTER, fullscreenStateHandler);
    player.addEventHandler(bitmovin.player.EVENT.ON_FULLSCREEN_EXIT, fullscreenStateHandler);

    self.onClick.subscribe(function() {
      if (player.isFullscreen()) {
        // player.exitFullscreen();
        const d: any = document;
        if (d.exitFullscreen) {
          d.exitFullscreen();
        } else if (d.webkitExitFullscreen) {
          d.webkitExitFullscreen();
        } else if (d.mozCancelFullScreen) {
          d.mozCancelFullScreen();
        } else if (d.msExitFullscreen) {
          d.msExitFullscreen();
        }
      } else {
        // player.enterFullscreen()
        var el = <any> player.getFigure().parentElement;
        if (el.requestFullscreen) {
          el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
          el.webkitRequestFullscreen();
        } else if (el.mozRequestFullScreen) {
          el.mozRequestFullScreen();
        } else if (el.msRequestFullscreen) {
          el.msRequestFullscreen();
        }
      }
    });

    // Startup init
    fullscreenStateHandler();
  }
}
