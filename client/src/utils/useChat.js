import { useState, useEffect, useRef, useCallback } from 'react';
import socket from './socket';
import { api } from './api';

const getMe = () => {
  try {
    return JSON.parse(localStorage.getItem('matchalize_user'))?._id || null;
  } catch {
    return null;
  }
};

export const useChat = (matchId) => {
  const [messages, setMessages] = useState([]);
  const [pendingMessages, setPendingMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(socket.connected);

  // Use refs for mutable state to prevent callback reference recreation
  const pendingRef = useRef(pendingMessages);
  useEffect(() => {
    pendingRef.current = pendingMessages;
  }, [pendingMessages]);

  const isConnectedRef = useRef(isConnected);
  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  // STABLE CALLBACK: Zero dependencies mean this function never re-creates
  const sendMessage = useCallback(async (text) => {
    const me = getMe();
    const tempId = Date.now().toString();
    const tempMsg = { _id: tempId, text, deliveryStatus: 'pending', senderId: me };

    if (!isConnectedRef.current) {
      setPendingMessages(prev => [...prev, tempMsg]);
      return;
    }

    setMessages(prev => [...prev, tempMsg]);
    try {
      const sent = await api.post(`/messages/${matchId}`, { text, clientMsgId: crypto.randomUUID() });
      setMessages(prev => prev.map(m => (m._id === tempId ? { ...sent, deliveryStatus: sent.deliveryStatus || 'sent' } : m)));
    } catch {
      setMessages(prev => prev.map(m => (m._id === tempId ? { ...m, deliveryStatus: 'failed' } : m)));
    }
  }, [matchId]);

  // Fetch initial message history
  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      try {
        const data = await api.get(`/messages/${matchId}`);
        if (isMounted) setMessages(data.messages || []);
      } catch (err) {
        console.error('History fetch failed', err);
      }
    };
    fetchHistory();
    return () => { isMounted = false; };
  }, [matchId]);

  // Socket connection & event listeners (Runs ONLY when matchId changes)
  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      socket.emit('join-match', matchId);
      // Flush pending queue automatically
      pendingRef.current.forEach(msg => sendMessage(msg.text));
      setPendingMessages([]);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleNewMessage = (msg) => {
      setMessages(prev => (prev.some(m => m._id === msg._id) ? prev : [...prev, msg]));
    };

    // If global socket is already active, join immediately
    if (socket.connected) {
      handleConnect();
    } else {
      socket.connect();
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('new-message', handleNewMessage);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('new-message', handleNewMessage);
    };
  }, [matchId, sendMessage]);

  return { messages, sendMessage, isConnected };
};
