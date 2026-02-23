const { getUser } = require('../../service/repository/user.service');
const { getPkById } = require('../../service/repository/Pk.service');
const { redis } = require("../../helper/redis");
const { send_live_token_individual_user } = require("../../service/common/individualSocket.service");
const { User } = require("../../../models");
const {  deleteRoom } = require("../../service/common/livekit.service");


async function end_pk(socket, data, emitEvent, emitToRoom, getRoomMembers) {
  try {
    let isUser = null;
    if (socket && socket?.authData?.user_id) {
      isUser = await getUser({ user_id: socket.authData.user_id });
      if (!isUser) {
        return next(new Error("User not found."));
      }
    }

    console.log("=======>", data)

    const { pk_battle_id, remaining } = data;

    if (!pk_battle_id) {
      console.log("pk_battle_id is required");
      // emitEvent(socket.id, "end_pk", {
      //   status: false,
      //   message: "pk_battle_id is required",
      // });
      return;
    }

    const pkBattles = await getPkById({ pk_battle_id: pk_battle_id });
    if (!pkBattles) {
      console.log("PK battle not found");
      // emitEvent(socket.id, "end_pk", {
      //   status: false,
      //   message: "PK battle not found",
      // });
      return;
    }

    const lefthost = await getUser({ user_id: pkBattles.host1_user_id })
    const righthost = await getUser({ user_id: pkBattles.host2_user_id })

    let winner = {};
    let looser = {};
    if (pkBattles.battle_status == "active") {

      if (isUser) {

        if (isUser.user_id === pkBattles.host1_user_id) {
          pkBattles.winner = "host2";
          looser.winner = "host1";
          looser.score = pkBattles.host1_total_points;
          looser.name = lefthost.full_name;
          looser.avatar = lefthost.profile_pic;
          looser.url = `${process.env.baseUrl_aapapi}/uploads/appapi/pk/victory.png`

          winner.winner = "host2";
          winner.score = pkBattles.host2_total_points;
          winner.name = righthost.full_name;
          winner.avatar = righthost.profile_pic;
          winner.url = `${process.env.baseUrl_aapapi}/uploads/appapi/pk/defeat.png`
        } else {
          pkBattles.winner = "host1";
          winner.winner = "host1";
          winner.score = pkBattles.host1_total_points;
          winner.name = lefthost.full_name;
          winner.avatar = lefthost.profile_pic;
          winner.url = `${process.env.baseUrl_aapapi}/uploads/appapi/pk/victory.png`

          looser.winner = "host2";
          looser.score = pkBattles.host2_total_points;
          looser.name = righthost.full_name;
          looser.avatar = righthost.profile_pic;
          looser.url = `${process.env.baseUrl_aapapi}/uploads/appapi/pk/defeat.png`

        }
      }
      else if (pkBattles.host1_total_points > pkBattles.host2_total_points) {
        pkBattles.winner = "host1";

        winner.winner = "host1";
        winner.score = pkBattles.host1_total_points;
        winner.name = lefthost.full_name;
        winner.avatar = lefthost.profile_pic;
        winner.url = `${process.env.baseUrl_aapapi}/uploads/appapi/pk/victory.png`

        looser.winner = "host2";
        looser.score = pkBattles.host2_total_points;
        looser.name = righthost.full_name;
        looser.avatar = righthost.profile_pic;
        looser.url = `${process.env.baseUrl_aapapi}/uploads/appapi/pk/defeat.png`

      } else if (pkBattles.host2_total_points > pkBattles.host1_total_points) {
        pkBattles.winner = "host2";

        looser.winner = "host1";
        looser.score = pkBattles.host1_total_points;
        looser.name = lefthost.full_name;
        looser.avatar = lefthost.profile_pic;
        looser.url = `${process.env.baseUrl_aapapi}/uploads/appapi/pk/defeat.png`


        winner.winner = "host2";
        winner.score = pkBattles.host2_total_points;
        winner.name = righthost.full_name;
        winner.avatar = righthost.profile_pic;
        winner.url = `${process.env.baseUrl_aapapi}/uploads/appapi/pk/victory.png`
      } else {

        winner.score = pkBattles.host2_total_points;
        winner.name = "";
        winner.avatar = "";
        winner.url = `${process.env.baseUrl_aapapi}/uploads/appapi/pk/draw.png`
        winner.winner = "draw";

        pkBattles.winner = "draw";
      }
    } else {
      redis.del(`pk:timer:${pk_battle_id}`);
      console.log("PK battle already ended or not active");
      // emitEvent(socket.id, "end_pk", {
      //   status: false,
      //   message: "PK battle ended!",
      //   pkResult: null,
      //   answer: null
      // });
      return;
    }


    pkBattles.time_remaining = remaining || 0;
    pkBattles.battle_status = "ended";
    pkBattles.ended_at = Date.now();
    await pkBattles.save();

    // const pkResult = await getPkResults(pk_battle_id);    // when Pk_battles_results is needed
    let pkResult = await getPkById({ pk_battle_id: pk_battle_id }, true);
    pkResult = pkResult.get({ plain: true });


    // 🔥 CLEAR REDIS TIMER
    await redis.del(`pk:timer:${pk_battle_id}`);

    console.log("pkResult:==============>", pkResult, winner, looser);

    if (pkResult) {
      // const host1_socket = await getUser({ user_id: pkResult.host1_user_id });
      // const host2_socket = await getUser({ user_id: pkResult.host2_user_id });

      emitToRoom(pkResult.host1_socket_room_id, "end_pk", {
        status: true,
        message: "PK battle successfully ended",
        pkResult,
        answer: pkBattles.winner == "host2" ? looser : winner
      });
      emitToRoom(pkResult.host2_socket_room_id, "end_pk", {
        status: true,
        message: "PK battle successfully ended",
        pkResult,
        answer: pkBattles.winner == "host1" ? looser : winner
      });



      // For INDIVIDUAL LIVE rook livekit token

      const socketsIds1 = await getRoomMembers(pkResult.host1_socket_room_id);
      console.log("-==================> dffd", socketsIds1);
      for (const socketId of socketsIds1) {
        const identity = await User.findOne({ where: { socket_id: socketId } }); //TODO: for testing purpose, can be changed later like set user_id in socketID   -> for better response
        if (identity.user_id === pkResult.host1_user_id) {
          await send_live_token_individual_user(socketId, identity.user_id, pkResult.host1_socket_room_id, "host", emitEvent);
        } else {
          await send_live_token_individual_user(socketId, identity.user_id, pkResult.host1_socket_room_id, "viewer", emitEvent);
        }
      }
      const socketsIds2 = await getRoomMembers(pkResult.host2_socket_room_id);
      for (const socketId of socketsIds2) {
        const identity = await User.findOne({ where: { socket_id: socketId } }); //TODO: for testing purpose, can be changed later like set user_id in socketID   -> for better response
        if (identity.user_id === pkResult.host2_user_id) {
          await send_live_token_individual_user(socketId, identity.user_id, pkResult.host2_socket_room_id, "host", emitEvent);
        } else {
          await send_live_token_individual_user(socketId, identity.user_id, pkResult.host2_socket_room_id, "viewer", emitEvent);
        }
      }

      console.log("-==================> dddd", socketsIds1, socketsIds2);
      // OR
      // const livekit_details = await generateLivekitToken(pkResult.host1_socket_room_id, pkResult.host1_socket_room_id, 'host');
      // const livekit_details2 = await generateLivekitToken(pkResult.host2_socket_room_id, pkResult.host2_socket_room_id, 'host');

      // emitToRoom(pkResult.host1_socket_room_id, "pk_livekit_token_details", livekit_details);
      // emitToRoom(pkResult.host2_socket_room_id, "pk_livekit_token_details", livekit_details2);

      emitToRoom(pkResult.host1_socket_room_id, "update_pk_score", pkResult);
      emitToRoom(pkResult.host2_socket_room_id, "update_pk_score", pkResult);

      deleteRoom(pkResult.pk_battle_id); // delete socket room after battle end
      // emitEvent(host1_socket.socket_id, "live_state_update", pkResult);
      // emitEvent(host2_socket.socket_id, "live_state_update", pkResult);
    }

    // emitEvent(socket.id, "end_pk", {
    //   status: true,
    //   message: "PK battle successfully ended",
    // });
  }

  catch (err) {
    console.error("end_pk Error:", err);
    // emitEvent(socket.id, "end_pk", {
    //   status: false,
    //   message: "Internal server error",
    // });
  }
}


module.exports = {
    end_pk
}