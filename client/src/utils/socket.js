import { io } from 'socket.io-client';
import { SOCKET_URL } from './api';

const socket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ['websocket'],
});

export default socket;
