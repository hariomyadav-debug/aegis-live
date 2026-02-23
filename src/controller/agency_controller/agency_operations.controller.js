const { generalResponse } = require("../../helper/response.helper");
const {
    createTransfer,
    getTransferHistory,
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
const {
    getAgencyUsers,
    getAgencyUserById,
    getAgencyUser,
    updateAgencyUser,
    deleteAgencyUser,
    getAgencyUsersByAgencyId,
    getUsersByAgencyId
} = require("../../service/repository/Agency_user.service");
const {
    getAgencies,
    getAgencyById,
    getAgency
} = require("../../service/repository/Agency.service");
const { getUser } = require("../../service/repository/user.service");

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

        console.log("Agency found:", agency);

        const totalHosts = await Agency_user.count({
            where: { agency_id: agency.id, state: 2 } // 2 = approved
        });

        agency.dataValues.total_hosts = totalHosts;

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
        const authUserId = req.authData?.user_id;

        if (!authUserId) {
            return generalResponse(
                res,
                {},
                "User ID is required",
                false,
                true,
                400
            );
        }

        const includeOptions = [
            {
                model: User,
                as: 'user',
                where: { user_id: authUserId },
                required: false,
                attributes: ['user_id', 'full_name', 'user_name', 'profile_pic', 'available_coins', 'diamond']
            }
        ];

        // Check if user is agency owner or member
        const agency = await getAgency({ user_id: authUserId, state: 2 }, includeOptions); // 2 = approved

        const agencyMember = await getAgencyUser({ user_id: authUserId, state: 2 }, includeOptions);

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


        return generalResponse(
            res,
            {
                data: agency || agencyMember
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
        const clientIp = req.ip || req.connection.remoteAddress;

        if(to_user_id === fromUserId) {
            return generalResponse(
                res,
                {},
                "You cannot transfer to yourself",
                false,
                true,
                400
            );
        }

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

        if (!Number.isInteger(parseFloat(amount)) || parseFloat(amount) <= 0) {
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
        // get sender's current balance
        const fromUser = await getUser({
            user_id: fromUserId
        });
        if (!fromUser || fromUser.diamond < parseFloat(amount)) {
            let message = !fromUser ? "Sender not found" : "Insufficient balance";
            return generalResponse(
                res,
                {},
                message,
                false,
                true,
                400
            );
        }

        // Check if recipient exists
        const toUser = await getUser({
            user_id: to_user_id
        });

        if (!toUser) {
            return generalResponse(
                res,
                {},
                "Recipient user not found",
                false,
                true,
                400
            );
        }

        // Create transfer record
        const transfer = await createTransfer({
            from_user_id: fromUserId,
            to_user_id: to_user_id,
            amount: amount,
            closing: (fromUser.diamond || 0) - parseInt(amount),
            Balance: (fromUser.diamond || 0) - parseInt(amount),
            description: "Transfer",
            add_time: Date.now().toString(),
            status: 1, // completed
            ip: clientIp
        });

        return generalResponse(
            res,
            {
                transfer: transfer,
                message: 'Transfer completed successfully'
            },
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

        const history = await getTransferHistory(filters, { page, pageSize }, userId);

        return generalResponse(
            res,
            {history, data: req.role_details},
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
        const user = await getUser({ user_id: userId });
        if (!user || user.diamond < Number(amount)) {
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
            coin: coins,
            exchange_rate: rate,
            status: 1,
            order_no: generateOrderNumber(userId),
            add_time: Date.now().toString()
        }, Number(amount));

        return generalResponse(
            res,
            {
                exchange: exchange,
                coins_earned: coins,
                rate: rate,
                diamond_spent: amount
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
            {history, data: req.role_details},
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
