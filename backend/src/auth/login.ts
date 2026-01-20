import { Request, Response } from "express"
import { prisma } from "../db";
import bcrypt from 'bcrypt';
import { signToken } from "./utils";

export async function Login(req : Request, res : Response){
    const {email, passwod} = req.body;
    if(!email || !passwod){
        return res.status(400).json({
            message : "Missing fields!"
        })
    }  

    const existingUser = await prisma.user.findUnique({
        where : {
            email
        }
    });

    if(!existingUser){
        return res.status(401).json({
            message : "Invalid Credentials!"
        })
    }

    const hashedPassword = await bcrypt.compare(passwod, existingUser.password);
    if(!hashedPassword){
        return res.status(401).json({
            message : "Invalid Credentials!"
        })
    };

    const token = signToken({userId : existingUser.id, name : existingUser.name});
    res.cookie("token", token, {
        httpOnly : true,
        sameSite : 'lax'
    })

    res.json({
        message : "Login successfull"
    })
}