
const {
    getUser
} = require("../../service/repository/user.service");

const { createLive, generateRoomId, getLive, deleteLive, updateLive } = require("../../service/repository/Live.service");
const { generalResponse } = require("../../helper/response.helper");
const { isFollow, getFollow } = require("../../service/repository/Follow.service");
const { sendPushNotification } = require("../../service/common/onesignal.service");
const { createLiveHost, getLiveLive_host } = require("../../service/repository/Live_host.service");

async function start_live(socket, data, emitEvent, joinRoom) {

    const isUser = await getUser({ user_id: socket.authData.user_id });

    if (!isUser) {
        return next(new Error("User not found."));
    }

    if (!data.peer_id) {
        return emitEvent(socket.id, "start_live", "Peer id is required");
    }
    const room_id = generateRoomId();
    joinRoom(socket, room_id);
    const live_payload = {
        live_title: data.live_title,
        socket_room_id: room_id,
    }




    const newLive = await createLive(live_payload)
    if (newLive) {
        const live_host_payload = {
            user_id: isUser.user_id,
            peer_id: data.peer_id,
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
                    peer_id: data.peer_id,
                    live_id: newLive.live_id,
                    is_main_host: true
                }

            }
        )
        const new_live = await getLive({ live_id: newLive.live_id })
        return emitEvent(socket.id, "start_live", new_live);
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
        emitToRoom(data.socket_room_id, "stop_live", {
            stop_live: true,
            live_host: already_host
        });
        disposeRoom(socket, already_live.Records[0].socket_room_id);
        return
    }
    return emitEvent(socket.id, "stop_live", "Failed to leave live");

}
async function join_live(socket, data, emitEvent, joinRoom, emitToRoom) {
    try {



        const isUser = await getUser({ user_id: socket.authData.user_id });
        if (!isUser) {
            return next(new Error("User not found."));
        }

        if (!data.socket_room_id && !data.user_id && !data.peer_id) {
            return emitEvent(socket.id, "join_live", "Data is missing");
        }

        const already_live = await getLive({ socket_room_id: data.socket_room_id, live_status: "live" });

        if (already_live.Records.length <= 0) {
            return emitEvent(socket.id, "join_live", {
                is_live: false,
            });
        }
        joinRoom(socket, data.socket_room_id);

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

        return emitToRoom(data.socket_room_id, "join_live", {
            total_viewers: already_live.Records[0].total_viewers + 1,
            curent_viewers: already_live.Records[0].curent_viewers + 1,
            likes: already_live.Records[0].likes,
            User: {
                user_id: isUser.user_id,
                full_name: isUser.full_name,
                first_name: isUser.first_name,
                last_name: isUser.last_name,
                user_name: isUser.user_name,
                profile_pic: isUser.profile_pic
            },
            peer_id: already_live.Records[0].Live_hosts,
            // streamer_id: already_live.Records[0].user_id,
            is_live: true
        });
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

    if (!data.socket_room_id && !data.user_id && !data.peer_id) {
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
                peer_id: data.peer_id
            },
            // peer_id: already_live.Records[0].peer_id,
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

    if (!data.socket_room_id && !data.user_id && !data.peer_id && !data.new_host_peer_id) {
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
            peer_id: data.new_host_peer_id,
            user_id: data.user_id
        }
    )
    if (
        connect_new_host
    ) {
        emitToRoom(data.socket_room_id, "activity_on_live", {
            message: "New Host Joined",
            User: {
                user_id: new_host.user_id,
                full_name: new_host.full_name,
                first_name: new_host.first_name,
                last_name: new_host.last_name,
                user_name: new_host.user_name,
                profile_pic: new_host.profile_pic,
                peer_id: data.new_host_peer_id
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
            peer_id: data.peer_id
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
            peer_id: data.peer_id
        }
    });
    leaveRoom(socket, data.socket_room_id);

}
async function activity_on_live(socket, data, emitEvent, emitToRoom) {
    const isUser = await getUser({ user_id: socket.authData.user_id });
    if (!isUser) {
        return next(new Error("User not found."));
    }

    if (!data.like && !data.comment) {
        return emitEvent(socket.id, "activity_on_live", "Data is missing");
    }
    const already_live = await getLive({ socket_room_id: data.socket_room_id, live_status: "live" });
    let real_time_payload
    if (already_live.Records.length <= 0) {
        return emitEvent(socket.id, "activity_on_live", "Live is closed");
    }
    if (data.like && data.like) {
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
    if (data.comment && data.comment.length > 0) {
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
    emitToRoom(data.socket_room_id, "activity_on_live", real_time_payload)
}
async function get_live(req, res) {

    const isUser = await getUser({ user_id: req.authData.user_id });
    const { page = 1, pageSize = 10 } = req.body;
    const live_status = req.body.live_status || "live";
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

    const already_live = await getLive(live_filter, { page, pageSize });

    if (already_live.Records.length <= 0) {
        return generalResponse(
            res,
            {},
            "No Live Found",
            true,
            false
        );
    }

    const already_live_with_follow = await Promise.all(
        already_live.Records.map(async (live) => {
            const updatedHosts = await Promise.all(
                live.Live_hosts.map(async (hosts) => {
                    const following_true = await isFollow({
                        follower_id: isUser.user_id,
                        user_id: hosts.user_id,
                    });

                    return {
                        ...hosts,
                        following: !!following_true, // simpler boolean cast
                    };
                })
            );

            return {
                ...live,
                Live_hosts: updatedHosts,
            };
        })
    );


    // ✅ Send the response with updated live data
    return generalResponse(
        res,
        {
            Records: already_live_with_follow,
            Pagination: already_live.Pagination
        },
        "Live Found",
        true,
        true
    );
}
async function get_live_admin(req, res) {
    const { page = 1, pageSize = 10 } = req.body;

    const live_status = req.body.live_status || "";
    const { sorted_by = "createdAt", sort_order = "DESC" } = req.body

    const already_live = await getLive({ live_status: live_status }, { page, pageSize }, [], [[sorted_by, sort_order]]);

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
