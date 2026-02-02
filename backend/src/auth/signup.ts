import { Request, Response } from "express";
import bcrypt from 'bcrypt';
import { prisma } from "../db";
import { signToken } from "./utils";
import { signupSchema } from "../schemas/auth.schema";

export async function Signup(req : Request, res : Response){
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json(parsed.error.format());
    }
    const {name, email, password} = parsed.data;

    if(!name || !email || !password) {
        return res.status(400).json({
            message : "Missing fields"
        })
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data : {
            name,
            email,
            password : hashedPassword
        }
    });

    const token = signToken({userId : user.id, name : user.name});
    res.cookie("token", token, {
        httpOnly : false,
        sameSite : 'lax',
        path: "/",
    })

    res.json({
        message : "Signup successfull!"
    })
}