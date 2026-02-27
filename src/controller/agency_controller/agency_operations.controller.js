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

/**
 * Get agency salary policy data (25 levels)
 * GET /api/agency/policy
 */
async function getPolicyDataHandler(req, res) {
    try {
        let policyData = [
            { level: 1, targetGift: 60000, hostSalary: 3, agentCommission: 0.6, levelName: 'Bronze' },
            { level: 2, targetGift: 120000, hostSalary: 6, agentCommission: 1.2, levelName: 'Silver' },
            { level: 3, targetGift: 180000, hostSalary: 9, agentCommission: 1.8, levelName: 'Gold' },
            { level: 4, targetGift: 240000, hostSalary: 12, agentCommission: 2.4, levelName: 'Platinum' },
            { level: 5, targetGift: 320000, hostSalary: 16, agentCommission: 3.8, levelName: 'Diamond' },
            { level: 6, targetGift: 410000, hostSalary: 19.3, agentCommission: 4.1, levelName: 'Emerald' },
            { level: 7, targetGift: 530000, hostSalary: 23.9, agentCommission: 5.3, levelName: 'Ruby' },
            { level: 8, targetGift: 650000, hostSalary: 30.6, agentCommission: 6.5, levelName: 'Sapphire' },
            { level: 9, targetGift: 760000, hostSalary: 34.2, agentCommission: 7.6, levelName: 'Topaz' },
            { level: 10, targetGift: 880000, hostSalary: 44, agentCommission: 8.8, levelName: 'Diamond Elite' },
            { level: 11, targetGift: 1200000, hostSalary: 60, agentCommission: 14.4, levelName: 'Platinum Pro' },
            { level: 12, targetGift: 1500000, hostSalary: 67.5, agentCommission: 15, levelName: 'Gold Master' },
            { level: 13, targetGift: 2000000, hostSalary: 100, agentCommission: 20, levelName: 'Silver King' },
            { level: 14, targetGift: 3500000, hostSalary: 157.5, agentCommission: 35, levelName: 'Bronze Emperor' },
            { level: 15, targetGift: 4500000, hostSalary: 202.5, agentCommission: 54, levelName: 'Crown Prince' },
            { level: 16, targetGift: 5600000, hostSalary: 252, agentCommission: 56, levelName: 'Royal' },
            { level: 17, targetGift: 6500000, hostSalary: 292.5, agentCommission: 65, levelName: 'Imperial' },
            { level: 18, targetGift: 8900000, hostSalary: 400.5, agentCommission: 89, levelName: 'Supreme' },
            { level: 19, targetGift: 10000000, hostSalary: 450, agentCommission: 100, levelName: 'Overlord' },
            { level: 20, targetGift: 15000000, hostSalary: 675, agentCommission: 180, levelName: 'Celestial' },
            { level: 21, targetGift: 20000000, hostSalary: 900, agentCommission: 200, levelName: 'Divine' },
            { level: 22, targetGift: 40000000, hostSalary: 1800, agentCommission: 400, levelName: 'Immortal' },
            { level: 23, targetGift: 70000000, hostSalary: 3150, agentCommission: 840, levelName: 'Transcendent' },
            { level: 24, targetGift: 90000000, hostSalary: 4050, agentCommission: 900, levelName: 'Eternal' },
            { level: 25, targetGift: 100000000, hostSalary: 4500, agentCommission: 1200, levelName: 'Legendary' },
        ];

        console.log("Policy data retrieved:", req.role_details.is_Agency);

        if(!req.role_details.is_Agency) {
             policyData = policyData.map((data)=> {
                const filteredData = { ...data };
                delete filteredData.agentCommission;
                return filteredData;
            })

        }

        return generalResponse(
            res,
            policyData,
            "Policy data retrieved successfully",
            true,
            false,
            200
        );
    } catch (error) {
        console.error("Error in policy data", error);
        return generalResponse(
            res,
            { success: false },
            "Error retrieving policy data",
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
    getWithdrawalHistoryHandler,
    getPolicyDataHandler
};
