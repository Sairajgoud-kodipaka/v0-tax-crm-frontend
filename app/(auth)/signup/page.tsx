'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

function SignupInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [peek, setPeek] = useState<{ valid: boolean; employeeName?: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    const supabase = createClient();
    void supabase.rpc('peek_invitation', { invite_token: token }).then(({ data, error }) => {
      if (error) {
        setPeek({ valid: false });
        return;
      }
      const row = Array.isArray(data) ? data[0] : data;
      if (row && typeof row === 'object' && row !== null && 'valid' in row) {
        const r = row as { valid: boolean; employee_name?: string | null };
        setPeek({
          valid: Boolean(r.valid),
          employeeName: r.employee_name ?? undefined,
        });
      } else {
        setPeek({ valid: false });
      }
    });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!token) {
      setError('Invitation token is required. Open the link from your tax preparer.');
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signErr } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (signErr) throw signErr;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError(
          'Account created. If email confirmation is required, confirm your email, then use the sign-in invitation link from your preparer (the one that ends with /login?token=…) so your account links to them. Or disable email confirmation in Supabase for development.',
        );
        return;
      }

      const { error: rpcErr } = await supabase.rpc('consume_invitation', { invite_token: token });
      if (rpcErr) throw rpcErr;

      router.push('/client');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create client account</CardTitle>
            <CardDescription>
              {token && peek?.valid
                ? `Invited by ${peek.employeeName ?? 'your tax preparer'}.`
                : token
                  ? 'Validating invitation…'
                  : 'You need an invitation link. Ask your preparer for a signup link.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading || !token}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading || !token}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading || !token}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || !token || peek?.valid === false}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  'Sign up'
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <SignupInner />
    </Suspense>
  );
}
