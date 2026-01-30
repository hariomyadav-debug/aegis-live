const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

const { Audio_stream_host, User, Audio_stream } = require("../../../models");


async function createAudioStreamHost(streamPayload) {
    try {
        const newStream = await Audio_stream_host.create(streamPayload);
        return newStream;
    } catch (error) {
        console.error('Error creating audio_stream_host:', error);
        throw error;
    }
}
async function get_audioStreamHost(streamPayload, pagination = { page: 1, pageSize: 10 }, excludedUserIds = []) {
    try {
        // Destructure and ensure proper types for pagination values
        const { page = 1, pageSize = 10 } = pagination;
        const offset = (Number(page) - 1) * Number(pageSize);
        const limit = Number(pageSize);

        // Build the where condition
        let wherecondition = { ...streamPayload }; // Default to the provided payload

        // if (streamPayload.live_status == ""){
        //     delete wherecondition.live_status
        // }

        // Add pagination options to the payload
        const query = {
            where:wherecondition,
            limit,
            offset,
            include: [
                {
                    model : User,
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
                            // "socket_id",
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
        const { rows, count } = await Audio_stream_host.findAndCountAll(query);
        
        // Prepare the structured response
        return {
            // Records: rows,
            Records: rows.map(r => r.get({ plain: true })),
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
async function updateAudioStreamHost(streamPayload, updateData, excludedUserIds = []) {
    try {

        // Use the update method to update the records
        const [updatedCount] = await Audio_stream_host.update(updateData, { where: streamPayload });

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


async function isStreamingHost(hostPlayload={},  livePlayload={live_status: "live"}) {
  
  try {
    const hostLive = await Audio_stream_host.findOne({
      where: hostPlayload,
      include: [
        {
          model: Audio_stream,
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
      stream_id: hostLive.stream_id,
      stream_data: hostLive,
    };
  } catch (err) {
    console.error("Get is host audio stream  Error:", err);
    return { isLive: false, live_id: null, message: "Something went wrong!", };
  }
}




module.exports = {
    createAudioStreamHost,
    get_audioStreamHost,
    updateAudioStreamHost,
    isStreamingHost,
}