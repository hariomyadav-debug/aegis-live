const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

const { Audio_stream, User, Audio_stream_host } = require("../../../models");


async function createAudioStream(streamPayload) {
    try {
        const newStream = await Audio_stream.create(streamPayload);
        return newStream;
    } catch (error) {
        console.error('Error creating Live:', error);
        throw error;
    }
}

async function getAudioStream(streamPayload, pagination = { page: 1, pageSize: 10 }, excludedUserIds = [], order = [['createdAt', 'DESC']]) {
    try {
        // Destructure and ensure proper types for pagination values
        const { page = 1, pageSize = 10 } = pagination;
        const offset = (Number(page) - 1) * Number(pageSize);
        const limit = Number(pageSize);

        // Build the where condition
        let wherecondition = { ...streamPayload }; // Default to the provided payload

        if (streamPayload.live_status == "") {
            delete wherecondition.live_status
        }

        // Add pagination options to the payload
        const query = {
            where: wherecondition,
            limit,
            offset,
            include: [
                {
                    model: Audio_stream_host,
                    where: { is_stream: true },
                    required: true,
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
                                    // "country_code",
                                    // "mobile_num",
                                    // "login_type",
                                    "gender",
                                    "state",
                                    "city",
                                    "bio",
                                    "login_verification_status",
                                    "is_private",
                                    "is_admin",
                                    "intrests",
                                    // "socket_id",
                                    // "available_coins",
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
                }
            ],
            order: order,
        };

        // Use findAndCountAll to get both rows and count
        const { rows, count } = await Audio_stream.findAndCountAll(query);

        // Prepare the structured response
        return {
            Records: rows.map(row => row.toJSON()),
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

async function getUnifiedStreams(payload = {}, pagination = { page: 1, pageSize: 10 }) {
    try {
        const { page = 1, pageSize = 10 } = pagination;
        const offset = (page - 1) * pageSize;
        const limit = Number(pageSize);

        const liveStatusCond = payload.live_status ? `AND main.live_status = '${payload.live_status}'` : '';
        const isDemoCond = payload.is_demo === false ? `AND main.is_demo = 0` : '';

        const query = `
            SELECT *
            FROM (
                SELECT
                    a.audio_stream_id AS live_id,
                    a.total_viewers,
                    a.curent_viewers,
                    a.likes,
                    a.socket_room_id,
                    a.comments,
                    a.live_title,
                    a.live_status,
                    a.is_demo,
                    a.createdAt,
                    a.updatedAt,
                    TRUE AS is_audio,
                    FALSE AS is_video,
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'live_host_id', ah.audio_stream_host_id,
                            'is_live', ah.is_live,
                            'is_main_host', ah.is_main_host,
                            'peer_id', ah.peer_id,
                            'createdAt', ah.createdAt,
                            'updatedAt', ah.updatedAt,
                            'live_id', ah.audio_stream_id,
                            'user_id', ah.user_id,
                            'User', JSON_OBJECT(
                                'user_id', u.user_id,
                                'user_name', u.user_name,
                                'email', u.email,
                                'mobile_num', u.mobile_num,
                                'profile_pic', u.profile_pic,
                                'full_name', u.full_name,
                                'first_name', u.first_name,
                                'last_name', u.last_name,
                                'country_code', u.country_code,
                                'login_type', u.login_type,
                                'country', u.country,
                                'country_short_name', u.country_short_name,
                                'profile_verification_status', u.profile_verification_status,
                                'total_socials', u.total_socials,
                                'blocked_by_admin', u.blocked_by_admin,
                                'is_deleted', u.is_deleted,
                                'createdAt', u.createdAt,
                                'updatedAt', u.updatedAt
                            )
                        )
                    ) AS Live_hosts
                FROM Audio_stream a
                JOIN Audio_stream_host ah ON a.audio_stream_id = ah.audio_stream_id
                JOIN Users u ON ah.user_id = u.user_id
                WHERE 1=1 ${liveStatusCond} ${isDemoCond}
                GROUP BY a.audio_stream_id

                UNION ALL

                SELECT
                    l.live_id,
                    l.total_viewers,
                    l.curent_viewers,
                    l.likes,
                    l.socket_room_id,
                    l.comments,
                    l.live_title,
                    l.live_status,
                    l.is_demo,
                    l.createdAt,
                    l.updatedAt,
                    FALSE AS is_audio,
                    TRUE AS is_video,
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'live_host_id', lh.live_host_id,
                            'is_live', lh.is_live,
                            'is_main_host', lh.is_main_host,
                            'peer_id', lh.peer_id,
                            'createdAt', lh.createdAt,
                            'updatedAt', lh.updatedAt,
                            'live_id', lh.live_id,
                            'user_id', lh.user_id,
                            'User', JSON_OBJECT(
                                'user_id', u2.user_id,
                                'user_name', u2.user_name,
                                'email', u2.email,
                                'mobile_num', u2.mobile_num,
                                'profile_pic', u2.profile_pic,
                                'full_name', u2.full_name,
                                'first_name', u2.first_name,
                                'last_name', u2.last_name,
                                'country_code', u2.country_code,
                                'login_type', u2.login_type,
                                'country', u2.country,
                                'country_short_name', u2.country_short_name,
                                'profile_verification_status', u2.profile_verification_status,
                                'total_socials', u2.total_socials,
                                'blocked_by_admin', u2.blocked_by_admin,
                                'is_deleted', u2.is_deleted,
                                'createdAt', u2.createdAt,
                                'updatedAt', u2.updatedAt
                            )
                        )
                    ) AS Live_hosts
                FROM Live l
                JOIN Live_host lh ON l.live_id = lh.live_id
                JOIN Users u2 ON lh.user_id = u2.user_id
                WHERE 1=1 ${liveStatusCond} ${isDemoCond}
                GROUP BY l.live_id

            ) AS main
            ORDER BY main.createdAt DESC
            LIMIT ${limit} OFFSET ${offset};
        `;

        const countQuery = `
            SELECT COUNT(*) AS total FROM (
                SELECT a.audio_stream_id FROM Audio_stream a WHERE 1=1 ${liveStatusCond} ${isDemoCond}
                UNION ALL
                SELECT l.live_id FROM Live l WHERE 1=1 ${liveStatusCond} ${isDemoCond}
            ) t;
        `;

        const [records] = await sequelize.query(query);
        const [[{ total }]] = await sequelize.query(countQuery);

        return {
            Records: records,
            Pagination: {
                total_pages: Math.ceil(total / pageSize),
                total_records: total,
                current_page: Number(page),
                records_per_page: Number(pageSize),
            },
        };

    } catch (err) {
        console.error("getUnifiedStreams Error:", err);
        throw err;
    }
}


async function updateAudioStream(streamPayload, updateData, excludedUserIds = []) {
    try {
        // Use the update method to update the records
        const [updatedCount] = await Audio_stream.update(updateData, { where: streamPayload });

        // Return a structured response
        return {
            message: updatedCount > 0 ? 'Update successful' : 'No records updated',
            updated_count: updatedCount,
        };
    } catch (error) {
        console.error('Error updating Live:', error);
        throw error;
    }
}

async function deleteAudioStream(streamPayload) {
    try {
        // Use the destroy method to delete the records

        const [deletedCount] = await Audio_stream.update({ live_status: "stopped", off_time: Date.now() }, { where: streamPayload });

        // Return a structured response
        return {
            message: deletedCount > 0 ? 'Delete successful' : 'No records deleted',
            deleted_count: deletedCount,
        };
    } catch (error) {
        console.error('Error deleting Live:', error);
        throw error;
    }
}

async function getAudioSteamCount(streamPayload) {
    try {

        const count = await Audio_stream.count({
            where: streamPayload,
        });

        return count;
    } catch (error) {
        console.error('Error in Live count:', error);
    }
}


module.exports = {
    createAudioStream,
    getAudioStream,
    updateAudioStream,
    getAudioSteamCount,
    deleteAudioStream,
    getUnifiedStreams
}