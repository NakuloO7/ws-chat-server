import WebSocket, { WebSocketServer } from "ws";
import { prisma } from "./db";
import cookie from 'cookie';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const PORT = 8080;
const JWT_SECRET = process.env.JWT_SECRET || "54322";

interface AuthenticateSocket extends WebSocket {
    user? :{
        userId : string,
        name : string,
    }
}



//create the websocket server
const wss = new WebSocketServer({port : PORT}); 
console.log(`Websocket sever running on ws://localhost:${PORT}`);


// roomId -> set of sockets
const rooms = new Map<string, Set<WebSocket>>(); //For each room name, store a SET of sockets connected to that room
/*
rooms = {
  "general" → Set(socketA, socketB),
  "random"  → Set(socketC)
}
*/

// socket -> roomId
const socketRoom = new Map<WebSocket, string>();  //For each socket, remember which room it belongs to
/*
socketRoom = {
  socketA → "general",
  socketB → "general",
  socketC → "random"
}
*/

//	To broadcast → you need room → sockets
// 	To clean up → you need socket → room

wss.on("connection", (socket : AuthenticateSocket, req)=>{
    console.log("new client connected");

    //authentication logic 
    try {
        const cookieHeader = req.headers.cookie;
        if(!cookieHeader){
            socket.close();
            return;
        }

        const cookies = cookie.parse(cookieHeader);
        console.log("check the cookies", cookies);
        const token = cookies.token;
        console.log("check the token", token);

        if(!token){
            socket.close();
            return;
        }

        const payload = jwt.verify(token, JWT_SECRET!) as {
            userId : string,
            name : string
        };

        socket.user = {
            userId : payload.userId,
            name : payload.name
        }
        console.log(`Authenticated via cookie: ${payload.name}`);
    } catch (error) {
        console.log("Cookie auth failed");
        socket.close();
        return;
    }

    //when message is received from the client 
    socket.on("message",async (data)=>{
        try {
            const parsed = JSON.parse(data.toString());  //parses the json string obj and convert it to obj
            const {type, roomId, payload} = parsed;  

            //join room logic
            if(type === "join"){
                if(!roomId) return;
                // Remove socket from old room (if any)
                const prevRoom = socketRoom.get(socket);
                if(prevRoom){
                    rooms.get(prevRoom)?.delete(socket);
                }

                // Add to new room
                if(!rooms.has(roomId)){
                    rooms.set(roomId, new Set());
                    //rooms = {
                    //  "general" → Set()
                    // }
                }
                rooms.get(roomId)?.add(socket);  
                socketRoom.set(socket, roomId);

                console.log(`Client joined room: ${roomId}`);
                //retriving the messages from the database
                const messages = await prisma.message.findMany({
                    where : {roomId},
                    orderBy : {createdAt : "asc"},
                    take: 50,
                })
                socket.send(
                    JSON.stringify({
                        type: "history",
                        messages,
                    })
                );
            }

            //send message in the room
            if(type === "message"){
                const currentRoom = socketRoom.get(socket);  //this will give the name of room for which the current socket belongs
                if(!currentRoom) return;

                const clients = rooms.get(currentRoom);  //this will return the set of sockets belong to current room
                if(!clients) return;
                for(const client of clients){
                    if(client.readyState === WebSocket.OPEN){
                        client.send(
                            JSON.stringify({
                                type : "message", 
                                roomId : currentRoom,
                                payload,
                            })
                        )
                    };
                };

                //save the messages to the database
                await prisma.message.create({
                    data : {
                        roomId : currentRoom,
                        content : payload
                    }
                })
            }

        } catch (error) {
            console.error("Invalid message format");
        };


        //handle disconnect 
        socket.on('close', ()=>{
            const roomId = socketRoom.get(socket);
            if(roomId){
                rooms.get(roomId)?.delete(socket);
                socketRoom.delete(socket);
                console.log(`Client left room: ${roomId}`);
            }
        })
    });
})