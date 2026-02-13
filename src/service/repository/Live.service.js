const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const util = require('util');
const { Live, User, Live_host } = require("../../../models");
const { getUserframe } = require('./Store/Frame.service');
const { getUserLevel } = require('./Level.service');
const { REGION_COUNTRIES } = require('../../utils/contries.key');


async function createLive(livePayload) {
    try {
        const newLive = await Live.create(livePayload);
        return newLive;
    } catch (error) {
        console.error('Error creating Live:', error);
        throw error;
    }
}
async function getLive(livePayload, pagination = { page: 1, pageSize: 10 }, excludedUserIds = [], order = [['createdAt', 'DESC']]) {
    try {
        // Destructure and ensure proper types for pagination values
        const page = Number(pagination.page) || 1;
        const pageSize = Number(pagination.pageSize) || 10;
        const offset = (page - 1) * pageSize;
        const limit = pageSize;

        // Build the where condition - create a new object to avoid side effects
        let wherecondition = {};

        // Extract search term if provided
        const regionId = livePayload?.region ? String(livePayload.region).trim() : '';
        const searchTerm = livePayload?.search ? String(livePayload.search).trim() : '';
        const isNumeric = !isNaN(searchTerm) && searchTerm !== '';

        // Handle each field from livePayload except search
        for (const key in livePayload) {
            if (key !== 'search' && key !== 'region') {
                wherecondition[key] = livePayload[key];
            }
        }

        // Remove live_status if it's an empty string
        if (wherecondition.live_status === "") {
            delete wherecondition.live_status;
        }

        // Add search filter if provided
        if (searchTerm) {
            const searchConditions = [
                { live_title: { [Op.like]: `%${searchTerm}%` } },
                { socket_room_id: { [Op.like]: `%${searchTerm}%` } },
            ];

            if (isNumeric) {
                searchConditions.push({ live_id: parseInt(searchTerm) });
            }

            wherecondition[Op.or] = searchConditions;
        }

        if (searchTerm) {
            wherecondition[Op.or] = [
                { live_title: { [Op.iLike]: `%${searchTerm}%` } },
                { socket_room_id: { [Op.iLike]: `%${searchTerm}%` } },
                ...(isNumeric ? [{ live_id: Number(searchTerm) }] : []),

                // 🔥 Host search
                { '$Live_hosts.User.full_name$': { [Op.iLike]: `%${searchTerm}%` } },
                { '$Live_hosts.User.user_name$': { [Op.iLike]: `%${searchTerm}%` } }
            ];
        }

        // Add region-based filtering if regionId is provided and not "0"
        if (regionId && regionId != "0") {
            const regionCountries = REGION_COUNTRIES[regionId] || [];

            if (regionCountries.length) {
                const countryNames = regionCountries.map(c => c.name);
                const shortNames = regionCountries.map(c => c.short_name);
                const dialCodes = regionCountries.map(c => c.dial_code);

                wherecondition[Op.and] = [
                    ...(wherecondition[Op.and] || []),
                    {
                        [Op.or]: [
                            // 🌍 country name (any case)
                            {
                                '$Live_hosts.User.country$': {
                                    [Op.iLike]: { [Op.any]: countryNames }
                                }
                            },

                            // 🌍 short name (USA, IND, etc.)
                            {
                                '$Live_hosts.User.country_short_name$': {
                                    [Op.iLike]: { [Op.any]: shortNames }
                                }
                            },

                            // 🌍 dial code (+1, +91, etc.)
                            {
                                '$Live_hosts.User.country_code$': {
                                    [Op.in]: dialCodes
                                }
                            }
                        ]
                    }
                ];
            }
        }


            // Build query with distinct for accurate counting
            const query = {
                where: wherecondition,
                limit,
                offset,
                subQuery: false, // 🔥 MUST
                include: [
                    {
                        model: Live_host,
                        as: 'Live_hosts',
                        where: { is_live: true },
                        required: true,
                        where: { is_live: true },
                        include: [
                            {
                                model: User,
                                required: !!searchTerm, // 🔥 only INNER JOIN when searching
                                attributes: {
                                    exclude: [
                                        "password",
                                        "otp",
                                        "social_id",
                                        "id_proof",
                                        "selfie",
                                        "device_token",
                                        "dob",
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
                    }
                ],
                order: order,
            };

            // Use findAndCountAll to get both rows and count
            const { rows, count } = await Live.findAndCountAll(query);

            const records = await Promise.all(
                rows.map(async (row) => {
                    const data = row.toJSON();

                    // Audio_stream_hosts is an ARRAY
                    if (
                        Array.isArray(data.Live_hosts) &&
                        data.Live_hosts.length > 0
                    ) {
                        data.Live_hosts = await Promise.all(
                            data.Live_hosts.map(async (host) => {
                                if (host.User) {
                                    const levelPayload = {
                                        level_up: {
                                            [Op.lte]: Number(host.User.consumption || 0)
                                        }
                                    };
                                    const framePayload = {
                                        user_id: host.User.user_id,
                                        status: true,
                                        end_time: {
                                            [Op.gt]: Sequelize.fn('NOW') // active frame
                                        }
                                    }

                                    const level = await getUserLevel(levelPayload, attributes);
                                    const frame = await getUserframe(framePayload);

                                    host.User.level = level || null;
                                    host.User.frame = frame || null;
                                }
                                return host;
                            })
                        );
                    }

                    return data;
                })
            );

            // Prepare the structured response
            return {
                Records: records, // Return filtered if search term, else return all
                Pagination: {
                    total_pages: Math.ceil(count / pageSize),
                    total_records: Number(count),
                    current_page: page,
                    records_per_page: pageSize,
                },
            };
        } catch (error) {
            console.error('Error fetching Live:', error);
            throw error;
        }
    }

async function updateLive(livePayload, updateData, excludedUserIds = []) {
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
            const [updatedCount] = await Live.update(updateData, { where: livePayload });

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

    async function deleteLive(livePayload) {
        try {
            // Use the destroy method to delete the records

            const [deletedCount] = await Live.update({ live_status: "stopped" }, { where: livePayload });

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

    async function getLiveCount(livePayload) {
        try {

            const count = await Live.count({
                where: livePayload,
            });

            return count;
        } catch (error) {
            console.error('Error in Live count:', error);
        }
    }

    /**
     * Generate a unique room ID
     * @returns {string} - Unique room ID
     */
    const generateRoomId = () => {
        const roomId = uuidv4().replace(/-/g, ''); // Remove dashes for a cleaner ID
        return roomId;
    };


    module.exports = {
        createLive,
        getLive,
        updateLive,
        deleteLive,
        generateRoomId,
        getLiveCount
    }