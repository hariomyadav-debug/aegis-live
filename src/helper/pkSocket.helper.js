import { Op } from "sequelize";
import { getPkById } from "../service/repository/Pk.service.js";
import { getGiftSentGroupedByUser } from "../service/repository/Transactions/Coin_coin_transaction.service.js";

export async function top_ranking_pk_sender(socket, data, emitEvent, emitToRoom) {

  if (!data.pk_battle_id && !data.socket_room_id) {
    return emitEvent(socket.id, 'top_ranking_pk_sender', "data is missing");
  }

  let payload = {}

  if (data.socket_room_id) {
    payload = {
      [Op.or]: [
        { host1_socket_room_id: data.socket_room_id },
        { host2_socket_room_id: data.socket_room_id }
      ],
      battle_status: "active"
    }
  }
  if (data.pk_battle_id) {
    payload = { pk_battle_id: data.pk_battle_id }
  }
  
  console.log(payload)
  
  try {
    let pk_battle = await getPkById(payload);
    console.log(pk_battle)

    if (!pk_battle) {
      console.log("pk not found.")
      return;
    }

    let sendersData = {};

    const topSenderOne = await getGiftSentGroupedByUser({
      transaction_ref: "pk",
      transaction_ref_id: data.pk_battle_id,
      reciever_id: pk_battle.host1_user_id
    }, 3);

    const topSenderTwo = await getGiftSentGroupedByUser({
      transaction_ref: "pk",
      transaction_ref_id: data.pk_battle_id,
      reciever_id: pk_battle.host2_user_id
    }, 3)

    sendersData.hostOne = topSenderOne;
    sendersData.hostTwo = topSenderTwo;

    emitToRoom(pk_battle.host2_socket_room_id, 'top_ranking_pk_sender', sendersData);
    emitToRoom(pk_battle.host1_socket_room_id, 'top_ranking_pk_sender', sendersData);
    return
  } catch (error) {
    console.log('Emit to top_ranking_pk_sender Error: ', error)
    emitEvent(socket.id, "top_ranking_pk_sender", { data: null, message: String(error) })
  }


}