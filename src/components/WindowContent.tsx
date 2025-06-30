
import { AppWindow } from './Desktop';
import { FileManager } from './apps/FileManager';
import { NotesApp } from './apps/NotesApp';
import { CodeEditor } from './apps/CodeEditor';
import { AIAssistant } from './apps/AIAssistant';
import { Calendar } from './apps/Calendar';
import { Terminal } from './apps/Terminal';
import { Settings } from './apps/Settings';
import { Browser } from './apps/Browser';

interface WindowContentProps {
  window: AppWindow;
}

export const WindowContent = ({ window }: WindowContentProps) => {
  const getContent = () => {
    switch (window.component) {
      case 'FileManager':
        return <FileManager />;
      case 'NotesApp':
        return <NotesApp />;
      case 'CodeEditor':
        return <CodeEditor />;
      case 'AIAssistant':
        return <AIAssistant />;
      case 'Calendar':
        return <Calendar />;
      case 'Terminal':
        return <Terminal />;
      case 'Settings':
        return <Settings />;
      case 'Browser':
        return <Browser />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-white">
            <p>App not found: {window.component}</p>
          </div>
        );
    }
  };

  return (
    <div className="h-full bg-slate-900/80 backdrop-blur-sm">
      {getContent()}
    </div>
  );
};
