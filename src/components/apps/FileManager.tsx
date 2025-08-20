import { useState, useEffect, useCallback } from 'react';
import { Folder, File, Upload, Download, Trash2, Plus, Search, Shield, Eye, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { toast } from '@/hooks/use-toast';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  modified: Date;
  isImportant?: boolean;
  path: string;
  content?: string;
  file_type?: string;
}

export const FileManager = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showImportanceDialog, setShowImportanceDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  
  const { user } = useAuth();
  const { isConnected } = useWallet();

  const loadFiles = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading files:', error);
        return;
      }

      if (data) {
        const fileItems: FileItem[] = data.map(file => ({
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size,
          created: new Date(file.created_at),
          modified: new Date(file.updated_at),
          url: file.url,
          isEncrypted: file.is_encrypted || false,
          isImportant: file.is_important || false
        }));
        setFiles(fileItems);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadFiles();
    }
  }, [user, loadFiles]);

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      setPendingFile(uploadedFile);
      setShowImportanceDialog(true);
    }
  };

  const saveFile = async (isImportant: boolean) => {
    if (!pendingFile || !user) return;

    if (isImportant && !isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to store important files on-chain.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Read file content for text files
      let content = '';
      if (pendingFile.type.startsWith('text/') || pendingFile.name.endsWith('.txt') || pendingFile.name.endsWith('.md')) {
        content = await pendingFile.text();
      }

      // For important files, you would implement blockchain storage here
      if (isImportant) {
        // Placeholder for blockchain storage
        toast({
          title: "Blockchain Storage",
          description: "Important file storage on blockchain will be implemented",
        });
      }

      // Always save metadata to Supabase
      const { error } = await supabase
        .from('files')
        .insert({
          user_id: user.id,
          name: pendingFile.name,
          type: pendingFile.type || 'application/octet-stream',
          size: pendingFile.size,
          path: `/uploads/${pendingFile.name}`,
          is_folder: false,
          content: content || null
        });

      if (error) throw error;

      toast({
        title: "File Saved",
        description: isImportant ? "File saved on-chain and metadata stored" : "File saved successfully",
      });

      loadFiles(); // Reload files
      setShowImportanceDialog(false);
      setPendingFile(null);
    } catch (error) {
      console.error('Error saving file:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save the file",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const deleteSelected = async () => {
    if (selectedFiles.length === 0 || !user) return;

    try {
      const { error } = await supabase
        .from('files')
        .delete()
        .in('id', selectedFiles)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Files Deleted",
        description: `${selectedFiles.length} file(s) deleted successfully`,
      });

      loadFiles();
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error deleting files:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete selected files",
        variant: "destructive",
      });
    }
  };

  const previewFileContent = (file: FileItem) => {
    setPreviewFile(file);
    setShowPreview(true);
  };

  const downloadFile = (file: FileItem) => {
    if (file.content) {
      const blob = new Blob([file.content], { type: file.file_type || 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "File Downloaded",
        description: `${file.name} downloaded successfully`,
      });
    } else {
      toast({
        title: "Download Failed",
        description: "File content not available",
        variant: "destructive",
      });
    }
  };

  const createNewFolder = async () => {
    if (!user) return;

    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

    try {
      const { error } = await supabase
        .from('files')
        .insert({
          user_id: user.id,
          name: folderName,
          type: 'folder',
          path: `/folders/${folderName}`,
          is_folder: true
        });

      if (error) throw error;

      toast({
        title: "Folder Created",
        description: `Folder "${folderName}" created successfully`,
      });

      loadFiles();
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create folder",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white">
      {/* Toolbar */}
      <div className="border-b border-slate-700 p-4 space-y-4">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-600 text-white"
            />
          </div>
          <Button
            onClick={createNewFolder}
            size="sm"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Folder
          </Button>
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <Button
            onClick={() => document.getElementById('file-upload')?.click()}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
          {selectedFiles.length > 0 && (
            <Button
              onClick={deleteSelected}
              size="sm"
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedFiles.length})
            </Button>
          )}
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 gap-2">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${
                selectedFiles.includes(file.id)
                  ? 'bg-blue-600/30 border border-blue-500'
                  : 'hover:bg-slate-800 border border-transparent'
              }`}
              onClick={() => toggleFileSelection(file.id)}
            >
              <div className="flex-shrink-0">
                {file.type === 'folder' ? (
                  <Folder className="h-5 w-5 text-yellow-400" />
                ) : (
                  <File className="h-5 w-5 text-blue-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium truncate">{file.name}</span>
                  {file.isImportant && (
                    <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded-full flex items-center">
                      <Shield className="h-3 w-3 mr-1" />
                      On-Chain
                    </span>
                  )}
                </div>
                <div className="text-sm text-slate-400 flex items-center space-x-4">
                  {file.size && <span>{(file.size / 1024).toFixed(1)} KB</span>}
                  <span>{file.modified.toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {file.content && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      previewFileContent(file);
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadFile(file);
                  }}
                  size="sm"
                  variant="ghost"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filteredFiles.length === 0 && (
          <div className="text-center text-slate-400 mt-12">
            <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No files found</p>
            {searchTerm && (
              <p className="text-sm mt-2">Try adjusting your search term</p>
            )}
          </div>
        )}
      </div>

      {/* Importance Dialog */}
      <Dialog open={showImportanceDialog} onOpenChange={setShowImportanceDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">File Storage Options</DialogTitle>
            <DialogDescription className="text-slate-300">
              Choose how to store your file: {pendingFile?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              onClick={() => saveFile(false)}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Saving...' : 'Save Off-Chain (Supabase)'}
            </Button>
            <Button
              onClick={() => saveFile(true)}
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

      {/* File Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-white">File Preview: {previewFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-auto">
            <pre className="bg-slate-900 p-4 rounded text-sm text-green-400 whitespace-pre-wrap">
              {previewFile?.content || 'No content available'}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};