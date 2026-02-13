const { generalResponse } = require("../../helper/response.helper");
const { Red_envelope, Red_envelope_record, User } = require("../../../models");
const { Op } = require('sequelize');
const { updateUser } = require("../../service/repository/user.service");
const { raw } = require("mysql2");

/**
 * Get complete red envelope graph/data
 * POST /api/red-envelope/graph
 * Returns all envelope info, records, comparison, and verification in one API
 */
async function getRedEnvelopeGraph(req, res) {
    try {
        const { envelope_id, ref_id, ref_type } = req.body;
        const user_id = req.authData?.user_id;

        if (!envelope_id || !ref_id || !ref_type) {
            return generalResponse(
                res,
                {},
                "Envelope ID, Reference ID, and Reference Type are required",
                false,
                true,
                400
            );
        }

        console.log("getRedEnvelopeGraph called with envelope_id:", envelope_id, "ref_id:", ref_id, "ref_type:", ref_type, "user_id:", user_id);
        // Get envelope details
        const envelope = await Red_envelope.findOne({ where: { id: envelope_id, ref_id, ref_type } });


        if (!envelope) {
            return generalResponse(
                res,
                {},
                "Red envelope not found",
                false,
                false,
                404
            );
        }

        const { rows: records, count: recordCount } = await Red_envelope_record.findAndCountAll({
            where: { envelope_id: envelope.id },
            include: [
                {
                    model: User,
                    attributes: ['user_id', 'full_name', 'user_name', 'profile_pic']
                }
            ],
            order: [['addtime', 'DESC']],
        });

        if (!envelope?.nums_rob || (recordCount && envelope.nums_rob <= recordCount)) {
            return generalResponse(
                res,
                { records, recordCount, is_graped: true },
                "Red envelope has already been fully claimed",
                true,
                true,
                200
            );
        }

        console.log("Envelope details:=========>", records, recordCount);
        
        if(recordCount){
            const alreadyClaimed = records.some(record => record.user_id === user_id);
            console.log("Envelope details:=========ffff>", records);
            if (alreadyClaimed) {
                return generalResponse(
                    res,
                    { records, recordCount, is_graped: true  },
                    "You have already claimed this red envelope",
                    true,
                    true,
                    200
                );
            }
        }

        const graphData = {
            envelope_id: envelope_id,
            user_id: user_id,
            coin: envelope.coin_rob,
        };
        await updateUser(user_id, {
            $inc: { diamonds: envelope.coin_rob }
        });

        await Red_envelope_record.create(graphData);

        const { rows: records2, count: recordCount2 } = await Red_envelope_record.findAndCountAll({
            where: { envelope_id: envelope.id },
            include: [
                {
                    model: User,
                    attributes: ['user_id', 'full_name', 'user_name', 'profile_pic']
                }
            ],
            order: [['addtime', 'DESC']],
        });

        return generalResponse(
            res,
            { graphData, records: records2, recordCount: recordCount2, is_graped: false },
            "Red envelope graph retrieved successfully",
            true,
            false,
            200
        );
    } catch (error) {
        console.error("Error in getRedEnvelopeGraph:", error);
        return generalResponse(
            res,
            { success: false },
            "Error retrieving red envelope graph",
            false,
            true,
            500
        );
    }
}

module.exports = {
    getRedEnvelopeGraph
};
