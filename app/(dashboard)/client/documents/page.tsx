import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Filter } from 'lucide-react';
import { getSessionUser, getServerSupabase } from '@/lib/data/tickets-queries';
import { ticketCaseBlackCtaButtonClassName } from '@/lib/ticket-case-tab-styles';
import { cn } from '@/lib/utils';

type TicketRow = {
  id: string;
  subject: string;
};

type DocumentRow = {
  id: string;
  ticket_id: string;
  original_filename: string | null;
  size_bytes: number | null;
  storage_path: string;
  created_at: string;
};

export default async function ClientDocumentsPage() {
  const session = await getSessionUser();
  if (!session || session.role !== 'client') return null;

  const supabase = await getServerSupabase();
  const { data: ticketRows } = await supabase
    .from('tickets')
    .select('id, subject')
    .eq('client_id', session.id)
    .order('updated_at', { ascending: false });

  const clientTickets = (ticketRows ?? []) as TicketRow[];
  const ticketIds = clientTickets.map((t) => t.id);
  const { data: docRows } =
    ticketIds.length > 0
      ? await supabase
          .from('documents')
          .select('id, ticket_id, original_filename, size_bytes, storage_path, created_at')
          .in('ticket_id', ticketIds)
          .in('category', ['client_upload', 'final', 'draft'])
          .order('created_at', { ascending: false })
      : { data: [] };

  const docs = (docRows ?? []) as DocumentRow[];
  const allDocuments = await Promise.all(
    docs.map(async (d) => {
      const { data } = await supabase.storage.from('tax-documents').createSignedUrl(d.storage_path, 3600);
      return {
        ...d,
        signedUrl: data?.signedUrl ?? '#',
      };
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground mt-1">All documents across your cases</p>
        </div>
        <p className="text-xs text-muted-foreground">Upload in each case to attach files to the right ticket.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            Showing documents from your active cases.
          </div>
        </CardContent>
      </Card>

      {allDocuments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">No documents uploaded yet</p>
              <Button asChild variant="default" className={cn('mt-4 gap-2', ticketCaseBlackCtaButtonClassName)}>
                <Link href="/client">Go to your cases</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {clientTickets.map((ticket) => {
            const ticketDocs = allDocuments.filter((d) => d.ticket_id === ticket.id);
            return ticketDocs.length > 0 ? (
              <Card key={ticket.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                  <CardDescription>{ticketDocs.length} documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {ticketDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {doc.original_filename ?? doc.storage_path.split('/').pop() ?? 'Document'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {Math.round((doc.size_bytes ?? 0) / 1024)} KB • {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <a href={doc.signedUrl} target="_blank" rel="noreferrer">
                              <Download className="w-4 h-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null;
          })}
        </div>
      )}

      {/* Document Types Info */}
      <Card>
        <CardHeader>
          <CardTitle>Common Documents We Need</CardTitle>
          <CardDescription>Here are the typical documents required for your tax return</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { category: 'Income Documents', items: ['W-2 Forms', '1099-INT (Interest)', '1099-DIV (Dividends)', '1099-MISC (Other Income)'] },
              { category: 'Deduction Documents', items: ['Mortgage Interest Statement', 'Property Tax Statements', 'Charitable Donations', 'Medical Expense Records'] },
              { category: 'Business Documents', items: ['Profit & Loss Statement', 'Bank Statements', 'Expense Receipts', 'Depreciation Schedule'] },
              { category: 'Other Documents', items: ['Prior Year Tax Return', 'Estimated Tax Payments', 'Tuition Statements', 'Child Care Statements'] },
            ].map((group) => (
              <div key={group.category} className="p-4 border border-border rounded-lg">
                <h3 className="font-medium text-foreground mb-2">{group.category}</h3>
                <ul className="space-y-1">
                  {group.items.map((item) => (
                    <li key={item} className="text-sm text-muted-foreground">• {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {clientTickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Documents</CardTitle>
            <CardDescription>
              To keep uploads one-step and consistent, upload documents directly inside each case under
              <span className="font-medium text-foreground"> My Documents</span>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="default" className={ticketCaseBlackCtaButtonClassName}>
              <Link href="/client">Open Cases</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
