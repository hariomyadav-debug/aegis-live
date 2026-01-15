const { where } = require("sequelize");
const { Frame, Frame_user, Sequelize } = require("../../../../models");
require('dotenv').config();

async function createFrames(framePayload) {
    try {
        const newFrame = await Frame.create(framePayload);
        return newFrame;
    } catch (error) {
        console.error('Error in frame:', error);
        throw error;
    }
}

async function getFrames(framePlayload, includeOptions = [], pagination = { page: 1, pageSize: 10 }) {
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
                ...framePlayload,
            },
            include: includeOptions, // Dynamically include models
            limit,
            offset,
        };

        // Use findAndCountAll to get both rows and count
        const { rows, count } = await Frame.findAndCountAll(query);

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
        console.error('Error in Frame:', error);
        throw error;
    }
}

async function updateFrame(framePayload, frameCondition) {
    try {
        const updatedFrame = await Frame.update(framePayload, { where: frameCondition });
        return updatedFrame;
    } catch (error) {
        console.error('Error in frameing:', error);
        throw error;
    }
}
async function deleteFrame(framePayload) {
    try {
        const unFrame = await Frame.destroy({ where: framePayload });
        return unFrame;
    } catch (error) {
        console.error('Error in unframeing frameing:', error);
        throw error;
    }
}

async function getFrameBy(payload, include) {
    try {
        const frame = await Frame.findOne({
            where: payload,
            attributes: include
        })

        return frame ? frame.toJSON() : null;
    } catch (error) {
        console.log('Error for frame', error)
        throw error;
    }

}

async function getUserframe(framePayload, attributes = ['frame_id', 'name', 'thumb', 'swf', 'need_coin', 'score']) {

    try {
        const activeFrame = await Frame.findOne({
            attributes,
            include: [{
                model: Frame_user,
                attributes: [],
                where: framePayload,
                required: true
            }],
            order: [[Frame_user, 'end_time', 'DESC']],
            raw: true
        });

        if (!activeFrame) {
            return null
        } else {
            activeFrame.thumb = `${process.env.baseUrl}/${activeFrame.thumb}`;
            activeFrame.swf = `${process.env.baseUrl}/${activeFrame.swf}`;
        }

        return activeFrame;
    } catch (error) {
        console.log('Error for user frame', error)
        throw error;

    }
}



// For Frame _user
async function getFrame_User(payload) {
    try {
        const frameUser = await Frame_user.findOne({
            where: payload,
            raw: true
        })

        return frameUser;
    } catch (error) {
        console.log('Error for Frame user', error);
        throw error;
    }
}

async function updateFrame_User(framePayload, frameCondition) {
    try {
        const updatedFrame = await Frame_user.update(framePayload, { where: frameCondition });
        return updatedFrame;
    } catch (error) {
        console.error('Error in frameing:', error);
        throw error;
    }
}

async function insertFrame_user(framePayload) {
    try {
        const updatedFrame = await Frame_user.create(framePayload);
        return updatedFrame;
    } catch (error) {
        console.error('Error in frameing:', error);
        throw error;
    }
}

async function getAllFrame_User(payload, attributes = ['frame_id', 'name', 'thumb', 'swf', 'need_coin', 'score']) {
    try {
        const baseUrl = process.env.baseUrl;

        let { count, rows } = await Frame.findAndCountAll({
            attributes: [
                ...attributes,
                [Sequelize.col('Frame_users.add_time'), 'add_time'],
                [Sequelize.col('Frame_users.end_time'), 'end_time'],
                [Sequelize.col('Frame_users.id'), 'id'],
                [Sequelize.col('Frame_users.status'), 'status'],
            ],
            include: [{
                model: Frame_user,
                attributes: [],
                where: payload,
                required: true
            }],
            order: [[Frame_user, 'end_time', 'DESC']],
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
        console.log('Error for Frame user', error);
        throw error;
    }
}



module.exports = {
    createFrames,
    getFrames,
    updateFrame,
    deleteFrame,
    getUserframe,
    getFrameBy,
    getFrame_User,
    updateFrame_User,
    insertFrame_user,
    getAllFrame_User
}