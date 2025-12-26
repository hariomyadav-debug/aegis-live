const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

const { Live_host, User, Live } = require("../../../models");


async function createLiveHost(livePayload) {
  try {
    const newLive = await Live_host.create(livePayload);
    return newLive;
  } catch (error) {
    console.error('Error creating Live_host:', error);
    throw error;
  }
}
async function getLiveLive_host(livePayload, pagination = { page: 1, pageSize: 10 }, excludedUserIds = []) {
  try {
    // Destructure and ensure proper types for pagination values
    const { page = 1, pageSize = 10 } = pagination;
    const offset = (Number(page) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    // Build the where condition
    let wherecondition = { ...livePayload }; // Default to the provided payload

    // if (livePayload.live_status == ""){
    //     delete wherecondition.live_status
    // }

    // Add pagination options to the payload
    const query = {
      where: wherecondition,
      limit,
      offset,
      include: [
        {
          model: User,
          attributes: {
            exclude: [
              "password",
              "otp",
              "social_id",
              "id_proof",
              "selfie",
              "device_token",
              "dob",
              "country_code",
              "mobile_num",
              "login_type",
              "gender",
              "state",
              "city",
              "bio",
              "login_verification_status",
              "is_private",
              "is_admin",
              "intrests",
              "socket_id",
              "available_coins",
              "account_name",
              "account_number",
              "bank_name",
              "swift_code",
              "IFSC_code"
            ],
          },
        }
      ],
      order: [
        ['createdAt', 'DESC'],
      ],
    };

    // Use findAndCountAll to get both rows and count
    const { rows, count } = await Live_host.findAndCountAll(query);

    // Prepare the structured response
    return {
      Records: rows,
      Pagination: {
        total_pages: Math.ceil(count / pageSize),
        total_records: Number(count),
        current_page: Number(page),
        records_per_page: Number(pageSize),
      },
    };
  } catch (error) {
    console.error('Error fetching Live:', error);
    throw error;
  }
}
async function updateLiveHost(livePayload, updateData, excludedUserIds = []) {
  try {
    // Ensure the provided socialPayload matches the conditions for updating
    // const { user_id, ...whereConditions } = socialPayload;

    // Add the excluded user IDs condition if necessary
    // const updateQuery = {
    //     where: {
    //         ...whereConditions,
    //         user_id: {
    //             [Sequelize.Op.notIn]: excludedUserIds, // Exclude user_ids from the list
    //         }
    //     },
    // };

    // Use the update method to update the records
    const [updatedCount] = await Live_host.update(updateData, { where: livePayload });

    // Return a structured response
    return {
      message: updatedCount > 0 ? 'Update successful' : 'No records updated',
      updated_count: updatedCount,
    };
  } catch (error) {
    console.error('Error updating Live Host:', error);
    throw error;
  }
}

// async function deleteLive(livePayload) {
//     try {
//         // Use the destroy method to delete the records

//         const [deletedCount] = await Live.update({ live_status : "stopped"},{ where: livePayload });

//         // Return a structured response
//         return {
//             message: deletedCount > 0 ? 'Delete successful' : 'No records deleted',
//             deleted_count: deletedCount,
//         };
//     } catch (error) {
//         console.error('Error deleting Live:', error);
//         throw error;
//     }
// }

// async function getLiveCount(livePayload) {
//     try {

//         const count = await Live.count({
//             where: livePayload,
//         });

//         return count;
//     } catch (error) {
//         console.error('Error in Live count:', error);
//     }
// }

// /**
//  * Generate a unique room ID
//  * @returns {string} - Unique room ID
//  */
// const generateRoomId = () => {
//     const roomId = uuidv4().replace(/-/g, ''); // Remove dashes for a cleaner ID
//     return roomId;
// };

async function isHostLive(liveHostPlayload={},  livePlayload={live_status: "live"}) {
  
  try {
    const hostLive = await Live_host.findOne({
      where: liveHostPlayload,
      include: [
        {
          model: Live,
          where: livePlayload,
        },
      ],
    });

    if (!hostLive) {
      return {
        isLive: false,
        live_id: null,
        message: "Host is not currently live",
      };
    }

    return {
      isLive: true,
      live_id: hostLive.live_id,
      live_data: hostLive.Live,
    };
  } catch (err) {
    console.error("isHostLive Error:", err);
    return { isLive: false, live_id: null };
  }
}


module.exports = {
  createLiveHost,
  getLiveLive_host,
  updateLiveHost,
  isHostLive,
  // deleteLive,
  // generateRoomId,
  // getLiveCount
}