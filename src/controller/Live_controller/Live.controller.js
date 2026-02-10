

const {
    getUser,
    getAllUsers
} = require("../../service/repository/user.service");

const { createLive, generateRoomId, getLive, deleteLive, updateLive } = require("../../service/repository/Live.service");
const { generalResponse } = require("../../helper/response.helper");
const { isFollow, getFollow, countFollows } = require("../../service/repository/Follow.service");
const { sendPushNotification } = require("../../service/common/onesignal.service");
const { createLiveHost, getLiveLive_host } = require("../../service/repository/Live_host.service");
const { getAudioStream, updateAudioStream } = require("../../service/repository/Audio_stream.service");
const { getGiftSendingReceivingByUserId } = require("../../service/repository/Transactions/Coin_coin_transaction.service");
const { bannerData, topIcons } = require("../../data/banner.data.js");
const { getPkByIdWith, getPkById } = require("../../service/repository/Pk.service");
const { Op } = require("sequelize");
const { redis } = require("../../helper/redis");
const fs = require('fs');
const path = require('path');
const { topSendersList, topReceiversList } = require("../leaderboard_controller/top_users.controller");
const { generateLivekitToken, deleteRoom, removeParticipants } = require("../../service/common/livekit.service.js");
const { top_ranking_pk_sender } = require("../../helper/pkSocket.helper.js");
const { hsetRedis } = require("../../service/common/redis.service.js");
const redis_keys = require("../../utils/redis.key.js");

async function start_live(socket, data, emitEvent, joinRoom) {

    const isUser = await getUser({ user_id: socket.authData.user_id });

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

            const uploadDir = path.resolve(__dirname, '../../../uploads/live_image');

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
            return emitEvent(socket.id, "start_live", "Cover image save failed");
        }
    }

    // if (!data.peer_id) {
    //     return emitEvent(socket.id, "start_live", "Peer id is required");
    // }
    const room_id = generateRoomId();
    joinRoom(socket, room_id);
    const livekit_details = await generateLivekitToken(room_id, socket.authData.user_id, 'host');

    const live_payload = {
        live_title: data.live_title,
        socket_room_id: room_id,
    }

    const newLive = await createLive(live_payload)
    if (newLive) {
        const live_host_payload = {
            user_id: isUser.user_id,
            peer_id: data.peer_id ? data.peer_id : "",
            live_id: newLive.live_id,
            is_main_host: true
        }
        const is_live_host_created = await createLiveHost(
            live_host_payload
        )
        const followers = await getFollow({
            user_id: socket.authData.user_id
        })


        // let playerIds = []
        // followers.Records.forEach(async element => {

        //     const user = await getUser({ user_id: element.follower_id });
        //     console.log("userrrr", user.device_token);

        //     playerIds.push(user.device_token)
        // });
        let playerIds = [];

        for (const element of followers.Records) {
            const user = await getUser({ user_id: element.follower_id });
            playerIds.push(user.device_token);
        }

        sendPushNotification(
            {
                playerIds: playerIds,
                title: `${isUser.full_name} has gone live, check now`,
                message: `${isUser.full_name} has gone live, check now`,
                large_icon: isUser.profile_pic,
                data: {
                    type: "live",
                    user_id: isUser.user_id,
                    peer_id: data.peer_id ? data.peer_id : "",
                    live_id: newLive.live_id,
                    is_main_host: true
                }

            }
        )
        const new_live = await getLive({ live_id: newLive.live_id })
        emitEvent(socket.id, 'live_livekit_token_details', livekit_details);
        emitEvent(socket.id, "start_live", new_live);


        // To handle recconnection and auto end stream at host disconnection
        await hsetRedis(redis_keys.liveStream(socket.id), {
            stream_id: newLive.live_id,
            host_id: isUser.user_id,
            room_id: room_id,
            live_status: "live",
            host_socket_id: socket.id,
            type: 'live',
            last_seen: Date.now()
        }, 6*60*60);
        return
    }

    return emitEvent(socket.id, "start_live", "Failed to start live");
}
async function stop_live(socket, data, emitEvent, emitToRoom, disposeRoom) {
    const isUser = await getUser({ user_id: socket.authData.user_id });

    if (!isUser) {
        return next(new Error("User not found."));
    }
    const already_host = await getLiveLive_host({ user_id: isUser.user_id, is_main_host: true })
    if (already_host.Records < 1) {
        return emitEvent(socket.id, "stop_live", "You are not live Or the host");

    }
    const already_live = await getLive({ live_id: already_host.Records[0].live_id, live_status: "live" });


    if (already_live.Records.length <= 0) {
        // disposeRoom(socket, already_live.Records[0].socket_room_id);
        return emitEvent(socket.id, "stop_live", "You are not live");
    }


    const delete_live = await deleteLive({ live_id: already_host.Records[0].live_id });

    if (delete_live) {
        // await  deleteRoom(already_host.Records[0].socket_room_id);
        emitToRoom(data.socket_room_id, "stop_live", {
            stop_live: true,
            live_host: already_host,
            socket_room_id: data.socket_room_id,
            streamer_id: data.streamer_id,
        });
        disposeRoom(socket, already_live.Records[0].socket_room_id);
        return
    }
    return emitEvent(socket.id, "stop_live", "Failed to leave live");

}

async function checkPkandUpdate(socket, data, emitEvent) {
    const pk = await getPkById({
        [Op.or]: [
            { host1_socket_room_id: data.socket_room_id },
            { host2_socket_room_id: data.socket_room_id }
        ],
        battle_status: "active"
    }, true);

    if (pk) {
        const redisKey = `pk:timer:${pk.pk_battle_id}`;
        const timer = await redis.hgetall(redisKey);

        if (timer.startTime) {
            const elapsed = Date.now() - Number(timer.startTime);
            const remaining = Math.max(
                Math.ceil((Number(timer.duration) - elapsed) / 1000),
                0
            );

            emitEvent(socket.id, "pk_timer_update", {
                pk_battle_id: pk.pk_battle_id,
                remaining
            });

            emitEvent(socket.id, "live_state_update", pk);
        }
    }
}

async function join_live(socket, data, emitEvent, joinRoom, emitToRoom, getRoomMembers) {
    try {
        const isUser = await getUser({ user_id: socket.authData.user_id });
        if (!isUser) {
            return next(new Error("User not found."));
        }

        // if (!data.socket_room_id && !data.user_id && !data.peer_id) {
        //     return emitEvent(socket.id, "join_live", "Data is missing");
        // }
        if (!data.socket_room_id && !data.user_id) {
            return emitEvent(socket.id, "join_live", "Data is missing");
        }

        const already_live = await getLive({ socket_room_id: data.socket_room_id, live_status: "live" });

        if (already_live.Records.length <= 0) {
            return emitEvent(socket.id, "join_live", {
                is_live: false,
            });
        }
        joinRoom(socket, data.socket_room_id);
        const livekit_details = await generateLivekitToken(data.socket_room_id, socket.authData.user_id, 'viewer');

        await updateLive(
            {
                socket_room_id: data.socket_room_id,
                live_id: already_live.Records[0].live_id
            },
            {
                total_viewers: already_live.Records[0].total_viewers + 1,
                curent_viewers: already_live.Records[0].curent_viewers + 1
            }
        );


        emitEvent(socket.id, 'live_livekit_token_details', livekit_details);
        console.log("join_live------------", await getRoomMembers(data.socket_room_id))
        emitToRoom(data.socket_room_id, "join_live", {
            total_viewers: already_live.Records[0].total_viewers + 1,
            curent_viewers: already_live.Records[0].curent_viewers + 1,
            likes: already_live.Records[0].likes,
            live_id: already_live.Records[0].live_id,
            socket_room_id: data.socket_room_id,
            User: {
                user_id: isUser.user_id,
                full_name: isUser.full_name,
                first_name: isUser.first_name,
                last_name: isUser.last_name,
                user_name: isUser.user_name,
                profile_pic: isUser.profile_pic
            },
            peer_id: already_live.Records[0].Live_hosts ? already_live.Records[0].Live_hosts : "",
            // streamer_id: already_live.Records[0].user_id,
            is_live: true
        });

        await checkPkandUpdate(socket, data, emitEvent);
        await top_ranking_pk_sender(socket, data, emitEvent, emitToRoom)


        //  For PK Update
        let main_host_user_id = 0;
        for (const record of already_live.Records) {
            const host = record.Live_hosts?.find(h => h.is_main_host);
            if (host) {
                main_host_user_id = host.user_id;
                break;
            }
        }

        // live_state_update 
        if (main_host_user_id) {
            const payload = {
                [Op.or]: [
                    { host1_socket_room_id: data.socket_room_id, host1_user_id: main_host_user_id },
                    { host2_socket_room_id: data.socket_room_id, host2_user_id: main_host_user_id }
                ]
            };

            const pkdetails = await getPkById(payload, true);
            if (pkdetails) {
                // PK Update on join user
                return emitEvent(socket.id, "live_state_update", pkdetails.dataValues);
            }
        }
    }
    catch (error) {
        console.log("error in join live", error);
        return emitEvent(socket.id, "join_live", error);
    }

}
async function request_to_be_host(socket, data, emitEvent, joinRoom, emitToRoom) {
    const isUser = await getUser({ user_id: socket.authData.user_id });
    if (!isUser) {
        return next(new Error("User not found."));
    }

    // if (!data.socket_room_id && !data.user_id && !data.peer_id) {
    //     return emitEvent(socket.id, "request_to_be_host", "Data is missing");
    // }

    if (!data.socket_room_id && !data.user_id) {
        return emitEvent(socket.id, "request_to_be_host", "Data is missing");
    }

    const already_live = await getLive({ socket_room_id: data.socket_room_id, live_status: "live" });

    if (already_live.Records.length <= 0) {
        return emitEvent(socket.id, "request_to_be_host", {
            is_live: false,
        });
    }
    // joinRoom(socket, data.socket_room_id);

    // await updateLive(
    //     {
    //         socket_room_id: data.socket_room_id,
    //         user_id: data.user_id
    //     },
    //     {
    //         total_viewers: already_live.Records[0].total_viewers + 1,
    //         curent_viewers: already_live.Records[0].curent_viewers + 1
    //     }
    // );
    const live_host = await getLiveLive_host({ live_id: already_live.Records[0].live_id, is_main_host: true, is_live: true })
    const main_streamer = await getUser({ user_id: live_host.user_id })
    if (!live_host) {
        return emitEvent(socket.id, "request_to_be_host", {
            is_user: false
        })
    }
    // for 
    return emitEvent(main_streamer.socket_id, 'request_to_be_host',
        {
            message: "A User wants to join as host",
            User: {
                user_id: isUser.user_id,
                full_name: isUser.full_name,
                first_name: isUser.first_name,
                last_name: isUser.last_name,
                user_name: isUser.user_name,
                profile_pic: isUser.profile_pic,
                peer_id: data?.peer_id
            },
            peer_id: already_live.Records[0].peer_id ? already_live.Records[0].peer_id : "",
            // streamer_id: already_live.Records[0].user_id,
            is_live: true

        }
    )
}
async function accept_request_for_new_host(socket, data, emitEvent, joinRoom, emitToRoom) {
    const isUser = await getUser({ user_id: socket.authData.user_id });
    if (!isUser) {
        return next(new Error("User not found."));
    }

    // if (!data.socket_room_id && !data.user_id && !data.peer_id && !data.new_host_peer_id) {
    //     return emitEvent(socket.id, "accept_request_for_new_host", "Data is missing");
    // }

    if (!data.socket_room_id && !data.user_id) {
        return emitEvent(socket.id, "accept_request_for_new_host", "Data is missing");
    }

    const already_live = await getLive({ socket_room_id: data.socket_room_id, live_status: "live" });

    if (already_live.Records.length <= 0) {
        return emitEvent(socket.id, "accept_request_for_new_host", {
            is_live: false,
        });
    }
    const new_host = await getUser({ user_id: data.user_id })
    const connect_new_host = await createLiveHost(
        {
            peer_id: data.new_host_peer_id ? data.new_host_peer_id : "",
            user_id: data.user_id
        }
    )
    if (
        connect_new_host
    ) {
        const livekit_details = await generateLivekitToken(data.socket_room_id, data.user_id, 'speaker');

        emitEvent(new_host.socket_id, 'live_livekit_token_details', livekit_details);

        emitToRoom(data.socket_room_id, "activity_on_live", {
            message: "New Host Joined",
            User: {
                user_id: new_host.user_id,
                full_name: new_host.full_name,
                first_name: new_host.first_name,
                last_name: new_host.last_name,
                user_name: new_host.user_name,
                profile_pic: new_host.profile_pic,
                peer_id: data.new_host_peer_id ? data.new_host_peer_id : ""
            },
        })

    }
    // joinRoom(socket, data.socket_room_id);

    // await updateLive(
    //     {
    //         socket_room_id: data.socket_room_id,
    //         user_id: data.user_id
    //     },
    //     {
    //         total_viewers: already_live.Records[0].total_viewers + 1,
    //         curent_viewers: already_live.Records[0].curent_viewers + 1
    //     }
    // );
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


async function leave_live_as_host(socket, data, emitEvent, leaveRoom, emitToRoom) {
    const isUser = await getUser({ user_id: socket.authData.user_id });
    if (!isUser) {
        return next(new Error("User not found."));
    }

    if (!data.socket_room_id && !data.user_id) {
        return emitEvent(socket.id, "leave_live", "Data is missing");
    }
    const already_live = await getLive({ socket_room_id: data.socket_room_id, live_status: "live" });

    if (already_live.Records.length <= 0) {
        return emitEvent(socket.id, "leave_live", "You Already left");
    }
    // if (already_live.Records[0].curent_viewers >= 0) {
    //     const update_live = await updateLive(
    //         {
    //             socket_room_id: data.socket_room_id,
    //             live_id: already_live.Records[0].live_id
    //         },
    //         {
    //             curent_viewers: already_live.Records[0].curent_viewers - 1
    //         }
    //     );
    // }
    // await removeParticipants(data.socket_room_id, socket.authData.user_id);

    emitToRoom(data.socket_room_id, "leave_live_as_host", {
        // total_viewers: already_live.Records[0].total_viewers,
        // curent_viewers: already_live.Records[0].curent_viewers - 1,
        User: {
            user_id: isUser.user_id,
            full_name: isUser.full_name,
            first_name: isUser.first_name,
            last_name: isUser.last_name,
            user_name: isUser.user_name,
            profile_pic: isUser.profile_pic,
            peer_id: data.peer_id ? data.peer_id : ""
        }
    });
    // leaveRoom(socket, data.socket_room_id);

}
async function leave_live(socket, data, emitEvent, leaveRoom, emitToRoom) {
    const isUser = await getUser({ user_id: socket.authData.user_id });
    if (!isUser) {
        return next(new Error("User not found."));
    }

    if (!data.socket_room_id && !data.user_id) {
        return emitEvent(socket.id, "leave_live", "Data is missing");
    }
    const already_live = await getLive({ socket_room_id: data.socket_room_id, live_status: "live" });

    if (already_live.Records.length <= 0) {
        return emitEvent(socket.id, "leave_live", "You Already left");
    }
    if (already_live.Records[0].curent_viewers >= 0) {
        const update_live = await updateLive(
            {
                socket_room_id: data.socket_room_id,
                live_id: already_live.Records[0].live_id
            },
            {
                curent_viewers: already_live.Records[0].curent_viewers - 1
            }
        );
    }
    // await removeParticipants(data.socket_room_id, socket.authData.user_id);

    emitToRoom(data.socket_room_id, "leave_live", {
        total_viewers: already_live.Records[0].total_viewers,
        curent_viewers: already_live.Records[0].curent_viewers - 1,
        User: {
            user_id: isUser.user_id,
            full_name: isUser.full_name,
            first_name: isUser.first_name,
            last_name: isUser.last_name,
            user_name: isUser.user_name,
            profile_pic: isUser.profile_pic,
            peer_id: data.peer_id ? data.peer_id : ""
        }
    });
    leaveRoom(socket, data.socket_room_id);

}
async function activity_on_live(socket, data, emitEvent, emitToRoom) {
    console.log("activity_on_live: #1");
    const isUser = await getUser({ user_id: socket.authData.user_id });
    if (!isUser) {
        return next(new Error("User not found."));
    }
    console.log("activity_on_live: #2");

    if (!data.like && !data.comment) {
        return emitEvent(socket.id, "activity_on_live", "Data is missing");
    }
    console.log("activity_on_live: #3");
    let already_live = await getLive({ socket_room_id: data.socket_room_id, live_status: "live" });
    console.log("activity_on_live: #4");
    let real_time_payload
    let isAudio = 0;
    console.log("activity_on_live: #5");
    if (already_live.Records.length <= 0) {
        console.log("activity_on_live: #6");
        already_live = await getAudioStream({ socket_stream_room_id: data.socket_room_id, live_status: "live" });
        console.log("activity_on_live: #7");
        if (already_live.length <= 0) {
            console.log("activity_on_live: #8");
            return emitEvent(socket.id, "activity_on_live", "Live is closed");
        }
        else {
            isAudio = 1;
            console.log("activity_on_live: #9");
        }
    }
    console.log("activity_on_live: #10");
    if (data.like && data.like) {
        console.log("activity_on_live: #11");
        real_time_payload = {
            like: true,
            comment: false,
            comment_cotent: "",
            user_id: isUser.user_id,
            user_name: isUser.user_name,
            profile_pic: isUser.profile_pic,
            full_name: isUser.full_name,
            first_name: isUser.first_name,
            last_name: isUser.last_name,
            current_like: already_live.Records[0].likes + 1,
            total_comments: already_live.Records[0].comments
        }
        if (isAudio == 1) {
            console.log("activity_on_live: #12");
            await updateAudioStream(
                {
                    socket_stream_room_id: data.socket_room_id,
                    stream_id: already_live.Records[0].stream_id
                },
                {
                    likes: already_live.Records[0].likes + 1
                }
            );
        }
        else {
            console.log("activity_on_live: #13");
            const update_live = await updateLive(
                {
                    socket_room_id: data.socket_room_id,
                    live_id: already_live.Records[0].live_id
                },
                {
                    likes: already_live.Records[0].likes + 1
                }
            );
        }
    }
    if (data.comment && data.comment.length > 0) {
        console.log("activity_on_live: #14");
        real_time_payload = {
            like: false,
            comment: true,
            comment_cotent: data.comment,
            user_id: isUser.user_id,
            user_name: isUser.user_name,
            profile_pic: isUser.profile_pic,
            full_name: isUser.full_name,
            first_name: isUser.first_name,
            last_name: isUser.last_name,
            total_like: already_live.Records[0].like,
            total_comments: already_live.Records[0].comments + 1
        }

        if (isAudio == 1) {
            console.log("activity_on_live: #15");
            await updateAudioStream(
                {
                    socket_stream_room_id: data.socket_room_id,
                    stream_id: already_live.Records[0].stream_id
                },
                {
                    likes: already_live.Records[0].likes + 1
                }
            );
        }
        else {
            console.log("activity_on_live: #16");
            const update_live = await updateLive(
                {
                    socket_room_id: data.socket_room_id,
                    live_id: already_live.Records[0].live_id
                },
                {
                    comments: already_live.Records[0].comments + 1
                }
            );
        }
    }
    console.log("activity_on_live: #17", data.socket_room_id, "activity_on_live");
    console.log(real_time_payload);
    emitToRoom(data.socket_room_id, "activity_on_live", real_time_payload)
}
async function get_live(req, res) {

    const isUser = await getUser({ user_id: req.authData.user_id });
    const { page = 1, pageSize = 10, search = "" } = req.body;
    // const live_status = req.body.live_status || "live";
    const live_status = "live";
    if (!isUser) {
        return generalResponse(
            res,
            {},
            "Invalid User",
            false,
            false,
            404
        );
    }
    let live_filter = { live_status: live_status };
    if (process.env.ISDEMO != "true") {
        live_filter.is_demo = false

    }

    // Add search to filter if provided
    if (search && String(search).trim() !== "") {
        live_filter.search = search;
    }

    const already_live = await getLive(live_filter, { page, pageSize });
    const stream_live = await getAudioStream(live_filter, { page, pageSize });

    const senderData = await topSendersList("", req.authData.user_id, 2);
    const receiverData = await topReceiversList("", req.authData.user_id, 2);

    if (already_live.Records.length <= 0 && stream_live.Records.length <= 0) {
        return generalResponse(
            res,
            {
                Banner: bannerData,
                topSender: senderData || [],
                topReceiver: receiverData || [],
                topIcons: topIcons || [],
                Records: [],
                Pagination: {
                    total_pages: 0,
                    total_records: 0,
                    current_page: 0,
                    records_per_page: 0,
                },
            },
            "No Live Found",
            true,
            false
        );
    }

    const already_live_with_follow = await Promise.all(
        already_live.Records.map(async (live) => {
            let is_following_mainhost = 0;
            const updatedHosts = await Promise.all(
                live.Live_hosts.map(async (hosts) => {
                    const following_true = await isFollow({
                        follower_id: isUser.user_id,
                        user_id: hosts.user_id,
                    });
                    if (hosts.is_main_host) {
                        is_following_mainhost = following_true;    // For main host 
                    }
                    const follower_count = await countFollows({ user_id: hosts.user_id })
                    const following_count = await countFollows({ follower_id: hosts.user_id })

                    return {
                        ...hosts,
                        following: !!following_true, // simpler boolean cast
                        follower_count: follower_count,
                        following_count: following_count,
                    };
                })
            );

            return {
                ...live,
                title: live.live_title,
                Live_hosts: updatedHosts,
                is_audio: false,             // 
                is_video: true,
                is_following: !!is_following_mainhost
            };
        })
    );

    const already_live_with_follow2 = await Promise.all(
        stream_live.Records.map(async (live) => {
            let is_following_mainhost = 0;
            const updatedHosts = await Promise.all(
                live.Audio_stream_hosts.map(async (hosts) => {
                    if (hosts.is_main_host) {
                        is_following_mainhost = hosts.user_id;
                    }
                    const following_true = await isFollow({
                        follower_id: isUser.user_id,
                        user_id: hosts.user_id,
                    });
                    const follower_count = await countFollows({ user_id: hosts.user_id })
                    const following_count = await countFollows({ follower_id: hosts.user_id })
                    const gift_details = await getGiftSendingReceivingByUserId(hosts.user_id);

                    return {
                        ...hosts,
                        live_host_id: hosts.stream_host_id,
                        is_live: hosts.is_streaming,
                        live_id: hosts.stream_id,
                        following: !!following_true, // simpler boolean cast
                        follower_count: follower_count,
                        following_count: following_count,
                        ...gift_details,
                    };
                })
            );

            return {
                ...live,
                live_id: live.stream_id,
                curent_viewers: live.user_count,
                likes: 0,
                socket_room_id: live.socket_stream_room_id,
                live_title: live.stream_title,
                Live_hosts: updatedHosts,
                is_audio: true,             // 
                is_video: false,
                is_following: !!is_following_mainhost,
            };
        })
    );

    // ✅ Send the response with updated live data
    return generalResponse(
        res,
        {
            Banner: bannerData,
            topSender: senderData,
            topReceiver: receiverData,
            topIcons: topIcons,
            Records: [...already_live_with_follow, ...already_live_with_follow2],
            Pagination: already_live.Pagination
        },
        "Live Found",
        true,
        true
    );
}
async function get_live_admin(req, res) {
    const { page = 1, pageSize = 10, search = "" } = req.body;

    const live_status = req.body.live_status || "";
    const { sorted_by = "createdAt", sort_order = "DESC" } = req.body

    // Build filter with search if provided
    const filter = { live_status: live_status };
    if (search && String(search).trim() !== "") {
        filter.search = search;
    }

    const already_live = await getLive(filter, { page, pageSize }, [], [[sorted_by, sort_order]]);

    if (already_live.Records.length <= 0) {
        return generalResponse(
            res,
            {},
            "No Live Found",
            true,
            false
        );
    }



    // ✅ Send the response with updated live data
    return generalResponse(
        res,
        already_live,
        "Live Found",
        true,
        true
    );
}



module.exports = {
    start_live,
    stop_live,
    join_live,
    get_live,
    leave_live,
    activity_on_live,
    get_live_admin,
    request_to_be_host,
    accept_request_for_new_host,
    leave_live_as_host
};
