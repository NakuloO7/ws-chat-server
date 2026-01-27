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
  userId: string | null;
  userName: string;
  text: string;
}

export const useWebSocket = (roomId: string) => {
  const socketRef = useRef<WebSocket | null>(null); //does NOT trigger re-renders when socket changes
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [fatalError, setFatalError] = useState(false);
  const currentRoomRef = useRef<string | null>(null);

  //create & destroy socket
  useEffect(() => {
    try {
      //create a websocket connection
      const socket = new WebSocket("ws://localhost:8080");
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("WS connected!");
        setConnected(true);
        socket.send(
          JSON.stringify({
            type: "join",
            roomId,
          }),
        );
        currentRoomRef.current = roomId;
      };

      //send message in the room
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        //Handle History of messages
        if (data.type === "history") {
          const normalized: UIMessage[] = data.messages.map((m: any) => ({
            userId: m.userId,
            userName: m.userName, // later you can resolve real user
            text: m.content,
          }));
          setMessages(normalized);
        }

        //Handle incoming messages
        if (data.type === "message") {
          const normalized: UIMessage = {
            userId: data.user.userId,
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
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    //leave the previous room
    //currentRoomRef.current. -> initial room the socket is in
    if (currentRoomRef.current) {
      socket.send(JSON.stringify({ type: "leave" }));
    }

    //join the new room
    socket.send(
      JSON.stringify({
        type: "join",
        roomId,
      }),
    );

    currentRoomRef.current = roomId;
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

  const leaveRoom = ()=>{
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify({ type: "leave" }));
    currentRoomRef.current = null;
    setMessages([]);
  }

  return {
    messages,
    sendMessage,
    connected,
    fatalError,
    leaveRoom
  };
};
