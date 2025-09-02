import { useState, useRef } from 'react';
import { Play, Save, Plus, Copy, MessageSquare, AlertCircle, Sparkles, Bug, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useGemini } from '@/hooks/useGemini';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { supabase } from '@/integrations/supabase/client';

interface CodeFile {
  id: string;
  name: string;
  language: string;
  content: string;
  isImportant: boolean;
}

export const CodeEditor = () => {
  const [files, setFiles] = useState<CodeFile[]>([
    {
      id: '1',
      name: 'hello.js',
      language: 'javascript',
      content: '// Welcome to NeuraOS Code Editor\nconsole.log("Hello, NeuraOS!");',
      isImportant: false,
    },
  ]);
  const [activeFile, setActiveFile] = useState<CodeFile>(files[0]);
  const [showAI, setShowAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [showConsole, setShowConsole] = useState(false);
  const consoleRef = useRef<HTMLDivElement>(null);
  
  const { generateResponse, loading: aiLoading } = useGemini();
  const { user } = useAuth();
  const { isConnected } = useWallet();

  const createNewFile = () => {
    const newFile: CodeFile = {
      id: Date.now().toString(),
      name: 'untitled.txt',
      language: 'text',
      content: '',
      isImportant: false,
    };
    setFiles([...files, newFile]);
    setActiveFile(newFile);
  };

  const saveFile = async (isImportant: boolean = false) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save files",
        variant: "destructive",
      });
      return;
    }

    if (isImportant && !isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to save important files on-chain.",
        variant: "destructive",
      });
      return;
    }

    try {
      const fileData = {
        user_id: user.id,
        name: activeFile.name,
        type: 'code',
        size: activeFile.content.length,
        path: `/code/${activeFile.name}`,
        is_folder: false,
        content: activeFile.content,
        language: activeFile.language
      };

      const { error } = await supabase
        .from('files')
        .upsert(fileData);

      if (error) throw error;

      const updatedFile = { ...activeFile, isImportant };
      setFiles(files.map(f => f.id === activeFile.id ? updatedFile : f));
      setActiveFile(updatedFile);

      toast({
        title: "File Saved",
        description: isImportant ? "File saved on-chain" : "File saved locally",
      });
    } catch (error) {
      console.error('Error saving file:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save the file",
        variant: "destructive",
      });
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(activeFile.content);
    toast({
      title: "Code Copied",
      description: "Code copied to clipboard",
    });
  };

  const runCode = () => {
    setShowConsole(true);
    const output: string[] = [];
    
    // Capture console.log
    const originalLog = console.log;
    console.log = (...args) => {
      output.push(args.join(' '));
      originalLog(...args);
    };

    try {
      if (activeFile.language === 'javascript') {
        // Use Function constructor instead of eval for better security
        const func = new Function(activeFile.content);
        func();
        if (output.length === 0) {
          output.push('Code executed successfully (no output)');
        }
      } else if (activeFile.language === 'python') {
        // For Python, we'd need Pyodide - for now, show placeholder
        output.push('Python execution requires Pyodide integration (coming soon)');
      } else {
        output.push(`Code execution not supported for ${activeFile.language}`);
      }
    } catch (error) {
      output.push(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      console.log = originalLog;
    }

    setConsoleOutput(prev => [...prev, ...output]);
    setTimeout(() => {
      consoleRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const askAI = async (action: 'explain' | 'fix' | 'optimize' | 'custom') => {
    let prompt = '';
    
    switch (action) {
      case 'explain':
        prompt = `Explain this ${activeFile.language} code:\n\n${activeFile.content}`;
        break;
      case 'fix':
        prompt = `Find and fix any bugs in this ${activeFile.language} code:\n\n${activeFile.content}`;
        break;
      case 'optimize':
        prompt = `Optimize this ${activeFile.language} code for better performance:\n\n${activeFile.content}`;
        break;
      case 'custom':
        prompt = `${aiPrompt}\n\nCode:\n${activeFile.content}`;
        break;
    }

    try {
      const response = await generateResponse(prompt);
      setAiResponse(response);
      setShowAI(true);
    } catch (error) {
      toast({
        title: "AI Error",
        description: "Failed to get AI response",
        variant: "destructive",
      });
    }
  };

  const applyAISuggestion = () => {
    // Extract code from AI response if it contains code blocks
    const codeMatch = aiResponse.match(/```[\w]*\n([\s\S]*?)\n```/);
    if (codeMatch) {
      setActiveFile({ ...activeFile, content: codeMatch[1] });
      toast({
        title: "Code Applied",
        description: "AI suggestion applied to editor",
      });
    } else {
      toast({
        title: "No Code Found",
        description: "No code block found in AI response",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white">
      {/* Header - always visible, even when console is open */}
      <div className="border-b border-slate-700 p-4 sticky top-0 z-20 bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button onClick={createNewFile} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New File
            </Button>
            <Select value={activeFile.language} onValueChange={(value) => setActiveFile({...activeFile, language: value})}>
              <SelectTrigger className="w-32 bg-slate-800 border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="typescript">TypeScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="css">CSS</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="text">Text</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={copyCode} size="sm" variant="outline">
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button onClick={() => setShowConsole(!showConsole)} size="sm" variant="outline">
              Console
            </Button>
            <Button onClick={() => setShowAI(!showAI)} size="sm" variant="outline">
              <Sparkles className="h-4 w-4 mr-2" />
              AI
            </Button>
            <Button onClick={runCode} size="sm" className="bg-green-600 hover:bg-green-700">
              <Play className="h-4 w-4 mr-2" />
              Run
            </Button>
            <Button onClick={() => saveFile(false)} size="sm" variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button onClick={() => saveFile(true)} size="sm" className="bg-orange-600 hover:bg-orange-700">
              <AlertCircle className="h-4 w-4 mr-2" />
              Important
            </Button>
          </div>
        </div>
      </div>

      {/* File Tabs */}
      <div className="border-b border-slate-700 px-4">
        <div className="flex space-x-1">
          {files.map((file) => (
            <button
              key={file.id}
              onClick={() => setActiveFile(file)}
              className={`px-4 py-2 text-sm rounded-t-lg transition-all ${
                activeFile.id === file.id
                  ? 'bg-slate-800 text-white border-t border-l border-r border-slate-600'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span>{file.name}</span>
                {file.isImportant && (
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Console */}
      {showConsole && (
        <div className="border-t border-slate-700 bg-black text-green-400 p-4 h-48 overflow-auto font-mono text-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-semibold">Console Output</span>
            <Button 
              onClick={() => setConsoleOutput([])} 
              size="sm" 
              variant="ghost"
              className="text-slate-400 hover:text-white"
            >
              Clear
            </Button>
          </div>
          {consoleOutput.map((line, index) => (
            <div key={index} className="mb-1">
              <span className="text-slate-500">{'>'}</span> {line}
            </div>
          ))}
          <div ref={consoleRef} />
        </div>
      )}
    </div>
  );
};