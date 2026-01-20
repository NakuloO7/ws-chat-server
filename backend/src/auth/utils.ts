import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || "54322";

export const signToken = (payload: object)=>{
    const token= jwt.sign({payload}, JWT_SECRET, { expiresIn: "7d" });
    return token;
}