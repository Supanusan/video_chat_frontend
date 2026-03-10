"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWebRTC } from '@/hooks/useWebRTC';
import { VideoPlayer } from '@/components/VideoPlayer';
import { ChatBox } from '@/components/ChatBox';
import { LogOut, SkipForward, Mic, MicOff, Video, VideoOff, Flag, Users, Clock } from 'lucide-react';

export default function ChatPage() {
  const router = useRouter();
  const {
    localStream,
    remoteStream,
    connectionState,
    messages,
    onlineCount,
    queueCount,
    isPartnerTyping,
    startLocalStream,
    startSearch,
    nextPerson,
    sendMessage,
    sendTyping,
    leave,
  } = useWebRTC();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // ── Session Timer ────────────────────────────────────────────
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (connectionState === 'connected') {
      setSessionSeconds(0);
      timerRef.current = setInterval(() => setSessionSeconds(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setSessionSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [connectionState]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // ── Init ─────────────────────────────────────────────────────
  const searchStartedRef = useRef(false);

  useEffect(() => {
    if (searchStartedRef.current) return;
    const init = async () => {
      try {
        await startLocalStream();
        searchStartedRef.current = true;
        startSearch();
      } catch (err) {
        console.error('Failed to start camera:', err);
        router.push('/');
      }
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => { leave(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Media Controls ───────────────────────────────────────────
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t: MediaStreamTrack) => t.enabled = !t.enabled);
      setIsMuted(m => !m);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((t: MediaStreamTrack) => t.enabled = !t.enabled);
      setIsVideoOff(v => !v);
    }
  };

  const handleLeave = () => {
    leave();
    router.push('/');
  };

  const handleReport = () => {
    alert('Report submitted. Moving to next stranger.');
    nextPerson();
  };

  const handleTyping = useCallback((isTyping: boolean) => {
    sendTyping(isTyping);
  }, [sendTyping]);

  // ── Render ───────────────────────────────────────────────────
  const isConnected = connectionState === 'connected';
  const isSearching = connectionState === 'searching';

  return (
    <div className="flex h-screen w-full flex-col bg-dark-900 md:flex-row">

      {/* ── Video Section ─────────────────────────────────────── */}
      <div className="flex flex-1 flex-col p-4 gap-4 relative">

        {/* Header */}
        <header className="flex items-center justify-between glass-panel px-5 py-3 rounded-2xl z-20">
          {/* Status indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full transition-colors ${
                isConnected ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' :
                isSearching ? 'bg-yellow-400 animate-pulse' :
                'bg-slate-500'
              }`} />
              <span className="font-semibold text-white tracking-wide uppercase text-sm">
                {isConnected ? 'Connected' : isSearching ? 'Searching...' : 'Idle'}
              </span>
            </div>

            {/* Session timer — shown only when connected */}
            {isConnected && (
              <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-3 py-1 text-xs font-mono text-slate-300 border border-white/10">
                <Clock className="h-3 w-3 text-brand-400" />
                {formatTime(sessionSeconds)}
              </div>
            )}
          </div>

          {/* Centre wordmark */}
          <span className="absolute left-1/2 -translate-x-1/2 text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-400 pointer-events-none hidden sm:block">
            Meetzy
          </span>

          {/* Right side: online count + exit */}
          <div className="flex items-center gap-4">
            {/* Online count badge */}
            <div className="hidden sm:flex items-center gap-1.5 text-slate-400 text-sm">
              <Users className="h-4 w-4 text-brand-400" />
              <span className="font-medium text-white">{onlineCount}</span>
              <span>online</span>
              {queueCount > 0 && (
                <span className="ml-1 text-xs text-slate-500">({queueCount} in queue)</span>
              )}
            </div>

            <button
              onClick={handleLeave}
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <LogOut className="h-4 w-4" /> Exit
            </button>
          </div>
        </header>

        {/* Video Grids */}
        <div className="flex-1 min-h-0 flex flex-col sm:flex-row gap-4 relative z-10">

          {/* Stranger Video (Primary) */}
          <div className="relative flex-1 rounded-2xl overflow-hidden glass-panel group">
            {isSearching && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-dark-900/80 backdrop-blur-md gap-3">
                <div className="h-16 w-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
                <h2 className="text-xl font-bold text-white tracking-wider">SEARCHING FOR STRANGER</h2>
                <p className="text-slate-400 text-sm">Skipping the voids of the internet...</p>
                {/* Mobile online count */}
                <div className="flex items-center gap-1.5 text-slate-400 text-sm mt-2">
                  <Users className="h-4 w-4 text-brand-400" />
                  <span className="font-medium text-white">{onlineCount}</span>
                  <span>users online</span>
                </div>
              </div>
            )}
            <VideoPlayer stream={remoteStream} className="h-full w-full border-none shadow-none rounded-none" />

            {/* "STRANGER" label overlay */}
            {isConnected && (
              <div className="absolute top-2 left-2 z-10 rounded-lg bg-dark-900/70 px-2 py-1 text-xs font-semibold text-slate-300 backdrop-blur-sm">
                STRANGER
              </div>
            )}
          </div>

          {/* Local Video (PIP) */}
          <div className="relative h-48 sm:h-auto sm:w-1/3 rounded-2xl overflow-hidden glass-panel border border-brand-500/20">
            <div className="absolute bottom-2 left-2 z-10 rounded-lg bg-dark-900/80 px-2 py-1 text-xs font-semibold text-brand-400 backdrop-blur-sm">
              YOU
            </div>

            {/* Muted/video-off overlays */}
            {isVideoOff && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-dark-900/90">
                <VideoOff className="h-10 w-10 text-slate-500" />
              </div>
            )}

            <VideoPlayer stream={localStream} muted mirrored className="h-full w-full border-none shadow-none rounded-none" />
          </div>

        </div>

        {/* Controls Bar */}
        <div className="glass-panel flex items-center justify-center gap-4 p-4 rounded-2xl z-20">
          {/* Media Toggles */}
          <div className="flex gap-2">
            <button
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
              className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all ${isMuted ? 'bg-red-500/20 text-red-500 ring-1 ring-red-500/50' : 'bg-dark-700 hover:bg-dark-600 text-white'}`}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
            <button
              onClick={toggleVideo}
              title={isVideoOff ? 'Show Camera' : 'Hide Camera'}
              className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all ${isVideoOff ? 'bg-red-500/20 text-red-500 ring-1 ring-red-500/50' : 'bg-dark-700 hover:bg-dark-600 text-white'}`}
            >
              {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </button>
          </div>

          <div className="h-8 w-px bg-white/10" />

          {/* Next Button */}
          <button
            onClick={nextPerson}
            disabled={isSearching}
            className="group flex-1 max-w-xs flex items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 font-bold text-white shadow-lg transition-all hover:bg-orange-400 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            NEXT
            <SkipForward className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>

          <div className="h-8 w-px bg-white/10" />

          {/* Report */}
          <button
            onClick={handleReport}
            title="Report & Skip"
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-dark-700 hover:bg-red-500/20 text-slate-400 hover:text-red-500 transition-all"
          >
            <Flag className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ── Chat Section ──────────────────────────────────────── */}
      <div className="h-64 md:h-full md:w-96 p-4 pt-0 md:pt-4 md:pl-0 flex flex-col">
        <ChatBox
          messages={messages}
          onSendMessage={sendMessage}
          onTyping={handleTyping}
          isPartnerTyping={isPartnerTyping}
          disabled={!isConnected}
        />
      </div>

    </div>
  );
}
