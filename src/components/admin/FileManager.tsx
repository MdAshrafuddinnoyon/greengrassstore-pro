import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Folder, File, FolderPlus, Upload, Trash2, 
  ChevronRight, Home, Loader2, MoreVertical,
  Download, Copy, ArrowLeft
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface FileItem {
  name: string;
  id?: string;
  updated_at?: string;
  created_at?: string;
  last_accessed_at?: string;
  metadata?: {
    size?: number;
    mimetype?: string;
  };
}

export const FileManager = () => {
  const [currentPath, setCurrentPath] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.storage
        .from('media')
        .list(currentPath, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' },
        });

      if (error) throw error;

      // Separate folders and files
      const folderItems: string[] = [];
      const fileItems: FileItem[] = [];

      (data || []).forEach((item) => {
        if (item.id === null) {
          // It's a folder
          folderItems.push(item.name);
        } else {
          fileItems.push(item);
        }
      });

      setFolders(folderItems);
      setFiles(fileItems);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Failed to fetch files');
    } finally {
      setLoading(false);
    }
  }, [currentPath]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const navigateToFolder = (folderName: string) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    setCurrentPath(newPath);
  };

  const navigateUp = () => {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    setCurrentPath(parts.join('/'));
  };

  const navigateToRoot = () => {
    setCurrentPath("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadFiles = e.target.files;
    if (!uploadFiles || uploadFiles.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(uploadFiles)) {
        const filePath = currentPath ? `${currentPath}/${file.name}` : file.name;
        
        const { error } = await supabase.storage
          .from('media')
          .upload(filePath, file, { upsert: true });

        if (error) throw error;
      }

      toast.success(`${uploadFiles.length} file(s) uploaded`);
      fetchFiles();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file(s)');
    } finally {
      setUploading(false);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('Please enter a folder name');
      return;
    }

    try {
      // Create empty placeholder file to create folder
      const folderPath = currentPath 
        ? `${currentPath}/${newFolderName}/.keep` 
        : `${newFolderName}/.keep`;
      
      const { error } = await supabase.storage
        .from('media')
        .upload(folderPath, new Blob(['']));

      if (error) throw error;

      toast.success('Folder created');
      setShowNewFolderDialog(false);
      setNewFolderName("");
      fetchFiles();
    } catch (error) {
      console.error('Create folder error:', error);
      toast.error('Failed to create folder');
    }
  };

  const deleteFile = async (fileName: string) => {
    if (!confirm(`Delete "${fileName}"?`)) return;

    try {
      const filePath = currentPath ? `${currentPath}/${fileName}` : fileName;
      const { error } = await supabase.storage
        .from('media')
        .remove([filePath]);

      if (error) throw error;

      toast.success('File deleted');
      fetchFiles();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete file');
    }
  };

  const getFileUrl = (fileName: string) => {
    const filePath = currentPath ? `${currentPath}/${fileName}` : fileName;
    const { data } = supabase.storage.from('media').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const copyUrl = (fileName: string) => {
    const url = getFileUrl(fileName);
    navigator.clipboard.writeText(url);
    toast.success('URL copied');
  };

  const downloadFile = (fileName: string) => {
    const url = getFileUrl(fileName);
    window.open(url, '_blank');
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const breadcrumbs = currentPath.split('/').filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">File Manager</h2>
          <p className="text-sm text-muted-foreground">Manage your media files</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowNewFolderDialog(true)}>
            <FolderPlus className="w-4 h-4 mr-2" />
            New Folder
          </Button>
          
          <label>
            <Button size="sm" disabled={uploading} asChild>
              <span className="cursor-pointer">
                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                Upload
              </span>
            </Button>
            <input
              type="file"
              className="hidden"
              multiple
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center gap-2 text-sm overflow-x-auto">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2"
              onClick={navigateToRoot}
            >
              <Home className="w-4 h-4" />
            </Button>
            
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2"
                  onClick={() => {
                    const newPath = breadcrumbs.slice(0, index + 1).join('/');
                    setCurrentPath(newPath);
                  }}
                >
                  {crumb}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : folders.length === 0 && files.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">This folder is empty</p>
            </div>
          ) : (
            <div className="divide-y">
              {/* Back button */}
              {currentPath && (
                <div 
                  className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                  onClick={navigateUp}
                >
                  <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">..</span>
                </div>
              )}
              
              {/* Folders */}
              {folders.map((folder) => (
                <div 
                  key={folder}
                  className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigateToFolder(folder)}
                >
                  <div className="flex items-center gap-3">
                    <Folder className="w-5 h-5 text-yellow-500" />
                    <span className="font-medium">{folder}</span>
                  </div>
                </div>
              ))}
              
              {/* Files */}
              {files.map((file) => (
                <div 
                  key={file.name}
                  className="flex items-center justify-between p-3 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <File className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.metadata?.size)}
                      </p>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => copyUrl(file.name)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy URL
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => downloadFile(file.name)}>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => deleteFile(file.name)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="folderName">Folder Name</Label>
            <Input
              id="folderName"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Enter folder name"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createFolder}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
