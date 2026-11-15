# Prompt 2: For Google AI Studio (Build App from Stitch Export)

After exporting your design/code from Stitch (HTML/CSS or React/Tailwind) and attaching or pasting it into **Google AI Studio**, copy and paste the prompt below to turn it into a fully functional music player:

---

I am providing the exported UI design for **"VibeFlow"**, a Spotify-inspired web music player. Transform this static design into a **fully functional, interactive React web application** (using Tailwind CSS and `lucide-react` icons).

**Core Functional Requirements to Implement:**

1. **Real Working Audio Engine:**
   * Implement an HTML5 `<audio>` player managed via React state/context so music actually plays when clicked.
   * Populate the app with a rich mock database of at least **4 distinct playlists** (e.g., *Midnight Lo-Fi*, *Cyberpunk Synthwave*, *Acoustic Chill*, *Deep Focus*) and **12+ playable tracks** using reliable, publicly accessible royalty-free MP3 URLs (such as SoundHelix sample MP3s) and high-resolution Unsplash cover images.

2. **Interactive Playback Controls:**
   * Clicking any playlist card's play button or any track row immediately loads and plays that track.
   * Wire up the bottom player bar: Play/Pause toggle, Next Track, Previous Track, Shuffle mode, Repeat mode (Off / Repeat All / Repeat One), interactive progress bar seeking (click and drag), real-time elapsed/total time formatting (`MM:SS`), and a working Volume slider + Mute toggle.
   * Show an animated green equalizer icon next to the currently active track in tracklists.

3. **Multi-View Navigation & Playlist Management:**
   * Make the Left Sidebar navigation functional: switch seamlessly between **Home View**, **Search View** (with real-time filtering by song title, artist, or genre cards), and **Playlist Detail View** (showing the full tracklist table when any playlist is clicked).
   * Allow users to **Like/Unlike** songs (updating a dedicated "Liked Songs" playlist automatically) and **Create New Playlists** using the `+` button in the sidebar.

4. **Dynamic UI Polish:**
   * Update the Right "Now Playing" panel and the ambient top gradient dynamically whenever the active track changes.
   * Add `Spacebar` shortcut for Play/Pause (preventing trigger when typing in the search input) and persist Liked Songs and volume settings in `localStorage`.

**Code Delivery:**
Preserve the exact visual aesthetic, spacing, colors, and layout from my attached Stitch design while ensuring clean, modular, bug-free React code with smooth transitions and responsive behavior.