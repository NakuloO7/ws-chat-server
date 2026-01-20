import { Router } from "express";
import { Signup } from "../auth/signup";
import { Login } from "../auth/login";
import { Logout } from "../auth/logout";

const router = Router();

router.post('signup', Signup);
router.post('login', Login);
router.post('logout', Logout);

export default router;