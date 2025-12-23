import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Upload, Image, File, Trash2, Copy, Search, 
  Grid3X3, List, Loader2, Download, FolderInput, CheckSquare, Zap, TrendingDown
} from "lucide-react";
import { ExportButtons } from "./ExportButtons";
import { Switch } from "@/components/ui/switch";

interface MediaFile {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  alt_text: string | null;
  caption: string | null;
  folder: string;
  created_at: string;
  publicUrl?: string;
}

export const MediaLibrary = () => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [uploadFolder, setUploadFolder] = useState("uploads");
  const [isDragging, setIsDragging] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [moveToFolder, setMoveToFolder] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [webpOptimization, setWebpOptimization] = useState(true);
  const [bulkOptimizing, setBulkOptimizing] = useState(false);
  const [bulkOptimizeProgress, setBulkOptimizeProgress] = useState(0);
  const [optimizationStats, setOptimizationStats] = useState<{
    originalSize: number;
    optimizedSize: number;
    savings: number;
    savingsPercent: number;
  } | null>(null);
  const itemsPerPage = 20;

  const predefinedFolders = ['uploads', 'products', 'blog', 'categories', 'banners', 'logos', 'digital-products'];

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const filesWithUrls = (data || []).map((file: MediaFile) => {
        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(file.file_path);
        return { ...file, publicUrl: urlData.publicUrl };
      });

      setFiles(filesWithUrls);

      const dbFolders = [...new Set((data || []).map((f: MediaFile) => f.folder))];
      const allFolders = [...new Set([...predefinedFolders, ...dbFolders])].sort();
      setFolders(allFolders);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Failed to fetch media files');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Update upload folder when selected folder changes
  useEffect(() => {
    if (selectedFolder !== 'all') {
      setUploadFolder(selectedFolder);
    }
  }, [selectedFolder]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'a') {
          e.preventDefault();
          if (selectedFiles.length === filteredFiles.length) {
            setSelectedFiles([]);
          } else {
            setSelectedFiles(filteredFiles.map(f => f.id));
          }
        }
      }
      if (e.key === 'Escape') {
        setSelectedFiles([]);
      }
      if (e.key === 'Delete' && selectedFiles.length > 0) {
        handleBulkDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFiles.length]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      await processFileUpload(droppedFiles);
    }
  };

  const processFileUpload = async (uploadFiles: FileList) => {
    setUploading(true);
    setOptimizationStats(null);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please login to upload files');
      setUploading(false);
      return;
    }

    // Use selected folder if not 'all', otherwise use uploadFolder
    const targetFolder = selectedFolder !== 'all' ? selectedFolder : uploadFolder;

    try {
      let totalOriginalSize = 0;
      let totalOptimizedSize = 0;
      let optimizedCount = 0;

      for (const file of Array.from(uploadFiles)) {
        const isImage = file.type.startsWith('image/');
        
        // Use WebP optimization for images if enabled
        if (isImage && webpOptimization) {
          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', targetFolder);
            formData.append('quality', '80');

            // Get session token for auth
            const { data: { session } } = await supabase.auth.getSession();
            
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/optimize-image`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session?.access_token}`,
                },
                body: formData,
              }
            );

            const result = await response.json();

            if (result.success && result.data) {
              totalOriginalSize += result.data.originalSize || 0;
              totalOptimizedSize += result.data.optimizedSize || 0;
              optimizedCount++;
              console.log(`Optimized ${file.name}: ${result.data.savingsPercent}% savings`);
            } else {
              throw new Error(result.error || 'Optimization failed');
            }
          } catch (optError) {
            console.error('Optimization error, falling back to direct upload:', optError);
            // Fallback to direct upload if optimization fails
            await uploadFileDirect(file, targetFolder, user.id);
          }
        } else {
          // Direct upload for non-images or when optimization is disabled
          await uploadFileDirect(file, targetFolder, user.id);
        }
      }

      // Show optimization stats
      if (optimizedCount > 0 && totalOriginalSize > 0) {
        const savings = totalOriginalSize - totalOptimizedSize;
        const savingsPercent = Math.round((savings / totalOriginalSize) * 100);
        setOptimizationStats({
          originalSize: totalOriginalSize,
          optimizedSize: totalOptimizedSize,
          savings,
          savingsPercent
        });
        toast.success(`${uploadFiles.length} file(s) uploaded with ${savingsPercent}% size reduction!`);
      } else {
        toast.success(`${uploadFiles.length} file(s) uploaded to ${targetFolder}`);
      }
      
      fetchFiles();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file(s)');
    } finally {
      setUploading(false);
    }
  };

  // Direct upload without optimization
  const uploadFileDirect = async (file: File, targetFolder: string, userId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${targetFolder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { error: dbError } = await supabase
      .from('media_files')
      .insert({
        user_id: userId,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        folder: targetFolder
      });

    if (dbError) throw dbError;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadFiles = e.target.files;
    if (!uploadFiles || uploadFiles.length === 0) return;
    await processFileUpload(uploadFiles);
  };

  const handleDelete = async (file: MediaFile) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('media')
        .remove([file.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('media_files')
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;

      toast.success('File deleted successfully');
      fetchFiles();
      setSelectedFile(null);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete file');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedFiles.length} files?`)) return;

    try {
      const filesToDelete = files.filter(f => selectedFiles.includes(f.id));
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('media')
        .remove(filesToDelete.map(f => f.file_path));

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('media_files')
        .delete()
        .in('id', selectedFiles);

      if (dbError) throw dbError;

      toast.success(`${selectedFiles.length} files deleted successfully`);
      setSelectedFiles([]);
      fetchFiles();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete files');
    }
  };

  const handleBulkMove = async () => {
    if (selectedFiles.length === 0 || !moveToFolder) return;

    try {
      const filesToMove = files.filter(f => selectedFiles.includes(f.id));
      
      for (const file of filesToMove) {
        const newPath = `${moveToFolder}/${file.file_path.split('/').pop()}`;
        
        // Move in storage
        const { error: moveError } = await supabase.storage
          .from('media')
          .move(file.file_path, newPath);

        if (moveError) throw moveError;

        // Update database
        const { error: dbError } = await supabase
          .from('media_files')
          .update({ folder: moveToFolder, file_path: newPath })
          .eq('id', file.id);

        if (dbError) throw dbError;
      }

      toast.success(`${selectedFiles.length} files moved to ${moveToFolder}`);
      setSelectedFiles([]);
      setShowMoveDialog(false);
      setMoveToFolder("");
      fetchFiles();
    } catch (error) {
      console.error('Bulk move error:', error);
      toast.error('Failed to move files');
    }
  };

  // Bulk optimize selected images to WebP
  const handleBulkOptimize = async () => {
    const imageFiles = files.filter(f => 
      selectedFiles.includes(f.id) && 
      f.file_type.startsWith('image/') && 
      f.file_type !== 'image/webp'
    );

    if (imageFiles.length === 0) {
      toast.error('No optimizable images selected (already WebP or not images)');
      return;
    }

    setBulkOptimizing(true);
    setBulkOptimizeProgress(0);
    let successCount = 0;
    let totalOriginal = 0;
    let totalOptimized = 0;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        setBulkOptimizeProgress(Math.round(((i + 1) / imageFiles.length) * 100));

        try {
          // Download the file first
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('media')
            .download(file.file_path);

          if (downloadError || !fileData) {
            console.error(`Failed to download ${file.file_name}:`, downloadError);
            continue;
          }

          totalOriginal += file.file_size;

          // Create FormData for optimization
          const formData = new FormData();
          formData.append('file', fileData, file.file_name);
          formData.append('folder', file.folder);
          formData.append('quality', '80');

          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/optimize-image`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session?.access_token}`,
              },
              body: formData,
            }
          );

          const result = await response.json();

          if (result.success) {
            // Delete old file
            await supabase.storage.from('media').remove([file.file_path]);
            await supabase.from('media_files').delete().eq('id', file.id);
            
            totalOptimized += result.data.optimizedSize || file.file_size;
            successCount++;
          }
        } catch (err) {
          console.error(`Error optimizing ${file.file_name}:`, err);
        }
      }

      if (successCount > 0) {
        const savings = totalOriginal - totalOptimized;
        const savingsPercent = totalOriginal > 0 ? Math.round((savings / totalOriginal) * 100) : 0;
        setOptimizationStats({
          originalSize: totalOriginal,
          optimizedSize: totalOptimized,
          savings,
          savingsPercent
        });
        toast.success(`Optimized ${successCount} images with ${savingsPercent}% size reduction!`);
        setSelectedFiles([]);
        fetchFiles();
      } else {
        toast.error('No images were optimized');
      }
    } catch (error) {
      console.error('Bulk optimization error:', error);
      toast.error('Failed to optimize images');
    } finally {
      setBulkOptimizing(false);
      setBulkOptimizeProgress(0);
    }
  };

  const toggleSelectFile = (id: string) => {
    setSelectedFiles(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedFiles.length === filteredFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(filteredFiles.map(f => f.id));
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = selectedFolder === 'all' || file.folder === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  // Pagination
  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);
  const paginatedFiles = filteredFiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFolder]);

  const isImage = (fileType: string) => fileType.startsWith('image/');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* WebP Optimization Toggle */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="font-medium text-sm">WebP Auto-Optimization</p>
            <p className="text-xs text-muted-foreground">
              Automatically convert PNG/JPG to WebP for faster loading
            </p>
          </div>
        </div>
        <Switch
          checked={webpOptimization}
          onCheckedChange={setWebpOptimization}
        />
      </div>

      {/* Optimization Stats */}
      {optimizationStats && (
        <div className="flex items-center gap-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <TrendingDown className="w-5 h-5 text-blue-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Image Optimization Complete!
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {formatFileSize(optimizationStats.originalSize)} → {formatFileSize(optimizationStats.optimizedSize)} 
              <span className="ml-2 font-bold text-green-600">
                ({optimizationStats.savingsPercent}% saved)
              </span>
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setOptimizationStats(null)}
            className="text-blue-600 hover:text-blue-800"
          >
            ✕
          </Button>
        </div>
      )}

      {/* Drag and Drop Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-all ${
          isDragging 
            ? 'border-primary bg-primary/10' 
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
        }`}
      >
        <Upload className={`w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 sm:mb-3 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
        <p className="font-medium text-sm sm:text-base mb-1">
          {isDragging ? 'Drop files here' : 'Drag & Drop files here'}
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
          {selectedFolder !== 'all' 
            ? `Files will be uploaded to "${selectedFolder}" folder`
            : 'or click to select files'
          }
          {webpOptimization && <span className="ml-1 text-green-600">(WebP optimization enabled)</span>}
        </p>
        <label>
          <Button size="sm" disabled={uploading} asChild>
            <span className="cursor-pointer">
              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Select Files
            </span>
          </Button>
          <input
            type="file"
            className="hidden"
            multiple
            accept="image/*,application/pdf,.csv,.xml"
            onChange={handleFileUpload}
          />
        </label>
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 sm:mt-3">
          Supported: Images, PDF, CSV, XML (Max 50MB)
        </p>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">Media Library</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">{files.length} files</p>
        </div>
        
        <div className="flex gap-2 flex-wrap w-full sm:w-auto">
          <ExportButtons 
            data={files.map(f => ({ 
              name: f.file_name, 
              type: f.file_type, 
              size: formatFileSize(f.file_size),
              folder: f.folder,
              url: f.publicUrl || ''
            }))} 
            filename={`media-library-${new Date().toISOString().split('T')[0]}`}
          />
          <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
          </Button>
          
          <select
            value={selectedFolder === 'all' ? uploadFolder : selectedFolder}
            onChange={(e) => setUploadFolder(e.target.value)}
            className="px-2 sm:px-3 py-2 border rounded-lg bg-background text-xs sm:text-sm flex-1 sm:flex-none"
          >
            {folders.map(folder => (
              <option key={folder} value={folder}>📁 {folder}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Folder Quick Access */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        <Button 
          variant={selectedFolder === 'all' ? 'default' : 'outline'} 
          size="sm"
          className="text-xs sm:text-sm h-8"
          onClick={() => setSelectedFolder('all')}
        >
          All Files
        </Button>
        {folders.map(folder => (
          <Button
            key={folder}
            variant={selectedFolder === folder ? 'default' : 'outline'}
            size="sm"
            className="text-xs sm:text-sm h-8"
            onClick={() => setSelectedFolder(folder)}
          >
            📁 {folder}
            <span className="ml-1 text-[10px] opacity-70">
              ({files.filter(f => f.folder === folder).length})
            </span>
          </Button>
        ))}
      </div>

      {/* Search and Bulk Actions Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {filteredFiles.length > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={toggleSelectAll}
            className="shrink-0"
          >
            <CheckSquare className="w-4 h-4 mr-2" />
            {selectedFiles.length === filteredFiles.length ? 'Deselect All' : 'Select All'}
          </Button>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedFiles.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-3 flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-xs sm:text-sm font-medium">{selectedFiles.length} selected</span>
          
          {/* Bulk Optimize Button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleBulkOptimize}
            disabled={bulkOptimizing}
            className="bg-green-50 border-green-200 hover:bg-green-100 text-green-700"
          >
            {bulkOptimizing ? (
              <>
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 animate-spin" />
                {bulkOptimizeProgress}%
              </>
            ) : (
              <>
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden sm:inline">Optimize to WebP</span>
                <span className="sm:hidden">WebP</span>
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowMoveDialog(true)}
          >
            <FolderInput className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <span className="hidden sm:inline">Move to folder</span>
            <span className="sm:hidden">Move</span>
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleBulkDelete}
          >
            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            Delete
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedFiles([])}
          >
            Clear
          </Button>
          <span className="hidden sm:inline text-xs text-muted-foreground ml-auto">
            Ctrl+A to select all, Delete to remove, Esc to clear
          </span>
        </div>
      )}

      {/* Files Grid/List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Image className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No media files found</p>
            <p className="text-sm text-muted-foreground mt-1">Upload your first file to get started</p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
          {paginatedFiles.map(file => (
            <Card 
              key={file.id} 
              className={`cursor-pointer transition-all relative ${
                selectedFiles.includes(file.id) 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : 'hover:ring-2 hover:ring-primary/50'
              }`}
              onClick={() => setSelectedFile(file)}
            >
              <div className="absolute top-1 left-1 z-10">
                <Checkbox
                  checked={selectedFiles.includes(file.id)}
                  onCheckedChange={() => toggleSelectFile(file.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-background"
                />
              </div>
              <CardContent className="p-1.5 sm:p-2">
                <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-1.5 sm:mb-2 flex items-center justify-center">
                  {isImage(file.file_type) ? (
                    <img 
                      src={file.publicUrl} 
                      alt={file.alt_text || file.file_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <File className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                  )}
                </div>
                <p className="text-[10px] sm:text-xs font-medium truncate">{file.file_name}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{formatFileSize(file.file_size)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {paginatedFiles.map(file => (
            <Card 
              key={file.id} 
              className={`cursor-pointer transition-all ${
                selectedFiles.includes(file.id) 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => setSelectedFile(file)}
            >
              <CardContent className="p-2 sm:p-3 flex items-center gap-2 sm:gap-4">
                <Checkbox
                  checked={selectedFiles.includes(file.id)}
                  onCheckedChange={() => toggleSelectFile(file.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                  {isImage(file.file_type) ? (
                    <img 
                      src={file.publicUrl} 
                      alt={file.alt_text || file.file_name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <File className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{file.file_name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.file_size)} • {file.folder}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="hidden sm:flex h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyUrl(file.publicUrl || '');
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 mt-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="h-8 px-2"
          >
            «
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="h-8 px-2"
          >
            ‹
          </Button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(page => {
              if (totalPages <= 7) return true;
              if (page === 1 || page === totalPages) return true;
              if (Math.abs(page - currentPage) <= 1) return true;
              return false;
            })
            .map((page, index, arr) => (
              <span key={page} className="flex items-center">
                {index > 0 && arr[index - 1] !== page - 1 && (
                  <span className="px-1 text-muted-foreground">...</span>
                )}
                <Button
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="h-8 w-8 p-0"
                >
                  {page}
                </Button>
              </span>
            ))
          }

          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="h-8 px-2"
          >
            ›
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="h-8 px-2"
          >
            »
          </Button>
          
          <span className="text-xs text-muted-foreground ml-2">
            {filteredFiles.length} files • Page {currentPage}/{totalPages}
          </span>
        </div>
      )}

      {/* Move to Folder Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Move {selectedFiles.length} files to folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select destination folder</Label>
              <Select value={moveToFolder} onValueChange={setMoveToFolder}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose folder..." />
                </SelectTrigger>
                <SelectContent>
                  {folders.map(folder => (
                    <SelectItem key={folder} value={folder}>📁 {folder}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowMoveDialog(false)}>Cancel</Button>
              <Button onClick={handleBulkMove} disabled={!moveToFolder}>
                <FolderInput className="w-4 h-4 mr-2" />
                Move Files
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* File Details Dialog */}
      <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>File Details</DialogTitle>
          </DialogHeader>
          
          {selectedFile && (
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              <div className="aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                {isImage(selectedFile.file_type) ? (
                  <img 
                    src={selectedFile.publicUrl} 
                    alt={selectedFile.alt_text || selectedFile.file_name}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <File className="w-16 h-16 text-muted-foreground" />
                )}
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <Label className="text-xs">File Name</Label>
                  <p className="text-sm break-all">{selectedFile.file_name}</p>
                </div>
                
                <div>
                  <Label className="text-xs">File Size</Label>
                  <p className="text-sm">{formatFileSize(selectedFile.file_size)}</p>
                </div>
                
                <div>
                  <Label className="text-xs">Folder</Label>
                  <p className="text-sm">📁 {selectedFile.folder}</p>
                </div>
                
                <div>
                  <Label className="text-xs">URL</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={selectedFile.publicUrl} readOnly className="text-xs" />
                    <Button size="icon" variant="outline" className="shrink-0" onClick={() => copyUrl(selectedFile.publicUrl || '')}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2 sm:pt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    size="sm"
                    onClick={() => window.open(selectedFile.publicUrl, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button 
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(selectedFile)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};