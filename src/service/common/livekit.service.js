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

const roomList = async () => {
    if (roomService) {
        const rooms = await roomService.listRooms();
        return rooms;
    }
    return null;
}

const generateLivekitToken = async (roomName, identity, role) => {
    try {

        let grants = {
            roomJoin: true,
            // room: "room_name",
            room: `${roomName}`,
        };


        if (role === "host") {
            grants = {
                ...grants,
                canPublish: true,
                canSubscribe: true,
                // canPublishData: true,
                // canUpdateOwnMetadata: true,
            };
        } else if (role === "viewer") {
            grants = {
                ...grants,
                canSubscribe: true,
                // canPublish: true,    // TODO: for now commited, can be changed later according to the user role in pk battle
                canPublish: false,     // TODO: for now commited
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
            identity: `${identity}`,
            ttl: "4h",
        });
        token.addGrant(grants);
        const jwt = await token.toJwt();

        return {
            token: jwt,
            url: LIVEKIT_HOST,
            roomName,
        };

    } catch (error) {
        console.log('Error to create token: ', err)
        throw err;
    }
}



const listParticipants = async (roomName) => {
    if (roomService) {
        const participants = await roomService.listParticipants(roomName);
        return participants;
    }
    return null
}

const removeParticipants = async (roomName, identity) => {
    if (roomService) {
        await roomService.removeParticipant(roomName, identity);
        return true;
    }
    return null
}

const deleteRoom = async (roomName) => {
    try {

        if (!roomService) return null;

        // check room exists
        const rooms = await roomService.listRooms({
            names: [roomName]
        });

        if (!rooms || rooms.length === 0) {
            console.log("Room does not exist:", roomName);
            return false;
        }

        // delete room
        await roomService.deleteRoom(roomName);

        console.log("Room deleted:", roomName);

        return true;

    } catch (error) {

        console.log("Error deleting room:", error.message);
        throw error;

    }
};



module.exports = {
    createLivekitRoom,
    generateLivekitToken,
    roomList,
    listParticipants,
    removeParticipants,
    deleteRoom
}