'use client';

import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

let sharedSocket = null;

function getSocket() {
  if (!sharedSocket) {
    sharedSocket = io({
      transports: ['websocket', 'polling'],
    });
  }
  return sharedSocket;
}

export default function useSocket(eventName, handler, { joinLeaderboard = false, joinRoom = null } = {}) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const socket = getSocket();

    const listener = (...args) => {
      handlerRef.current?.(...args);
    };

    if (joinLeaderboard) {
      socket.emit('join_leaderboard');
    }

    if (joinRoom) {
      socket.emit('join_team_room', joinRoom);
    }

    if (eventName) {
      socket.on(eventName, listener);
    }

    return () => {
      if (eventName) {
        socket.off(eventName, listener);
      }
    };
  }, [eventName, joinLeaderboard, joinRoom?.teamId, joinRoom?.accessCode]);

  return getSocket();
}
