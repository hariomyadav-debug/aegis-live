const { Op } = require("sequelize");
const socket_service = require("../../service/common/socket.service");
const { getAllUsers } = require("../../service/repository/user.service");
const { generalResponse } = require("../../helper/response.helper");

async function get_live_listener_by_room(req, res) {
    if (!req.body?.socket_room_id) {
        return generalResponse(
            res,
            {},
            "Invalid room id",
            false,
            false,
            404
        );
    }
   
    try {
        const roomSocketIds = await socket_service.viewersSocketIds(req.body.socket_room_id);
        const userPayload = {
            socket_id: {
                [Op.in]: roomSocketIds
            }
        }

        const attributes = ['user_id', 'full_name', 'user_name', 'socket_id', 'profile_pic', 'consumption']

        const listenerUsers = await getAllUsers(userPayload, attributes);

        return generalResponse(
        res,
        {
            listenerUsers,
            total: listenerUsers ? listenerUsers.length : 0
        },
        "Live Found",
        true,
        true
    );

    } catch (error) {
        console.log("Listener list of live ERROR:", error);
        return generalResponse(
            res,
            {},
            "Internal server error",
            false,
            false,
            500
        );

    }

}


module.exports ={
    get_live_listener_by_room
}