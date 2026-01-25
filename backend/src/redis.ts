import Redis from 'ioredis';

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;

//Publisher: used when THIS server wants to send a message to Redis
export const pub = new Redis({
    host : REDIS_HOST,
    port : REDIS_PORT
})


//Subscriber: used when THIS server wants to receive messages from Redis
export const sub = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT
})