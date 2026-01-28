import { Router  } from "express";
import { prisma } from "../db";


const router = Router();

//GET /messages?roomId=xxx&cursor=ISO_DATE&limit=30
router.get('/', async(req , res)=>{
    const {roomId, cursor, limit} = req.query;

    if(!roomId || typeof(roomId) !== "string"){
        return res.status(400).json({error : "RoomId required!"});
    };

    const take = Number(limit) || 30;

    const messages =await prisma.message.findMany({
        where : {
            roomId,
            ...(cursor
              ? {
                  createdAt: {
                    lt: new Date(cursor as string),
                  },
                }
            : {}),
        },
        orderBy : {
            createdAt: "desc",
        },
        take
    });

    res.json({
        messages : messages.reverse(),  //older first
        nextCursor: messages[0]?.createdAt ?? null,
    })

})

export default router;


//messages.ts returns messages older than a given timestamp, in small batches, so chat apps don’t load everything at once.
