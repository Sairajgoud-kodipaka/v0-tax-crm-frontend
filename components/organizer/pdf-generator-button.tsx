'use client';

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { generateTaxOrganizerPDFAction, saveTaxOrganizerPDFAction } from '@/app/actions/organizer';
import { generateTaxOrganizerPDF, downloadPDF } from '@/lib/pdf-generator';

interface PDFGeneratorButtonProps {
  ticketId: string;
  variant?: 'generate' | 'download';
  saveToSystem?: boolean;
  className?: string;
}

export function PDFGeneratorButton({ 
  ticketId, 
  variant = 'generate',
  saveToSystem = true,
  className 
}: PDFGeneratorButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    
    try {
      // Get the organizer data from server
      const data = await generateTaxOrganizerPDFAction(ticketId);
      
      // Generate PDF blob
      const pdfBlob = await generateTaxOrganizerPDF(data);
      
      const filename = `tax-organizer-${data.ticketRef}-${new Date().toISOString().split('T')[0]}.pdf`;
      
      if (variant === 'download') {
        // Just download the PDF
        downloadPDF(pdfBlob, filename);
        toast({
          title: 'PDF generated successfully',
          description: 'Tax organizer PDF has been downloaded.',
        });
      } else if (saveToSystem) {
        // Save to system and optionally download
        const result = await saveTaxOrganizerPDFAction(ticketId, pdfBlob, filename);
        
        if (result.success) {
          // Also download the PDF for immediate viewing
          downloadPDF(pdfBlob, filename);
          
          toast({
            title: 'PDF generated and saved',
            description: 'Tax organizer PDF has been saved to the system and downloaded.',
          });
        } else {
          throw new Error('Failed to save PDF to system');
        }
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: 'PDF generation failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleGeneratePDF}
      disabled={isGenerating}
      className={className}
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4 mr-2" />
      )}
      {isGenerating 
        ? 'Generating...' 
        : variant === 'download' 
          ? 'Download PDF' 
          : 'Generate PDF'
      }
    </Button>
  );
}