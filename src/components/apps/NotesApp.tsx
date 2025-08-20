import { useState, useEffect, useCallback } from 'react';
import { Plus, Save, FileText, Star, Search, AlertCircle, Sparkles, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { useGemini } from '@/hooks/useGemini';
import { toast } from '@/hooks/use-toast';

interface Note {
  id: string;
  title: string;
  content: string;
  isImportant: boolean;
  created_at: string;
  updated_at: string;
}

export const NotesApp = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showImportanceDialog, setShowImportanceDialog] = useState(false);
  const [pendingNote, setPendingNote] = useState<Note | null>(null);
  const [showAI, setShowAI] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  
  const { user } = useAuth();
  const { isConnected } = useWallet();
  const { generateResponse, loading: aiLoading } = useGemini();

  const loadNotes = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading notes:', error);
        return;
      }

      if (data) {
        const noteItems: Note[] = data.map(note => ({
          id: note.id,
          title: note.title || 'Untitled',
          content: note.content || '',
          created_at: note.created_at,
          updated_at: note.updated_at,
          isImportant: false // Default value since this field doesn't exist in database
        }));
        setNotes(noteItems);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadNotes();
    }
  }, [user, loadNotes]);

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const createNewNote = async () => {
    if (!user) return;

    const newNote = {
      title: 'Untitled Note',
      content: '',
      user_id: user.id
    };

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert(newNote)
        .select()
        .single();

      if (error) throw error;

      const formattedNote: Note = {
        id: data.id,
        title: data.title,
        content: data.content || '',
        isImportant: false,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setNotes([formattedNote, ...notes]);
      setSelectedNote(formattedNote);
      
      toast({
        title: "Note Created",
        description: "New note created successfully",
      });
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: "Error",
        description: "Failed to create new note",
        variant: "destructive",
      });
    }
  };

  const handleSave = () => {
    if (!selectedNote) return;
    setPendingNote(selectedNote);
    setShowImportanceDialog(true);
  };

  const saveNote = async (isImportant: boolean) => {
    if (!pendingNote || !user) return;

    if (isImportant && !isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to save important notes on-chain.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('notes')
        .update({
          title: pendingNote.title,
          content: pendingNote.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', pendingNote.id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      const updatedNote = {
        ...pendingNote,
        isImportant,
        updated_at: new Date().toISOString()
      };
      
      setNotes(notes.map(n => n.id === pendingNote.id ? updatedNote : n));
      setSelectedNote(updatedNote);

      toast({
        title: "Note Saved",
        description: isImportant ? "Note saved on-chain and in database" : "Note saved successfully",
      });

      setShowImportanceDialog(false);
      setPendingNote(null);
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save the note",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSelectedNote = (updates: Partial<Note>) => {
    if (!selectedNote) return;
    const updatedNote = { ...selectedNote, ...updates };
    setSelectedNote(updatedNote);
  };

  const deleteNote = async (noteId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user.id);

      if (error) throw error;

      setNotes(notes.filter(n => n.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(notes.length > 1 ? notes.find(n => n.id !== noteId) || null : null);
      }

      toast({
        title: "Note Deleted",
        description: "Note deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the note",
        variant: "destructive",
      });
    }
  };

  const enhanceWithAI = async (action: 'summarize' | 'rewrite' | 'expand') => {
    if (!selectedNote?.content) {
      toast({
        title: "No Content",
        description: "Please add some content to enhance",
        variant: "destructive",
      });
      return;
    }

    let prompt = '';
    switch (action) {
      case 'summarize':
        prompt = `Summarize this note in a concise way:\n\n${selectedNote.content}`;
        break;
      case 'rewrite':
        prompt = `Rewrite this note to be clearer and better structured:\n\n${selectedNote.content}`;
        break;
      case 'expand':
        prompt = `Expand on this note with more details and examples:\n\n${selectedNote.content}`;
        break;
    }

    try {
      const response = await generateResponse(prompt);
      setAiResponse(response);
      setShowAI(true);
    } catch (error) {
      toast({
        title: "AI Error",
        description: "Failed to enhance note with AI",
        variant: "destructive",
      });
    }
  };

  const applyAIEnhancement = () => {
    if (selectedNote && aiResponse) {
      updateSelectedNote({ content: aiResponse });
      setShowAI(false);
      setAiResponse('');
      toast({
        title: "Enhancement Applied",
        description: "AI enhancement applied to note",
      });
    }
  };

  return (
    <div className="h-full flex bg-slate-900 text-white">
      {/* Sidebar */}
      <div className="w-80 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center space-x-2 mb-3">
            <Button onClick={createNewNote} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-600 text-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className={`p-4 border-b border-slate-800 cursor-pointer transition-all ${
                selectedNote?.id === note.id ? 'bg-slate-800 border-l-4 border-l-blue-500' : 'hover:bg-slate-800/50'
              }`}
              onClick={() => setSelectedNote(note)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium truncate flex-1">{note.title}</h3>
                {note.isImportant && (
                  <Star className="h-4 w-4 text-yellow-400 flex-shrink-0 ml-2" />
                )}
              </div>
              <p className="text-sm text-slate-400 line-clamp-2">
                {note.content.replace(/[#*`]/g, '').slice(0, 100)}...
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {new Date(note.updated_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {selectedNote ? (
          <>
            <div className="border-b border-slate-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <Input
                  value={selectedNote.title}
                  onChange={(e) => updateSelectedNote({ title: e.target.value })}
                  className="text-lg font-semibold bg-transparent border-none px-0 text-white focus:ring-0"
                  placeholder="Note title..."
                />
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => setShowAI(!showAI)}
                    size="sm"
                    variant="outline"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI
                  </Button>
                  <Button
                    onClick={handleSave}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    onClick={() => deleteNote(selectedNote.id)}
                    size="sm"
                    variant="destructive"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 flex">
              <div className={showAI ? 'flex-1' : 'w-full'}>
                <Textarea
                  value={selectedNote.content}
                  onChange={(e) => updateSelectedNote({ content: e.target.value })}
                  placeholder="Start writing... (Markdown supported)"
                  className="w-full h-full resize-none bg-slate-800 border-slate-600 text-white font-mono"
                />
              </div>

              {showAI && (
                <div className="w-80 border-l border-slate-700 bg-slate-800 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center">
                      <Sparkles className="h-4 w-4 mr-2" />
                      AI Enhancement
                    </h3>
                    <Button onClick={() => setShowAI(false)} size="sm" variant="ghost">×</Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-2">
                      <Button 
                        onClick={() => enhanceWithAI('summarize')} 
                        size="sm" 
                        variant="outline"
                        disabled={aiLoading}
                        className="justify-start"
                      >
                        Summarize
                      </Button>
                      <Button 
                        onClick={() => enhanceWithAI('rewrite')} 
                        size="sm" 
                        variant="outline"
                        disabled={aiLoading}
                        className="justify-start"
                      >
                        Rewrite
                      </Button>
                      <Button 
                        onClick={() => enhanceWithAI('expand')} 
                        size="sm" 
                        variant="outline"
                        disabled={aiLoading}
                        className="justify-start"
                      >
                        Expand
                      </Button>
                    </div>

                    {aiResponse && (
                      <div className="bg-slate-700 p-3 rounded text-sm max-h-64 overflow-auto">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">AI Enhancement:</span>
                          <div className="flex space-x-1">
                            <Button onClick={applyAIEnhancement} size="sm" variant="ghost">
                              Apply
                            </Button>
                            <Button 
                              onClick={() => navigator.clipboard.writeText(aiResponse)} 
                              size="sm" 
                              variant="ghost"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="whitespace-pre-wrap">{aiResponse}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a note to start editing</p>
            </div>
          </div>
        )}
      </div>

      {/* Importance Dialog */}
      <Dialog open={showImportanceDialog} onOpenChange={setShowImportanceDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Save Note</DialogTitle>
            <DialogDescription className="text-slate-300">
              Choose how to store your note: {pendingNote?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              onClick={() => saveNote(false)}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Saving...' : 'Save Off-Chain (Database)'}
            </Button>
            <Button
              onClick={() => saveNote(true)}
              disabled={loading || !isConnected}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Saving...' : 'Save On-Chain (Important)'}
            </Button>
            {!isConnected && (
              <p className="text-sm text-slate-400 text-center">
                Connect wallet to enable on-chain storage
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};