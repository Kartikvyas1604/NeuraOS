
import { useState, useEffect } from 'react';  
import { Taskbar } from './Taskbar';
import { WindowManager } from './WindowManager';
import { DesktopIcon } from './DesktopIcon';
import { WalletConnection } from './WalletConnection';
import { useWallet } from '@/hooks/useWallet';
import { User } from '@supabase/supabase-js';
import { FileText, Code, Brain, Calendar, Settings, Terminal, Folder, Monitor } from 'lucide-react';

interface DesktopProps {
  user: User;
}

export interface AppWindow {
  id: string;
  title: string;
  component: string;
  isMinimized: boolean;
  isMaximized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
}

export const Desktop = ({ user }: DesktopProps) => {
  const [windows, setWindows] = useState<AppWindow[]>([]);
  const [nextZIndex, setNextZIndex] = useState(1000);
  const [showWalletConnection, setShowWalletConnection] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { walletAddress, isConnected } = useWallet();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const openApp = (appType: string, title: string) => {
    const existingWindow = windows.find(w => w.component === appType);
    if (existingWindow) {
      focusWindow(existingWindow.id);
      return;
    }

    const newWindow: AppWindow = {
      id: Date.now().toString(),
      title,
      component: appType,
      isMinimized: false,
      isMaximized: false,
      position: { 
        x: 100 + (windows.length * 30), 
        y: 100 + (windows.length * 30) 
      },
      size: { width: 800, height: 600 },
      zIndex: nextZIndex,
    };

    setWindows([...windows, newWindow]);
    setNextZIndex(nextZIndex + 1);
  };

  const closeWindow = (windowId: string) => {
    setWindows(windows.filter(w => w.id !== windowId));
  };

  const minimizeWindow = (windowId: string) => {
    setWindows(windows.map(w => 
      w.id === windowId ? { ...w, isMinimized: true } : w
    ));
  };

  const maximizeWindow = (windowId: string) => {
    setWindows(windows.map(w => 
      w.id === windowId ? { 
        ...w, 
        isMaximized: !w.isMaximized,
        isMinimized: false
      } : w
    ));
  };

  const focusWindow = (windowId: string) => {
    setWindows(windows.map(w => 
      w.id === windowId 
        ? { ...w, zIndex: nextZIndex, isMinimized: false }
        : w
    ));
    setNextZIndex(nextZIndex + 1);
  };

  const updateWindowPosition = (windowId: string, position: { x: number; y: number }) => {
    setWindows(windows.map(w => 
      w.id === windowId ? { ...w, position } : w
    ));
  };

  const updateWindowSize = (windowId: string, size: { width: number; height: number }) => {
    setWindows(windows.map(w => 
      w.id === windowId ? { ...w, size } : w
    ));
  };

  const desktopApps = [
    { id: 'file-manager', title: 'File Manager', icon: Folder, component: 'FileManager' },
    { id: 'notes', title: 'Notes', icon: FileText, component: 'NotesApp' },
    { id: 'code-editor', title: 'Code Editor', icon: Code, component: 'CodeEditor' },
    { id: 'ai-assistant', title: 'AI Assistant', icon: Brain, component: 'AIAssistant' },
    { id: 'calendar', title: 'Calendar', icon: Calendar, component: 'Calendar' },
    { id: 'terminal', title: 'Terminal', icon: Terminal, component: 'Terminal' },
    { id: 'settings', title: 'Settings', icon: Settings, component: 'Settings' },
    { id: 'browser', title: 'Browser', icon: Monitor, component: 'Browser' },
  ];

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden relative">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 animate-pulse"></div>
        </div>
      </div>

      {/* Desktop Icons */}
      <div className="absolute top-8 left-8 grid grid-cols-2 gap-6 z-10">
        {desktopApps.map((app, index) => (
          <DesktopIcon
            key={app.id}
            icon={app.icon}
            title={app.title}
            onClick={() => openApp(app.component, app.title)}
            delay={index * 100}
          />
        ))}
      </div>

      {/* System Info */}
      <div className="absolute top-8 right-8 z-10">
        <div className="bg-black/20 backdrop-blur-md rounded-lg p-4 border border-white/10">
          <div className="text-white text-sm font-medium mb-1">Welcome, {user.email}</div>
          <div className="text-slate-300 text-xs mb-2">
            {currentTime.toLocaleString()}
          </div>
          {isConnected && (
            <div className="text-green-400 text-xs mb-2">
              Wallet: {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
            </div>
          )}
          <button
            onClick={() => setShowWalletConnection(true)}
            className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full hover:from-blue-600 hover:to-purple-600 transition-all"
          >
            {isConnected ? 'Switch Wallet' : 'Connect Wallet'}
          </button>
        </div>
      </div>

      {/* Window Manager */}
      <WindowManager
        windows={windows}
        onClose={closeWindow}
        onMinimize={minimizeWindow}
        onMaximize={maximizeWindow}
        onFocus={focusWindow}
        onUpdatePosition={updateWindowPosition}
        onUpdateSize={updateWindowSize}
      />

      {/* Taskbar */}
      <Taskbar
        windows={windows}
        onWindowClick={focusWindow}
        onAppOpen={openApp}
      />

      {/* Wallet Connection Modal */}
      {showWalletConnection && (
        <WalletConnection onClose={() => setShowWalletConnection(false)} />
      )}
    </div>
  );
};
