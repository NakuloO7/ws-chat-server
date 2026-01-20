import { Request, Response } from "express";


export async function Logout(req : Request, res:Response){
    res.clearCookie('token');
    res.json({
        message : "Logged out!"
    })
}