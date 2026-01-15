const { where, Op } = require("sequelize");
const { Vip_level, Vip_privilege_mapping, Vip_privilege_type, Vip_record, Vip_history } = require("../../../models");
// const {VIP_levels, Vip_levels,  Sequelize } = require("../../../models");
require('dotenv').config();

async function createVip_level(payload) {
    try {
        const data = await Vip_levels.create(payload);
        return data;
    } catch (error) {
        console.error('Error in create VIP levels:', error);
        throw error;
    }
}

async function getVip_levelWithPagination(playload, includeOptions = [], attributes = [], pagination = { page: 1, pageSize: 10 }) {
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
                ...playload,
            },
            attributes: attributes,
            include: includeOptions, // Dynamically include models
            order: [['id', 'ASC']],
            limit,
            offset,
        };

        // Use findAndCountAll to get both rows and count
        const { rows, count } = await Vip_level.findAndCountAll(query);

        // Prepare the structured response
        return {
            Records: rows.map(r => r.get({ plain: true })),
            Pagination: {
                total_pages: Math.ceil(count / pageSize),
                total_records: Number(count),
                current_page: Number(page),
                records_per_page: Number(pageSize),
            },
        };
    } catch (error) {
        console.error('Error in get vip level:', error);
        throw error;
    }
}

async function getVip_level(playload, includeOptions) {
    try {

        // Build the query object
        const query = {
            where: {
                ...playload,
            },
            include: includeOptions,
            oeder: [['id', 'ASC']],
        };

        // Use findAndCountAll to get both rows and count
        const { rows, count } = await Vip_level.findAndCountAll(query);

        // Prepare the structured response
        return rows.map(r => r.get({ plain: true }));
    } catch (error) {
        console.error('Error in get vip level:', error);
        throw error;
    }
}

async function updateVip_level(payload, condition) {
    try {
        const updated = await Vip_levels.update(payload, { where: condition });
        return updated;
    } catch (error) {
        console.error('Error in update level:', error);
        throw error;
    }
}
async function deleteVip_level(payload) {
    try {
        const deleted = await Vip_levels.destroy({ where: payload });
        return deleted;
    } catch (error) {
        console.error('Error in delete vip level:', error);
        throw error;
    }
}


// VIP Record
async function createVip_Record(payload) {
    try {
        const data = await Vip_record.create(payload);
        return data;
    } catch (error) {
        console.error('Error in create VIP Record:', error);
        throw error;
    }
}

async function getVip_record(payload, includeOptions = [], attributes = []) {
    try {
        const query = {
            where: { ...payload },
            include: includeOptions,
            order: [['id', 'ASC']],
            raw: true
        };

        // Only add attributes if provided
        if (attributes && attributes.length > 0) {
            query.attributes = attributes;
        }

        // Use findAndCountAll to get both rows and count
        const { rows, count } = await Vip_record.findAndCountAll(query);

        return rows;
    } catch (error) {
        console.error('Error in get vip record:', error);
        throw error;
    }
}

async function updateVip_record(payload, condition) {
    try {
        const updated = await Vip_record.update(payload, { where: condition });
        return updated;
    } catch (error) {
        console.error('Error in update VIP Record:', error);
        throw error;
    }
}


// VIP History
async function createVip_history(payload) {
    try {
        const data = await Vip_history.create(payload);
        return data;
    } catch (error) {
        console.error('Error in create VIP history:', error);
        throw error;
    }
}


// PRivileges 
function groupPrivilegesByVipLevel(privileges, vipIds) {
    const grouped = {};

    vipIds.forEach(id => {
        grouped[id] = [];
    });

    for (const priv of privileges) {
        for (const vipId of priv.vip_level_ids) {
            if (grouped[vipId]) {
                grouped[vipId].push(priv);
            }
        }
    }

    return grouped;
}

async function getPrivilagesByVipIds(vipLevelIds) {
    try {
        const privileges = await Vip_privilege_mapping.findAll({
            where: {
                [Op.or]: vipLevelIds.map(id => ({
                    vip_level_ids: {
                        [Op.contains]: [id],
                    },
                })),
                status: true,
            },
            attributes: [
                'id',
                'vip_level_ids',
                'title',
                'description_img',
                'description',
                'vehicle_id',
                'exp_multiplier',
            ],
            include: [
                {
                    model: Vip_privilege_type,
                    as: 'pType',
                    attributes: ['title', 'icon_active', 'icon_inactive'],
                },
            ],
            order: [["sort_order", "ASC"]],
        });

        return groupPrivilegesByVipLevel(privileges, vipLevelIds);
    } catch (error) {
        console.error("Error fetching privileges:", error);
        throw error;
    }
}


module.exports = {
    createVip_level,
    getVip_levelWithPagination,
    updateVip_level,
    deleteVip_level,
    getPrivilagesByVipIds,
    getVip_record,
    updateVip_record,
    createVip_Record,
    createVip_history
}