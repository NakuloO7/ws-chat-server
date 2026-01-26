import { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';


export interface AuthRequest extends Request{
    user?: {
        userId : string,
        name :string
    }
}

export const authMiddleware = (req : AuthRequest, res : Response, next : NextFunction) =>{
    const token = req.cookies?.token;
    if(!token){
        return res.status(401).json({
            message : "Invalid User!"
        })
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {            
           payload: {
                userId: string;
                name: string;
            };
        }
        req.user = {
            userId: decoded.payload.userId,
            name: decoded.payload.name,
        };
        next();
    } catch (error) {
        console.log("Error in auth middleware", error);
        return res.status(401).json({ message: "Invalid token" });
    }
};