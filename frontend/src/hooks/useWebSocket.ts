import axios from "axios";
import { useEffect, useRef, useState } from "react";

export interface chatMessage {
  type: "message";
  roomId: string;
  user: {
    userId: string;
    name: string;
  };
  payload: string;
}

export interface UIMessage {
  id: string;
  userId: string | null;
  userName: string;
  text: string;
  createdAt: string;
  deleted?: boolean; // ✅ ADD
}

export const useWebSocket = (roomId: string) => {
  const socketRef = useRef<WebSocket | null>(null); //does NOT trigger re-renders when socket changes
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [fatalError, setFatalError] = useState(false);

  //Tracks which room the socket is currently in
  const currentRoomRef = useRef<string | null>(roomId);

  //Pagination state
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);

  //HTTP: Load initial messages (history)
  const loadInitialMessages = async (roomId: string) => {
    console.log("Loading initial messages for room:", roomId);
    const res = await axios.get(
      `http://localhost:3000/messages?roomId=${roomId}&limit=30`,
      {
        withCredentials: true,
      },
    );

    const data = res.data;
    const normalized: UIMessage[] = data.messages.map((m: any) => ({
      id: m.id,
      userId: m.userId,
      userName: m.userName,
      text: m.content,
      createdAt: m.createdAt,
    }));
    setMessages(normalized);
    setCursor(data.nextCursor);
    setHasMore(!!data.nextCursor);
  };

  const loadOlderMessages = async () => {
    if (!hasMore) return;
    if (loadingRef.current) return;
    if (!cursor) return;

    loadingRef.current = true;
    try {
      const res = await axios.get(
        `http://localhost:3000/messages?roomId=${roomId}&limit=30&cursor=${cursor}`,
        { withCredentials: true },
      );
      const data = res.data;
      const normalized: UIMessage[] = data.messages.map((m: any) => ({
        id: m.id,
        userId: m.userId,
        userName: m.userName,
        text: m.content,
        createdAt: m.createdAt,
      }));

      // ⬆️ PREPEND older messages
      setMessages((prev) => [...normalized, ...prev]);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } finally {
      loadingRef.current = false;
    }
  };

  //create & destroy socket
  useEffect(() => {
    try {
      //create a websocket connection
      const socket = new WebSocket("ws://localhost:8080");
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("WS connected!");
        setConnected(true);
        // ✅ Join room ONLY after socket is open
        if (currentRoomRef.current) {
          socket.send(
            JSON.stringify({
              type: "join",
              roomId: currentRoomRef.current,
            }),
          );
        }
      };

      //send message in the room
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        // //Handle History of messages
        // if (data.type === "history") {
        //   const normalized: UIMessage[] = data.messages.map((m: any) => ({
        //     userId: m.userId,
        //     userName: m.userName, // later you can resolve real user
        //     text: m.content,
        //   }));
        //   setMessages(normalized);
        // }

        //Handle incoming messages
        if (data.type === "message") {
          const normalized: UIMessage = {
            id: data.id,
            userId: data.user.userId,
            userName: data.user.name,
            text: data.payload,
            createdAt: data.createdAt,
          };
          setMessages((prev) => {
            if (prev.some((m) => m.id === normalized.id)) return prev;
            return [...prev, normalized];
          });
        }

        //handle edit message
        if (data.type === "edit") {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === data.messageId ? { ...msg, text: data.text } : msg,
            ),
          );
        }

        //handle delete message
        if (data.type === "delete") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === data.messageId ? { ...m, deleted: true, text: "" } : m,
            ),
          );
        }
      };

      socket.onerror = (err) => {
        console.log("WS error", err);
        setFatalError(true);
      };

      socket.onclose = (event) => {
        console.log("WS closed!", event.code, event.reason);
        setConnected(false);
        // Auth failure → backend closed connection
        // Only treat certain closes as auth failure
        if (event.code === 1008 || event.code === 4001) {
          setFatalError(true);
        }
      };

      return () => {
        socket.close();
      };
    } catch (error) {
      console.error("WS setup failed", error);
      setFatalError(true);
    }
  }, []);

  //for joining and leaving the room
  useEffect(() => {
    const socket = socketRef.current;
    const prevRoom = currentRoomRef.current;

    // leave previous room FIRST
    if (socket && socket.readyState === WebSocket.OPEN && prevRoom) {
      socket.send(JSON.stringify({ type: "leave" }));
    }
    // update room ref
    currentRoomRef.current = roomId;

    // reset state
    setMessages([]);
    setCursor(null);
    setHasMore(true);
    
    // load history
    loadInitialMessages(roomId);
  
    // join new room
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "join", roomId }));
    }
  }, [roomId]);

  const sendMessage = (text: string) => {
    if (!socketRef.current) return;
    if (socketRef.current.readyState !== WebSocket.OPEN) return;

    socketRef.current.send(
      JSON.stringify({
        type: "message",
        payload: text,
      }),
    );
  };

  const leaveRoom = () => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify({ type: "leave" }));
    currentRoomRef.current = null;
    setMessages([]);
    setCursor(null);
    setHasMore(true);
  };

  return {
    messages,
    sendMessage,
    connected,
    fatalError,
    leaveRoom,
    // pagination state exposed (Phase 9.3A)
    cursor,
    hasMore,
    loadOlderMessages,
  };
};
