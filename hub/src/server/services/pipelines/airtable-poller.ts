import {
  getSongsWithoutYouTube,
  pollForBrandVideoTriggers,
  isConfigured,
} from '@/server/services/integrations/airtable-client';
import {
  AirtableSongRecord,
  AirtableBrandVideoRecord,
} from '@/lib/types';

export class AirtablePoller {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private polling: boolean = false;
  private onSongTriggered: ((songs: AirtableSongRecord[]) => void) | null =
    null;
  private onBrandVideoTriggered:
    | ((videos: AirtableBrandVideoRecord[]) => void)
    | null = null;

  /**
   * Register a callback that fires when new song triggers are found.
   */
  onSongs(callback: (songs: AirtableSongRecord[]) => void): void {
    this.onSongTriggered = callback;
  }

  /**
   * Register a callback that fires when new brand video triggers are found.
   */
  onBrandVideos(
    callback: (videos: AirtableBrandVideoRecord[]) => void
  ): void {
    this.onBrandVideoTriggered = callback;
  }

  /**
   * Poll Airtable once for new triggers in both the songs and brand videos tables.
   * Returns any records that have a status indicating they are ready to process.
   */
  async pollOnce(): Promise<{
    songs: AirtableSongRecord[];
    brandVideos: AirtableBrandVideoRecord[];
  }> {
    if (!isConfigured()) {
      console.warn(
        '[AirtablePoller] Airtable is not configured. Skipping poll.'
      );
      return { songs: [], brandVideos: [] };
    }

    try {
      // Songs: find records without a YouTube URL (ready for processing)
      // Brand Videos: still uses Status-based polling
      const [songs, brandVideos] = await Promise.all([
        getSongsWithoutYouTube(),
        pollForBrandVideoTriggers(),
      ]);

      if (songs.length > 0) {
        console.log(
          `[AirtablePoller] Found ${songs.length} song(s) ready for processing`
        );
      }

      if (brandVideos.length > 0) {
        console.log(
          `[AirtablePoller] Found ${brandVideos.length} brand video(s) ready for processing`
        );
      }

      return { songs, brandVideos };
    } catch (error) {
      console.error('[AirtablePoller] Error during poll:', error);
      return { songs: [], brandVideos: [] };
    }
  }

  /**
   * Start polling Airtable at a regular interval.
   * When new triggers are found, the registered callbacks are invoked.
   * @param intervalMinutes How often to poll, in minutes (default: 5)
   */
  startPolling(intervalMinutes: number = 5): void {
    if (this.polling) {
      console.warn('[AirtablePoller] Already polling. Stop first before restarting.');
      return;
    }

    if (!isConfigured()) {
      console.warn(
        '[AirtablePoller] Airtable is not configured. Cannot start polling.'
      );
      return;
    }

    const intervalMs = intervalMinutes * 60 * 1000;
    this.polling = true;

    console.log(
      `[AirtablePoller] Starting polling every ${intervalMinutes} minute(s)`
    );

    // Run an initial poll immediately
    this.executePoll();

    // Then set up recurring interval
    this.intervalId = setInterval(() => {
      this.executePoll();
    }, intervalMs);
  }

  /**
   * Stop the polling interval.
   */
  stopPolling(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.polling = false;
    console.log('[AirtablePoller] Polling stopped');
  }

  /**
   * Returns whether the poller is currently active.
   */
  isPolling(): boolean {
    return this.polling;
  }

  /**
   * Internal method to execute a single poll cycle and dispatch results to callbacks.
   */
  private async executePoll(): Promise<void> {
    try {
      const { songs, brandVideos } = await this.pollOnce();

      if (songs.length > 0 && this.onSongTriggered) {
        this.onSongTriggered(songs);
      }

      if (brandVideos.length > 0 && this.onBrandVideoTriggered) {
        this.onBrandVideoTriggered(brandVideos);
      }
    } catch (error) {
      console.error('[AirtablePoller] Error in poll cycle:', error);
    }
  }
}

// Singleton instance for use across the application
let pollerInstance: AirtablePoller | null = null;

export function getAirtablePoller(): AirtablePoller {
  if (!pollerInstance) {
    pollerInstance = new AirtablePoller();
  }
  return pollerInstance;
}
