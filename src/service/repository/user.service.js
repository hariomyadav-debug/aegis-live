const { Sequelize, Op } = require('sequelize');

const { User, Social } = require("../../../models");


const getUsers = async (
    filterPayload = {},
    pagination = { page: 1, pageSize: 10 },
    attributes = [],
    excludedUserIds,
    order = [['createdAt', 'DESC']],
    include = []
) => {
    try {
        const { page = 1, pageSize = 10 } = pagination;
        const offset = (Number(page) - 1) * Number(pageSize);
        const limit = Number(pageSize);

        const whereCondition = {};
        // const include = [];

        // Example: Add Social model based on condition
        if (filterPayload.total_social && filterPayload.total_social > 0) {
            whereCondition.total_socials = { [Op.gt]: filterPayload.total_social };
            include.push({
                model: Social,
                limit: filterPayload.total_social,
            });
        }

        if (filterPayload.user_name) {
            whereCondition.user_name = filterPayload.user_check
                ? filterPayload.user_name
                : { [Op.like]: `${filterPayload.user_name}%` };
        }
        if (filterPayload.email) whereCondition.email = filterPayload.email;
        if (filterPayload.mobile_num) whereCondition.mobile_num = filterPayload.mobile_num;
        if (filterPayload.user_id) whereCondition.user_id = filterPayload.user_id;

        if (!filterPayload.user_id && excludedUserIds?.length > 0) {
            whereCondition.user_id = { [Sequelize.Op.notIn]: excludedUserIds };
        }

        if (filterPayload.country) {
            whereCondition.country = { [Op.like]: `${filterPayload.country}%` };
        }



        const { rows, count } = await User.findAndCountAll({
            where: whereCondition,
            attributes: attributes.length ? attributes : undefined,
            limit,
            offset,
            include,
            order: order,
        });

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
        console.error('Error fetching Users:', error);
        throw new Error('Could not retrieve users');
    }
};


async function getUser(userPayload, auth = false, deleted = false) {
    // Create an array to store the conditions for the "OR" query  
    const orConditions = [];

    // Dynamically add conditions based on the provided payload
    if (userPayload.mobile_num) {
        orConditions.push({ mobile_num: userPayload.mobile_num });
    }
    if (userPayload.country_code) {
        orConditions.push({ country_code: userPayload.country_code });
    }
    if (userPayload.user_name) {
        orConditions.push({
            user_name: { [Op.like]: `${userPayload.user_name}%` } // Search for names starting with the given string
        });
    }
    if (userPayload.email) {
        orConditions.push({ email: userPayload.email });
    }
    if (userPayload.user_id) {
        orConditions.push({ user_id: userPayload.user_id });
    }
    if (userPayload.country) {
        orConditions.push({ country: userPayload.country });
    }

    // If no conditions are provided, return null (or handle it as needed)
    if (orConditions.length === 0) {
        return null;
    }
    if (auth) {

        const isUser = await User.findOne({
            where: { mobile_num: userPayload.mobile_num, country_code: userPayload.country_code }
        });

        return isUser;

    }
    else if (deleted) {

        const isUser = await User.findOne({
            where: userPayload
        });

        return isUser;

    }
    else {
        const isUser = await User.findOne({
            where: {
                [Op.or]: orConditions
            }
        });
        return isUser;

    }
    // Perform the query with the "OR" conditions


}


async function createUser(userPayload) {
    try {

        const newUser = await User.create(userPayload);
        return newUser;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
}
async function updateUser(userPayload, condition) {
    try {
        const newUser = await User.update(userPayload, { where: condition });

        return newUser;
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
}


async function isPrivate(userPayload) {
    try {
        const isUser = await getUser(userPayload)

        if (isUser?.is_private) {
            return true
        }
        else {
            return false
        }
    }
    catch (err) {
        console.error('Error finding private user:', error);
        throw error;
    }
}
async function isAdmin(userPayload) {
    try {
        const isUser = await getUser(userPayload)

        if (isUser?.is_admin) {
            return isUser
        }
        else {
            return false
        }
    }
    catch (err) {
        console.error('Error finding private user:', err);
        throw err;
    }
}

async function getUserCount(userPayload = {}, extraOptions = {}) {
    try {
        const count = await User.count({
            where: userPayload,
            // ...extraOptions,
            // raw: true,
        });
        return count;
    } catch (error) {
        console.error('Error in getUserCount:', error);
    }
}
async function getUserCountData(userPayload = {}, extraOptions = {}) {
    try {
        const count = await User.findAll({
            where: userPayload,
            ...extraOptions,
            raw: true,
        });
        return count;
    } catch (error) {
        console.error('Error in getUserCount:', error);
    }
}

module.exports = {
    getUser,
    getUsers,
    createUser,
    updateUser,
    isPrivate,
    isAdmin,
    getUserCount,
    getUserCountData
};