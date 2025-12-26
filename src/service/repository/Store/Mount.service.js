const {Mount} = require("../../../../models");


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


module.exports ={
    createMounts,
    getMounts,
    updateMount,
    deleteMount
}