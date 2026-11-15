import { useState } from 'react';
import { ListMusic, Menu, Search } from 'lucide-react';
import { CreatePlaylistModal } from './components/CreatePlaylistModal';
import { HomeView } from './components/HomeView';
import { NowPlayingPanel } from './components/NowPlayingPanel';
import { PlayerBar } from './components/PlayerBar';
import { PlaylistView } from './components/PlaylistView';
import { SearchView } from './components/SearchView';
import { Sidebar } from './components/Sidebar';
import { PlayerProvider, usePlayer } from './context/PlayerContext';

function VibeFlowShell() {
  const {
    activeView,
    setActiveView,
    currentTrack,
    isNowPlayingOpen,
    setIsNowPlayingOpen,
  } = usePlayer();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="h-dvh w-screen flex flex-col bg-[#09090B] text-[#E5E1E4] overflow-hidden">
      {/* Main 3-Pane Workspace */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Center Main Viewport with Dynamic Ambient Gradient */}
        <main className="relative flex-1 min-w-0 h-full overflow-y-auto bg-[#131315]">
          {/* Ambient Top Bloom driven by active track accent color */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-72 transition-all duration-700"
            style={{
              background: `radial-gradient(ellipse 80% 70% at 25% 0%, ${currentTrack.accentColor}26 0%, rgba(99, 102, 241, 0.12) 45%, rgba(19, 19, 21, 0) 100%)`,
            }}
          />

          {/* Compact Top Utility Header */}
          <header className="sticky top-0 z-20 flex items-center justify-between gap-4 px-5 md:px-8 py-3.5 bg-[#131315]/75 backdrop-blur-md border-b border-white/[0.04]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
                className="lg:hidden p-2 rounded-lg text-[#E5E1E4] hover:bg-white/10 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1 bg-[#201F22]/80 p-1 rounded-lg border border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setActiveView({ type: 'home' })}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    activeView.type === 'home'
                      ? 'bg-[#353437] text-white'
                      : 'text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  Home
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView({ type: 'search' })}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    activeView.type === 'search'
                      ? 'bg-[#353437] text-white'
                      : 'text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsNowPlayingOpen((prev) => !prev)}
              aria-label="Toggle Now Playing panel"
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                isNowPlayingOpen
                  ? 'bg-[#1ED760]/15 border-[#1ED760]/40 text-[#1ED760]'
                  : 'bg-[#201F22] border-white/[0.08] text-[#E5E1E4] hover:bg-[#2A2A2C]'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span>Now Playing</span>
            </button>
          </header>

          {/* Active Route Content */}
          <div className="relative z-10">
            {activeView.type === 'home' && <HomeView />}
            {activeView.type === 'search' && (
              <SearchView initialGenre={activeView.genre} />
            )}
            {activeView.type === 'playlist' && (
              <PlaylistView playlistId={activeView.playlistId} />
            )}
          </div>
        </main>

        <NowPlayingPanel />
      </div>

      {/* Persistent Bottom Audio Controls */}
      <PlayerBar />

      {/* Playlist Creation Modal */}
      <CreatePlaylistModal />
    </div>
  );
}

export default function App() {
  return (
    <PlayerProvider>
      <VibeFlowShell />
    </PlayerProvider>
  );
}
