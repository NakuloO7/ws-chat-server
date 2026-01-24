import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.route';

import path from "path";
const PORT = 3000;

const app = express();

app.use(express.json());
app.use(cookieParser());


app.use(cors({
    origin: ["http://localhost:3000", 'http://127.0.0.1:5500'],
    credentials: true,
}));

app.use(express.static(path.join(__dirname, "..", "public")));

app.use('/auth', authRouter);

export default app;