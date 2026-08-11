import { io } from 'socket.io-client';
import { SOCKET_URL } from './api';

const socket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ['websocket'],
});

// When admin suspends a user or per-event middleware catches them
socket.on('force-disconnect', ({ reason }) => {
  const reasonText = reason || 'Account suspended';

  // Only persist the suspension lockout for real suspensions.
  // Admin "kick" sends 'Admin forced disconnect' — don't falsely lock them out.
  const isSuspension = /suspend/i.test(reasonText);
  if (isSuspension) {
    localStorage.setItem('matchalize_suspended', JSON.stringify({
      reason: reasonText,
      suspendedAt: new Date().toISOString(),
    }));
  }

  socket.disconnect();
  window.location.href = '/auth';
});

export default socket;
