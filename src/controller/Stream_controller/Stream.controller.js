
const { createAudioStream, deleteAudioStream, getGiftTotalsByStream } = require("../../service/repository/Audio_stream.service");
const { createAudioStreamHost, get_audioStreamHost, updateAudioStreamHost } = require("../../service/repository/Audio_stream_host.service");
const { getAudioStream, updateAudioStream } = require("../../service/repository/Audio_stream.service");
const { getUser, getUsers, getAllUsers } = require("../../service/repository/user.service");
const { generateRoomId } = require("../../service/repository/Live.service");
const { getFollow, countFollows } = require("../../service/repository/Follow.service");
const { sendPushNotification } = require("../../service/common/onesignal.service");
const { Op } = require('sequelize');
const { getPk, getPkByIdWith } = require("../../service/repository/Pk.service");
const { Sequelize } = require("../../../models");
const fs = require('fs');
const path = require('path');
const { getGift, getOneGift } = require("../../service/repository/Gift.service");

async function start_audio_stream(socket, data, emitEvent, joinRoom) {
    const isUser = await getUser({ user_id: socket.authData.user_id });
    console.log("data checkkkkkkkkkk", data);
    if (!isUser) {
        return next(new Error("User not found."));
    }

    let thumb = '';
    if (data?.cover_image && typeof data.cover_image === 'string') {
        try {
            const base64 = data.cover_image.includes(',')
                ? data.cover_image.split(',')[1]
                : data.cover_image;

            const buffer = Buffer.from(base64, 'base64');

            const uploadDir = path.resolve(__dirname, '../../../uploads/stream_image');

            // ✅ Create folder if not exists
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const fileName = data.name || `stream_${Date.now()}.png`;
            const filePath = path.join(uploadDir, fileName);

            fs.writeFileSync(filePath, buffer);
            console.log(filePath)

            thumb = `uploads/stream_image/${fileName}`;
        } catch (err) {
            console.error('Cover image save failed:', err);
            return emitEvent(socket.id, "start_audio_stream", "Cover image save failed");
        }
    }

    if (!data.peer_id || !data.seat_number) {
        return emitEvent(socket.id, "start_audio_stream", "Data is missing");
    }

    const stream_room_id = generateRoomId();
    joinRoom(socket, stream_room_id);
    const stream_payload = {
        stream_title: data?.stream_title || "",
        thumb: thumb,
        socket_stream_room_id: stream_room_id,
        start_time: Date.now(),
        seat_map: JSON.stringify([])
    }

    const newStream = await createAudioStream(stream_payload)
    if (newStream) {
        const stream_host_payload = {
            user_id: isUser.user_id,
            peer_id: data.peer_id,
            stream_id: newStream.stream_id,
            is_main_host: true,
            seat_number: 1,  // TODO: For now main host can seat at seat number 1
            start_time: Date.now()
        }
        const is_stream_host_created = await createAudioStreamHost(
            stream_host_payload
        )
        const followers = await getFollow({
            user_id: socket.authData.user_id
        })


        let playerIds = [];

        for (const element of followers.Records) {
            const user = await getUser({ user_id: element.follower_id });
            playerIds.push(user.device_token);
        }

        sendPushNotification(
            {
                playerIds: playerIds,
                title: `${isUser.full_name} has gone audio stream, check now`,
                message: `${isUser.full_name} has gone audio stream, check now`,
                large_icon: isUser.profile_pic,
                data: {
                    type: "Stream",
                    user_id: isUser.user_id,
                    peer_id: data.peer_id,
                    stream_id: newStream.stream_id,
                    is_main_host: true
                }

            }
        )
        const new_stream = await getAudioStream({ stream_id: newStream.stream_id })

        return emitEvent(socket.id, "start_audio_stream", new_stream, data?.emit_type);

    }

    return emitEvent(socket.id, "start_audio_stream", { data: { socket_stream_room_id: stream_room_id }, message: "Failed to start audio streaming" }, data?.emit_type);

}
async function stop_audio_stream(socket, data, emitEvent, emitToRoom, disposeRoom) {
    const isUser = await getUser({ user_id: socket.authData.user_id });

    if (!isUser) {
        return next(new Error("User not found."));
    }
    console.log(
        "stop_audio_stream test:",
        JSON.stringify(data, null, 2)
    );

    if (!data.socket_stream_room_id) {
        return emitEvent(socket.id, "stop_audio_stream", "socket_stream_room_id is missing", data?.emit_type);
    }
    const already_host = await get_audioStreamHost({ user_id: isUser.user_id, is_main_host: true })
    if (already_host.Records < 1) {
        return emitEvent(socket.id, "stop_audio_stream", "You are not live Or the host", data?.emit_type);

    }
    const already_live = await getAudioStream({ stream_id: already_host.Records[0].stream_id, socket_stream_room_id: data.socket_stream_room_id, live_status: "live" });


    if (already_live.Records.length <= 0) {
        // disposeRoom(socket, already_live.Records[0].socket_room_id);
        return emitEvent(socket.id, "stop_audio_stream", "You are not live", data?.emit_type);
    }


    const delete_live = await deleteAudioStream({ stream_id: already_host.Records[0].stream_id });

    if (delete_live) {
        emitToRoom(data.socket_stream_room_id, "audio_stream_stopped", {
            stop_live: true,
            live_host: already_host
        }, data?.emit_type);
        disposeRoom(already_live.Records[0].socket_stream_room_id);
        return
    }

    return emitEvent(socket.id, "stop_audio_stream", "Failed to leave live", data?.emit_type);

}

async function join_audio_stream(socket, data, emitEvent, joinRoom, emitToRoom, getRoomMembers, broadcastEvent) {
    try {

        if (!data.socket_stream_room_id || !data.user_id || !data.peer_id) {
            return emitEvent(socket.id, "join_audio_stream", "Data is missing");
        }

        const isUser = await getUser({ user_id: data.user_id });
        if (!isUser) {
            return next(new Error("User not found."));
        }

        const already_audio_stream = await getAudioStream({ socket_stream_room_id: data.socket_stream_room_id, live_status: "live" });

        if (already_audio_stream.Records.length <= 0) {
            return emitEvent(socket.id, "join_audio_stream", {
                is_live: false,
            });
        }
        joinRoom(socket, data.socket_stream_room_id);

        await updateAudioStream(
            {
                socket_stream_room_id: data.socket_stream_room_id,
                stream_id: already_audio_stream.Records[0].stream_id
            },
            {
                user_count: already_audio_stream.Records[0].user_count + 1
            }
        );
        const new_stream = await getAudioStream({ stream_id: already_audio_stream.Records[0].stream_id });


        const roomSocketIds = await getRoomMembers(data.socket_stream_room_id);

        const userPayload = {
            socket_id: {
                [Op.in]: roomSocketIds
            }
        }

        const attributes = ['user_id', 'full_name', 'user_name', 'socket_id', 'profile_pic', 'consumption']

        const listenerUsers = await getAllUsers(userPayload, attributes);
        const joinedUser = listenerUsers.filter(data => data.user_id == data.user_id);

        const giftValueMap = await getGiftTotalsByStream(
            already_audio_stream.Records[0].stream_id
        );




        new_stream.Records = await Promise.all(new_stream.Records.map(async (record) => {
            if (Array.isArray(record.Audio_stream_hosts) && record.Audio_stream_hosts.length > 0) {
                const updatedHosts = await Promise.all(record.Audio_stream_hosts.map(async (hosts) => {

                    try {
                        const follower_count = await countFollows({ user_id: hosts.user_id });
                        const following_count = await countFollows({ follower_id: hosts.user_id });

                        return {
                            ...hosts,
                            follower_count: Number(follower_count) || 0,
                            following_count: Number(following_count) || 0,
                            gift_value: giftValueMap[hosts.user_id] || 0
                        };
                    } catch (err) {
                        // on error return host unchanged but with zero counts
                        return {
                            ...hosts,
                            follower_count: 0,
                            following_count: 0,
                            gift_value: giftValueMap[hosts.user_id] || 0
                        };
                    }
                }));

                return {
                    ...record,
                    Audio_stream_hosts: updatedHosts,
                    listenerUsers
                };
            } else {
                return {
                    ...record,
                    Audio_stream_hosts: []
                };
            }
        }));




        return emitToRoom(data.socket_stream_room_id, "join_audio_stream", new_stream);

        // return emitToRoom(data.socket_stream_room_id, "join_audio_stream", {
        //     data: new_stream,
        //     message: 'Entered the live room',
        //     user:joinedUser
        // });
    }
    catch (error) {
        console.log("error in join live", error);

        return emitEvent(socket.id, "join_live", error);

    }

}

async function request_to_join_audio_stream(socket, data, emitEvent, joinRoom, emitToRoom) {
    const isUser = await getUser({ user_id: socket.authData.user_id });

    if (!isUser) {
        return next(new Error("User not found."));
    }

    if (!data.socket_stream_room_id || !data.user_id || !data.peer_id || !data.seat_number) {
        return emitEvent(socket.id, "request_to_join_audio_stream", "Data is missing", data?.emit_type);
    }


    const already_live = await getAudioStream({ socket_stream_room_id: data.socket_stream_room_id, live_status: "live" });


    if (already_live.Records.length <= 0) {
        return emitEvent(socket.id, "request_to_join_audio_stream", {
            is_live: false,
        }, data?.emit_type);
    }

    if (already_live.Records.user_count >= already_live.Records.total_seat) {
        return emitEvent(socket.id, "request_to_join_audio_stream", {
            is_live: false,
            message: "All seats are reserved!"
        }, data?.emit_type);
    }


    const isAvailable = already_live.Records[0]?.seat_map?.some(
        seat => ((seat.seat === parseInt(data.seat_number)) && (seat.available === true))
    ) || false;


    if (!isAvailable) {
        return emitEvent(socket.id, "request_to_join_audio_stream", {
            is_live: true,
            message: "seat" + data.seat_number + " is not available!"
        }, data?.emit_type);
    }

    const live_host = await get_audioStreamHost({ stream_id: already_live.Records[0].stream_id, is_main_host: true, is_stream: true })


    if (!live_host) {
        return emitEvent(socket.id, "request_to_join_audio_stream", {
            is_user: false
        }, data?.emit_type)
    }

    // const main_streamer = await getUser({ user_id: live_host.user_id })
    const main_streamer = await getUser({ user_id: live_host.Records[0].user_id })

    emitEvent(socket.id, 'request_to_join_audio_stream',
        {
            message: "Request send successfully to the host",
            data: {
                user_id: isUser.user_id,
                full_name: isUser.full_name,
            }
        }, data?.emit_type
    )

    console.log("request ---------", data.peer_id);
    // for 
    return emitEvent(main_streamer.socket_id, 'request_received_to_join_audio_stream',
        {
            message: "A User wants to join as host",
            User: {
                user_id: isUser.user_id,
                full_name: isUser.full_name,
                first_name: isUser.first_name,
                last_name: isUser.last_name,
                user_name: isUser.user_name,
                profile_pic: isUser.profile_pic,
                peer_id: data.peer_id,
                seat_number: data.seat_number
            },
            // peer_id: already_live.Records[0].peer_id,
            // streamer_id: already_live.Records[0].user_id,
            is_live: true

        }
    )
}

async function accept_request_to_join_audio_stream(socket, data, emitEvent, joinRoom, emitToRoom) {
    const isUser = await getUser({ user_id: socket.authData.user_id });
    if (!isUser) {
        return next(new Error("User not found."));
    }

    // console.log("accept -------", data);

    if (!data.socket_stream_room_id || !data.user_id || !data.peer_id || !data.new_host_peer_id || !data.seat_number) {
        return emitEvent(socket.id, "accept_request_to_join_audio_stream", "Data is missing");
    }


    const already_live = await getAudioStream({ socket_stream_room_id: data.socket_stream_room_id, live_status: "live" });


    if (already_live.Records.length <= 0) {
        return emitEvent(socket.id, "accept_request_to_join_audio_stream", {
            is_live: false,
        });
    }
    else if (already_live.Records.user_count >= already_live.Records.total_seat) {
        return emitEvent(socket.id, "accept_request_to_join_audio_stream", {
            is_live: false,
            message: "All seats are reserved!"
        });
    }

    const isAvailable = already_live.Records[0]?.seat_map?.some(
        seat => ((seat.seat === parseInt(data.seat_number)) && (seat.available === true))
    ) || false;

    if (!isAvailable) {
        return emitEvent(socket.id, "accept_request_to_join_audio_stream", {
            is_live: true,
            message: "seat" + data.seat_number + " is not available!"
        });
    }
    console.log("room id: ", data.socket_stream_room_id);
    console.log("stream id: ", already_live.Records[0].stream_id)

    const new_host = await getUser({ user_id: data.user_id });

    const connect_new_host = await createAudioStreamHost(
        {
            peer_id: data.peer_id,
            user_id: data.user_id,
            seat_number: data.seat_number,
            stream_id: already_live.Records[0].stream_id,
            start_time: Date.now()
        }
    )

    joinRoom(socket, data.socket_stream_room_id);

    const newSeatMap = already_live.Records[0].seat_map.map(seat =>
        seat.seat === data.seat_number
            ? { ...seat, available: false }    // seat is now taken
            : seat
    );

    await updateAudioStream(
        {
            socket_stream_room_id: data.socket_stream_room_id,
            user_id: data.user_id
        },
        {
            user_count: already_live.Records[0].user_count + 1,
            seat_map: newSeatMap
        }
    );

    if (
        connect_new_host
    ) {
        const follower_count = await countFollows({ user_id: new_host.user_id });
        const following_count = await countFollows({ follower_id: new_host.user_id });


        emitToRoom(data.socket_stream_room_id, "activity_on_audio_stream", {
            message: "New Host Joined",
            User: {
                user_id: new_host.user_id,
                full_name: new_host.full_name,
                first_name: new_host.first_name,
                last_name: new_host.last_name,
                user_name: new_host.user_name,
                profile_pic: new_host.profile_pic,
                peer_id: data.peer_id,
                seat_number: data.seat_number,
                follower_count: follower_count,
                following_count: following_count,
                level: new_host.getDataValue('level'),
                frame: new_host.getDataValue('frame'),
            },
        })

        const main_streamer = await getUser({ user_id: new_host.user_id })
        emitEvent(main_streamer.socket_id, "activity_on_audio_stream", {
            message: "New Host Joined",
            User: {
                user_id: new_host.user_id,
                full_name: new_host.full_name,
                first_name: new_host.first_name,
                last_name: new_host.last_name,
                user_name: new_host.user_name,
                profile_pic: new_host.profile_pic,
                peer_id: data.peer_id,
                seat_number: data.seat_number,
                follower_count: follower_count,
                following_count: following_count,
                level: new_host.getDataValue('level'),
                frame: new_host.getDataValue('frame'),
            },
        })


    }


    // const live_host = await getLiveLive_host({ live_id: already_live.Records[0].live_id, is_main_host:true , is_live:true })
    // const main_streamer = await getUser({ user_id: live_host.user_id})
    // if (!live_host) {
    //     return emitEvent(socket.id, "request_to_be_host", {
    //         is_user: false
    //     })
    // }
    // // for 
    // return emitEvent(main_streamer.socket_id, 'request_to_be_host',
    //     {
    //         message: "A User wants to join as host",
    //         User: {
    //             user_id: isUser.user_id,
    //             full_name: isUser.full_name,
    //             first_name: isUser.first_name,
    //             last_name: isUser.last_name,
    //             user_name: isUser.user_name,
    //             profile_pic: isUser.profile_pic,
    //             peer_id:data.peer_id
    //         },
    //         // peer_id: already_live.Records[0].peer_id,
    //         // streamer_id: already_live.Records[0].user_id,
    //         is_live: true

    //     }
    // )
}


async function leave_audio_stream_as_user(socket, data, emitEvent, leaveRoom, emitToRoom) {

    if (!data.socket_stream_room_id || !data.user_id) {
        return emitEvent(socket.id, "leave_audio_stream_as_user", "data is missing");
    }

    const isUser = await getUser({ user_id: data.user_id });
    if (!isUser) {
        return next(new Error("User not found."));
    }
    console.log("leave_audio_stream_as_user data", data);


    const already_live = await getAudioStream({ socket_stream_room_id: data.socket_stream_room_id, live_status: "live" });


    if (already_live.Records.length <= 0) {
        return emitEvent(socket.id, "leave_audio_stream_as_user", "You are not live", data?.emit_type);
    }

    const already_host = await get_audioStreamHost({ user_id: isUser.user_id, stream_id: already_live.Records[0].stream_id, is_main_host: false, is_stream: true })
    if (already_host.Records < 1) {

        await updateAudioStream(
            {
                socket_stream_room_id: data.socket_stream_room_id,
                stream_id: already_live.Records[0].stream_id
            },
            {
                user_count: already_live.Records[0].user_count - 1,
            }
        );


        emitToRoom(data.socket_stream_room_id, "leave_audio_stream_as_user", {
            message: `${isUser.full_name} has left the audio stream`,
            user_id: isUser.user_id,
            ...data,
        }, data?.emit_type);

        return emitEvent(socket.id, "leave_audio_stream_as_user", {
            message: "You have left the audio stream successfully",
            user_id: isUser.user_id,
            ...data,
        }, data?.emit_type);
        // return emitEvent(socket.id, "leave_audio_stream_as_user", "Only for joined user", data?.emit_type);
    }

    leaveRoom(socket, data.socket_stream_room_id);
    const newSeatMap = already_live.Records[0].seat_map.map(seat =>
        seat.seat === already_host.Records[0].seat_number
            ? { ...seat, available: true }    // seat is now available
            : seat
    );

    await updateAudioStream(
        {
            socket_stream_room_id: data.socket_stream_room_id,
            stream_id: already_live.Records[0].stream_id
        },
        {
            user_count: already_live.Records[0].user_count - 1,
            seat_map: newSeatMap
        }
    );

    console.log("7");
    await updateAudioStreamHost(
        {
            user_id: isUser.user_id,
            stream_id: already_live.Records[0].stream_id,
            is_main_host: false,
            is_stream: true
        },
        {
            is_stream: false,
            stop_time: Date.now()
        }
    );


    emitToRoom(data.socket_stream_room_id, "leave_audio_stream_as_user", {
        message: `${isUser.full_name} has left the audio stream`,
        user_id: isUser.user_id,
        ...data,
    }, data?.emit_type);

    return emitEvent(socket.id, "leave_audio_stream_as_user", {
        message: "You have left the audio stream successfully",
        user_id: isUser.user_id,
        ...data,
    }, data?.emit_type);
}

async function mute_toggle_by_host(socket, data, emitEvent, emitToRoom) {
    const isUser = await getUser({ user_id: socket.authData.user_id });
    console.log("mute_toggle_by_host data-------------", data);
    if (!isUser) {
        return next(new Error("User not found."));
    }
    if (!data.socket_stream_room_id || !data.user_id) {
        return emitEvent(socket.id, "mute_toggle_by_host", "data is missing", data?.emit_type);
    }
    const already_live = await getAudioStream({ socket_stream_room_id: data.socket_stream_room_id, live_status: "live" });

    if (already_live.Records.length <= 0) {
        return emitEvent(socket.id, "mute_toggle_by_host", "You are not live", data?.emit_type);
    }
    const muted_user = await get_audioStreamHost({ user_id: data.user_id, stream_id: already_live.Records[0].stream_id, is_stream: true });
    if (!muted_user) {
        return emitEvent(socket.id, "mute_toggle_by_host", "User not found", data?.emit_type);
    }

    await updateAudioStreamHost(
        {
            user_id: data.user_id,
            stream_id: already_live.Records[0].stream_id,
            is_stream: true
        },
        {
            is_muted: muted_user.Records[0].is_muted ? 0 : 1,
        }
    );

    emitEvent(muted_user.Records[0].User.socket_id, "mute_toggle_by_host", {
        message: `${muted_user.Records[0].User.full_name} has been muted by the host`,
        user_id: data.user_id,
        is_muted: muted_user.Records[0].is_muted ? 0 : 1
    });
    return emitEvent(socket.id, "mute_toggle_by_host", {
        message: `${muted_user.Records[0].User.full_name} has been muted successfully`,
        user_id: data.user_id,
        is_muted: muted_user.Records[0].is_muted ? 0 : 1
    });
}

async function mute_toggle_by_user(socket, data, emitEvent, emitToRoom) {
    const isUser = await getUser({ user_id: socket.authData.user_id });
    // console.log("mute_toggle_by_user data-------------", data);
    if (!isUser) {
        return next(new Error("User not found."));
    }
    if (!data.socket_stream_room_id || !data.user_id) {
        return emitEvent(socket.id, "mute_toggle_by_user", "data is missing", data?.emit_type);
    }
    const already_live = await getAudioStream({ socket_stream_room_id: data.socket_stream_room_id, live_status: "live" });

    if (already_live.Records.length <= 0) {
        return emitEvent(socket.id, "mute_toggle_by_user", "You are not live", data?.emit_type);
    }
    const muted_user = await get_audioStreamHost({ user_id: data.user_id, stream_id: already_live.Records[0].stream_id, is_stream: true });
    if (!muted_user) {
        return emitEvent(socket.id, "mute_toggle_by_user", "User not found", data?.emit_type);
    }

    await updateAudioStreamHost(
        {
            user_id: data.user_id,
            stream_id: already_live.Records[0].stream_id,
            is_stream: true
        },
        {
            is_muted: muted_user.Records[0].is_muted ? 0 : 1,
        }
    );

    emitToRoom(data.socket_stream_room_id, "mute_toggle_by_user", {
        message: `${muted_user.Records[0].User.full_name} has been mute.!`,
        user_id: data.user_id,
        is_muted: muted_user.Records[0].is_muted ? 0 : 1
    });
    return
}

async function gift_send_to_user(socket, data, emitEvent, emitToRoom) {

    if (!data.socket_stream_room_id || !data.sender_name || !data.sender_id || !data.gift_id) {
        return emitEvent(socket.id, 'gift_send_to_user', "data is missing");
    }

    const isUser = await getUser({ user_id: data.sender_id });
    if (!isUser) {
        return next(new Error("Sender ID not found."));
    }


    const attributes = ['name', 'gift_id', 'gift_thumbnail', 'gift_value']
    const gift = await getOneGift({gift_id: data.gift_id}, attributes);

    
    return emitToRoom(data.socket_stream_room_id, "gift_send_to_user", {
        data: { ...data, sender_profile_pic: isUser.profile_pic, level: isUser.getDataValue('level'), frame: isUser.getDataValue('frame'), gift},
        messsage: `Sended by ${data.sender_name}`
    })
}


async function update_audio_stream_seats(socket, data, emitEvent, emitToRoom) {
    const isUser = await getUser({ user_id: socket.authData.user_id });
    // console.log("mute_toggle_by_user data-------------", data);
    if (!isUser) {
        return next(new Error("User not found."));
    }

    if (!data.stream_id || !data.seat_count || !data.socket_stream_room_id) {
        return emitEvent(socket.id, 'update_audio_stream_seats', "data is missing");
    }

    const isValidStream = await getAudioStream({ stream_id: data.stream_id, live_status: "live" });
    if (!isValidStream) {
        return emitEvent(socket.id, 'update_audio_stream_seats', "Stream ended!");
    }

    let seatMap = Array.isArray(isValidStream?.Records?.[0].seat_map)
        ? [...isValidStream?.Records?.[0].seat_map]
        : [];

    const oldCount = seatMap.length;
    const newSeatCount = data.seat_count;

    /* 🔼 INCREASE SEATS */
    if (newSeatCount > oldCount) {
        for (let i = oldCount; i < newSeatCount; i++) {
            seatMap.push({
                seat: i + 1,
                available: true
            });
        }
    }

    /* 🔽 DECREASE SEATS */
    if (newSeatCount < oldCount) {
        for (let i = newSeatCount; i < oldCount; i++) {
            if (seatMap[i] && !seatMap[i].available) {
                return emitEvent(socket.id, 'update_audio_stream_seats', { message: "Seats not empty!", liveStream: null })

            }
        }
        seatMap = seatMap.slice(0, newSeatCount);
    }


    const { updated_count, message } = await updateAudioStream({ stream_id: data.stream_id }, { total_seat: data.seat_count, seat_map: seatMap });
    const liveStream = await getAudioStream({ stream_id: data.stream_id });

    if (updated_count > 0) {
        emitToRoom(data.socket_stream_room_id, 'update_audio_stream_seats', { message, liveStream: liveStream?.Records?.[0] })
        return emitEvent(socket.id, 'update_audio_stream_seats', { message, liveStream: liveStream?.Records?.[0] })
    } else {
        return emitToRoom(data.socket_stream_room_id, 'update_audio_stream_seats', { message, liveStream: null })
    }

}

module.exports = {
    start_audio_stream,
    join_audio_stream,
    stop_audio_stream,
    request_to_join_audio_stream,
    accept_request_to_join_audio_stream,
    leave_audio_stream_as_user,
    mute_toggle_by_host,
    mute_toggle_by_user,
    gift_send_to_user,
    update_audio_stream_seats
}