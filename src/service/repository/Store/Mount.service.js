const { where } = require("sequelize");
const {Mount, Mount_user, Sequelize} = require("../../../../models");
require('dotenv').config();

async function createMounts(mountPayload) {
    try {
        const newMount = await Mount.create(mountPayload);
        return newMount;
    } catch (error) {
        console.error('Error in mount:', error);
        throw error;
    }
}

async function getMounts(mountPlayload, includeOptions=[], pagination = { page: 1, pageSize: 10 }) {
    try {
         let { page, pageSize } = pagination;
        page = Number(page)
        pageSize = Number(pageSize)
        // Calculate offset and limit for pagination
        const offset = (page - 1) * pageSize;
        const limit = pageSize;

        // Build the query object
        const query = {
            where: {
                ...mountPlayload,
            },
            include: includeOptions, // Dynamically include models
            limit,
            offset,
        };

         // Use findAndCountAll to get both rows and count
        const { rows, count } = await Mount.findAndCountAll(query);

        // Prepare the structured response
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
        console.error('Error in Mount:', error);
        throw error;
    }
}

async function updateMount(mountPayload , mountCondition) {
    try {
        const updatedMount = await Mount.update(mountPayload, {where:mountCondition});
        return updatedMount;
    } catch (error) {
        console.error('Error in mounting:', error);
        throw error;
    }
}
async function deleteMount(mountPayload ) {
    try {
        const unMount = await Mount.destroy({where:mountPayload});
        return unMount;
    } catch (error) {
        console.error('Error in unmounting mounting:', error);
        throw error;
    }
}

async function getMountBy(payload, include) {
    try {
        const frame = await Mount.findOne({
            where: payload,
            attributes: include
        })

        return frame ? frame.toJSON() : null;
    } catch (error) {
        console.log('Error for frame', error)
        throw error;
    }

}
async function getUserMount(mountPayload, attributes = ['mount_id', 'name', 'thumb', 'swf', 'need_coin', 'score']) {

    try {
        const activeMount = await Mount.findOne({
            attributes,
            include: [{
                model: Mount_user,
                attributes: [],
                where: mountPayload,
                required: true
            }],
            order: [[Mount_user, 'end_time', 'DESC']],
            raw: true
        });

        if (!activeMount) {
            return null
        } else {
            activeMount.thumb = `${process.env.baseUrl}/${activeMount.thumb}`;
            activeMount.swf = `${process.env.baseUrl}/${activeMount.swf}`;
        }

        return activeMount;
    } catch (error) {
        console.log('Error for user mount', error)
        throw error;

    }
}



// ---------------------
async function getMount_User(payload) {
    try {
        const mountUser = await Mount_user.findOne({
            where: payload,
            raw: true
        })

        return mountUser;
    } catch (error) {
        console.log('Error for mount user', error);
        throw error;
    }
}

async function updateMount_User(mountPayload, mountCondition) {
    try {
        const updatedMount = await Mount_user.update(mountPayload, { where: mountCondition });
        return updatedMount;
    } catch (error) {
        console.error('Error in mounting:', error);
        throw error;
    }
}

async function insertMount_user(mountPayload) {
    try {
        const updatedMount = await Mount_user.create(mountPayload);
        return updatedMount;
    } catch (error) {
        console.error('Error in mounting:', error);
        throw error;
    }
}

async function getAllMount_User(payload, attributes = ['mount_id', 'name', 'thumb', 'swf', 'need_coin', 'score']) {
    try {
        const baseUrl = process.env.baseUrl;

        let { count, rows } = await Mount.findAndCountAll({
            attributes: [
                ...attributes,
                [Sequelize.col('Mount_users.add_time'), 'add_time'],
                [Sequelize.col('Mount_users.end_time'), 'end_time'],
                [Sequelize.col('Mount_users.id'), 'id'],
                [Sequelize.col('Mount_users.status'), 'status'],
            ],
            include: [{
                model: Mount_user,
                attributes: [],
                where: payload,
                required: true
            }],
            order: [[Mount_user, 'end_time', 'DESC']],
            raw: true
        });

        rows = rows.map(row => ({
            ...row,
            swf: row.swf?.includes('amazonaws.com') || row.swf?.includes('cloudfront.net')
                ? row.swf
                : `${baseUrl}/${row.swf}`,
            thumb: row.thumb?.includes('amazonaws.com') || row.thumb?.includes('cloudfront.net')
                ? row.thumb
                : `${baseUrl}/${row.thumb}`
        }));

        return rows;
    } catch (error) {
        console.log('Error for Mount user', error);
        throw error;
    }
}


module.exports ={
    createMounts,
    getMounts,
    updateMount,
    deleteMount,
    getUserMount,
    getMount_User,
    getMountBy,
    updateMount_User,
    insertMount_user,
    getAllMount_User
}