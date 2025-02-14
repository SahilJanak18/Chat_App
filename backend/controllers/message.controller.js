import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { getRecieverSocketId } from "../socket/socket.js";
import { io } from "../socket/socket.js";

export const sendMessage=async(req,res)=>{
    try {
        const{message}=req.body;
        const{id:recieverId}=req.params;
        const SenderId=req.user._id;

        let conversation= await Conversation.findOne({
            participants:{$all:[SenderId,recieverId]},
        })

        if(!conversation){
            conversation=await Conversation.create({
                participants:[SenderId,recieverId],
            });
        }
        
        const newMessage= new Message({
            SenderId,
            recieverId,
            message,
        });

        if(newMessage){
            conversation.messages.push(newMessage._id);
        }
        
        await Promise.all([ conversation.save(), newMessage.save()]);

        //SOCKET IO FUNCTIONALITY
        const recieverSocketId=getRecieverSocketId(recieverId);
        if(recieverSocketId){
            io.to(recieverSocketId).emit("newMessage",newMessage);
        }

        res.status(201).json(newMessage);

    } catch (error) {
        console.log("Error in sendMessage controller: ",error.message);
        res.status(500).json({error:"Internal Server Error"});
    }
};

export const getMessages= async(req,res)=>{
    try {
        const{id: userToChatId}=req.params;
        const SenderId=req.user._id;

        const conversation= await Conversation.findOne({
            participants:{$all:[SenderId,userToChatId]},
        }).populate("messages");

        if(!conversation) return res.status(200).json([]);

        const messages=conversation.messages;

        res.status(200).json(messages);

    } catch (error) {
        console.log("Error in getMessages controller: ",error.message);
        res.status(500).json({error:"Internal Server Error"});
        
    }
};