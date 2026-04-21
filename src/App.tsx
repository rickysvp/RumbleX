import { useRef, useState, useEffect } from 'react';
import { LeftSidebar } from './components/sidebar/LeftSidebar';
import { RoundStage } from './components/arena/RoundStage';
import { MixedFeed } from './components/feed/MixedFeed';
import { IntelTower } from './components/intel/IntelTower';
import { useGameTimer } from './hooks/useGameTimer';
import { useSimulation } from './hooks/useSimulation';
import { useGameStore } from './store/gameStore';
import { useWalletStore } from './store/walletStore';
import { Menu, X } from 'lucide-react';

// Layout Components
import { MobileNavBar, TabId } from './components/layout/MobileNavBar';
import { HamburgerMenu } from './components/layout/HamburgerMenu';

// Pages
import { 
  ArenaPage, 
  RankPage, 
  StatsPage, 
  RulesPage, 
  HistoryPage, 
  GuidePage, 
  SettingsPage, 
  SupportPage 
} from './pages';

// Dev tools
import { DebugPanel } from './components/dev/DebugPanel';
import { DevBadge } from './components/dev/DevBadge';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('ARENA');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [currentView, setCurrentView] = useState('arena');
  
  // Initialize Heartbeat
  useGameTimer();
  useSimulation();

  // Selectors
  const phase = useGameStore(state => state.phase);
  const players = useGameStore(state => state.players);
  const roundNumber = useGameStore(state => state.roundNumber);
  const { address } = useWalletStore();
  
  const aliveCount = (players || []).filter(p => p.status === 'alive').length;
  const totalInPlay = (players || []).reduce((acc, p) => acc + p.mon, 0);

  // Responsive Detection
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setViewMode('mobile');
      else if (window.innerWidth < 1280) setViewMode('tablet');
      else setViewMode('desktop');
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Render current page based on view
  const renderMainContent = () => {
    switch (currentView) {
      case 'arena':
        return viewMode === 'mobile' ? (
          <div className="flex-1 flex flex-col overflow-hidden relative h-full min-w-0 pb-[64px]">
            <ArenaPage />
          </div>
        ) : viewMode === 'tablet' ? (
          <>
            <RoundStage />
            <div className="h-px w-full bg-app-border shrink-0" />
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
               <MixedFeed />
            </div>
          </>
        ) : (
          <>
            <div className="shrink-0 h-[420px]">
              <RoundStage />
            </div>
            <div className="h-px w-full bg-app-border shrink-0" />
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
               <MixedFeed />
            </div>
          </>
        );
      case 'rank':
        return <RankPage />;
      case 'stats':
        return <StatsPage />;
      case 'rules':
        return <RulesPage />;
      case 'history':
        return <HistoryPage />;
      case 'guide':
        return <GuidePage />;
      case 'settings':
        return <SettingsPage />;
      case 'support':
        return <SupportPage />;
      default:
        return viewMode === 'mobile' ? (
          <div className="flex-1 flex flex-col overflow-hidden relative h-full min-w-0 pb-[64px]">
            <ArenaPage />
          </div>
        ) : (
          <>
            <div className="shrink-0 h-[420px]">
              <RoundStage />
            </div>
            <div className="h-px w-full bg-app-border shrink-0" />
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
               <MixedFeed />
            </div>
          </>
        );
    }
  };

  // Mobile Content Switcher
  const renderMobileContent = () => {
    switch (activeTab) {
      case 'ARENA': 
        return (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="shrink-0 h-[40vh] min-h-[280px] max-h-[380px]">
              <RoundStage />
            </div>
            <div className="h-px w-full bg-app-border shrink-0" />
            <div className="flex-1 min-h-0 overflow-hidden">
              <MixedFeed />
            </div>
          </div>
        );
      case 'INTEL': return <IntelTower />;
      case 'PROFILE': return <LeftSidebar />;
      case 'FEED': return <MixedFeed />;
      default: return (
        <div className="flex flex-col h-full overflow-hidden">
          <div className="shrink-0 h-[40vh] min-h-[280px] max-h-[380px]">
            <RoundStage />
          </div>
          <div className="h-px w-full bg-app-border shrink-0" />
          <div className="flex-1 min-h-0 overflow-hidden">
            <MixedFeed />
          </div>
        </div>
      );
    }
  };

  return (
    <div className="h-screen w-full bg-app-bg text-app-text font-sans flex flex-col overflow-hidden selection:bg-app-accent selection:text-black">
      
      {/* Tablet/Mobile Header */}
      {viewMode !== 'desktop' && (
        <header className="h-[50px] sm:h-[60px] border-b border-app-border bg-[#0a0a0a] flex items-center justify-between px-4 sm:px-6 shrink-0 z-50">
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={() => setIsMenuOpen(true)} className="p-2 -ml-2 text-app-muted hover:text-white transition-colors">
              <Menu size={18} className="sm:w-5 sm:h-5" />
            </button>
            <img src="/rumblex.png" alt="RumbleX" className="h-5 sm:h-6 object-contain" />
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
             <div className="font-app-mono text-[9px] sm:text-[11px] text-app-muted truncate max-w-[100px] sm:max-w-none">{address || '0x...'}</div>
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          </div>
        </header>
      )}

      <main className={`flex-grow grid gap-0 overflow-hidden ${
        viewMode === 'desktop' 
          ? 'grid-cols-[260px_1fr_280px]' 
          : viewMode === 'tablet'
            ? 'grid-cols-[1fr_280px]'
            : 'grid-cols-1'
      }`}>
        
        {/* Left Sidebar (Desktop Only) */}
        {viewMode === 'desktop' && (
          <section className="overflow-hidden flex flex-col bg-[#0a0a0a] border-r border-app-border">
            <LeftSidebar onNavigate={setCurrentView} currentView={currentView} />
          </section>
        )}

        {/* Main Center (Dynamic Content) */}
        <section className={`bg-[#0D0D0D] flex flex-col overflow-hidden relative min-w-0 ${viewMode === 'desktop' ? 'border-r border-app-border' : ''}`}>
          {viewMode === 'mobile' ? (
            <div className="flex-1 flex flex-col overflow-hidden relative h-full min-w-0 pb-[64px]">
              {renderMobileContent()}
            </div>
          ) : (
            renderMainContent()
          )}
        </section>

        {/* Intel Tower (Desktop & Tablet Only) */}
        {viewMode !== 'mobile' && (
          <IntelTower />
        )}
      </main>

      {/* Footer (Desktop/Tablet) or Nav (Mobile) */}
      {viewMode === 'mobile' ? (
        <MobileNavBar activeTab={activeTab} onTabChange={setActiveTab} />
      ) : (
        <footer className="h-[40px] sm:h-[48px] bg-app-accent text-app-bg flex items-center px-4 sm:px-8 font-app-bold uppercase text-[10px] sm:text-[12px] justify-between shrink-0 z-10">
          <div className="flex items-center gap-3 sm:gap-6">
             <span>STATUS: {phase.replace('_', ' ')}</span>
             <span className="opacity-40">|</span>
             <span>ROUND #{roundNumber}</span>
          </div>
          {phase === 'live' && (
            <div className="flex gap-4 sm:gap-8">
              <span>ALIVE: {aliveCount}</span>
              <span>POOL: {totalInPlay.toFixed(1)} MON</span>
            </div>
          )}
        </footer>
      )}

      {/* Overlay Components */}
      <HamburgerMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {/* Development Debug Panel */}
      {process.env.NODE_ENV === 'development' && (
        <>
          <DebugPanel />
          <DevBadge />
        </>
      )}
    </div>
  );
}
