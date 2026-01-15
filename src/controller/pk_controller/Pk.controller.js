const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');
const { Pk_battles } = require('../../../models');
const { getLiveLive_host, isHostLive } = require('../../service/repository/Live_host.service');
const { getUser } = require('../../service/repository/user.service');
const Live_host = require('../../../models/Live_host');
const { createPk, getPkByIdWith, getPkResults, getPkById, updatePk } = require('../../service/repository/Pk.service');
const { generalResponse } = require('../../helper/response.helper');

async function startPK(req, res) {
  try {
    const { host1_live_id, host2_live_id, battle_duration = 120 } = req.body;

    if (!host1_live_id || !host2_live_id) {
      return res.status(400).json({
        status: false,
        message: "host1_live_id and host2_live_id are required",
      });
    }

    if (battle_duration < 60 || battle_duration > 180) {
      return res.status(400).json({
        status: false,
        message: "battle_duration must be between 60 and 180 seconds",
      });
    }

    const pkPayload = {
      host1_live_id,
      host2_live_id,
      host1_user_id: data.host1_user_id || 0, // to be filled when host 1 joins
      host2_user_id: data.host2_user_id || 0, // to be filled when host 2 joins
      battle_duration,
      battle_status: "pending",
      created_at: new Date(),
      started_at: new Date(),
    };

    const newBattle = await createPk(pkPayload);

    console.log("newBattle---------------:", newBattle);
    return generalResponse(res, newBattle, "PK battle started", true, true, 200);

  } catch (err) {
    console.error("startPK Error:", err);
    return generalResponse(res, null, "Internal server error", false, false, 500);
  }
}
async function endPK(req, res) {
  try {
    const { pk_battle_id } = req.body;

    if (!pk_battle_id) {
      return generalResponse(res, null, "pk_battle_id is required", false, false, 400);
    }

    const battle = await Pk_battles.findOne({
      where: { pk_battle_id },
    });


    if (!battle) {
      return res.status(404).json({
        status: false,
        message: "PK battle not found",
      });
    }

    if (battle.battle_status === "ended") {
      return generalResponse(res, null, "PK battle already ended", false, false, 400);
    }

    // Update fields
    battle.battle_status = "ended";
    battle.ended_at = Date.now(); // bigint timestamp
    battle.actual_duration = battle.battle_duration; // optional update
    battle.time_remaining = 0; // optional update

    await battle.save();

    return generalResponse(res, battle, "PK battle successfully ended", true, true, 200);
  } catch (err) {
    console.error("endPK Error:", err);
    return generalResponse(res, null, "Internal server error", false, false, 500);
  }
};


async function pk_battle_request(socket, data, emitEvent) {
  try {
    const isUser = await getUser({ user_id: socket.authData.user_id });

    if (!isUser) {
      return next(new Error("User not found."));
    }

    console.log("pk_battle_request data:", data);

    const { host2_user_id } = data;
    console.log("pk_battle_request data:", host2_user_id);
    if (!host2_user_id) {
      emitEvent(socket.id, "pk_battle_request", {
        status: false,
        message: "host2_user_id is required",
      });
      return;
    }

    const already_live = await isHostLive({ user_id: socket.authData.user_id, is_live: true });
    if (!already_live.isLive) {
      emitEvent(socket.id, "pk_battle_request", {
        status: false,
        is_live: false,
        message: "You must be live to send a PK battle request",
      });
      return;
    }

    const already_live2 = await isHostLive({ user_id: host2_user_id, is_live: true });

    if (!already_live2.isLive) {

      emitEvent(socket.id, "pk_battle_request", {
        status: false,
        is_live: false,
        message: "Host 2 must be live to send a PK battle request",
      });
      return;
    }

    const live_host = await getLiveLive_host({ live_id: already_live2.live_id, is_main_host: true, is_live: true })

    const main_streamer = await getUser({ user_id: live_host.Records[0].user_id })

    if (!live_host) {
      return emitEvent(socket.id, "pk_battle_request", {
        is_user: false,
        status: false,
        message: "Host 2 main live host not found",
      })
    }

    // Here you can add logic to notify host2 about the PK battle request

    emitEvent(main_streamer.socket_id, "pk_battle_request", {
      status: true,
      data: { ...data, },
      message: "Request to join PK battle received",
    });
  } catch (err) {
    console.error("pk_battle_request Error:", err);
    emitEvent(socket, "pk_battle_request", {
      status: false,
      message: "Internal server error",
    });
  }
}
async function pk_battle_request_response(socket, data, emitEvent, emitToRoom, broadcastEvent) {
  if (typeof data === "string" && data.trim().startsWith("{")) {
    try {
      data = JSON.parse(data);
    } catch (err) {
      console.log("Invalid JSON, using raw data instead:", err.message);
    }
  }

  const isUser = await getUser({ user_id: socket.authData.user_id });

  if (!isUser) {
    return next(new Error("User not found."));
  }


  if (!data.host1_user_id || !data.host2_user_id || !data.host1_live_id || !data.host2_live_id || !data.host1_socket_room_id || !data.host2_socket_room_id) {
    emitEvent(socket.id, "pk_battle_request_response", {
      status: false,
      message: "Missing required PK battle data",
    });
    return;
  }


  const main_streamer = await getUser({ user_id: data.host1_user_id })
  if (!data.accepted) {
    emitEvent(main_streamer.socket_id, "pk_battle_request_response", {
      status: false,
      data: data,
      message: "PK battle request declined",
    });
    return;
  }

  const host1_live = await isHostLive({ is_live: true, user_id: data.host1_user_id });

  if (!host1_live) {
    emitEvent(main_streamer.socket_id, "pk_battle_request_response", {
      status: false,
      data: data,
      message: "Live ended by host 1.",
    });
  }


  const pkPayload = {
    host1_live_id: data.host1_live_id,
    host2_live_id: data.host2_live_id,
    host1_user_id: data.host1_user_id,
    host2_user_id: data.host2_user_id,
    host1_peer_id: data?.host1_peer_id || "",
    host2_peer_id: data?.host2_peer_id || "",
    host1_socket_room_id: data.host1_socket_room_id,
    host2_socket_room_id: data.host2_socket_room_id,
    battle_duration: data.battle_duration || 120,
    battle_status: "active",
    created_at: new Date(),
    started_at: new Date(),
  };

  const pk_battle = await createPk(pkPayload);
  if (!pk_battle) {
    return emitEvent(main_streamer.socket_id, "pk_battle_request_response", {
      status: false,
      data: data,
      message: "Failed to create PK battle",
    });
  }
  let pkDetails = await getPkByIdWith({ pk_battle_id: pk_battle.pk_battle_id });
  pkDetails = pkDetails.get({ plain: true });



  emitToRoom(data.host1_socket_room_id, "start_pk", pkDetails);
  emitToRoom(data.host2_socket_room_id, "start_pk", pkDetails);
  emitEvent(main_streamer.socket_id, 'start_pk', pkDetails);
  emitEvent(socket.id, 'start_pk', pkDetails);

  emitToRoom(data.host1_socket_room_id, "live_state_update", pkDetails);
  emitToRoom(data.host2_socket_room_id, "live_state_update", pkDetails);
  emitEvent(main_streamer.socket_id, 'live_state_update', pkDetails);
  emitEvent(socket.id, 'live_state_update', pkDetails);

  emitEvent(main_streamer.socket_id, "pk_battle_request_response", {
    status: true,
    data: pkDetails,
    message: "PK battle request accepted",
  });

  return;
}

async function update_pk_score(socket, data, emitEvent, emitToRoom) {
  const isUser = await getUser({ user_id: socket.authData.user_id });

  if (!isUser) {
    return next(new Error("User not found."));
  }

  if (!data.pk_battle_id || !data.is_host1 || !data.host1_live_id || !data.host2_live_id || !data.host1_user_id || !data.host2_user_id) {
    emitEvent(socket.id, "pk_battle_request", {
      status: false,
      message: "host2_user_id is required",
    });
    return;
  }

  try {
    let updatedPayload = {}
    if (data.is_host1) {
      updatedPayload = {
        host1_score_coins: data?.coins ? data.coins : 0,
        host1_total_points: data?.total_points ? data.total_points : 0
      };
    } else {
      updatedPayload = {
        host2_score_coins: data?.coins ? data.coins : 0,
        host1_total_points: data?.total_points ? data.total_points : 0
      };
    }
    console.log(updatedPayload, data);

    const updated = await updatePk(data.pk_battle_id, updatedPayload);
    if (!updated) {
      emitEvent(socket.id, 'update_pk_score', { message: 'Something went wrong to update pk battle.' })
    }


    emitToRoom(updated.host1_socket_room_id, 'update_pk_score', updated);
    emitToRoom(updated.host2_socket_room_id, 'update_pk_score', updated);
    return;

  } catch (error) {
    console.error('Error updating PK score:', error);
    emitEvent(socket.id, 'update_pk_score', { message: 'Failed to update PK score' })
  }

}

async function end_pk(socket, data, emitEvent, emitToRoom, broadcastEvent) {
  try {
    const isUser = await getUser({ user_id: socket.authData.user_id });
    if (!isUser) {
      return next(new Error("User not found."));
    }
    const { pk_battle_id } = data;
    if (!pk_battle_id) {
      emitEvent(socket.id, "end_pk", {
        status: false,
        message: "pk_battle_id is required",
      });
      return;
    }

    const pkBattles = await getPkById({ pk_battle_id: pk_battle_id });
    if (!pkBattles) {
      emitEvent(socket.id, "end_pk", {
        status: false,
        message: "PK battle not found",
      });
      return;
    }
    if (pkBattles.battle_status !== "ended") {
      if (pkBattles.host1_total_points > pkBattles.host2_total_points) {
        pkBattles.winner = "host1";
      } else if (pkBattles.host2_total_points > pkBattles.host1_total_points) {
        pkBattles.winner = "host2";
      } else {
        pkBattles.winner = "draw";
      }
    }
    pkBattles.battle_status = "ended";
    pkBattles.ended_at = Date.now();
    await pkBattles.save();

    // const pkResult = await getPkResults(pk_battle_id);    // when Pk_battles_results is needed
    let pkResult = await getPkById({ pk_battle_id: pk_battle_id });
    pkResult = pkResult.get({ plain: true })

    if (pkResult) {
      const host1_socket = await getUser({ user_id: pkResult.host1_user_id });
      const host2_socket = await getUser({ user_id: pkResult.host2_user_id });

      emitToRoom(pkResult.host1_socket_room_id, "end_pk", pkResult);
      emitToRoom(pkResult.host1_socket_room_id, "live_state_update", pkResult);
      emitToRoom(pkResult.host2_socket_room_id, "live_state_update", pkResult);
      emitEvent(host1_socket.socket_id, "live_state_update", pkResult);
      emitEvent(host2_socket.socket_id, "live_state_update", pkResult);
    }

    emitEvent(socket.id, "end_pk", {
      status: true,
      message: "PK battle successfully ended",
    });
  }

  catch (err) {
    console.error("end_pk Error:", err);
    emitEvent(socket.id, "end_pk", {
      status: false,
      message: "Internal server error",
    });
  }
}


async function pk_webrtc_offer(socket, data, emitEvent) {
  try {
    const isUser = await getUser({ user_id: socket.authData.user_id });
    if (!isUser) {
      return next(new Error("User not found."));
    }
    const { target_user_id, pk_battle_id, sdp } = data;
    if (!target_user_id || !pk_battle_id || !sdp) {
      emitEvent(socket.id, "pk_webrtc_offer", {
        status: false,
        message: "target_user_id, pk_battle_id, and sdp are required",
      });
      return;
    }

    const main_streamer = await getUser({ user_id: target_user_id })
    emitEvent(main_streamer.socket_id, "pk_webrtc_offer", {
      pk_battle_id,
      sdp,
    });
  }
  catch (err) {
    console.error("pk_webrtc_offer Error:", err);
    emitEvent(socket.id, "pk_webrtc_offer", {
      status: false,
      message: "Internal server error",
    });
  }
}

async function pk_webrtc_answer(socket, data, emitEvent) {
  try {
    const isUser = await getUser({ user_id: socket.authData.user_id });
    if (!isUser) {
      return next(new Error("User not found."));
    }
    const { target_user_id, pk_battle_id, sdp } = data;
    if (!target_user_id || !pk_battle_id || !sdp) {
      emitEvent(socket.id, "pk_webrtc_answer", {
        status: false,
        message: "target_user_id, pk_battle_id, and sdp are required",
      });
      return;
    }
    const main_streamer = await getUser({ user_id: target_user_id })
    emitEvent(main_streamer.socket_id, "pk_webrtc_answer", {
      pk_battle_id,
      sdp,
    });
  }
  catch (err) {
    console.error("pk_webrtc_answer Error:", err);
    emitEvent(socket.id, "pk_webrtc_answer", {
      status: false,
      message: "Internal server error",
    });
  }
}

async function pk_webrtc_ice_candidate(socket, data, emitEvent) {
  try {
    const isUser = await getUser({ user_id: socket.authData.user_id });
    if (!isUser) {
      return next(new Error("User not found."));
    }

    const { target_user_id, pk_battle_id, candidate } = data;
    if (!target_user_id || !pk_battle_id || !candidate) {
      emitEvent(socket.id, "pk_webrtc_ice_candidate", {
        status: false,
        message: "target_user_id, pk_battle_id, and candidate are required",
      });
      return;
    }

    const main_streamer = await getUser({ user_id: target_user_id })
    emitEvent(main_streamer.socket_id, "pk_webrtc_ice_candidate", {
      pk_battle_id,
      candidate,
    });
  }
  catch (err) {
    console.error("pk_webrtc_ice_candidate Error:", err);
    emitEvent(socket.id, "pk_webrtc_ice_candidate", {
      status: false,
      message: "Internal server error",
    });
  }
}


async function cohost_request(socket, data, emitEvent) {
  try {
    console.log("cohost_request data:", data);

    const { host_user_id } = data;

    if (!host_user_id) {
      return emitEvent(socket.id, "cohost_request", {
        status: false,
        message: "host_user_id is required",
      });
    }

    const main_streamer = await getUser({ user_id: host_user_id })
    // Forward request to the host
    emitEvent(main_streamer.socket_id, "cohost_request", {
      status: true,
      message: "Co-host request received",
      data,
    });
  } catch (err) {
    console.error("cohost_request Error:", err);
    emitEvent(socket.id, "cohost_request", {
      status: false,
      message: "Internal server error",
    });
  }
}

async function cohost_request_response(socket, data, emitEvent, emitToRoom) {
  try {
    console.log("cohost_request_response data:", data);

    const { requester_user_id } = data;

    if (!requester_user_id) {
      return emitEvent(socket.id, "cohost_request_response", {
        status: false,
        message: "requester_user_id is required",
      });
    }

    const main_streamer = await getUser({ user_id: requester_user_id })
    // Send response back to the requester
    emitEvent(main_streamer.socket_id, "cohost_request_response", {
      status: true,
      message: "Response forwarded to requester",
      data,
    });
    if (!data.accepted) return;
    // Notify all viewers in the live room about the new co-host
    emitToRoom(data.host_live_socket_room_id, "cohost_joined", {
      status: true,
      message: "A new co-host has joined the stream",
      data,
    });

  } catch (err) {
    console.error("cohost_request_response Error:", err);

    emitEvent(socket.id, "cohost_request_response", {
      status: false,
      message: "Internal server error",
    });
  }
}

async function cohost_leave(socket, data, emitEvent, emitToRoom) {
  try {
    console.log("Co-host left:", data.cohost_user_id);

    emitToRoom(data.socket_room_id, "cohost_left", {
      status: true,
      message: "Co-host has left the stream",
      data,
    });
  } catch (err) {
    console.error("cohost_leave Error:", err);

    emitEvent(socket.id, "cohost_leave", {
      status: false,
      message: "Internal server error",
    });
  }
}

async function remove_cohost(socket, data, emitEvent, emitToRoom) {
  try {
    const { cohost_user_id } = data;

    if (!cohost_user_id) {
      return emitEvent(socket.id, "cohost_removed", {
        status: false,
        message: "cohost_user_id is required",
      });
    }

    const main_streamer = await getUser({ user_id: cohost_user_id })
    // Notify the co-host they are removed
    emitEvent(main_streamer.socket_id, "cohost_removed", {
      status: true,
      message: "You have been removed as a co-host",
      data,
    });
    emitToRoom(data.socket_room_id, "cohost_left", {
      status: true,
      message: "A co-host has been removed from the stream",
      data,
    });

  } catch (err) {
    console.error("remove_cohost Error:", err);

    emitEvent(socket.id, "cohost_removed", {
      status: false,
      message: "Internal server error",
    });
  }
}






module.exports = {
  startPK,
  endPK,
  pk_battle_request,
  pk_battle_request_response,
  pk_webrtc_offer,
  pk_webrtc_answer,
  pk_webrtc_ice_candidate,
  cohost_request,
  cohost_request_response,
  cohost_leave,
  remove_cohost,
  end_pk,
  update_pk_score
};