
import { AccessToken } from 'livekit-server-sdk';
import { getUser } from '../../service/repository/user.service';

const createLivekitRoom = async (roomName)=>{
  try {
    const room = await roomService.createRoom({
      name: roomName,
      emptyTimeout: 10 * 60,
      maxParticipants: 50,
    });

    res.json({
      success: true,
      room,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
}

const createToken = async (req, res) => {
    try {
        const isUser = await getUser({ user_id: socket.authData.user_id });
        if (!isUser) {
            return next(new Error("User not found."));
        }
        
    } catch (error) {
        console.error('Error Live-kit token:', error);
        throw error;
    }
    // If this room doesn't exist, it'll be automatically created when the first
    // participant joins
    const roomName = 'quickstart-room';
    // Identifier to be used for participant.
    // It's available as LocalParticipant.identity with livekit-client SDK
    const participantName = 'quickstart-username';

    const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
        identity: participantName,
        // Token to expire after 10 minutes
        ttl: '10m',
    });
    at.addGrant({ roomJoin: true, room: roomName });

    return await at.toJwt();
};


module.exports = {
    createRoom,
    createToken
};
