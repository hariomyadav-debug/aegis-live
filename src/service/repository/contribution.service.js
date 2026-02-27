const { Op, fn, col, literal } = require("sequelize");
const { Coin_to_coin, User } = require("../../../models");
const { isFollow, countFollows } = require("./Follow.service");

/**
 * Get date filter for different time periods
 * @param {string} filter - 'daily', 'weekly', 'monthly', 'all' (default)
 * @returns {Object} Sequelize where condition
 */
const getDateFilter = (filter) => {
    const today = new Date();

    if (filter === "daily") {
        const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return { createdAt: { [Op.gte]: dayStart } };
    }

    if (filter === "weekly") {
        const dayOfWeek = today.getDay();
        // Monday = 1, so if today is Monday, subtract 0, if Tuesday subtract 1, etc.
        const first = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Sunday
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - first);
        weekStart.setHours(0, 0, 0, 0);
        return { createdAt: { [Op.gte]: weekStart } };
    }

    if (filter === "monthly") {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return { createdAt: { [Op.gte]: monthStart } };
    }

    return {}; // No filter for 'all'
};

/**
 * Format number with K, M, B suffix
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
const formatNumber = (num) => {
    if (num === "***") return "***";
    if (num >= 1000000000) {
        return (Math.round((num / 1000000000) * 100) / 100).toFixed(2) + "B";
    } else if (num >= 1000000) {
        return (Math.round((num / 1000000) * 100) / 100).toFixed(2) + "M";
    } else if (num >= 1000) {
        return (Math.round((num / 1000) * 100) / 100).toFixed(2) + "K";
    } else {
        return String(num);
    }
};

/**
 * Get contribution ranking for a user (senders)
 * @param {number} userId - Current login user ID
 * @param {string} filter - 'daily', 'weekly', 'monthly', 'all'
 * @param {number} limit - Limit results (0 = no limit)
 * @param {number} offset - Offset for pagination (default: 0)
 * @returns {Promise<Array>} Ranking array with user info
 */
async function getContributionRanking(userId, filter = "all", limit = 20, offset = 0) {
    try {
        const dateFilter = getDateFilter(filter);

        let result = await Coin_to_coin.findAll({
            where: { ...dateFilter },
            include: [
                {
                    model: User,
                    as: "sender",
                    attributes: ["profile_pic", "user_name"],
                },
            ],
            attributes: [
                "sender_id",
                [fn("SUM", col("coin")), "total"],
                [fn("COUNT", col("transaction_id")), "transaction_count"],
                [col("sender.user_id"), "id"],
                [col("sender.user_name"), "name"],
            ],
            group: ["sender_id", "sender.user_id"],
            order: [[literal("total"), "DESC"]],
            ...(limit ? { limit: Number(limit), offset: Number(offset) } : {}),
            // raw: true,
            subQuery: false,
        });

        result = JSON.parse(JSON.stringify(result));

        // Add rank and enrich with user data
        return await Promise.all(
            result.map(async (row, index) => {
                const isFollowing = await isFollow({
                    user_id: row.id,
                    follower_id: userId,
                });

                const following_count = await countFollows({
                    follower_id: row.id,
                });

                return {
                    id: row.id,
                    uid: row.sender_id,
                    name: row.name,
                    userinfo: {
                        user_id: row.id,
                        user_name: row.name,
                        profile_pic: row?.sender?.profile_pic || "",
                        followers: following_count,
                        isFollowing: !!isFollowing,
                    },
                    total: row.total,
                    transaction_count: row.transaction_count,
                    rank: index + 1,
                };
            })
        );
    } catch (error) {
        console.error("getContributionRanking error:", error);
        throw error;
    }
}

/**
 * Get ordered contribution list with total sum and pagination info
 * @param {number} userId - Current login user ID
 * @param {string} filter - 'daily', 'weekly', 'monthly', 'all'
 * @param {number} limit - Limit results per page
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Object>} { list, total, hasMore, totalCount, offset, limit }
 */
async function getOrderedContribution(userId, filter = "all", limit = 20, offset = 0) {
    try {
        const dateFilter = getDateFilter(filter);

        // Get ranking list with pagination
        const list = await getContributionRanking(userId, filter, limit, offset);

        // Get total sum
        const totalResult = await Coin_to_coin.findOne({
            where: { ...dateFilter },
            attributes: [[fn("SUM", col("coin")), "total_sum"]],
            raw: true,
        });

        // Get total count of unique senders for pagination info
        const countResult = await Coin_to_coin.findAll({
            where: { ...dateFilter },
            attributes: [[fn("COUNT", fn("DISTINCT", col("sender_id"))), "unique_senders"]],
            raw: true,
        });

        const total = totalResult?.total_sum || 0;
        const totalCount = parseInt(countResult[0]?.unique_senders || 0);
        const hasMore = (offset + limit) < totalCount;

        return {
            list,
            total,
            hasMore,
            totalCount,
            offset,
            limit,
        };
    } catch (error) {
        console.error("getOrderedContribution error:", error);
        throw error;
    }
}

/**
 * Get all time periods data in single call
 * @param {number} userId - Current login user ID
 * @returns {Promise<Object>} { list_day, list_week, list_month, list_all, totals }
 */
async function getAllPeriodContributions(userId) {
    try {
        // Fetch all periods in parallel
        const [dayData, weekData, monthData, allData] = await Promise.all([
            getOrderedContribution(userId, "daily", 20),
            getOrderedContribution(userId, "weekly", 20),
            getOrderedContribution(userId, "monthly", 20),
            getOrderedContribution(userId, "all", 20),
        ]);

        return {
            list_day: dayData.list,
            list_day_total: dayData.total,
            list_week: weekData.list,
            list_week_total: weekData.total,
            list_month: monthData.list,
            list_month_total: monthData.total,
            list_all: allData.list,
            list_all_total: allData.total,
        };
    } catch (error) {
        console.error("getAllPeriodContributions error:", error);
        throw error;
    }
}

module.exports = {
    getDateFilter,
    formatNumber,
    getContributionRanking,
    getOrderedContribution,
    getAllPeriodContributions,
};
