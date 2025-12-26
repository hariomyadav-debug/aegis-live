const {
    RoomServiceClient,
    AccessToken
} = require("livekit-server-sdk");
require("dotenv").config();

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_HOST = process.env.LIVEKIT_URL;


const roomService = new RoomServiceClient(
    LIVEKIT_HOST,
    API_KEY,
    API_SECRET
);

const createLivekitRoom = async (roomName) => {
    try {
        const room = await roomService.createRoom({
            name: roomName,
            emptyTimeout: 10 * 60,  // 10 minutes
            maxParticipants: 100,   // only 100 users join this room
        });

        return room;
    } catch (err) {
        throw err;
    }
}

const generateLivekitToken = async (roomName, identity, role) => {
    try {

        let grants = {
            roomJoin: true,
            room: roomName,
        };


        if (role === "host") {
            grants = {
                ...grants,
                canPublish: true,
                canSubscribe: true,
                canPublishData: true,
                canUpdateOwnMetadata: true,
            };
        } else if (role === "viewer") {
            grants = {
                ...grants,
                canSubscribe: true,
                canPublish: false,
            };
        } else {
            // participant
            grants = {
                ...grants,
                canPublish: true,
                canSubscribe: true,
            };
        }

        const token = new AccessToken(API_KEY, API_SECRET, {
            identity,
        });
        token.addGrant(grants);
        const jwt = await token.toJwt();

        return jwt;

    } catch (error) {
        console.log('Error to create token: ', err)
        throw err;
    }
}

const roomList = async () => {
    if (roomService) {
        const rooms = await roomService.listRooms();
        return rooms;
    }
    return null;
}

const listParticipants = async (roomName) => {
    if (roomService) {
        const participants = await roomService.listParticipants(roomName);
        return participants;
    }
    return null
}

const removeParticipants = async (roomName,identity )=>{
    if(roomService){
        await roomService.removeParticipant(roomName, identity);
    }
    return null
}

const deleteParticipants = async (roomName,identity )=>{
    if(roomService){
        await roomService.deleteRoom("roomName");

    }
    return null
}


module.exports = {
    createLivekitRoom,
    generateLivekitToken,
    roomList,
    listParticipants,
    removeParticipants,
    deleteParticipants
}