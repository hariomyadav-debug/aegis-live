const { Exchange_record, User, Agency, Agency_user, User_coinrecord } = require("../../../models");
const { Op } = require('sequelize');

/**
 * Create an exchange record
 */
async function createExchangeRecord(exchangeData) {
    try {
        const record = await Exchange_record.create(exchangeData);
        return record;
    } catch (error) {
        console.error('Error creating exchange record:', error);
        throw error;
    }
}

/**
 * Get exchange history with pagination
 */
async function getExchangeHistory(filters = {}, pagination = { page: 1, pageSize: 50 }) {
    try {
        let { page, pageSize } = pagination;
        page = Number(page);
        pageSize = Number(pageSize);
        
        const offset = (page - 1) * pageSize;
        const limit = pageSize;

        const query = {
            where: filters,
            limit,
            offset,
            order: [['add_time', 'DESC']]
        };

        const { rows, count } = await Exchange_record.findAndCountAll(query);

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
        console.error('Error fetching exchange history:', error);
        throw error;
    }
}

/**
 * Get total exchanged amount
 */
async function getExchangeTotal(userId) {
    try {
        const total = await Exchange_record.sum('coin', {
            where: { user_id: userId }
        });
        return total || 0;
    } catch (error) {
        console.error('Error getting exchange total:', error);
        throw error;
    }
}

/**
 * Get exchange rate for user (based on agency level/status)
 */
async function getExchangeRate(userId) {
    try {
        // Check if user is agency owner
        const agency = await Agency.findOne({
            where: { user_id: userId, state: 1 } // 1 = approved
        });

        if (agency) {
            // Agency owners get premium rate
            return 9500; // or whatever your premium rate is
        }

        // Regular rate
        return 1000; // base rate
    } catch (error) {
        console.error('Error getting exchange rate:', error);
        throw error;
    }
}

/**
 * Calculate coins from cash
 */
function calculateCoinsFromCash(cash, rate) {
    return Math.floor(cash * rate);
}

/**
 * Validate exchange amount
 */
function validateExchangeAmount(amount) {
    if (!amount || amount === "") {
        return { valid: false, error: "Amount not entered" };
    }

    if (!Number.isNumeric(amount)) {
        return { valid: false, error: "Amount not number" };
    }

    if (Number(amount) !== Math.floor(Number(amount))) {
        return { valid: false, error: "Decimal amounts not allowed" };
    }

    const minAmount = 10;
    if (Number(amount) < minAmount) {
        return { valid: false, error: `Minimum amount should be ${minAmount}$` };
    }

    return { valid: true };
}

module.exports = {
    createExchangeRecord,
    getExchangeHistory,
    getExchangeTotal,
    getExchangeRate,
    calculateCoinsFromCash,
    validateExchangeAmount
};
