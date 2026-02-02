import { Request, Response } from "express"
import { prisma } from "../db";
import bcrypt from 'bcrypt';
import { signToken } from "./utils";
import { loginSchema } from "../schemas/auth.schema";

export async function Login(req : Request, res : Response){
    const parsed = loginSchema.safeParse(req.body);
    if(!parsed.success){
        return res.status(400).json(parsed.error.format());
    }
    const {email, password} = parsed.data;
    if(!email || !password){
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

    const hashedPassword = await bcrypt.compare(password, existingUser.password);
    if(!hashedPassword){
        return res.status(401).json({
            message : "Invalid Credentials!"
        })
    };

    const token = signToken({userId : existingUser.id, name : existingUser.name});
    res.cookie("token", token, {
        httpOnly : true,
        sameSite : 'lax',
        path: "/",
    })

    res.json({
        message : "Login successfull"
    })
}