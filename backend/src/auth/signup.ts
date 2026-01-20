import { Request, Response } from "express";
import bcrypt from 'bcrypt';
import { prisma } from "../db";
import { signToken } from "./utils";

export async function Signup(req : Request, res : Response){
    const {name, email, passwod} = req.body;

    if(!name || !email || !passwod) {
        return res.status(400).json({
            message : "Missing fields"
        })
    }

    const hashedPassword = await bcrypt.hash(passwod, 10);
    const user = await prisma.user.create({
        data : {
            name,
            email,
            password : hashedPassword
        }
    });

    const token = signToken({userId : user.id, name : user.name});
    console.log("Token from signup route", token);
    res.cookie("token", token, {
        httpOnly : false,
        sameSite : 'lax'
    })

    res.json({
        message : "Signup successfull!"
    })
}