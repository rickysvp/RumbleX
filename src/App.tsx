import { useState, useEffect } from 'react';
import { LeftSidebar } from './components/sidebar/LeftSidebar';
import { RoundStage } from './components/arena/RoundStage';
import { MixedFeed } from './components/feed/MixedFeed';
import { IntelTower } from './components/intel/IntelTower';
import { useGameTimer } from './hooks/useGameTimer';
import { useSimulation } from './hooks/useSimulation';
import { useGameStore } from './store/gameStore';
// Layout Components
import { MobileNavBar, TabId } from './components/layout/MobileNavBar';
import { HamburgerMenu } from './components/layout/HamburgerMenu';
import { TopBar } from './components/layout/TopBar';

// Pages
import { 
  ArenaPage, 
  RankPage, 
  StatsPage, 
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
  const players = useGameStore(state => state.players);

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
            <div className="shrink-0 h-[360px]">
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
            <div className="shrink-0 h-[360px]">
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
          <div className="flex flex-col h-full w-full overflow-hidden bg-[#0D0D0D]">
            {/* Arena Stage - Fixed Height */}
            <div className="shrink-0 h-[320px] sm:h-[380px] w-full overflow-hidden">
              <RoundStage />
            </div>
            
            {/* Divider */}
            <div className="h-px w-full bg-app-border shrink-0" />
            
            {/* Feed - Flexible Height */}
            <div className="flex-1 min-h-0 w-full overflow-hidden">
              <MixedFeed />
            </div>
          </div>
        );
      case 'INTEL': return <IntelTower />;
      case 'PROFILE': return <LeftSidebar />;
      case 'FEED': return <MixedFeed />;
      default: return (
        <div className="flex flex-col h-full w-full overflow-hidden bg-[#0D0D0D]">
          {/* Arena Stage - Fixed Height */}
          <div className="shrink-0 h-[320px] sm:h-[380px] w-full overflow-hidden">
            <RoundStage />
          </div>
          
          {/* Divider */}
          <div className="h-px w-full bg-app-border shrink-0" />
          
          {/* Feed - Flexible Height */}
          <div className="flex-1 min-h-0 w-full overflow-hidden">
            <MixedFeed />
          </div>
        </div>
      );
    }
  };

  return (
    <div className="h-screen w-full bg-app-bg text-app-text font-sans flex flex-col overflow-hidden selection:bg-app-accent selection:text-black">
      
      {/* TopBar - All Views */}
      <TopBar onMenuOpen={() => setIsMenuOpen(true)} showMenu={viewMode !== 'desktop'} />

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
            <div className="flex-1 flex flex-col overflow-hidden relative h-full min-w-0">
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

      {/* Mobile Nav Bar */}
      {viewMode === 'mobile' && (
        <MobileNavBar activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      {/* Overlay Components */}
      <HamburgerMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          setIsMenuOpen(false);
        }}
      />

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
