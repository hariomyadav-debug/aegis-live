
const { updateUser, getUser } = require("../repository/user.service");
const {
  getParticipantWithoutPagenation,
} = require("../repository/Participant.service");
const { User } = require("../../../models");
const filterData = require("../../helper/filter.helper");
const {
  typing,
  chat_list,
  message_list,
  get_chat_id,
  real_time_message_seen,
  initial_onlineList,
  delete_for_everyone,
  delete_for_me
} = require("../../controller/chat_controller/Message.controller");
const { start_live, leave_live, stop_live, join_live, activity_on_live, request_to_be_host, leave_live_as_host, accept_request_for_new_host } = require("../../controller/Live_controller/Live.controller");
const { start_audio_stream, join_audio_stream, stop_audio_stream, request_to_join_audio_stream, accept_request_to_join_audio_stream, leave_audio_stream_as_user, muted_by_host, mute_toggle_by_host, mute_toggle_by_user, gift_send_to_user, update_audio_stream_seats, audio_stream_seat_lock_unlock, sent_invite_by_host_to_join, transparent_activity_handler, red_envelope_handler } = require("../../controller/Stream_controller/Stream.controller");
const { pk_battle_request, pk_battle_request_response, pk_webrtc_offer, pk_webrtc_answer, pk_webrtc_ice_candidate, cohost_request, cohost_request_response, cohost_leave, remove_cohost, update_pk_score, pk_gift_sending_to_host } = require("../../controller/pk_controller/Pk.controller");
const { end_pk } = require("../../controller/pk_controller/PK_sockets.controller");
const { startPkTimerWorker } = require("../../helper/pkTimerWorker");
const { top_ranking_pk_sender } = require("../../helper/pkSocket.helper.js");
const { autoStopLiveAtSocketDisc } = require("../../helper/rejoinSocket.helper.js");

let io;

// Initialize the socket server
const initSocket = (serverwithsockets) => {
  io = serverwithsockets;
  // 🔥 START TIMER WORKER HERE
  // startPkTimerWorker({ emitToRoom, emitEvent, getRoomMembers });


  // Set up event listeners for socket connections
  io.on("connection", (socket) => {
    console.log(`New client connected: ${socket.id}`);

    // Example: Listen for a custom event
    listenToEvent(socket, "chat_list", (data) => {
      chat_list(socket, data, emitEvent);
    });
    listenToEvent(socket, "message_list", (data) => {
      message_list(socket, data, emitEvent);
    });
    listenToEvent(socket, "delete_for_me", (data) => {
      delete_for_me(socket, data, emitEvent);
    });
    listenToEvent(socket, "delete_for_everyone", (data) => {
      delete_for_everyone(socket, data, emitEvent);
    });
    listenToEvent(socket, "typing", (data) => {
      typing(socket, data, emitEvent);
    });
    listenToEvent(socket, "initial_online_user", (data) => {
      initial_onlineList(socket, emitEvent);
    });
    listenToEvent(socket, "real_time_message_seen", (data) => {
      real_time_message_seen(socket, data, emitEvent);
    });
    listenToEventwithAck(socket, "get_chat_id", get_chat_id);
    // Live
    listenToEvent(socket, "start_live", (data) => {
      start_live(socket, data, emitEvent, joinRoom);
    });
    listenToEvent(socket, "join_live", (data) => {
      join_live(socket, data, emitEvent, joinRoom, emitToRoom, getRoomMembers);
    });
    listenToEvent(socket, "leave_live", (data) => {
      leave_live(socket, data, emitEvent, leaveRoom, emitToRoom);
    });
    listenToEvent(socket, "activity_on_live", (data) => {
      console.log("activity_on_live: received");
      console.log(data);
      activity_on_live(socket, data, emitEvent, emitToRoom);
    });
    listenToEvent(socket, "stop_live", (data) => {
      stop_live(socket, data, emitEvent, emitToRoom, disposeRoom);
    });
    listenToEvent(socket, "request_to_be_host", (data) => {
      request_to_be_host(socket, data, emitEvent, joinRoom, emitToRoom);
    });
    listenToEvent(socket, "accept_request_for_new_host", (data) => {
      accept_request_for_new_host(socket, data, emitEvent, joinRoom, emitToRoom);
    });

    // TODO: check these later
    // listenToEvent(socket, "accept_request_for_new_host", (data) => {
    //   leave_live_as_host(socket, data, emitEvent, leaveRoom, emitToRoom);
    // });

    // -------  for Streaming
    listenToEvent(socket, "start_audio_stream", (data) => {
      data = data?.emit_type ? data : { ...data, emit_type: "all" };  // By defalt to all
      start_audio_stream(socket, data, emitEvent, joinRoom);
    });
    listenToEvent(socket, "join_audio_stream", (data) => {
      data = data?.emit_type ? data : { ...data, emit_type: "all" };
      join_audio_stream(socket, data, emitEvent, joinRoom, emitToRoom, getRoomMembers, broadcastEvent);
    });
    listenToEvent(socket, "stop_audio_stream", (data = {}) => {
      const payload = {
        ...data,
        emit_type: data.emit_type ?? "all",
        socket_stream_room_id:
          data.socket_stream_room_id ?? data.room_id,
      };

      stop_audio_stream(socket, payload, emitEvent, emitToRoom, disposeRoom);
    });
    listenToEvent(socket, "request_to_join_audio_stream", (data) => {

      data = data?.emit_type ? data : { ...data, emit_type: "all" };
      request_to_join_audio_stream(socket, data, emitEvent, joinRoom, emitToRoom, getRoomMembers);
    });
    listenToEvent(socket, "accept_request_to_join_audio_stream", (data) => {
      data = data?.emit_type ? data : { ...data, emit_type: "" };
      accept_request_to_join_audio_stream(socket, data, emitEvent, joinRoom, emitToRoom, joinRoomBySocketId);
    });
    listenToEvent(socket, "leave_audio_stream_as_user", (data) => {
      data = data?.emit_type ? data : { ...data, emit_type: "all" };
      leave_audio_stream_as_user(socket, data, emitEvent, leaveRoom, emitToRoom);
    });

    listenToEvent(socket, "mute_toggle_by_host", (data) => {
      mute_toggle_by_host(socket, data, emitEvent, emitToRoom);
    });

    listenToEvent(socket, "mute_toggle_by_user", (data) => {
      mute_toggle_by_user(socket, data, emitEvent, emitToRoom);
    });

    listenToEvent(socket, "gift_send_to_user", (data) => {
      gift_send_to_user(socket, data, emitEvent, emitToRoom);
    });
    listenToEvent(socket, "update_audio_stream_seats", (data) => {
      update_audio_stream_seats(socket, data, emitEvent, emitToRoom);
    });

    listenToEvent(socket, "audio_stream_seat_lock_unlock", (data) => {
      audio_stream_seat_lock_unlock(socket, data, emitEvent, emitToRoom);
    });


    listenToEvent(socket, "sent_invite_by_host_to_join", (data) => {
      sent_invite_by_host_to_join(socket, data, emitEvent, emitToRoom);
    });

    listenToEvent(socket, "transparent_activity_handler", (data) => {
      transparent_activity_handler(socket, data, emitEvent, emitToRoom);
    });

    listenToEvent(socket, "red_envelope", (data) => {
        red_envelope_handler(socket, data, emitEvent, emitToRoom);
    });


    // ------------ For PK battle (Coming Soon) --------------
    listenToEvent(socket, "pk_battle_request", (data) => {
      pk_battle_request(socket, data, emitEvent);
    });
    listenToEvent(socket, "pk_battle_request_response", (data) => {
      pk_battle_request_response(socket, data, emitEvent, emitToRoom, getRoomMembers, broadcastEvent);
    });

    listenToEvent(socket, "update_pk_score", (data) => {
      update_pk_score(socket, data, emitEvent, emitToRoom);
    });

    listenToEvent(socket, "end_pk", (data) => {
      end_pk(socket, data, emitEvent, emitToRoom, getRoomMembers);
    });
    listenToEvent(socket, "pk_webrtc_offer", (data) => {
      pk_webrtc_offer(socket, data, emitEvent);
    });
    listenToEvent(socket, "pk_webrtc_answer", (data) => {
      pk_webrtc_answer(socket, data, emitEvent);
    });
    listenToEvent(socket, "pk_webrtc_ice_candidate", (data) => {
      pk_webrtc_ice_candidate(socket, data, emitEvent);
    });

    listenToEvent(socket, "pk_gift_sending_to_host", (data) => {
      pk_gift_sending_to_host(socket, data, emitEvent, emitToRoom, getRoomMembers);
    });
    listenToEvent(socket, "top_ranking_pk_sender", (data) => {
      top_ranking_pk_sender(socket, data, emitEvent, emitToRoom, getRoomMembers);
    });


    // -------------------------- For Live ---------------

    listenToEvent(socket, "cohost_request", (data) => {
      cohost_request(socket, data, emitEvent);
    });

    listenToEvent(socket, "cohost_request_response", (data) => {
      cohost_request_response(socket, data, emitEvent, emitToRoom, joinRoom);
    });

    listenToEvent(socket, "cohost_leave", (data) => {
      cohost_leave(socket, data, emitEvent, emitToRoom);
    });

    listenToEvent(socket, "remove_cohost", (data) => {
      remove_cohost(socket, data, emitEvent);
    });



    // Handle disconnection
    socket.on("disconnect", async () => {
      await updateUser({ socket_id: "" }, { user_id: socket.authData.user_id });    // TODO: check this later enable this if any issue in showing online status of user
      const isUser = await getUser({ user_id: socket.authData.user_id });
      if (!isUser) {
        return new Error("User not found.");
      }
      attributes = [
        "profile_pic",
        "user_id",
        "full_name",
        "user_name",
        "email",
        "country_code",
        "country",
        "gender",
        "bio",
        "profile_verification_status",
        "login_verification_status",
        "socket_id",
      ];
      const userWithSelectedFields = filterData(isUser.toJSON(), attributes);
      userWithSelectedFields.isOnline = false
      const includeOptions = [
        {
          model: User,
          as: "User",
          attributes: [
            "mobile_num",
            "profile_pic",
            "dob",
            "user_id",
            "full_name",
            "user_name",
            "email",
            "country_code",
            "socket_id",
            "login_type",
            "gender",
            "country",
            "state",
            "city",
            "bio",
            "profile_verification_status",
            "login_verification_status",
            "is_private",
            "is_admin",
            "createdAt",
            "updatedAt"
          ],
        },
      ];
      const getChats_of_users = await getParticipantWithoutPagenation(
        { user_id: isUser.user_id },
        includeOptions
      );
      if (getChats_of_users.Records.length > 0) {
        getChats_of_users.Records.map((chats) => {
          return chats.chat_id;
        }).forEach(async (element) => {
          let users = await getParticipantWithoutPagenation(
            { chat_id: element },
            includeOptions
          );
          users.Records.map((chats) => {
            // if (chats.dataValues.User.dataValues.user_id != updatedUser){
            emitEvent(
              chats.User.socket_id,
              "offline_user",
              userWithSelectedFields
            );
            // }
          });
        });
      }

      await autoStopLiveAtSocketDisc(socket.id, emitEvent, emitToRoom, disposeRoom )
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};

// Emit event to a specific socket
const emitEvent = (socket_id, event, data, type = "") => {
  // console.log('emitdata-----------', event, );
  // Retrieve the socket instance using the socket_id
  if (type === "all") {
    // Broadcast to all sockets
    io.emit(event, data);
    console.log(`Event "${event}" emitted to all sockets with data: ${data}\n `);

  } else {
    // Specific socket or User To User
    const socket = io.sockets.sockets.get(socket_id);
    if (socket) {
      // console.log("Emmited to", socket_id, "Event", event , "data" ,data);

      socket.emit(event, data);
    } else {
      console.warn(`Socket with ID ${socket_id} is not connected`);
    }
  }
};

// Listen to an event from a specific socket
const listenToEvent = (socket, event, callback) => {
  socket.on(event, (data) => {
    if (callback) callback(data);
  });
};
const listenToEventwithAck = (socket, event, handler) => {
  socket.on(event, (data, clientCallback) => {

    if (handler) {
      handler(socket, data)
        .then((result) => {
          if (clientCallback) clientCallback(result);
        })
        .catch((error) => {
          console.error(`Error in event "${event}":`, error);
          if (clientCallback)
            clientCallback({ success: false, error: error.message });
        });
    }
  });
};

// Dispose of the socket server
const disposeSocket = () => {
  if (io) {
    io.close(() => {
      // console.log("Socket server disposed ✅");
    });
  } else {
    console.warn("Socket server is not initialized");
  }
};

// Broadcast event to all connected clients
const broadcastEvent = (event, data) => {
  if (io) {
    console.log(`Broadcasting event "${event}" with data: ${data}\n `);
    io.emit(event, data);
  } else {
    console.warn("Socket server is not initialized");
  }
};

const joinRoom = (socket, roomId) => {
  if (io) {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room: ${roomId}`);
  } else {
    console.warn('Socket.io not initialized');
  }
};

const joinRoomBySocketId = (socketId, roomId) => {
  const socket = io.sockets.sockets.get(socketId);

  if (!socket) {
    console.log('Socket not found or disconnected:', socketId);
    return;
  }

  socket.join(roomId);
  console.log(`Socket ${socketId} joined room ${roomId}`);
};


const leaveRoom = (socket, roomId) => {
  if (io) {
    socket.leave(roomId);
    // console.log(`Socket ${socket.id} left room: ${roomId}`);
  } else {
    console.warn('Socket.io not initialized');
  }
};
const disposeRoom = (roomId) => {
  if (io) {
    const room = io.sockets.adapter.rooms.get(roomId);

    if (room) {
      // Make all sockets leave the room without disconnecting
      for (const socketId of room) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          socket.leave(roomId);
          // console.log(`Socket ${socket.id} left room: ${roomId}`);
        }
      }

      // Room is now empty but no disconnection happened
      // console.log(`Room ${roomId} disposed (emptied).`);
    } else {
      console.warn(`Room ${roomId} not found.`);
    }
  } else {
    console.warn('Socket.io not initialized');
  }
};


/**
 * Emit an event to a specific room
 * @param {string} roomId - Room ID to send the event to
 * @param {string} event - Event name to emit
 * @param {any} data - Data to send with the event
 */

const emitToRoom = (roomId, event, data) => {

  io.in(roomId).fetchSockets().then(sockets => {
    // console.log("Sockets in room:", roomId, sockets.map(s => s.id));
  });

  if (io) {
    io.to(roomId).emit(event, data);
    console.log(`Event "${event}" emitted to room: ${roomId} data is ${data}\n `);

  } else {
    console.warn('Socket.io not initialized');
  }
};

const emitToRoomFromApi = async (roomId, event, data) => {

  io.in(roomId).fetchSockets().then(sockets => {
    console.log("Sockets in room:", roomId, sockets.map(s => s.id));
  });

  if (io) {
    io.to(roomId).emit(event, data);
    console.log(`Event "${event}" emitted to room: ${roomId} data is ${data}\n `);

  } else {
    console.warn('Socket.io not initialized');
  }
};

const getRoomMembers = async (roomId) => {
  if (io) {
    // const sockets = await ioInstance.in(roomId).allSockets();
    const sockets = await io.in(roomId).allSockets();
    return Array.from(sockets);
  } else {
    console.warn('Socket.io not initialized');
    return [];
  }
};

const viewersSocketIds =  async(roomId) => {
  try {
    const roomSocketIds =  await getRoomMembers(roomId);
    return roomSocketIds;   // ✅ REQUIRED
  } catch (error) {
    console.log('Not getting users socket id from room ID: ', error);
    return [];              // ✅ REQUIRED
  }
};

module.exports = {
  initSocket,
  emitEvent,
  listenToEvent,
  disposeSocket,
  broadcastEvent,
  viewersSocketIds,
  // getRoomMembers,
  // emitToRoomFromApi,
  io,
};
