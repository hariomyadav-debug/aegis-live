const {Frame} = require("../../../../models");


async function createFrames(framePayload) {
    try {
        const newFrame = await Frame.create(framePayload);
        return newFrame;
    } catch (error) {
        console.error('Error in frame:', error);
        throw error;
    }
}

async function getFrames(framePlayload, includeOptions=[], pagination = { page: 1, pageSize: 10 }) {
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

async function updateFrame(framePayload , frameCondition) {
    try {
        const updatedFrame = await Frame.update(framePayload, {where:frameCondition});
        return updatedFrame;
    } catch (error) {
        console.error('Error in frameing:', error);
        throw error;
    }
}
async function deleteFrame(framePayload ) {
    try {
        const unFrame = await Frame.destroy({where:framePayload});
        return unFrame;
    } catch (error) {
        console.error('Error in unframeing frameing:', error);
        throw error;
    }
}


module.exports ={
    createFrames,
    getFrames,
    updateFrame,
    deleteFrame
}