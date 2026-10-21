import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-[#090a0f] text-zinc-100 overflow-x-hidden">
      {children}
    </div>
  );
}
