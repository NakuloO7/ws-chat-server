import { Request, Response } from "express";

export async function Logout(req: Request, res: Response) {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // true in production (HTTPS)
  });
  res.json({
    message: "Logged out!",
  });
}
