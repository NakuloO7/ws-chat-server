import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

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
  id?: string;
  userName: string;
  text: string;
  createdAt?: string;
}

export const useWebSocket = (roomId: string) => {
  const socketRef = useRef<WebSocket | null>(null); //does NOT trigger re-renders when socket changes
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [fatalError, setFatalError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    try {
      //create a websocket connection
      const socket = new WebSocket("ws://localhost:8080");
      socketRef.current = socket;

      socket.onopen = () => {
        if (!isMounted) return;
        console.log("WS connected!");
        setConnected(true);

        //Join room
        socket.send(
          JSON.stringify({
            type: "join",
            roomId,
          }),
        );
      };

      //send message in the room
      socket.onmessage = (event) => {
        if (!isMounted) return;
        const data = JSON.parse(event.data);

        //Handle History of messages
        if (data.type === "history") {
          const normalized: UIMessage[] = data.messages.map((m: any) => ({
            id: m.id,
            userName: "History", // later you can resolve real user
            text: m.content,
            createdAt: m.createdAt,
          }));

          setMessages(normalized);
        }

        //Handle incoming messages
        if (data.type === "message") {
          const normalized: UIMessage = {
            userName: data.user.name,
            text: data.payload,
          };

          setMessages((prev) => [...prev, normalized]);
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
        isMounted = false;
        socket.close();
      };
    } catch (error) {
      console.error("WS setup failed", error);
      setFatalError(true);
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

  return {
    messages,
    sendMessage,
    connected,
    fatalError,
  };
};
