'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const photos = [
  {
    src: '/images/cherry-blossom.png',
    title: 'Cherry Blossom Beauty',
    caption: 'Hisako Enterprise',
  },
  {
    src: '/images/cherry-motion.webp',
    title: 'Cherry Motion',
    caption: 'Hisako Enterprise',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Automatically interchange photos every 6 seconds with smooth crossfade
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPhotoIndex((prev) => (prev === 0 ? 1 : 0));
    }, 6000);
    return () => clearInterval(timer);
  }, []);

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
    <div className="min-h-screen w-full flex bg-[#090a0f] text-zinc-100">
      {/* Left Form Section */}
      <div className="w-full lg:w-[44%] xl:w-[40%] min-h-screen flex flex-col justify-between p-6 sm:p-12 lg:p-16 z-10 bg-[#090a0f]">
        {/* Top: Brand Logo matching Lummi style */}
        <div>
          <div className="flex flex-col items-start select-none">
            <span
              className="text-4xl sm:text-5xl text-white tracking-normal font-bold"
              style={{ fontFamily: "'Caveat', cursive, sans-serif" }}
            >
              TenderOS
            </span>
            <div className="flex items-center gap-1.5 -mt-1.5 pl-1">
              <svg className="w-14 h-2 text-white/80" viewBox="0 0 60 8" fill="none">
                <path
                  d="M2 5C18 1.5 42 1.5 58 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-xs font-sans font-medium text-zinc-300 tracking-wide">
                by Hisako
              </span>
            </div>
          </div>
        </div>

        {/* Center: Login Form */}
        <div className="w-full max-w-sm my-auto py-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-8">
            Log in to TenderOS
          </h1>

          <form onSubmit={handleLogin} className="space-y-5">
            {errorMessage && (
              <div className="rounded-lg border border-red-500/40 bg-red-950/30 p-3 text-xs text-red-300 leading-relaxed animate-in fade-in">
                {errorMessage}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-zinc-300">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@hisako.co.ke"
                className="w-full h-11 rounded-lg bg-[#121318] border border-zinc-800 px-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-zinc-300">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-11 rounded-lg bg-[#121318] border border-zinc-800 px-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
              />
              <div className="flex justify-start pt-0.5">
                <button
                  type="button"
                  onClick={() => alert('Password recovery is managed by the system administrator.')}
                  className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-zinc-600 hover:bg-purple-600 text-white font-medium text-sm transition-all duration-200 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Continue</span>
              )}
            </button>
          </form>
        </div>

        {/* Bottom: Legal & Terms */}
        <div className="pt-6">
          <p className="text-xs text-zinc-500 leading-relaxed">
            By signing in, you agree to TenderOS&apos;s{' '}
            <span className="underline underline-offset-2 text-zinc-400 cursor-pointer hover:text-white">
              Terms of Use
            </span>{' '}
            and{' '}
            <span className="underline underline-offset-2 text-zinc-400 cursor-pointer hover:text-white">
              Privacy Policy
            </span>
            .
          </p>
        </div>
      </div>

      {/* Right Photo Gallery Section with Interchanging Photos */}
      <div className="hidden lg:block lg:w-[56%] xl:w-[60%] relative overflow-hidden bg-black min-h-screen">
        {photos.map((photo, index) => {
          const isActive = currentPhotoIndex === index;
          return (
            <div
              key={photo.src}
              className={cn(
                'absolute inset-0 transition-opacity duration-1000 ease-in-out',
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              )}
            >
              <Image
                src={photo.src}
                alt={photo.title}
                fill
                priority={index === 0}
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="object-cover object-center"
              />
            </div>
          );
        })}

        {/* Subtle Dark Gradient at Bottom */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-20 pointer-events-none" />

        {/* Photographer / Title Attribution Badge (matching screenshot bottom-right) */}
        <div className="absolute bottom-6 right-6 z-30 flex items-center gap-2.5 rounded-full bg-black/60 backdrop-blur-md px-3.5 py-1.5 text-xs text-white border border-white/15 shadow-xl transition-all">
          <div className="relative h-5 w-5 rounded-full overflow-hidden border border-white/30 shrink-0">
            <Image
              src={photos[currentPhotoIndex].src}
              alt="Thumbnail"
              fill
              className="object-cover"
            />
          </div>
          <span className="font-medium text-[11px] text-zinc-200">
            {photos[currentPhotoIndex].title}
          </span>
        </div>

        {/* Slide Indicator Controls */}
        <div className="absolute bottom-6 left-6 z-30 flex items-center space-x-1.5">
          {photos.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentPhotoIndex(idx)}
              aria-label={`View photo ${idx + 1}`}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                currentPhotoIndex === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
