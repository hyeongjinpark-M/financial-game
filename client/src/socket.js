import { io } from 'socket.io-client';

// 개발: localhost:3001, 배포: VITE_SERVER_URL 환경변수 (Railway URL)
const URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
export const socket = io(URL, {
  transports: ['websocket', 'polling'],
});
