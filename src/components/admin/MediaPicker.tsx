import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Image, Upload, Link as LinkIcon, Check, X, Folder } from "lucide-react";

interface MediaFile {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  folder?: string;
  publicUrl?: string;
}

interface MediaPickerProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  folder?: string; // Default folder for uploads
}

// Folder configuration for different content types
export const MEDIA_FOLDERS = {
  products: 'products',
  blog: 'blog',
  categories: 'categories',
  banners: 'banners',
  logos: 'logos',
  sliders: 'sliders',
  uploads: 'uploads',
} as const;

export const MediaPicker = ({ 
  value, 
  onChange, 
  label = "Image", 
  placeholder = "Select or enter image URL",
  folder = 'uploads'
}: MediaPickerProps) => {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(value || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [uploadFolder, setUploadFolder] = useState(folder);
  const [availableFolders, setAvailableFolders] = useState<string[]>([]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Extract unique folders
      const folders = [...new Set((data || []).map(f => f.folder).filter(Boolean))] as string[];
      setAvailableFolders(folders);

      const filesWithUrls = await Promise.all(
        (data || []).map(async (file) => {
          const { data: urlData } = supabase.storage
            .from('media')
            .getPublicUrl(file.file_path);
          return { ...file, publicUrl: urlData.publicUrl };
        })
      );

      setFiles(filesWithUrls.filter(f => f.file_type.startsWith('image/')));
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchFiles();
    }
  }, [open]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    // Convert FileList to array
    const filesToUpload = Array.from(fileList);
    
    // Validate all files are images
    const invalidFiles = filesToUpload.filter(f => !f.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      toast.error(`${invalidFiles.length} file(s) are not images and will be skipped`);
    }
    
    const validFiles = filesToUpload.filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const uploadedUrls: string[] = [];
      
      for (const file of validFiles) {
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${uploadFolder}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file);

        if (uploadError) {
          console.error(`Failed to upload ${file.name}:`, uploadError);
          continue;
        }

        const { error: dbError } = await supabase
          .from('media_files')
          .insert({
            file_name: file.name,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size,
            user_id: user.id,
            folder: uploadFolder
          });

        if (dbError) {
          console.error(`Failed to save ${file.name} to database:`, dbError);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);

        uploadedUrls.push(urlData.publicUrl);
      }

      if (uploadedUrls.length > 0) {
        // For single file mode, use last uploaded file
        onChange(uploadedUrls[uploadedUrls.length - 1]);
        setUrlInput(uploadedUrls[uploadedUrls.length - 1]);
        toast.success(`${uploadedUrls.length} image(s) uploaded to ${uploadFolder} folder`);
        fetchFiles(); // Refresh file list
      }
      
      if (uploadedUrls.length === validFiles.length) {
        setOpen(false);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectFile = (file: MediaFile) => {
    if (file.publicUrl) {
      onChange(file.publicUrl);
      setUrlInput(file.publicUrl);
      setOpen(false);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput) {
      onChange(urlInput);
      setOpen(false);
    }
  };

  const filteredFiles = files.filter(f => {
    const matchesSearch = f.file_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = selectedFolder === 'all' || f.folder === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="icon">
              <Image className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Select Image</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="library" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="library">Media Library</TabsTrigger>
                <TabsTrigger value="upload">Upload New</TabsTrigger>
                <TabsTrigger value="url">Enter URL</TabsTrigger>
              </TabsList>

              <TabsContent value="library" className="flex-1 overflow-hidden mt-4">
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Search images..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                    <SelectTrigger className="w-40">
                      <Folder className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="All Folders" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Folders</SelectItem>
                      {availableFolders.map(f => (
                        <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : filteredFiles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No images found
                  </div>
                ) : (
                  <div className="grid grid-cols-4 md:grid-cols-5 gap-3 overflow-y-auto max-h-[400px] p-1">
                    {filteredFiles.map((file) => (
                      <div
                        key={file.id}
                        onClick={() => handleSelectFile(file)}
                        className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all hover:border-primary group ${
                          value === file.publicUrl ? 'border-primary ring-2 ring-primary/30' : 'border-transparent'
                        }`}
                      >
                        <img
                          src={file.publicUrl}
                          alt={file.file_name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                          <span className="text-white text-xs truncate capitalize">{file.folder}</span>
                        </div>
                        {value === file.publicUrl && (
                          <div className="absolute top-1 right-1 bg-primary text-white rounded-full p-1">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="upload" className="mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Upload to Folder</Label>
                    <Select value={uploadFolder} onValueChange={setUploadFolder}>
                      <SelectTrigger>
                        <Folder className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(MEDIA_FOLDERS).map(([key, value]) => (
                          <SelectItem key={key} value={value} className="capitalize">{key}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Will be saved to: <span className="font-medium text-primary capitalize">{uploadFolder}</span> folder
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="media-picker-upload"
                      disabled={uploading}
                      multiple
                    />
                    <Button asChild disabled={uploading}>
                      <label htmlFor="media-picker-upload" className="cursor-pointer">
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Select Image
                          </>
                        )}
                      </label>
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="url" className="mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Image URL</Label>
                    <Input
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  
                  {urlInput && (
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                      <img
                        src={urlInput}
                        alt="Preview"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <Button onClick={handleUrlSubmit} className="w-full">
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Use This URL
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Preview */}
      {value && (
        <div className="relative w-20 h-20 rounded-lg overflow-hidden border bg-muted">
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
