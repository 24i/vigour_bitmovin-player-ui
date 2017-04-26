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

    let fullscreenStateHandler = () => {
      if (player.isFullscreen()) {
        this.on();
      } else {
        this.off();
      }
    };

    player.addEventHandler(player.EVENT.ON_FULLSCREEN_ENTER, fullscreenStateHandler);
    player.addEventHandler(player.EVENT.ON_FULLSCREEN_EXIT, fullscreenStateHandler);

    this.onClick.subscribe(() => {
      if (player.isFullscreen()) {
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
        player.fireEvent(player.EVENT.ON_FULLSCREEN_EXIT, { requested: true })
      } else {
        var el = <any> player.getFigure().parentElement.parentElement;
        if (el.requestFullscreen) {
          el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
          el.webkitRequestFullscreen();
        } else if (el.mozRequestFullScreen) {
          el.mozRequestFullScreen();
        } else if (el.msRequestFullscreen) {
          el.msRequestFullscreen();
        }
        player.fireEvent(player.EVENT.ON_FULLSCREEN_ENTER, { requested: true })
      }
    });

    // Startup init
    fullscreenStateHandler();
  }
}
