'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldCheck, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setErrorMessage(message);
      setLoading(false);
    }
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl shadow-2xl">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-zinc-100">
          TenderOS
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Authorized single-operator authentication gateway
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          {errorMessage && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
              {errorMessage}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-300">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="operator@hisako.co.ke"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-zinc-800 bg-zinc-950 text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-zinc-700"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-300">
              Password
            </label>
            <Input
              type="password"
              placeholder="••••••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-zinc-800 bg-zinc-950 text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-zinc-700"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Enter System
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 border-t border-zinc-800/80 pt-4 text-center">
          <p className="text-[11px] text-zinc-500">
            Single-operator system. Credentials are seed-managed in Supabase.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
