# Shared saving

The site is connected to the Griffons Supabase project. Its shared-state table was confirmed available on October 16, 2026. The project URL and publishable key are in `index.html`; never put a secret or service-role key in the page.

1. Open the published site first in the browser that already has your preferred game setup. The first visitor initializes the empty shared table from that browser's saved setup.
2. Check that the page says **Saved for everyone** after an edit. If it offers **Use shared** or **Publish mine**, export a JSON backup first, then choose **Publish mine** to share this browser's setup.
3. Open the site in another browser or device. Already-open pages check for updates every five seconds and refresh when brought back into focus.

Anyone with the link can edit. Each edit saves locally immediately and then syncs to the shared table. If a connection fails or two visitors edit at once, the page keeps a device copy and offers a sync choice instead of silently discarding changes. Opening the HTML file offline still works with device-only saving until it reconnects.

The table definition and access policies are in [supabase_setup.sql](supabase_setup.sql) if the project ever needs to be recreated.
