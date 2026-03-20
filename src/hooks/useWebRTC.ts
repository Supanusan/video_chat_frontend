import { useState, useRef, useCallback, useEffect } from 'react';
import { socketService } from '@/lib/socket';

export type ConnectionState = 'idle' | 'searching' | 'connected' | 'error';

// ICE servers for NAT traversal
const iceServers: RTCConfiguration = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
    {
      urls: 'turn:global.relay.metered.ca:443',
      username: '853ae06f64723f4733c7269ebecaec24c039',
      credential: '853ae06f64723f4733c7269ebecaec24c039',
    },
    {
      urls: 'turns:global.relay.metered.ca:443?transport=tcp',
      username: '853ae06f64723f4733c7269ebecaec24c039',
      credential: '853ae06f64723f4733c7269ebecaec24c039',
    },
  ],
  iceCandidatePoolSize: 10,
};

export function useWebRTC() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ sender: 'me' | 'partner'; text: string }[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [queueCount, setQueueCount] = useState(0);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef(socketService.getSocket());
  const roomIdRef = useRef<string | null>(null);
  const connectionStateRef = useRef<ConnectionState>('idle');

  // Sync refs with state
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);
  useEffect(() => { connectionStateRef.current = connectionState; }, [connectionState]);

  // ─── 1. Local Stream ───────────────────────────────────────────────────────

  const startLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices.', error);
      setConnectionState('error');
      throw error;
    }
  }, []);

  const stopLocalStream = useCallback((stream: MediaStream | null) => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
  }, []);

  // ─── 2. Peer Connection ────────────────────────────────────────────────────

  const cleanupRTC = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setRemoteStream(null);
    setRoomId(null);
    setMessages([]);
  }, []);

  const setupPeerConnection = useCallback((room: string, stream: MediaStream | null) => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    const pc = new RTCPeerConnection(iceServers);
    peerConnectionRef.current = pc;
    setRoomId(room);

    // Add local tracks
    if (stream) {
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
    }

    // Receive remote tracks -> show remote video
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        console.log('Received remote video stream');
        setRemoteStream(event.streams[0]);
        setConnectionState('connected');
      }
    };

    // Send ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('ice-candidate', { roomId: room, candidate: event.candidate });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log('WebRTC Connection State:', state);

      if (state === 'disconnected') {
        // Try ICE restart before giving up
        pc.restartIce();
      }

      if (state === 'failed' || state === 'closed') {
        console.log('WebRTC connection failed/closed - re-queuing.');
        cleanupRTC();
        setConnectionState('idle');
        setTimeout(() => {
          if (connectionStateRef.current === 'idle') {
            setConnectionState('searching');
            socketRef.current.emit('join-queue');
          }
        }, 500);
      }
    };

    return pc;
  }, [cleanupRTC]);

  // ─── 3. Queue & Navigation ─────────────────────────────────────────────────

  const startSearch = useCallback(() => {
    if (connectionStateRef.current === 'searching' || connectionStateRef.current === 'connected') {
      return;
    }

    cleanupRTC();
    setConnectionState('searching');

    const socket = socketRef.current;

    const emitJoinQueue = () => {
      socket.emit('join-queue');
    };

    if (socket.connected) {
      emitJoinQueue();
    } else {
      socket.once('connect', emitJoinQueue);
      socket.connect();
    }
  }, [cleanupRTC]);

  const nextPerson = useCallback(() => {
    const currentRoom = roomIdRef.current;
    if (currentRoom) {
      socketRef.current.emit('next', { roomId: currentRoom });
    }
    cleanupRTC();
    setConnectionState('idle');
    setTimeout(() => {
      setConnectionState('searching');
      socketRef.current.emit('join-queue');
    }, 150);
  }, [cleanupRTC]);

  const leave = useCallback(() => {
    const currentRoom = roomIdRef.current;
    if (currentRoom) {
      socketRef.current.emit('next', { roomId: currentRoom });
    }
    setLocalStream(prev => {
      stopLocalStream(prev);
      return null;
    });
    cleanupRTC();
    setConnectionState('idle');
  }, [cleanupRTC, stopLocalStream]);

  // ─── 4. Text Chat ──────────────────────────────────────────────────────────

  const sendMessage = useCallback((text: string) => {
    const currentRoom = roomIdRef.current;
    if (currentRoom && text.trim()) {
      socketRef.current.emit('chat-message', { roomId: currentRoom, text });
      setMessages(prev => [...prev, { sender: 'me', text }]);
    }
  }, []);

  const sendTyping = useCallback((isTyping: boolean) => {
    const currentRoom = roomIdRef.current;
    if (currentRoom) {
      socketRef.current.emit('typing', { roomId: currentRoom, isTyping });
    }
  }, []);

  // ─── 5. Socket Event Listeners ─────────────────────────────────────────────

  const localStreamRef = useRef<MediaStream | null>(null);
  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);

  useEffect(() => {
    const socket = socketRef.current;

    const onMatchFound = async ({
      roomId: room,
      isInitiator,
    }: {
      partnerId: string;
      roomId: string;
      isInitiator: boolean;
    }) => {
      console.log(`Match found! Room: ${room}, Initiator: ${isInitiator}`);

      const pc = setupPeerConnection(room, localStreamRef.current);

      if (isInitiator) {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('offer', { roomId: room, offer });
        } catch (err) {
          console.error('Error creating offer:', err);
        }
      }
    };

    const onOffer = async (offer: RTCSessionDescriptionInit) => {
      if (!peerConnectionRef.current) return;
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        const currentRoom = roomIdRef.current;
        if (currentRoom) {
          socket.emit('answer', { roomId: currentRoom, answer });
        } else {
          console.error('No Room ID when trying to send answer');
        }
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    };

    const onAnswer = async (answer: RTCSessionDescriptionInit) => {
      if (!peerConnectionRef.current) return;
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error('Error handling answer:', err);
      }
    };

    const onIceCandidate = async (candidate: RTCIceCandidateInit) => {
      if (!peerConnectionRef.current) return;
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        // Silently ignore ICE candidate errors (common with timing issues)
      }
    };

    const onPeerDisconnected = () => {
      console.log('Peer disconnected cleanly');
      cleanupRTC();
      setConnectionState('idle');
      setTimeout(() => {
        setConnectionState('searching');
        socketRef.current.emit('join-queue');
      }, 300);
    };

    const onChatMessage = (text: string) => {
      setMessages(prev => [...prev, { sender: 'partner', text }]);
    };

    const onStats = ({
      onlineCount,
      queueCount,
    }: {
      onlineCount: number;
      queueCount: number;
    }) => {
      setOnlineCount(onlineCount);
      setQueueCount(queueCount);
    };

    const onTyping = ({ isTyping }: { isTyping: boolean }) => {
      setIsPartnerTyping(isTyping);
      if (isTyping) {
        setTimeout(() => setIsPartnerTyping(false), 3000);
      }
    };

    socket.on('match-found', onMatchFound);
    socket.on('offer', onOffer);
    socket.on('answer', onAnswer);
    socket.on('ice-candidate', onIceCandidate);
    socket.on('peer-disconnected', onPeerDisconnected);
    socket.on('chat-message', onChatMessage);
    socket.on('stats', onStats);
    socket.on('typing', onTyping);

    return () => {
      socket.off('match-found', onMatchFound);
      socket.off('offer', onOffer);
      socket.off('answer', onAnswer);
      socket.off('ice-candidate', onIceCandidate);
      socket.off('peer-disconnected', onPeerDisconnected);
      socket.off('chat-message', onChatMessage);
      socket.off('stats', onStats);
      socket.off('typing', onTyping);
    };
  }, [setupPeerConnection, cleanupRTC]);

  return {
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
  };
}
