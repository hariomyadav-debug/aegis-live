const { Transfer_record, User, Agency, Agency_user } = require("../../../models");
const { Op } = require('sequelize');
const {sequelize} = require("../../../models");

/**
 * Create a transfer record
 */
async function createTransfer(transferData) {
    const t = await sequelize.transaction();
    try {
        // Deduct money from sender
        const fromUser = await User.findOne({
            where: { user_id: transferData.from_user_id },
            transaction: t,
            lock: true
        });
        if(!fromUser) throw new Error("Sender user not found");
            if (fromUser.diamond < transferData.amount) {
                throw new Error("Insufficient balance");
            }

        await fromUser.decrement(
            { diamond: Number(transferData.amount) },
            { transaction: t }
        );


        // Add diamond to recipient
        const toUser = await User.findOne({
            where: { user_id: transferData.to_user_id }
        });

        if (!toUser) {
            await t.rollback();
            throw new Error("Recipient user not found");
        }

        await toUser.increment(
            { diamond: Number(transferData.amount) },
            { transaction: t }
        );

        // Create transfer record
        const transfer = await Transfer_record.create(transferData, { transaction: t });
        await t.commit();
        return transfer;
    } catch (error) {
        await t.rollback();
        console.error('Error creating transfer:', error);
        throw error;
    }
}

/**
 * Get transfer history with pagination
 */
async function getTransferHistory(filters = {}, pagination = { page: 1, pageSize: 50 }, userId = null) {
    try {
        let { page, pageSize } = pagination;
        page = Number(page);
        pageSize = Number(pageSize);
        
        const offset = (page - 1) * pageSize;
        const limit = pageSize;

        const query = {
            where: filters,
            include: [
                // {
                //     model: Agency,
                //     as: 'agency_record',
                //     attributes: ['user_id', 'full_name', 'user_name']
                // },
                {
                    model: User,
                    as: 'to_user',
                    attributes: ['user_id', 'full_name', 'user_name']
                },
                {
                    model: User,
                    as: 'from_user',
                    attributes: ['user_id', 'full_name', 'user_name']
                }
            ],
            limit,
            offset,
            order: [['add_time', 'DESC']]
        };

        const { rows, count } = await Transfer_record.findAndCountAll(query);

        // ✅ ADD deduct key here
        const updatedRows = rows.map(row => {

            const record = row.toJSON();

            record.deduct = record.from_user_id === userId;

            return record;

        });
        return {
            Records: updatedRows,
            Pagination: {
                total_pages: Math.ceil(count / pageSize),
                total_records: Number(count),
                current_page: Number(page),
                records_per_page: Number(pageSize),
            },
        };
    } catch (error) {
        console.error('Error fetching transfer history:', error);
        throw error;
    }
}

/**
 * Check if user has sufficient balance
 */


/**
 * Deduct money from user
 */
async function deductMoney(userId, amount) {
    try {
        const [updated] = await User.update(
            { diamond: sequelize.literal(`diamond - ${amount}`) },
            {
                where: { user_id: userId, diamond: { [Op.gte]: amount } },
                returning: true
            }
        );
        return updated;
    } catch (error) {
        console.error('Error deducting money:', error);
        throw error;
    }
}

/**
 * Add money to user
 */
async function addMoney(userId, amount) {
    try {
        const [updated] = await User.update(
            { diamond: sequelize.literal(`diamond + ${amount}`) },
            {}
        );
        return updated;
    } catch (error) {
        console.error('Error adding money:', error);
        throw error;
    }
}

/**
 * Get total transferred between users
 */
async function getTransferTotal(agencyId, toUserId = null) {
    try {
        const query = { where: { agency_id: agencyId } };
        if (toUserId) {
            query.where.to_user_id = toUserId;
        }

        const total = await Transfer_record.sum('amount', query);
        return total || 0;
    } catch (error) {
        console.error('Error getting transfer total:', error);
        throw error;
    }
}

module.exports = {
    createTransfer,
    getTransferHistory,
    deductMoney,
    addMoney,
    getTransferTotal
};
