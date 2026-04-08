'use client';

import { useState } from 'react';
import { createInvitationLinkAction } from '@/app/actions/invitations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Link2 } from 'lucide-react';

export default function EmployeeInvitePage() {
  const [signupUrl, setSignupUrl] = useState('');
  const [loginUrl, setLoginUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setError('');
    setLoading(true);
    try {
      const { signupUrl: su, loginUrl: lu } = await createInvitationLinkAction();
      setSignupUrl(su);
      setLoginUrl(lu);
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
            Share the <strong>signup</strong> link with new clients. If they already have an account (for example after
            confirming email), send them the <strong>sign-in</strong> link instead — it links them to you on login.
            New tickets use you as the default assignee; the whole team can still see and work every case.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="button" onClick={generate} disabled={loading}>
            {loading ? 'Generating…' : 'Generate invitation link'}
          </Button>
          {signupUrl && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-signup">New client — create account</Label>
                <div className="flex gap-2">
                  <Input id="invite-signup" readOnly value={signupUrl} className="font-mono text-xs" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => void navigator.clipboard.writeText(signupUrl)}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-login">Already registered — sign in (links invite)</Label>
                <div className="flex gap-2">
                  <Input id="invite-login" readOnly value={loginUrl} className="font-mono text-xs" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => void navigator.clipboard.writeText(loginUrl)}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
