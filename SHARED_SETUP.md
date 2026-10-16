# Shared saving setup

The site can run offline with device-only saving. To share edits between visitors:

1. Sign in at [Supabase](https://supabase.com/dashboard) and create a project.
2. Open the project's SQL Editor and run [supabase_setup.sql](supabase_setup.sql).
3. Open the project's **Connect** dialog and copy its Project URL and **publishable** key. Send those two values to Codex to connect the existing `index.html`. Never send or place a secret/service-role key in the page.
4. After the connected page is published, open it in the browser with the setup you want everyone to see. If it offers **Use shared** or **Publish mine**, make a JSON backup first, then choose **Publish mine** to make that browser's saved game setup the shared one.

The public site reads the shared setup when opened and saves edits to one shared row. Anyone who can open the page can change it. If a simultaneous edit or connection failure occurs, the page keeps a device copy and shows a sync choice rather than silently discarding changes.
