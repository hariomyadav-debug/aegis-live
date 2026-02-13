const { Transfer, User, Agency, Agency_user } = require("../../../models");
const { Op } = require('sequelize');

/**
 * Create a transfer record
 */
async function createTransfer(transferData) {
    try {
        const transfer = await Transfer.create(transferData);
        return transfer;
    } catch (error) {
        console.error('Error creating transfer:', error);
        throw error;
    }
}

/**
 * Get transfer history with pagination
 */
async function getTransferHistory(filters = {}, pagination = { page: 1, pageSize: 50 }) {
    try {
        let { page, pageSize } = pagination;
        page = Number(page);
        pageSize = Number(pageSize);
        
        const offset = (page - 1) * pageSize;
        const limit = pageSize;

        const query = {
            where: filters,
            include: [
                {
                    model: User,
                    as: 'agency_user',
                    attributes: ['user_id', 'full_name', 'user_name']
                },
                {
                    model: User,
                    as: 'to_user',
                    attributes: ['user_id', 'full_name', 'user_name']
                }
            ],
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        };

        const { rows, count } = await Transfer.findAndCountAll(query);

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
        console.error('Error fetching transfer history:', error);
        throw error;
    }
}

/**
 * Check if user has sufficient balance
 */
async function checkBalance(userId, amount) {
    try {
        const user = await User.findOne({
            where: { user_id: userId },
            attributes: ['money']
        });

        if (!user) return false;
        return user.money >= amount;
    } catch (error) {
        console.error('Error checking balance:', error);
        throw error;
    }
}

/**
 * Deduct money from user
 */
async function deductMoney(userId, amount) {
    try {
        const [updated] = await User.update(
            { money: sequelize.literal(`money - ${amount}`) },
            {
                where: { user_id: userId, money: { [Op.gte]: amount } },
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
            { money: sequelize.literal(`money + ${amount}`) },
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

        const total = await Transfer.sum('amount', query);
        return total || 0;
    } catch (error) {
        console.error('Error getting transfer total:', error);
        throw error;
    }
}

module.exports = {
    createTransfer,
    getTransferHistory,
    checkBalance,
    deductMoney,
    addMoney,
    getTransferTotal
};
