const { Level } = require("../../../models");

async function createLevels(levelPayload) {
    try {
        const newLevel = await Level.create(levelPayload);
        return newLevel;
    } catch (error) {
        console.error('Error in level:', error);
        throw error;
    }
}

async function getLevels(levelPlayload, includeOptions = [], pagination = { page: 1, pageSize: 10 }) {
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
                ...levelPlayload,
            },
            include: includeOptions, // Dynamically include models
            // limit,
            // offset,
            order: [['level_id', 'ASC']],
        };

        // Use findAndCountAll to get both rows and count
        const { rows, count } = await Level.findAndCountAll(query);

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
        console.error('Error in Level:', error);
        throw error;
    }
}

async function updateLevel(levelPayload, levelCondition) {
    try {
        const updatedLevel = await Level.update(levelPayload, { where: levelCondition });
        return updatedLevel;
    } catch (error) {
        console.error('Error in leveling:', error);
        throw error;
    }
}
async function deleteLevel(levelPayload) {
    try {
        const unLevel = await Level.destroy({ where: levelPayload });
        return unLevel;
    } catch (error) {
        console.error('Error in unleveling leveling:', error);
        throw error;
    }
}

// function getUserLevel(consumption, levels) {
//     let userLevel = null;

//     for (const level of levels) {
//         if (Number(consumption) >= Number(level.level_up)) {
//             userLevel = level;
//         } else if (Number(consumption) == 0) {
//             userLevel = levels[0];
//         } else {
//             break;
//         }
//     }

//     return userLevel;
// }

async function getUserLevel(levelPalyload, attributes) {
    try {
        const level = await Level.findOne({
            attributes,
            where: levelPalyload,
            order: [['level_up', 'DESC']],
            limit: 1,
            // raw: true
        });

         return level ? level.toJSON() : null;

    } catch (error) {
        console.log('Error for user level', error)
        throw error;
    }
}



module.exports = {
    createLevels,
    getLevels,
    updateLevel,
    deleteLevel,
    getUserLevel
}