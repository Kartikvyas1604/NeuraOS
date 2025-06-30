import { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Lightbulb } from 'lucide-react';
import { useGemini } from '@/hooks/useGemini';

interface TerminalLine {
  id: string;
  type: 'command' | 'output' | 'suggestion' | 'ai';
  content: string;
  timestamp: Date;
}

export const Terminal = () => {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: '1',
      type: 'output',
      content: 'Welcome to NeuraOS Terminal v1.0',
      timestamp: new Date(),
    },
    {
      id: '2',
      type: 'output',
      content: 'Type "help" for available commands or "/ask <question>" for AI assistance.',
      timestamp: new Date(),
    },
  ]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { generateResponse, loading: aiLoading } = useGemini();

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  const executeCommand = async (command: string) => {
    const cmd = command.trim();
    
    // Add command to history
    setCommandHistory(prev => [...prev, command]);
    
    // Add command line
    const commandLine: TerminalLine = {
      id: Date.now().toString(),
      type: 'command',
      content: `$ ${command}`,
      timestamp: new Date(),
    };

    let output = '';
    let suggestion = '';
    let isAICommand = false;

    // Check for AI command
    if (cmd.startsWith('/ask ')) {
      isAICommand = true;
      const question = cmd.slice(5);
      if (question.trim()) {
        setLines(prev => [...prev, commandLine]);
        
        // Add loading indicator
        const loadingLine: TerminalLine = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: 'AI is thinking...',
          timestamp: new Date(),
        };
        setLines(prev => [...prev, loadingLine]);

        try {
          const aiResponse = await generateResponse(question);
          // Replace loading line with actual response
          setLines(prev => prev.map(line => 
            line.id === loadingLine.id 
              ? { ...line, content: `AI: ${aiResponse}` }
              : line
          ));
        } catch (error) {
          setLines(prev => prev.map(line => 
            line.id === loadingLine.id 
              ? { ...line, content: 'AI: Sorry, I encountered an error. Please try again.' }
              : line
          ));
        }
        
        setCurrentCommand('');
        setHistoryIndex(-1);
        return;
      } else {
        output = 'Usage: /ask <your question>';
      }
    } else {
      // Regular commands
      const lowerCmd = cmd.toLowerCase();
      switch (lowerCmd) {
        case 'help':
          output = `Available commands:
help - Show this help message
clear - Clear terminal
ls - List files
pwd - Show current directory
whoami - Show current user
date - Show current date
echo [text] - Echo text
neuraos - Show NeuraOS info
/ask [question] - Ask AI assistant`;
          break;
        
        case 'clear':
          setLines([]);
          setCurrentCommand('');
          return;
        
        case 'ls':
          output = 'Documents/  Projects/  Downloads/  welcome.txt  notes.md';
          suggestion = 'Try: ls -la for detailed listing';
          break;
        
        case 'pwd':
          output = '/home/neuraos-user';
          break;
        
        case 'whoami':
          output = 'neuraos-user';
          break;
        
        case 'date':
          output = new Date().toString();
          break;
        
        case 'neuraos':
          output = `NeuraOS - Intelligent Web Operating System
Version: 1.0.0
Built with: React, TypeScript, Tailwind CSS, Supabase
Features: AI Assistant, Code Editor, File Manager, and more!
AI: Powered by Gemini AI`;
          break;

        case 'ps':
          output = `PID  COMMAND
1    neuraos-kernel
2    desktop-manager
3    file-manager
4    ai-assistant
5    terminal`;
          break;

        case 'uptime':
          output = `System uptime: ${Math.floor(Math.random() * 24)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
          break;
        
        default:
          if (lowerCmd.startsWith('echo ')) {
            output = command.slice(5);
          } else if (lowerCmd.startsWith('cd ')) {
            output = `Changed directory to: ${command.slice(3)}`;
            suggestion = 'Use "pwd" to see current directory';
          } else if (lowerCmd.startsWith('mkdir ')) {
            output = `Created directory: ${command.slice(6)}`;
          } else if (lowerCmd.startsWith('touch ')) {
            output = `Created file: ${command.slice(6)}`;
          } else {
            output = `Command not found: ${cmd}`;
            suggestion = 'Type "help" for available commands or "/ask <question>" for AI help';
          }
      }
    }

    if (!isAICommand) {
      const outputLine: TerminalLine = {
        id: (Date.now() + 1).toString(),
        type: 'output',
        content: output,
        timestamp: new Date(),
      };

      const newLines = [commandLine, outputLine];

      if (suggestion) {
        const suggestionLine: TerminalLine = {
          id: (Date.now() + 2).toString(),
          type: 'suggestion',
          content: `💡 Suggestion: ${suggestion}`,
          timestamp: new Date(),
        };
        newLines.push(suggestionLine);
      }

      setLines(prev => [...prev, ...newLines]);
    }

    setCurrentCommand('');
    setHistoryIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (currentCommand.trim()) {
        executeCommand(currentCommand);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentCommand('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Simple tab completion for common commands
      const commands = ['help', 'clear', 'ls', 'pwd', 'whoami', 'date', 'neuraos', '/ask '];
      const matches = commands.filter(cmd => cmd.startsWith(currentCommand));
      if (matches.length === 1) {
        setCurrentCommand(matches[0]);
      }
    }
  };

  return (
    <div className="h-full bg-black text-green-400 font-mono flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-3 flex items-center space-x-3">
        <TerminalIcon className="h-5 w-5" />
        <span className="text-white font-semibold">NeuraOS Terminal</span>
        <div className="flex-1" />
        <div className="text-xs text-slate-400">
          Press ↑/↓ for command history | Tab for completion
        </div>
      </div>

      {/* Terminal Content */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-auto p-4 space-y-1"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map((line) => (
          <div
            key={line.id}
            className={`${
              line.type === 'command'
                ? 'text-white font-bold'
                : line.type === 'suggestion'
                ? 'text-yellow-400'
                : line.type === 'ai'
                ? 'text-blue-400'
                : 'text-green-400'
            }`}
          >
            {line.type === 'suggestion' && (
              <Lightbulb className="inline h-4 w-4 mr-2" />
            )}
            <pre className="whitespace-pre-wrap">{line.content}</pre>
          </div>
        ))}

        {/* Current Command Line */}
        <div className="flex items-center space-x-2">
          <span className="text-white font-bold">$</span>
          <input
            ref={inputRef}
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-green-400 font-mono"
            placeholder="Enter command..."
            autoFocus
            disabled={aiLoading}
          />
          {aiLoading && (
            <span className="text-blue-400 text-sm">AI thinking...</span>
          )}
        </div>
      </div>

      {/* Quick Commands */}
      <div className="border-t border-slate-700 p-3">
        <div className="flex flex-wrap gap-2">
          {['help', 'ls', 'clear', 'neuraos', '/ask how to code'].map((cmd) => (
            <button
              key={cmd}
              onClick={() => {
                setCurrentCommand(cmd);
                inputRef.current?.focus();
              }}
              className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-300 transition-colors"
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};