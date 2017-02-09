import {ClickOverlay} from './clickoverlay';
import {UIInstanceManager} from '../uimanager';

/**
 * A simple click capture overlay for clickThroughUrls of ads.
 */
export class AdClickOverlay extends ClickOverlay {

  configure(player: bitmovin.player.Player, uimanager: UIInstanceManager): void {
    super.configure(player, uimanager);

    let self = this;
    let clickThroughUrl = <string>null;
    let clickThroughEnabled = !player.getConfig().advertising
      || !player.getConfig().advertising.hasOwnProperty('clickThroughEnabled')
      || player.getConfig().advertising.clickThroughEnabled;

    player.addEventHandler(player.EVENT.ON_AD_STARTED, function(event: bitmovin.player.AdStartedEvent) {
      clickThroughUrl = event.clickThroughUrl;

      if (clickThroughEnabled) {
        self.setUrl(clickThroughUrl);
      } else {
        // If click-through is disabled, we set the url to null to avoid it open
        self.setUrl(null);
      }
    });

    // Clear click-through URL when ad has finished
    let adFinishedHandler = function() {
      self.setUrl(null);
    };
    player.addEventHandler(player.EVENT.ON_AD_FINISHED, adFinishedHandler);
    player.addEventHandler(player.EVENT.ON_AD_SKIPPED, adFinishedHandler);

    self.onClick.subscribe(function() {
      // Pause the ad when overlay is clicked
      player.pause('ui-content-click');

      // Notify the player of the clicked ad
      player.fireEvent(player.EVENT.ON_AD_CLICKED, {
        clickThroughUrl: clickThroughUrl
      });
    });
  }
}