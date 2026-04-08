'use client';

import { replaceTicketDocumentFormAction } from '@/app/actions/forms';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

/** Inline form: pick file → submit. Same action for clients (own uploads) and staff. */
export function ReplaceDocumentButton({
  documentId,
  size = 'sm',
  className,
}: {
  documentId: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  className?: string;
}) {
  const inputId = `replace-doc-file-${documentId}`;
  return (
    <form
      action={replaceTicketDocumentFormAction}
      className="inline-flex"
    >
      <input type="hidden" name="documentId" value={documentId} />
      <input
        id={inputId}
        type="file"
        name="file"
        required
        className="hidden"
        onChange={(e) => {
          e.currentTarget.form?.requestSubmit();
          e.currentTarget.value = '';
        }}
      />
      <Button
        type="button"
        variant="outline"
        size={size}
        className={className}
        aria-label="Replace file"
        onClick={() => document.getElementById(inputId)?.click()}
      >
        <RefreshCw className="size-3.5" />
        Replace
      </Button>
    </form>
  );
}
