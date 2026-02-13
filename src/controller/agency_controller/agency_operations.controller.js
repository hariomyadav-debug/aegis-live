const { generalResponse } = require("../../helper/response.helper");
const {
    createTransfer,
    getTransferHistory,
    checkBalance,
    deductMoney,
    addMoney,
    getTransferTotal
} = require("../../service/repository/Transfer.service");
const {
    createExchangeRecord,
    getExchangeHistory,
    getExchangeRate,
    calculateCoinsFromCash,
    validateExchangeAmount
} = require("../../service/repository/Exchange.service");
const {
    createWithdrawalRequest,
    getWithdrawalHistory,
    getAvailableBalance,
    validateWithdrawalAmount,
    updateWithdrawalStatus,
    generateOrderNumber
} = require("../../service/repository/Withdrawal.service");
const { User, Agency, Agency_user } = require("../../../models");
const { Op } = require('sequelize');

/**
 * Get agency home dashboard
 * POST /api/agency/home
 */
async function getAgencyHome(req, res) {
    try {
        const user_id = req.authData?.user_id;

        if (!user_id) {
            return generalResponse(
                res,
                {},
                "User ID is required",
                false,
                true,
                400
            );
        }

        console.log("getAgencyHome called with user_id:", user_id);
        const agency = await Agency.findOne({
            where: { user_id: user_id, state: 2 }, // 1 = approved
            include: [{
                model: User,
                as: 'user',
                where: { user_id: user_id },
                required: false,
                attributes: ['user_id', 'full_name', 'user_name', 'profile_pic', 'available_coins', 'diamond']
            }]
        });
        console.log("getAgencyHome agency:", agency);

        if (!agency) {
            return generalResponse(
                res,
                {},
                "You are not a member of this family and do not have permission to operate",
                false,
                false,
                403
            );
        }


        return generalResponse(
            res,
            {
                agency: agency,
            },
            "Agency home data retrieved",
            true,
            false,
            200
        );
    } catch (error) {
        console.error("Error in agency home", error);
        return generalResponse(
            res,
            { success: false },
            "Error retrieving agency data",
            false,
            true,
            500
        );
    }
}

/**
 * Get agency wallet  
 * POST /api/agency/wallet
 */
async function getAgencyWallet(req, res) {
    try {
        const { user_id } = req.body;
        const authUserId = req.authData?.user_id;

        if (!user_id) {
            return generalResponse(
                res,
                {},
                "User ID is required",
                false,
                true,
                400
            );
        }

        // Check if user is agency owner or member
        const agency = await Agency.findOne({
            where: { user_id: user_id, state: 1 }
        });

        const agencyMember = await Agency_user.findOne({
            where: { user_id: user_id, state: 1 }
        });

        if (!agency && !agencyMember) {
            return generalResponse(
                res,
                {},
                "Access denied",
                false,
                false,
                403
            );
        }

        const user = await User.findOne({
            where: { user_id: user_id }
        });

        return generalResponse(
            res,
            {
                user: {
                    user_id: user.user_id,
                    full_name: user.full_name,
                    money: user.money,
                    coin: user.coin || 0
                },
                agency: agency || agencyMember
            },
            "Wallet data retrieved",
            true,
            false,
            200
        );
    } catch (error) {
        console.error("Error in agency wallet", error);
        return generalResponse(
            res,
            { success: false },
            "Error retrieving wallet data",
            false,
            true,
            500
        );
    }
}

/**
 * Transfer money to user
 * POST /api/agency/transfer
 */
async function transferMoney(req, res) {
    try {
        const { to_user_id, amount } = req.body;
        const fromUserId = req.authData?.user_id;

        if (!fromUserId || !to_user_id || !amount) {
            return generalResponse(
                res,
                {},
                "Missing required fields",
                false,
                true,
                400
            );
        }

        if (!Number.isInteger(amount) || amount <= 0) {
            return generalResponse(
                res,
                {},
                "Amount must be a positive integer",
                false,
                true,
                400
            );
        }

        // Check if sender has enough balance
        const hasBalance = await checkBalance(fromUserId, amount);
        if (!hasBalance) {
            return generalResponse(
                res,
                {},
                "Insufficient balance",
                false,
                true,
                400
            );
        }

        // Check if recipient exists
        const toUser = await User.findOne({
            where: { user_id: to_user_id }
        });

        if (!toUser) {
            return generalResponse(
                res,
                {},
                "Recipient not found",
                false,
                false,
                404
            );
        }

        // Create transfer record
        const transfer = await createTransfer({
            from_user_id: fromUserId,
            to_user_id: to_user_id,
            amount: amount,
            description: "Transfer",
            status: 1 // completed
        });

        return generalResponse(
            res,
            transfer,
            "Transfer completed successfully",
            true,
            true,
            200
        );
    } catch (error) {
        console.error("Error in transfer", error);
        return generalResponse(
            res,
            { success: false },
            "Error processing transfer",
            false,
            true,
            500
        );
    }
}

/**
 * Get transfer history
 * POST /api/agency/transfer-history
 */
async function getTransferHistoryHandler(req, res) {
    try {
        const { page = 1, pageSize = 50 } = req.body;
        const userId = req.authData?.user_id;

        const filters = {
            [Op.or]: [
                { from_user_id: userId },
                { to_user_id: userId }
            ]
        };

        const history = await getTransferHistory(filters, { page, pageSize });

        return generalResponse(
            res,
            history,
            "Transfer history retrieved",
            true,
            false,
            200
        );
    } catch (error) {
        console.error("Error in transfer history", error);
        return generalResponse(
            res,
            { success: false },
            "Error retrieving transfer history",
            false,
            true,
            500
        );
    }
}

/**
 * Exchange money for coins
 * POST /api/agency/exchange
 */
async function exchangeMoneyForCoins(req, res) {
    try {
        const { amount } = req.body;
        const userId = req.authData?.user_id;

        if (!userId || !amount) {
            return generalResponse(
                res,
                {},
                "Missing required fields",
                false,
                true,
                400
            );
        }

        // Validate amount
        const validation = validateExchangeAmount(amount);
        if (!validation.valid) {
            return generalResponse(
                res,
                {},
                validation.error,
                false,
                true,
                400
            );
        }

        // Check balance
        const user = await User.findOne({ where: { user_id: userId } });
        if (!user || user.money < amount) {
            return generalResponse(
                res,
                {},
                "Insufficient balance",
                false,
                true,
                400
            );
        }

        // Get exchange rate
        const rate = await getExchangeRate(userId);
        const coins = calculateCoinsFromCash(amount, rate);

        // Create exchange record
        const exchange = await createExchangeRecord({
            user_id: userId,
            cash_amount: amount,
            coin_amount: coins,
            exchange_rate: rate,
            status: 1,
            add_time: Math.floor(Date.now() / 1000)
        });

        return generalResponse(
            res,
            {
                exchange: exchange,
                coins_earned: coins,
                rate: rate
            },
            "Exchange completed successfully",
            true,
            true,
            200
        );
    } catch (error) {
        console.error("Error in exchange", error);
        return generalResponse(
            res,
            { success: false },
            "Error processing exchange",
            false,
            true,
            500
        );
    }
}

/**
 * Get exchange history
 * POST /api/agency/exchange-history
 */
async function getExchangeHistoryHandler(req, res) {
    try {
        const { page = 1, pageSize = 50 } = req.body;
        const userId = req.authData?.user_id;

        const history = await getExchangeHistory(
            { user_id: userId },
            { page, pageSize }
        );

        return generalResponse(
            res,
            history,
            "Exchange history retrieved",
            true,
            false,
            200
        );
    } catch (error) {
        console.error("Error in exchange history", error);
        return generalResponse(
            res,
            { success: false },
            "Error retrieving exchange history",
            false,
            true,
            500
        );
    }
}

/**
 * Request withdrawal
 * POST /api/agency/withdrawal-request
 */
async function requestWithdrawal(req, res) {
    try {
        const { amount, type, account_bank, account, ifcs, name } = req.body;
        const userId = req.authData?.user_id;

        if (!userId || !amount) {
            return generalResponse(
                res,
                {},
                "Missing required fields",
                false,
                true,
                400
            );
        }

        // Validate amount
        const validation = validateWithdrawalAmount(amount);
        if (!validation.valid) {
            return generalResponse(
                res,
                {},
                validation.error,
                false,
                true,
                400
            );
        }

        // Check available balance
        const availableBalance = await getAvailableBalance(userId);
        if (availableBalance < validation.amount) {
            return generalResponse(
                res,
                {},
                "Insufficient available balance",
                false,
                true,
                400
            );
        }

        const orderNumber = generateOrderNumber(userId);

        const withdrawal = await createWithdrawalRequest({
            user_id: userId,
            amount: validation.amount,
            order_number: orderNumber,
            status: 0, // pending
            type: type || 1,
            account_bank: account_bank || null,
            account: account || null,
            ifcs: ifcs || null,
            name: name || null,
            add_time: Math.floor(Date.now() / 1000)
        });

        return generalResponse(
            res,
            withdrawal,
            "Withdrawal request submitted successfully",
            true,
            true,
            201
        );
    } catch (error) {
        console.error("Error in withdrawal request", error);
        return generalResponse(
            res,
            { success: false },
            "Error processing withdrawal request",
            false,
            true,
            500
        );
    }
}

/**
 * Get withdrawal history
 * POST /api/agency/withdrawal-history
 */
async function getWithdrawalHistoryHandler(req, res) {
    try {
        const { page = 1, pageSize = 50, status } = req.body;
        const userId = req.authData?.user_id;

        const filters = {};
        if (status !== undefined && status !== null) {
            filters.status = status;
        }

        const history = await getWithdrawalHistory(userId, filters, { page, pageSize });

        return generalResponse(
            res,
            history,
            "Withdrawal history retrieved",
            true,
            false,
            200
        );
    } catch (error) {
        console.error("Error in withdrawal history", error);
        return generalResponse(
            res,
            { success: false },
            "Error retrieving withdrawal history",
            false,
            true,
            500
        );
    }
}

module.exports = {
    getAgencyHome,
    getAgencyWallet,
    transferMoney,
    getTransferHistoryHandler,
    exchangeMoneyForCoins,
    getExchangeHistoryHandler,
    requestWithdrawal,
    getWithdrawalHistoryHandler
};
