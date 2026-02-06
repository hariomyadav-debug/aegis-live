const { Pk_battles, User } = require("../../../models");
const Pk_battle_results = require("../../../models/Pk_battle_results");



async function createPk(pkPayload) {
    try {
        const newPk = await Pk_battles.create(pkPayload);
        return newPk;
    } catch (error) {
        console.error('Error creating Pk:', error);
        throw error;
    }
}

async function getPk(pkPayload, pagination = { page: 1, pageSize: 10 }, excludedUserIds = [], order = [['createdAt', 'DESC']]) {
    try {
        // Destructure and ensure proper types for pagination values
        const { page = 1, pageSize = 10 } = pagination;
        const offset = (Number(page) - 1) * Number(pageSize);
        const limit = Number(pageSize);
        // Build the where condition
        let wherecondition = { ...pkPayload }; // Default to the provided payload
        // Add pagination options to the payload
        const query = {
            where: wherecondition,
            limit,
            offset,
            order,
        };
        const pkRecords = await Pk_battles.findAndCountAll(query);
        return pkRecords;
    } catch (error) {
        console.error('Error fetching Pk records:', error);
        throw error;
    }
}

async function getPkByIdWith(pkPayload) {
    try {
        const pkRecord = await Pk_battles.findOne({
            where: pkPayload,
            include: [
                {
                    model: User,
                    as: "host1",
                    attributes: {
                        exclude: [
                            "password", "otp", "id_proof", "selfie",
                            "device_token", "account_name", "account_number",
                            "bank_name", "swift_code", "IFSC_code",
                            "blocked_by_admin", "is_deleted"
                        ]
                    }
                },
                {
                    model: User,
                    as: "host2",
                    attributes: {
                        exclude: [
                            "password", "otp", "id_proof", "selfie",
                            "device_token", "account_name", "account_number",
                            "bank_name", "swift_code", "IFSC_code",
                            "blocked_by_admin", "is_deleted"
                        ]
                    }
                }
            ]
        });
        return pkRecord;
    } catch (error) {
        console.error("Error fetching Pk by ID:", error);
        throw error;
    }
}

async function updatePk(pk_battle_id, updatePayload) {
    try {
        const result = await Pk_battles.update(updatePayload, {
            where: { pk_battle_id }
        });
        return result;
    } catch (error) {
        console.error('Error updating Pk record:', error);
        throw error;
    }
}

async function getPkById(pkpayload, is_include = false) {
  try {
    const query = {
      where: pkpayload
    };

    if (is_include) {
      query.include = [
        {
          model: User,
          as: "host1",
          attributes: [
            "user_id",
            "full_name",
            "user_name",
            "profile_pic"
          ]
        },
        {
          model: User,
          as: "host2",
          attributes: [
            "user_id",
            "full_name",
            "user_name",
            "profile_pic"
          ]
        }
      ];
    }

    const pkRecord = await Pk_battles.findOne(query);
    return pkRecord;

  } catch (error) {
    console.error("Error fetching Pk by ID:", error);
    throw error;
  }
}



async function getPkResults(pk_battle_id) {
    try {
        const pkResult = await Pk_battle_results.findOne({
            where: { pk_battle_id }
        });
        return pkResult;
    } catch (error) {
        console.error('Error fetching Pk result:', error);
        throw error;
    }
}



module.exports = {
    createPk,
    getPk,
    getPkByIdWith,
    getPkResults,
    updatePk,
    getPkById,
};