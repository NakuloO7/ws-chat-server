import WebSocket, { WebSocketServer } from "ws";

const PORT = 8080;

//create the websocket server
const wss = new WebSocketServer({port : PORT}); 
console.log(`Websocket sever running on ws://localhost:${PORT}`);

//store all the connected clients
const clients = new Set<WebSocket>();  //stores the unique values

wss.on("connection", (socket)=>{
    console.log("new client connected");
    clients.add(socket);   //added to the set

    //when message is received from the client 
    socket.on("message", (data)=>{
        const message = data.toString();   //the data is raw binary data so convert it to string first
        console.log("Received", message);
        
        //Broadcast this message to all the connected clients
        for(const client of clients){
            if(client.readyState === WebSocket.OPEN){
                client.send(message);
            }
        }
    });

    //handle the close
    socket.on("close", ()=>{
        console.log("Client disconnected");
        clients.delete(socket);
    });

    //error handled
    socket.on('error', (err)=>{
        console.log("Socket error", err);
    })
})