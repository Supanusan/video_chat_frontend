"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Zap, 
  ShieldCheck, 
  User, 
  RefreshCw, 
  AlertTriangle, 
  Bell,
  Info
} from 'lucide-react';

export default function Home() {
  const [nickname, setNickname] = useState("");
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isFinding, setIsFinding] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showToast, setShowToast] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera preview
  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermission(true);
      } catch (err) {
        console.error("Camera access denied:", err);
        setHasPermission(false);
      }
    }
    setupCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle toggles
  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const handleStartChat = () => {
    setIsFinding(true);
    // Mock finding a match
    setTimeout(() => {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 1500);
  };

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8 md:py-12 relative">
      {/* Toast Notification */}
      <div className={`fixed top-6 right-6 z-50 transition-all duration-500 transform ${showToast ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0'}`}>
        <div className="glass-panel px-6 py-4 rounded-2xl flex items-center gap-3 border-brand-500/30">
          <div className="bg-brand-500 p-2 rounded-full">
            <Bell className="w-4 h-4 text-white" />
          </div>
          <p className="font-semibold text-sm">New person found! Connecting...</p>
        </div>
      </div>

      {/* Header Section */}
      <header className="max-w-4xl w-full text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="bg-gradient-to-br from-brand-500 to-accent-purple p-2 rounded-xl shadow-lg">
            <Video className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-accent-purple">
            Meetzy
          </h2>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
          Meet <span className="text-brand-500">Strangers</span> Instantly
        </h1>
        <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto">
          Safe, private, zero lag, random video chats.
        </p>
      </header>

      {/* Main Interaction Area */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* Left Content - Prep & Preview (Lg: 7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="relative group">
            {/* Video Container */}
            <div className="aspect-video w-full rounded-[2rem] overflow-hidden glass-panel video-glow relative">
              {hasPermission === false ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-800 text-center p-8">
                  <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
                  <h3 className="text-xl font-bold mb-2 text-white">Camera Access Required</h3>
                  <p className="text-slate-400">Please enable camera and microphone permissions to start chatting.</p>
                </div>
              ) : (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover mirror scale-x-[-1]"
                  />
                  {/* Overlay Controls */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/20 backdrop-blur-md p-2 rounded-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button 
                      onClick={toggleMic}
                      className={`p-3 rounded-xl transition-all ${isMicOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500/80 hover:bg-red-500'}`}
                    >
                      {isMicOn ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
                    </button>
                    <button 
                      onClick={toggleCamera}
                      className={`p-3 rounded-xl transition-all ${isCameraOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500/80 hover:bg-red-500'}`}
                    >
                      {isCameraOn ? <Video className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-white" />}
                    </button>
                  </div>
                  {/* Status Tag */}
                  <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">Preview Mode</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Controls Below Video */}
          <div className="flex flex-wrap gap-4 items-center justify-between px-2">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-slate-400">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                <span className="text-sm font-semibold">End-to-end Private</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-semibold">No Lag</span>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
              <Info className="w-4 h-4" />
              <span>Data flows peer-to-peer</span>
            </div>
          </div>
        </div>

        {/* Right Content - Actions (Lg: 5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6 lg:mt-0">
          <div className="glass-panel p-8 rounded-[2rem] flex flex-col gap-8">
            <div>
              <label htmlFor="nickname" className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
                Your Nickname (Optional)
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="text" 
                  id="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="CoolStranger42"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all font-medium"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={handleStartChat}
                disabled={isFinding}
                className="btn-primary w-full text-lg h-16 group"
              >
                {isFinding ? (
                  <>
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    Finding someone...
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6 group-hover:scale-125 transition-transform" />
                    Start Chatting Now
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-4">
                <button className="btn-secondary h-14">
                  <RefreshCw className="w-5 h-5" />
                  Skip
                </button>
                <button className="btn-danger h-14">
                  <AlertTriangle className="w-5 h-5" />
                  Report
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <div className="flex items-start gap-4">
                <div className="bg-brand-500/10 p-3 rounded-2xl mt-1">
                  <ShieldCheck className="w-6 h-6 text-brand-400" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200">Safety First</h4>
                  <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                    We prioritize your safety. Any inappropriate behavior will result in a permanent ban.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Statistics or Hint */}
          <div className="px-8 py-4 bg-brand-500/5 border border-brand-500/10 rounded-2xl flex items-center justify-between">
            <span className="text-brand-400 font-bold text-sm">4,209 Active Strangers</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-dark-900 bg-slate-700 -ml-2 first:ml-0 overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-brand-400 to-purple-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto pt-24 pb-8 w-full max-w-4xl text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-4" />
          <p className="text-slate-500 text-sm font-medium">
            Privacy-friendly, data flows peer-to-peer.
          </p>
          <div className="flex gap-6 text-slate-600 font-bold text-xs uppercase tracking-widest">
            <a href="#" className="hover:text-brand-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-brand-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-brand-400 transition-colors">Safety Tips</a>
          </div>
        </div>
      </footer>

      {/* Background Blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[40rem] h-[40rem] bg-brand-500/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-[20%] right-[10%] w-[35rem] h-[35rem] bg-accent-purple/10 blur-[100px] rounded-full" />
      </div>
    </main>
  );
}
