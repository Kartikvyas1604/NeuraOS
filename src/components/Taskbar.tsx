
import { useState } from 'react';
import { AppWindow } from './Desktop';  
import { useAuth } from '@/hooks/useAuth';
import { Brain, Code, FileText, Folder, Calendar, Settings, Terminal, Monitor, LogOut, User } from 'lucide-react';

interface TaskbarProps {
  windows: AppWindow[];
  onWindowClick: (windowId: string) => void;
  onAppOpen: (appType: string, title: string) => void;
}

export const Taskbar = ({ windows, onWindowClick, onAppOpen }: TaskbarProps) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  const getAppIcon = (component: string) => {
    const icons: Record<string, React.ComponentType> = {
      FileManager: Folder,
      NotesApp: FileText,
      CodeEditor: Code,
      AIAssistant: Brain,
      Calendar: Calendar,
      Terminal: Terminal,
      Settings: Settings,
      Browser: Monitor,
    };
    return icons[component] || FileText;
  };

  const quickLaunchApps = [
    { component: 'FileManager', title: 'File Manager', icon: Folder },
    { component: 'CodeEditor', title: 'Code Editor', icon: Code },
    { component: 'AIAssistant', title: 'AI Assistant', icon: Brain },
    { component: 'Terminal', title: 'Terminal', icon: Terminal },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-4 mb-4">
        <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/20 p-3">
          <div className="flex items-center justify-between">
            {/* NeuraOS Logo */}
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-xl">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <span className="text-white font-semibold text-sm">NeuraOS</span>
            </div>

            {/* Quick Launch */}
            <div className="flex items-center space-x-2">
              {quickLaunchApps.map((app) => {
                const Icon = app.icon;
                const isOpen = windows.some(w => w.component === app.component);
                return (
                  <button
                    key={app.component}
                    onClick={() => onAppOpen(app.component, app.title)}
                    className={`p-2 rounded-lg transition-all ${
                      isOpen 
                        ? 'bg-blue-500/30 border border-blue-400/50' 
                        : 'bg-white/10 hover:bg-white/20 border border-transparent'
                    }`}
                    title={app.title}
                  >
                    <Icon className="h-4 w-4 text-white" />
                  </button>
                );
              })}
            </div>

            {/* Open Windows */}
            <div className="flex items-center space-x-2">
              {windows.filter(w => !w.isMinimized).map((window) => {
                const Icon = getAppIcon(window.component);
                return (
                  <button
                    key={window.id}
                    onClick={() => onWindowClick(window.id)}
                    className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-all border border-white/20"
                    title={window.title}
                  >
                    <Icon className="h-4 w-4 text-white" />
                    <span className="text-white text-sm max-w-20 truncate">
                      {window.title}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all border border-white/20"
              >
                <User className="h-4 w-4 text-white" />
              </button>

              {showUserMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/80 backdrop-blur-xl rounded-lg border border-white/20 p-2 min-w-40">
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-white hover:bg-white/10 rounded-lg transition-all"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
