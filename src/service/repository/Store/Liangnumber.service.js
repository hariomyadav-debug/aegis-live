const {Liang} = require("../../../../models");


async function createLiangs(liangPayload) {
    try {
        const newLiang = await Liang.create(liangPayload);
        return newLiang;
    } catch (error) {
        console.error('Error in liang:', error);
        throw error;
    }
}

async function getLiangs(liangPlayload, includeOptions=[], pagination = { page: 1, pageSize: 10 }) {
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
                ...liangPlayload,
            },
            include: includeOptions, // Dynamically include models
            limit,
            offset,
        };

         // Use findAndCountAll to get both rows and count
        const { rows, count } = await Liang.findAndCountAll(query);

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
        console.error('Error in Liang:', error);
        throw error;
    }
}

async function updateLiang(liangPayload , liangCondition) {
    try {
        const updatedLiang = await Liang.update(liangPayload, {where:liangCondition});
        return updatedLiang;
    } catch (error) {
        console.error('Error in lianging:', error);
        throw error;
    }
}
async function deleteLiang(liangPayload ) {
    try {
        const unLiang = await Liang.destroy({where:liangPayload});
        return unLiang;
    } catch (error) {
        console.error('Error in unlianging lianging:', error);
        throw error;
    }
}


module.exports ={
    createLiangs,
    getLiangs,
    updateLiang,
    deleteLiang
}