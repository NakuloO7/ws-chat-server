import { Router } from "express";
import { Signup } from "../auth/signup";
import { Login } from "../auth/login";
import { Logout } from "../auth/logout";
import { AuthRequest, authMiddleware } from "../middleware/auth";

const router = Router();

router.post('/signup', Signup);
router.post('/login', Login);
router.post('/logout', Logout);

//this route it wrote to determine the exact logged in user such that its username can be added to the chat
router.get("/me", authMiddleware, (req : AuthRequest , res)=>{ 
    res.json({
        userId : req.user?.userId,
        name : req.user?.name,
    })
})


export default router;