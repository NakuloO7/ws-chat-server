import WebSocket from "ws";

export interface AuthenticateSocket extends WebSocket {
    user? :{
        userId : string,
        name : string,
    }
}