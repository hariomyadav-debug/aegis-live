const { generalResponse } = require("../../helper/response.helper");
const { getConfig } = require("./../../service/repository/Project_conf.service");
const {
    formatNumber,
    getAllPeriodContributions,
    getOrderedContribution,
} = require("../../service/repository/contribution.service");

/**
 * Get all contribution rankings for all time periods
 * Used for the main dashboard/index page
 */
async function index(req, res) {
    const userId = req.userData.user_id;

    try {
        // Get config to check if coin amounts should be visible
        const config = await getConfig({ config_id: 1 });
        const listCoinSwitch = true || false;
        // const listCoinSwitch = config?.list_coin_switch || false;

        // Get all period contributions
        const contributions = await getAllPeriodContributions(userId);

        // Process each list to format numbers and apply visibility rules
        const processContributionList = (list, total) => {
            const processedList = list.map((item) => {
                const formattedTotal = listCoinSwitch ? item.total : "***";
                return {
                    ...item,
                    total: formatNumber(formattedTotal),
                };
            });

            const formattedTotal = listCoinSwitch ? total : "***";
            return {
                list: processedList,
                total: formatNumber(formattedTotal),
            };
        };

        // Apply formatting to all periods
        const dayResult = processContributionList(
            contributions.list_day,
            contributions.list_day_total
        );
        const weekResult = processContributionList(
            contributions.list_week,
            contributions.list_week_total
        );
        const monthResult = processContributionList(
            contributions.list_month,
            contributions.list_month_total
        );
        const allResult = processContributionList(
            contributions.list_all,
            contributions.list_all_total
        );

        const responseData = {
            list_day: dayResult.list,
            list_day_total: dayResult.total,
            list_week: weekResult.list,
            list_week_total: weekResult.total,
            list_month: monthResult.list,
            list_month_total: monthResult.total,
            list_all: allResult.list,
            list_all_total: allResult.total,
            uid: userId,
        };

        return generalResponse(
            res,
            responseData,
            "Contribution leaderboard fetched successfully",
            true,
            true
        );
    } catch (error) {
        console.error("Contribution index error:", error);
        return generalResponse(
            res,
            {},
            "Something went wrong!",
            false,
            true,
            500
        );
    }
}

/**
 * Get ordered contribution list for a specific time period
 * Used for the detailed/order page
 */
async function order(req, res) {
    const userId = req.userData.user_id;
    const { filter = "all", page = 1, limit = 20 } = req.query;

    try {
        // Validate filter
        const validFilters = ["daily", "weekly", "monthly", "all"];
        if (!validFilters.includes(filter)) {
            return generalResponse(
                res,
                {},
                `Invalid filter. Must be one of: ${validFilters.join(", ")}`,
                false,
                true,
                400
            );
        }

        // Get config to check if coin amounts should be visible
        const config = await getConfig({ config_id: 1 });
        const listCoinSwitch = true || false;
        // const listCoinSwitch = config?.list_coin_switch || false;

        // Calculate offset from page number
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.max(1, parseInt(limit) || 20);
        const offset = (pageNum - 1) * limitNum;

        // Get ordered contribution for the specified filter with pagination
        const data = await getOrderedContribution(userId, filter, limitNum, offset);

        // Format numbers and apply visibility rules
        const processedList = data.list.map((item) => {
            const formattedTotal = listCoinSwitch ? item.total : "***";
            return {
                ...item,
                total: formatNumber(formattedTotal),
            };
        });

        const formattedTotal = listCoinSwitch ? data.total : "***";

        const responseData = {
            list: processedList,
            list_total: formatNumber(formattedTotal),
            filter,
            uid: userId,
            pagination: {
                current_page: pageNum,
                per_page: limitNum,
                total: data.totalCount,
                has_more: data.hasMore,
                total_pages: Math.ceil(data.totalCount / limitNum),
            },
        };

        return generalResponse(
            res,
            responseData,
            "Contribution list fetched successfully",
            true,
            true
        );
    } catch (error) {
        console.error("Contribution order error:", error);
        return generalResponse(
            res,
            {},
            "Something went wrong!",
            false,
            true,
            500
        );
    }
}

module.exports = {
    index,
    order,
};
