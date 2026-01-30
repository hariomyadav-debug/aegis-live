
const { Op, fn, col, literal } = require("sequelize");
const { User, Coin_to_coin, Follow } = require("../../../models");
const { generalResponse } = require("../../helper/response.helper");
const { isFollow, countFollows } = require("../../service/repository/Follow.service");



// ------------------------ DATE FILTER FUNCTION ------------------------
const getDateFilter = (filter) => {
    const today = new Date();

    if (filter === "daily") {
        return { createdAt: { [Op.gte]: new Date(today.setHours(0, 0, 0, 0)) } };
    }

    if (filter === "weekly") {
        const firstDay = new Date(today.setDate(today.getDate() - 7));
        return { createdAt: { [Op.gte]: firstDay } };
    }

    if (filter === "monthly") {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        return { createdAt: { [Op.gte]: firstDay } };
    }

    if (filter === "yearly") {
        const firstDay = new Date(today.getFullYear(), 0, 1); // Jan 1st
        return { createdAt: { [Op.gte]: firstDay } };
    }

    return {}; // No filter
};



async function topReceiversList(filter, loginUserId, limit=0) {
    try {
        const dateFilter = getDateFilter(filter);

        let result = await Coin_to_coin.findAll({
            where: { ...dateFilter },
            include: [
                {
                    model: User,
                    as: "reciever",
                    attributes: ['profile_pic'],
                },


            ],
            attributes: [
                "reciever_id",
                [fn("SUM", col("coin")), "score"],
                [fn("COUNT", col("transaction_id")), "transactions"],
                [col("reciever.user_id"), "id"],
                [col("reciever.user_name"), "name"],
                // [col("reciever.profile_pic"), "imageUrl"]
            ],
            group: ["reciever_id", "reciever.user_id"],
            order: [[literal("score"), "DESC"]],
             ...(limit ? { limit: Number(limit) } : {}), // 👈 magic line
        });

        result = result.map(r => r.get({ plain: true }));

        // 🔥 Add rank based on score (sorted DESC already)
         return await Promise.all(
            result.map(async (row, index) => {
                const isFollowing = await isFollow({
                    user_id: row.id,
                    follower_id: loginUserId
                });

                const following_count = await countFollows({
                    follower_id: row.id
                });

                return {
                    ...row,
                    rank: index + 1,
                    isFollowing: !!isFollowing,
                    followers: following_count,
                    imageUrl: row.reciever.profile_pic,
                };
            })
        );


    } catch (error) {
        console.error("topReceiversList error:", error);
        throw error;
    }
}



async function topSendersList(filter, loginUserId, limit=0) {
    try {
        const dateFilter = getDateFilter(filter);
        console.log(dateFilter, 'dateFilter------');

        let result = await Coin_to_coin.findAll({
            where: { ...dateFilter },
            include: [
                {
                    model: User,
                    as: "sender",
                    attributes: ['profile_pic'],
                }
            ],
            attributes: [
                "sender_id",
                [fn("SUM", col("coin")), "score"],
                [fn("COUNT", col("transaction_id")), "transactions"],
                [col("sender.user_id"), "id"],
                [col("sender.user_name"), "name"],
                // [col("sender.profile_pic"), "imageUrl"]
            ],
            group: ["sender_id", "sender.user_id"],
            order: [[literal("score"), "DESC"]],
             ...(limit ? { limit: Number(limit) } : {}), // 👈 magic line
        });

         result = result.map(r => r.get({ plain: true }));

        // 🔥 Add rank based on score (sorted DESC already)
         return await Promise.all(
            result.map(async (row, index) => {
                const isFollowing = await isFollow({
                    user_id: row.id,
                    follower_id: loginUserId
                });

                const following_count = await countFollows({
                    follower_id: row.id
                });

                return {
                    ...row,
                    rank: index + 1,
                    imageUrl: row.sender.profile_pic,
                    isFollowing: !!isFollowing,
                    followers: following_count
                };
            })
        );


    } catch (error) {
        console.error("topSendersList error:", error);
        throw error;
    }
}


async function topSenderReceiverList(req, res) {
    const loginUserId = req.userData.user_id;
    try {
        const { filter } = req.query;   // daily / weekly / monthly / none

        console.log(filter, req.query)
        const senderData = await topSendersList(filter, loginUserId);
        const receiverData = await topReceiversList(filter, loginUserId);

        return generalResponse(
            res,
            { senderData, receiverData },
            "Leaderboard fetched successfully",
            true,
            true
        );

    } catch (error) {
        console.log("Top sender receiver list error: ", error);
        return generalResponse(
            res,
            {},
            "Something went wrong!",
            false,
            true
        );
    }
}


module.exports = {
    topSenderReceiverList,
    topSendersList,
    topReceiversList
};




