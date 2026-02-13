const { Cash_record, User, Agency_user } = require("../../../models");
const { Op } = require('sequelize');

/**
 * Create a withdrawal request
 */
async function createWithdrawalRequest(withdrawalData) {
    try {
        const record = await Cash_record.create(withdrawalData);
        return record;
    } catch (error) {
        console.error('Error creating withdrawal request:', error);
        throw error;
    }
}

/**
 * Get withdrawal history with pagination
 */
async function getWithdrawalHistory(userId, filters = {}, pagination = { page: 1, pageSize: 50 }) {
    try {
        let { page, pageSize } = pagination;
        page = Number(page);
        pageSize = Number(pageSize);
        
        const offset = (page - 1) * pageSize;
        const limit = pageSize;

        const query = {
            where: {
                user_id: userId,
                ...filters
            },
            limit,
            offset,
            order: [['add_time', 'DESC']]
        };

        const { rows, count } = await Cash_record.findAndCountAll(query);

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
        console.error('Error fetching withdrawal history:', error);
        throw error;
    }
}

/**
 * Get pending withdrawal amount
 */
async function getPendingWithdrawalAmount(userId) {
    try {
        const pending = await Cash_record.sum('amount', {
            where: {
                user_id: userId,
                status: 0 // pending
            }
        });
        return pending || 0;
    } catch (error) {
        console.error('Error getting pending withdrawal amount:', error);
        throw error;
    }
}

/**
 * Get available balance (total money - pending withdrawals)
 */
async function getAvailableBalance(userId) {
    try {
        const user = await User.findOne({
            where: { user_id: userId },
            attributes: ['money']
        });

        if (!user) return 0;

        const pending = await getPendingWithdrawalAmount(userId);
        return Math.max(0, user.money - pending);
    } catch (error) {
        console.error('Error getting available balance:', error);
        throw error;
    }
}

/**
 * Validate withdrawal amount
 */
function validateWithdrawalAmount(amount, minAmount = 50) {
    if (amount <= 0) {
        return { valid: false, error: "Invalid amount" };
    }

    if (amount < minAmount) {
        return { valid: false, error: `Minimum amount ${minAmount}$` };
    }

    // Round to 2 decimals
    const rounded = Math.round(amount * 100) / 100;
    
    return { valid: true, amount: rounded };
}

/**
 * Update withdrawal status
 */
async function updateWithdrawalStatus(withdrawalId, status, notes = null) {
    try {
        const updated = await Cash_record.update(
            {
                status: status,
                up_time: Math.floor(Date.now() / 1000)
            },
            {
                where: { id: withdrawalId }
            }
        );
        return updated;
    } catch (error) {
        console.error('Error updating withdrawal status:', error);
        throw error;
    }
}

/**
 * Get withdrawal request by ID
 */
async function getWithdrawalById(withdrawalId) {
    try {
        const record = await Cash_record.findOne({
            where: { id: withdrawalId }
        });
        return record;
    } catch (error) {
        console.error('Error fetching withdrawal record:', error);
        throw error;
    }
}

/**
 * Generate unique order number for withdrawal
 */
function generateOrderNumber(userId) {
    const timestamp = Math.floor(Date.now() / 1000);
    const random = Math.floor(Math.random() * 1000);
    return `${userId}_${timestamp}${random}`;
}

module.exports = {
    createWithdrawalRequest,
    getWithdrawalHistory,
    getPendingWithdrawalAmount,
    getAvailableBalance,
    validateWithdrawalAmount,
    updateWithdrawalStatus,
    getWithdrawalById,
    generateOrderNumber
};
