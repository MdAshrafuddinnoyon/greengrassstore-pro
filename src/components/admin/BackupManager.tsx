import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Download, Upload, Loader2, Database, CheckCircle, 
  AlertTriangle, FileJson, Calendar, User
} from "lucide-react";

interface BackupMetadata {
  version: string;
  created_at: string;
  created_by: string;
  tables: string[];
  data: Record<string, unknown[]>;
  errors?: string[];
}

export const BackupManager = () => {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [lastBackup, setLastBackup] = useState<BackupMetadata | null>(null);
  const [importResult, setImportResult] = useState<Record<string, { imported: number; errors: string[] }> | null>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error('Please login first');
        return;
      }

      const { data, error } = await supabase.functions.invoke('backup-data', {
        body: { action: 'export' }
      });

      if (error) throw error;

      if (data.success && data.backup) {
        setLastBackup(data.backup);
        
        // Download as JSON file
        const blob = new Blob([JSON.stringify(data.backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success('Backup exported successfully!');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export backup');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const backup = JSON.parse(text) as BackupMetadata;

      if (!backup.version || !backup.data) {
        throw new Error('Invalid backup file format');
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error('Please login first');
        return;
      }

      const { data, error } = await supabase.functions.invoke('backup-data', {
        body: { action: 'import', backup }
      });

      if (error) throw error;

      if (data.success) {
        setImportResult(data.results);
        toast.success('Backup imported successfully!');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import backup');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const getTotalRecords = (backup: BackupMetadata) => {
    return Object.values(backup.data).reduce((sum, arr) => sum + (arr?.length || 0), 0);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Database Backup & Restore
          </CardTitle>
          <CardDescription>
            Export all your data as JSON backup or restore from a previous backup file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Section */}
          <div className="p-4 border rounded-lg space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Download className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Export Backup</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Download a complete backup of all your data including products, orders, customers, settings, and more.
                </p>
                <Button onClick={handleExport} disabled={exporting}>
                  {exporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Export Backup
                    </>
                  )}
                </Button>
              </div>
            </div>

            {lastBackup && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(lastBackup.created_at).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {lastBackup.created_by}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileJson className="w-4 h-4" />
                      {getTotalRecords(lastBackup)} records
                    </span>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Import Section */}
          <div className="p-4 border rounded-lg space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Upload className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Restore Backup</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Upload a backup file to restore your data. This will merge with existing data (existing records will be updated).
                </p>
                <div>
                  <label>
                    <Button variant="outline" disabled={importing} asChild>
                      <span className="cursor-pointer">
                        {importing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Select Backup File
                          </>
                        )}
                      </span>
                    </Button>
                    <input
                      type="file"
                      className="hidden"
                      accept=".json"
                      onChange={handleImport}
                      disabled={importing}
                    />
                  </label>
                </div>
              </div>
            </div>

            {importResult && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Import Results:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {Object.entries(importResult).map(([table, result]) => (
                    <div 
                      key={table} 
                      className={`p-2 rounded text-xs ${
                        result.errors.length > 0 
                          ? 'bg-red-50 text-red-700' 
                          : 'bg-green-50 text-green-700'
                      }`}
                    >
                      <span className="font-medium">{table}</span>
                      <span className="ml-1">({result.imported})</span>
                      {result.errors.length > 0 && (
                        <AlertTriangle className="w-3 h-3 inline ml-1" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Warning */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Regular backups are recommended. Store backup files securely as they contain all your business data.
            </AlertDescription>
          </Alert>

          {/* Tables List */}
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">Included in backup:</p>
            <div className="flex flex-wrap gap-1">
              {['Products', 'Categories', 'Orders', 'Customers', 'Blog Posts', 'Settings', 'Coupons', 'Newsletter', 'Media', 'FAQs', 'Popups'].map(table => (
                <span key={table} className="px-2 py-1 bg-muted rounded text-xs">
                  {table}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
