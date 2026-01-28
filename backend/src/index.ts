import WebSocket, { WebSocketServer } from "ws";
import { prisma } from "./db";
import * as cookie from "cookie";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { AuthenticateSocket } from "./types/ws";
import { IncomingMessage } from "http";
import app from "./http";
import { pub, sub } from "./redis";
dotenv.config();

const WS_PORT = Number(process.env.WS_PORT) || 8080;
const JWT_SECRET = process.env.JWT_SECRET || "54322";





//create the websocket server
const wss = new WebSocketServer({port : WS_PORT}); 
console.log(`Websocket sever running on ws://localhost:${WS_PORT}`);


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


sub.psubscribe("room:*");  //redis subscriber code

//this will put the message received in a particular room of the socket
sub.on('pmessage', (_, channel, message)=>{
    const roomId = channel.replace("room:", "");
    const parsed = JSON.parse(message);

    const clients = rooms.get(roomId);
    if(!clients) return;
    for(const client of clients){
        if(client.readyState === WebSocket.OPEN){
            client.send(JSON.stringify(parsed));
        }
    }
})

wss.on("connection", (socket : AuthenticateSocket, req : IncomingMessage)=>{
    console.log("new client connected");

    //authentication logic 
    try {
        const cookieHeader = req.headers.cookie;
        
        if(!cookieHeader){
            console.log("NO COOKIE → CLOSING");
            socket.close();
            return;
        }

        const cookies = cookie.parse(cookieHeader);
        const token = cookies.token;

        if(!token){
            socket.close();
            return;
        }

        const decoded = jwt.verify(token, JWT_SECRET!) as {
           payload: {
                userId: string;
                name: string;
            };
        };

        socket.user = {
            userId : decoded.payload.userId,
            name : decoded.payload.name
        }
    } catch (error) {
        console.log("Cookie auth failed");
        console.log("AUTH ERROR", error);
        socket.close();
        return;
    }

    //when message is received from the client 
    socket.on("message",async (data)=>{
        try {
            const parsed = JSON.parse(data.toString());  //parses the json string obj and convert it to obj
            const {type, roomId, payload} = parsed;  
            if(!socket.user) return;

            //join room logic
            if(type === "join"){
                if(!roomId) return;
                // Remove socket from old room (if any)
                const prevRoom = socketRoom.get(socket);  //for eg if the socket belongs to the genral room then prevRoom = general
                //and then we can remove that socket form the rooms i.e general in this case
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
            
            //leave the room logic
            if(type === "leave"){
                const currentRoom = socketRoom.get(socket);
                if(!currentRoom) return;
                
                rooms.get(currentRoom)?.delete(socket);
                socketRoom.delete(socket);
                console.log(`Client left room: ${currentRoom}`);
            }

            //send message in the room
            if(type === "message"){
                const currentRoom = socketRoom.get(socket);  //this will give the name of room for which the current socket belongs
                if(!currentRoom) return;

                const clients = rooms.get(currentRoom);  //this will return the set of sockets belong to current room
                if(!clients) return;
                const messageData  = {
                    type : "message", 
                    roomId : currentRoom,
                    user : socket.user,
                    payload, 
                }
                // for(const client of clients){
                //     if(client.readyState === WebSocket.OPEN){
                //         client.send(JSON.stringify(messageData));
                //     };
                // };   //because we are using redis now

                // Publish to Redis instead of local broadcast
                await pub.publish(`room:${currentRoom}`,JSON.stringify(messageData));

                //save the messages to the database
                await prisma.message.create({
                    data : {
                        roomId : currentRoom,
                        content : payload,
                        userId : socket.user.userId,
                        userName : socket.user.name
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


//out http sever
app.listen(3000, () => {
  console.log("HTTP auth server running on port 3000");
});