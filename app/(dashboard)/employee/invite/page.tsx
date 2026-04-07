'use client';

import { useState } from 'react';
import { createInvitationLinkAction } from '@/app/actions/invitations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Link2 } from 'lucide-react';

export default function EmployeeInvitePage() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setError('');
    setLoading(true);
    try {
      const { url: u } = await createInvitationLinkAction();
      setUrl(u);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="size-5" />
            Invite a client
          </CardTitle>
          <CardDescription>
            Generate a one-time signup link. When the client registers, a ticket is created in Pending Info and assigned
            to you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="button" onClick={generate} disabled={loading}>
            {loading ? 'Generating…' : 'Generate invitation link'}
          </Button>
          {url && (
            <div className="space-y-2">
              <Label htmlFor="invite-url">Copy this link</Label>
              <div className="flex gap-2">
                <Input id="invite-url" readOnly value={url} className="font-mono text-xs" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => void navigator.clipboard.writeText(url)}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
