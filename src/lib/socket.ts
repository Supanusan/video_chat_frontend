import { io, Socket } from 'socket.io-client';

// ✅ Fixed
const URL = process.env.NEXT_PUBLIC_SOCKET_URL || "https://videochatbackend-production.up.railway.app";
class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(URL, {
        autoConnect: false, // Don't connect until explicitly asked
      });
    }
    if (!this.socket.connected) {
      this.socket.connect();
    }
    return this.socket;
  }

  getSocket() {
    if (!this.socket) {
      // Create socket but DON'T connect yet — avoids inflating online count
      // before user actually clicks "Start Chatting"
      this.socket = io(URL, {
        autoConnect: false,
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
