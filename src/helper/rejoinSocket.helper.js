const { deleteRoom } = require("../service/common/livekit.service");
const { hgetRedis, hsetRedis, setRedis, deleteRedis } = require("../service/common/redis.service");
const { deleteAudioStream } = require("../service/repository/Audio_stream.service");
const { deleteLive } = require("../service/repository/Live.service");
const redis_keys = require("../utils/redis.key");


//TODO: apply in join socket,  reconnection function 
async function handleHostReconnect(socket, streamId) {
    const streamKey = redis_keys.liveStream(streamId);
    const timerKey = redis_keys.hostDisconnectTimer(streamId);

    const stream = await hgetRedis(streamKey);
    if (!stream.host_id) return;

    await hsetRedis(streamKey, {
        live_status: "live",
        host_socket_id: socket.id,
        last_seen: Date.now()
    });

    // Cancel grace timer
    await deleteRedis(timerKey);

    socket.join(stream.room_id);

    // io.to(stream.room_id).emit("host_reconnected", {
    //     host_id: stream.host_id
    // });
}

async function endStream(socketId, data, key, timerKey, emitEvent, emitToRoom, disposeRoom) {
    console.log("Ending stream:===========>", data.stream_id);

    // End LiveKit room
    // await deleteRoom(`${roomId}`);

    let event = "";
    // Update DB
    if(data.type === 'live'){
        await deleteLive({ live_id: data.stream_id });
         event = "stop_live";
    }else{
        await deleteAudioStream({ stream_id: data.stream_id });
         event = "audio_stream_stopped";
    }

    // Cleanup Redis
    await deleteRedis(key);
    await deleteRedis(timerKey);

    // Notify users
    emitToRoom(data.room_id, event, {
        stop_live: true,
        live_host: null,
        socket_room_id: data.room_id,
        streamer_id: socketId,
    })

    // Force leave sockets
    disposeRoom(data.room_id);
    return ;
}

// auto close stream at end
async function autoStopLiveAtSocketDisc(socket_id, emitEvent, emitToRoom, disposeRoom) {

    const key = redis_keys.liveStream(socket_id);
    const timerKey = redis_keys.hostDisconnectTimer(socket_id);
    console.log("Ending stream:sad===========>", socket_id);
    
    try {
        const stream = await hgetRedis(key);
        console.log(1, stream);
        if (!stream.host_id) return;
        
        // Mark temporarily offline
        await hsetRedis(key, {
            live_status: "host_disconnected",
            last_seen: Date.now()
        });
        
        // Start grace timer ONLY ONCE
        const alreadyStarted = await setRedis(timerKey, "1", 60);
        
        if (alreadyStarted) {
            setTimeout(async () => {
                const current = await hgetRedis(key);
                
                if (current.live_status === "host_disconnected") {
                    console.log(7);
                    await endStream(socket_id, current, key, timerKey, emitEvent, emitToRoom, disposeRoom);
                }
            }, 60 * 1000);
        }
        
    } catch (error) {
        console.log('To handle rejoin or stop live ERROR: ', error);
        throw error;
    }

}

module.exports = { autoStopLiveAtSocketDisc };