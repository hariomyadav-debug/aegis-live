const { Op } = require('sequelize');
const { Agency, User } = require("../../../models");

/**
 * Create a new Agency
 */
async function createAgency(agencyPayload) {
    try {
        const newAgency = await Agency.create(agencyPayload);
        return newAgency;
    } catch (error) {
        console.error('Error in creating agency:', error);
        throw error;
    }
}

/**
 * Get agencies with pagination and filters
 */
async function getAgencies(filterPayload = {}, includeOptions = [], pagination = { page: 1, pageSize: 10 }) {
    try {
        let { page, pageSize } = pagination;
        page = Number(page);
        pageSize = Number(pageSize);

        const offset = (page - 1) * pageSize;
        const limit = pageSize;

        const query = {
            where: {
                ...filterPayload,
            },
            include: includeOptions,
            limit,
            offset,
            order: [['id', 'DESC']]
        };

        const { rows, count } = await Agency.findAndCountAll(query);

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
        console.error('Error in fetching agencies:', error);
        throw error;
    }
}

/**
 * Get a single agency by ID
 */
async function getAgencyById(payload, includeOptions = []) {
    try {
        const agency = await Agency.findOne({
            where: payload,
            include: includeOptions
        });
        return agency;
    } catch (error) {
        console.error('Error in fetching agency:', error);
        throw error;
    }
}

/**
 * Get agency by condition
 */
async function getAgency(condition, includeOptions = []) {

    if(includeOptions.length === 0) {
        includeOptions = [
            {   
                model: User,
                as: "user",
                attributes: ['user_id', 'full_name', 'user_name', 'profile_pic', 'available_coins', 'diamond']
            }
        ]
    }

    try {
        const agency = await Agency.findOne({
            where: condition,
            include: includeOptions
        });
        return agency;
    } catch (error) {
        console.error('Error in fetching agency:', error);
        throw error;
    }
}

/**
 * Update agency
 */
async function updateAgency(agencyPayload, condition) {
    try {
        const updatedAgency = await Agency.update(agencyPayload, {
            where: condition,
            returning: true
        });
        return updatedAgency;
    } catch (error) {
        console.error('Error in updating agency:', error);
        throw error;
    }
}

/**
 * Delete agency
 */
async function deleteAgency(condition) {
    try {
        const deletedAgency = await Agency.destroy({
            where: condition
        });
        return deletedAgency;
    } catch (error) {
        console.error('Error in deleting agency:', error);
        throw error;
    }
}

/**
 * Count agencies
 */
async function countAgencies(condition) {
    try {
        const count = await Agency.count({
            where: condition
        });
        return count;
    } catch (error) {
        console.error('Error in counting agencies:', error);
        throw error;
    }
}

/**
 * Search agencies
 */
async function searchAgencies(searchPayload, pagination = { page: 1, pageSize: 10 }) {
    try {
        let { page, pageSize } = pagination;
        page = Number(page);
        pageSize = Number(pageSize);

        const offset = (page - 1) * pageSize;
        const limit = pageSize;

        let whereCondition = {};

        if (searchPayload.searchTerm) {
            const searchTerm = searchPayload.searchTerm;
            const orConditions = [];
            if (!searchPayload.isNumeric) {
                orConditions.push({ name: { [Op.iLike]: `%${searchTerm}%` } });
                orConditions.push({ full_name: { [Op.iLike]: `%${searchTerm}%` } });
                orConditions.push({ country: { [Op.iLike]: `%${searchTerm}%` } });
            };

            // 👇 If searchTerm is a number, also search by user_id
            if (searchPayload.isNumeric) { 
                orConditions.push({ user_id: Number(searchTerm) });
            }

            whereCondition[Op.or] = orConditions;
        }

        const query = {
            where: whereCondition,
            limit,
            offset,
            order: [['id', 'DESC']]
        };


        console.log("searchAgencies query:", JSON.stringify(query), searchPayload);
        const { rows, count } = await Agency.findAndCountAll(query);

        console.log("searchAgencies query:", rows);
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
        console.error('Error in searching agencies:', error);
        throw error;
    }
}

module.exports = {
    createAgency,
    getAgencies,
    getAgencyById,
    getAgency,
    updateAgency,
    deleteAgency,
    countAgencies,
    searchAgencies
};
