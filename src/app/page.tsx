"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Video, ShieldCheck, Zap } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermissionsAndStart = async () => {
    setLoading(true);
    setError(null);
    try {
      // Test permissions before navigating
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      // Immediately stop them so the next page can acquire properly
      stream.getTracks().forEach(t => t.stop());
      router.push('/chat');
    } catch (err) {
      console.error(err);
      setError("Please allow camera and microphone access to continue.");
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center relative overflow-hidden bg-dark-900 selection:bg-brand-500/30">
      {/* Decorative gradient background blur */}
      <div className="absolute top-[-20%] left-[-10%] h-[50rem] w-[50rem] rounded-full bg-brand-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] h-[40rem] w-[40rem] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none" />
      
      <div className="z-10 flex flex-col items-center max-w-2xl px-6 text-center">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 shadow-2xl shadow-brand-500/20">
            <Video className="h-10 w-10 text-white" />
          </div>
          <span className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-400 sm:text-5xl">
            Meetzy
          </span>
        </div>
        
        <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 sm:text-7xl drop-shadow-sm">
          Meet <span className="text-brand-400">Strangers</span>
        </h1>
        
        <p className="mb-12 text-lg leading-relaxed text-slate-400 sm:text-xl font-light">
          Instant peer-to-peer random video chats — ultra-low latency, completely private, zero friction.
        </p>
        
        <div className="flex w-full flex-col gap-4 sm:flex-row justify-center">
          <button
            onClick={requestPermissionsAndStart}
            disabled={loading}
            className="group relative flex items-center justify-center gap-3 overflow-hidden rounded-xl bg-white px-8 py-4 font-semibold text-dark-900 transition-all hover:bg-slate-100 hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:hover:scale-100"
          >
            <span className="relative z-10">{loading ? "Requesting Permissions..." : "Start Chatting"}</span>
            {!loading && <Zap className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        {/* Feature Grid */}
        <div className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-2 text-left opacity-80">
          <div className="flex items-start gap-4 p-4 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm">
            <Zap className="h-6 w-6 text-brand-400 mt-1" />
            <div>
              <h3 className="font-semibold text-white">Lightning Fast P2P</h3>
              <p className="text-sm text-slate-400 mt-1">Direct WebRTC connections mean zero server lag and raw video quality.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm">
            <ShieldCheck className="h-6 w-6 text-purple-400 mt-1" />
            <div>
              <h3 className="font-semibold text-white">Private & Secure</h3>
              <p className="text-sm text-slate-400 mt-1">Data flows directly between peers. We don't record or store your streams.</p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
