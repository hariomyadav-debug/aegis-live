const {Room_theme} = require("../../../../models");


async function createRoom_themes(room_themePayload) {
    try {
        const newRoom_theme = await Room_theme.create(room_themePayload);
        return newRoom_theme;
    } catch (error) {
        console.error('Error in room_theme:', error);
        throw error;
    }
}

async function getRoom_themes(room_themePlayload, includeOptions=[], pagination = { page: 1, pageSize: 10 }) {
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
                ...room_themePlayload,
            },
            include: includeOptions, // Dynamically include models
            limit,
            offset,
        };

         // Use findAndCountAll to get both rows and count
        const { rows, count } = await Room_theme.findAndCountAll(query);

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
        console.error('Error in Room_theme:', error);
        throw error;
    }
}

async function updateRoom_theme(room_themePayload , room_themeCondition) {
    try {
        const updatedRoom_theme = await Room_theme.update(room_themePayload, {where:room_themeCondition});
        return updatedRoom_theme;
    } catch (error) {
        console.error('Error in room_themeing:', error);
        throw error;
    }
}
async function deleteRoom_theme(room_themePayload ) {
    try {
        const unRoom_theme = await Room_theme.destroy({where:room_themePayload});
        return unRoom_theme;
    } catch (error) {
        console.error('Error in unroom_themeing room_themeing:', error);
        throw error;
    }
}


module.exports ={
    createRoom_themes,
    getRoom_themes,
    updateRoom_theme,
    deleteRoom_theme
}