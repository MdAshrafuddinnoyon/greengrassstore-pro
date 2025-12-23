import JSZip from 'jszip';

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
};

export const exportToExcel = (data: any[], filename: string) => {
  // Simple Excel XML format
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<?mso-application progid="Excel.Sheet"?>\n';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
  xml += '<Worksheet ss:Name="Sheet1">\n<Table>\n';
  
  // Headers row
  xml += '<Row>\n';
  headers.forEach(header => {
    xml += `<Cell><Data ss:Type="String">${escapeXml(header)}</Data></Cell>\n`;
  });
  xml += '</Row>\n';
  
  // Data rows
  data.forEach(row => {
    xml += '<Row>\n';
    headers.forEach(header => {
      const value = row[header];
      const displayValue = value === null || value === undefined 
        ? '' 
        : typeof value === 'object' 
          ? JSON.stringify(value) 
          : String(value);
      const type = typeof value === 'number' ? 'Number' : 'String';
      xml += `<Cell><Data ss:Type="${type}">${escapeXml(displayValue)}</Data></Cell>\n`;
    });
    xml += '</Row>\n';
  });
  
  xml += '</Table>\n</Worksheet>\n</Workbook>';
  
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  downloadBlob(blob, `${filename}.xls`);
};

export const exportToZip = async (
  datasets: { name: string; data: any[] }[],
  zipFilename: string
) => {
  const zip = new JSZip();
  
  datasets.forEach(({ name, data }) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');
    
    zip.file(`${name}.csv`, '\ufeff' + csvContent);
  });
  
  const content = await zip.generateAsync({ type: 'blob' });
  downloadBlob(content, `${zipFilename}.zip`);
};

const escapeXml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
