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
                canPublish: true,
                // canPublish: false,     // TODO: for now commited
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

        console.log(await roomList(), 'lisst-----------------');

        return {
            token: jwt,
            url: LIVEKIT_HOST,
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
    if (roomService) {
        await roomService.deleteRoom(roomName);
        return true;
    }
    return null
}


module.exports = {
    createLivekitRoom,
    generateLivekitToken,
    roomList,
    listParticipants,
    removeParticipants,
    deleteRoom
}