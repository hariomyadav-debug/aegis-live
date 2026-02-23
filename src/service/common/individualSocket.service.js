const { generateLivekitToken } = require("../common/livekit.service");
const { v4: uuidv4 } = require('uuid');
//  make seperate token for every join user in pk battle

// TODO: use user id for identity instead of socket id or
async function send_live_token_individual_user(socketId, identity="22", roomName, role="viewer", emitEvent) {
  console.log("=======================> send_live_token_individual_user: ", socketId, identity, roomName, role);
  try {
    const livekit_details = await generateLivekitToken(roomName, identity, role);   // for now make all host but can be changed later according to the user role in pk battle
    emitEvent(socketId, "pk_livekit_token_details", livekit_details);
  } catch (err) {
    console.error("Error sending live token to individual user:", err);
  }
}

module.exports = {
  send_live_token_individual_user
}