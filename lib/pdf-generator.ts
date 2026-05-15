import { format } from 'date-fns';

export interface PDFGenerationData {
  ticketId: string;
  clientName: string;
  ticketRef: string;
  answers: Record<string, unknown>;
}

export async function generateTaxOrganizerPDF(data: PDFGenerationData): Promise<Blob> {
  // Dynamic import to avoid SSR issues
  const { default: jsPDF } = await import('jspdf');
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  let yPosition = margin;

  // Helper function to add text with wrapping
  const addText = (text: string, x: number, y: number, options: { 
    fontSize?: number; 
    fontStyle?: string;
    maxWidth?: number;
  } = {}) => {
    const fontSize = options.fontSize || 10;
    const fontStyle = options.fontStyle || 'normal';
    const maxWidth = options.maxWidth || contentWidth;

    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', fontStyle);

    if (text.length * (fontSize * 0.6) > maxWidth) {
      // Text needs wrapping
      const lines = pdf.splitTextToSize(text, maxWidth);
      lines.forEach((line: string, index: number) => {
        pdf.text(line, x, y + (index * (fontSize * 0.4)));
      });
      return y + (lines.length * (fontSize * 0.4));
    } else {
      pdf.text(text, x, y);
      return y + (fontSize * 0.4);
    }
  };

  // Helper function to check if we need a new page
  const checkNewPage = (requiredSpace: number): number => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      pdf.addPage();
      return margin;
    }
    return yPosition;
  };

  // Header
  yPosition = addText('TAX ORGANIZER SUMMARY', margin, yPosition, { 
    fontSize: 18, 
    fontStyle: 'bold' 
  });
  yPosition += 10;

  // Client information
  yPosition = addText(`Client: ${data.clientName}`, margin, yPosition, { 
    fontSize: 12, 
    fontStyle: 'bold' 
  });
  yPosition += 5;
  
  yPosition = addText(`Ticket: #${data.ticketRef}`, margin, yPosition, { 
    fontSize: 12 
  });
  yPosition += 5;
  
  yPosition = addText(`Generated: ${format(new Date(), 'PPP')}`, margin, yPosition, { 
    fontSize: 12 
  });
  yPosition += 15;

  // Process organizer sections
  const sections = [
    { title: 'TAXPAYER INFORMATION', prefix: 'tp-' },
    { title: 'SPOUSE INFORMATION', prefix: 'sp-' },
    { title: 'ADDRESS INFORMATION', prefix: 'addr-' },
    { title: 'BANK DETAILS', prefix: 'bank-' },
    { title: 'DEPENDENTS', prefix: 'dep-' },
    { title: 'INCOME SOURCES', prefix: 'inc-' },
    { title: 'ADDITIONAL INCOME', prefix: 'add-inc-' },
    { title: 'RENTAL INCOME', prefix: 'rental-' },
    { title: 'EXPENSES', prefix: 'exp-' },
    { title: 'ELECTRIC/HYBRID VEHICLE', prefix: 'ev-' },
    { title: 'DAYCARE EXPENSES', prefix: 'daycare-' },
  ];

  sections.forEach(section => {
    const sectionData = Object.entries(data.answers).filter(([key]) => 
      key.startsWith(section.prefix)
    );

    if (sectionData.length > 0) {
      yPosition = checkNewPage(30);
      
      // Section header
      yPosition = addText(section.title, margin, yPosition, { 
        fontSize: 14, 
        fontStyle: 'bold' 
      });
      yPosition += 10;

      // Section content
      sectionData.forEach(([key, value]) => {
        if (value && value !== '' && value !== 'N/A') {
          yPosition = checkNewPage(20);
          
          const fieldName = key.replace(section.prefix, '').replace(/-/g, ' ').toUpperCase();
          const fieldValue = Array.isArray(value) ? value.join(', ') : String(value);
          
          yPosition = addText(`${fieldName}:`, margin, yPosition, { 
            fontSize: 10, 
            fontStyle: 'bold' 
          });
          yPosition += 2;
          
          yPosition = addText(fieldValue, margin + 10, yPosition, { 
            fontSize: 10,
            maxWidth: contentWidth - 10
          });
          yPosition += 8;
        }
      });
      
      yPosition += 10;
    }
  });

  // Add any remaining fields that don't fit the standard prefixes
  const processedKeys = new Set();
  sections.forEach(section => {
    Object.keys(data.answers).forEach(key => {
      if (key.startsWith(section.prefix)) {
        processedKeys.add(key);
      }
    });
  });

  const remainingData = Object.entries(data.answers).filter(([key]) => 
    !processedKeys.has(key) && data.answers[key] && data.answers[key] !== '' && data.answers[key] !== 'N/A'
  );

  if (remainingData.length > 0) {
    yPosition = checkNewPage(30);
    
    yPosition = addText('OTHER INFORMATION', margin, yPosition, { 
      fontSize: 14, 
      fontStyle: 'bold' 
    });
    yPosition += 10;

    remainingData.forEach(([key, value]) => {
      yPosition = checkNewPage(20);
      
      const fieldName = key.replace(/-/g, ' ').toUpperCase();
      const fieldValue = Array.isArray(value) ? value.join(', ') : String(value);
      
      yPosition = addText(`${fieldName}:`, margin, yPosition, { 
        fontSize: 10, 
        fontStyle: 'bold' 
      });
      yPosition += 2;
      
      yPosition = addText(fieldValue, margin + 10, yPosition, { 
        fontSize: 10,
        maxWidth: contentWidth - 10
      });
      yPosition += 8;
    });
  }

  // Footer
  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      `Page ${i} of ${totalPages} - Generated by Tax CRM System`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  return pdf.output('blob');
}

export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}