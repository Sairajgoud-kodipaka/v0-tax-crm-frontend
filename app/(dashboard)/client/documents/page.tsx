'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockTickets } from '@/lib/mock-data';
import { Download, Trash2, Upload, Filter } from 'lucide-react';

export default function ClientDocumentsPage() {
  const clientTickets = mockTickets.filter(t => t.clientId === 'client-1');
  const allDocuments = clientTickets.flatMap(t =>
    t.documents.map(d => ({ ...d, ticketSubject: t.subject, ticketId: t.id }))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground mt-1">All documents across your cases</p>
        </div>
        <Button className="bg-primary text-primary-foreground gap-2">
          <Upload className="w-4 h-4" />
          Upload Document
        </Button>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search documents..."
                className="w-full px-3 py-2 border border-border rounded-lg"
              />
            </div>
            <Button variant="outline" gap-2>
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      {allDocuments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">No documents uploaded yet</p>
              <Button className="mt-4 bg-primary text-primary-foreground gap-2">
                <Upload className="w-4 h-4" />
                Upload Your First Document
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {clientTickets.map((ticket) => {
            const ticketDocs = ticket.documents;
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
                          <p className="font-medium text-foreground">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {Math.round(doc.size / 1024)} KB • {doc.uploadedAt.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
