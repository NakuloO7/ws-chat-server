import { Router  } from "express";
import { prisma } from "../db";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { pub } from "../redis";


const router = Router();

//GET /messages?roomId=xxx&cursor=ISO_DATE&limit=30
router.get('/',authMiddleware, async(req : AuthRequest , res)=>{
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
router.patch('/:id', authMiddleware, async(req : AuthRequest , res)=>{
    const {id} = req.params;
    const {text} = req.body;
    if(!text || !text.trim()){
        return  res.status(400).json({ error: "Text required" });
    }

    if (typeof id !== "string") {
        return res.status(400).json({ error: "Invalid message id" });
    }

    if(!req.user){
        return res.sendStatus(401);
    }

    const message = await prisma.message.findUnique({
        where : {id}
    })

    if(!message){
        return res.sendStatus(404);
    }

    //check for the message owner 
    if(message.userId !== req.user.userId){
        return res.sendStatus(403);
    }

    const updated = await prisma.message.update({
        where : {id}, 
        data : {
            content : text
        }
    });

    //Broadcast edit event 
    await pub.publish(
        `room:${message.roomId}`,
        JSON.stringify({
            type : "edit",
            messageId : updated.id,
            text : updated.content
        })
    )

    res.json(updated);
});


router.delete('/:id', authMiddleware, async(req : AuthRequest, res)=>{
    const {id} = req.params;
    if(typeof(id) !== "string"){
        return res.status(400).json({ error: "Invalid message id" });
    }

    const message = await prisma.message.findUnique({
        where : {id}
    })
    if(!message){
        return res.sendStatus(404);
    }

    if(!req.user || message.userId !== req.user.userId){
        return res.sendStatus(403);
    }

    const deleted = await prisma.message.delete({
        where : {id}
    });

    //realtime broadcast
    await pub.publish(
        `room:${message.roomId}`,
        JSON.stringify({
            type: "delete",
            messageId: deleted.id,
        })
    );

    res.json({success : true});
})