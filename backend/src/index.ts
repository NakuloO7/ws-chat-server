import WebSocket, { WebSocketServer } from "ws";

const PORT = 8080;

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

wss.on("connection", (socket)=>{
    console.log("new client connected");

    //when message is received from the client 
    socket.on("message", (data)=>{
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
                socket.send(
                    JSON.stringify({
                        type: "system",
                        message: `Joined room ${roomId}`,
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