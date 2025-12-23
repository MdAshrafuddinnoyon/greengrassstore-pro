import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileArchive } from "lucide-react";
import { exportToCSV, exportToExcel, exportToZip } from "@/lib/exportUtils";
import { toast } from "sonner";

interface ExportButtonsProps {
  data: any[];
  filename: string;
  label?: string;
}

export const ExportButtons = ({ data, filename, label = "Export" }: ExportButtonsProps) => {
  const handleExport = async (format: 'csv' | 'excel' | 'zip') => {
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      switch (format) {
        case 'csv':
          exportToCSV(data, filename);
          toast.success("CSV file downloaded");
          break;
        case 'excel':
          exportToExcel(data, filename);
          toast.success("Excel file downloaded");
          break;
        case 'zip':
          await exportToZip([{ name: filename, data }], filename);
          toast.success("ZIP file downloaded");
          break;
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel')}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Export as Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('zip')}>
          <FileArchive className="w-4 h-4 mr-2" />
          Export as ZIP
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
