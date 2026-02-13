const { Op, Model } = require('sequelize');
const { Agency_user, User } = require("../../../models");

/**
 * Create a new Agency User
 */
async function createAgencyUser(agencyUserPayload) {
    try {
        const newAgencyUser = await Agency_user.create(agencyUserPayload);
        return newAgencyUser;
    } catch (error) {
        console.error('Error in creating agency user:', error);
        throw error;
    }
}

/**
 * Get agency users with pagination and filters
 */
async function getAgencyUsers(filterPayload = {}, includeOptions = [], pagination = { page: 1, pageSize: 10 }) {
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

        const { rows, count } = await Agency_user.findAndCountAll(query);

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
        console.error('Error in fetching agency users:', error);
        throw error;
    }
}

/**
 * Get a single agency user by ID
 */
async function getAgencyUserById(agencyUserId, includeOptions = []) {
    try {
        const agencyUser = await Agency_user.findByPk(agencyUserId, {
            include: includeOptions
        });
        return agencyUser;
    } catch (error) {
        console.error('Error in fetching agency user:', error);
        throw error;
    }
}

/**
 * Get agency user by condition
 */
async function getAgencyUser(condition) {
    try {
        const agencyUser = await Agency_user.findOne({
            where: condition,
            include:[{
                model: User,
                as: 'user',
                required: false,
                attributes: ['user_id', 'full_name', 'user_name', 'profile_pic', 'available_coins', 'diamond']
            }]
        });
        return agencyUser;
    } catch (error) {
        console.error('Error in fetching agency user:', error);
        throw error;
    }
}

/**
 * Update agency user
 */
async function updateAgencyUser(agencyUserPayload, condition) {
    try {
        const updatedAgencyUser = await Agency_user.update(agencyUserPayload, {
            where: condition,
            returning: true
        });
        return updatedAgencyUser;
    } catch (error) {
        console.error('Error in updating agency user:', error);
        throw error;
    }
}

/**
 * Delete agency user
 */
async function deleteAgencyUser(condition) {
    try {
        const deletedAgencyUser = await Agency_user.destroy({
            where: condition
        });
        return deletedAgencyUser;
    } catch (error) {
        console.error('Error in deleting agency user:', error);
        throw error;
    }
}

/**
 * Count agency users
 */
async function countAgencyUsers(condition) {
    try {
        const count = await Agency_user.count({
            where: condition
        });
        return count;
    } catch (error) {
        console.error('Error in counting agency users:', error);
        throw error;
    }
}

/**
 * Get agency users by agency ID with pagination
 */
async function getAgencyUsersByAgencyId(agencyId, pagination = { page: 1, pageSize: 10 }, includeOptions = []) {
    try {
        let { page, pageSize } = pagination;
        page = Number(page);
        pageSize = Number(pageSize);
        
        const offset = (page - 1) * pageSize;
        const limit = pageSize;

        const query = {
            where: {
                agency_id: agencyId
            },
            include: includeOptions,
            limit,
            offset,
            order: [['id', 'DESC']]
        };

        const { rows, count } = await Agency_user.findAndCountAll(query);

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
        console.error('Error in fetching agency users by agency id:', error);
        throw error;
    }
}

/**
 * Get users belonging to an agency
 */
async function getUsersByAgencyId(agencyId, state = null) {
    try {
        const condition = { agency_id: agencyId };
        if (state !== null) {
            condition.state = state;
        }

        const users = await Agency_user.findAll({
            where: condition,
            order: [['id', 'DESC']]
        });

        return users;
    } catch (error) {
        console.error('Error in getting users by agency id:', error);
        throw error;
    }
}

module.exports = {
    createAgencyUser,
    getAgencyUsers,
    getAgencyUserById,
    getAgencyUser,
    updateAgencyUser,
    deleteAgencyUser,
    countAgencyUsers,
    getAgencyUsersByAgencyId,
    getUsersByAgencyId
};
