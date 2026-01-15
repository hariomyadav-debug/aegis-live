const { generalResponse } = require("../../helper/response.helper");
const updateFieldsFilter = require("../../helper/updateField.helper");
const { createLevels, getLevels } = require("../../service/repository/Level.service");

async function createLevelList(req, res) {
    const admin_id = req.authData.user_id
    try {
        let allowedUpdateFieldsMandatory = [];

        allowedUpdateFieldsMandatory = ['level_name', 'level_id', 'level_up', 'thumb', 'colour', 'thumb_mark', 'bg']
        let filteredData;
        try {
            filteredData = updateFieldsFilter(req.body, allowedUpdateFieldsMandatory, true);
            filteredData.uploader_id = admin_id
        }
        catch (err) {
            console.log(err);
            return generalResponse(
                res,
                { success: false },
                "Data is Missing",
                false,
                true
            );
        }

        const created = await createLevels(filteredData)

        if (created) {

            return generalResponse(
                res,
                {},
                "Level added successfully",
                true,
                true
            )

        }
        return generalResponse(
            res,
            {},
            "Failed to add level",
            ture,
            true
        )


    } catch (error) {
        console.error("Error in adding level", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while adding level!",
            false,
            true
        );
    }
}

async function get_all_levels(req, res) {
    console.log('ee')
    try {
        const levelPayload = {}
        const levelList = await getLevels(levelPayload);
        if (levelList.Pagination.total_records == 0) {
            return generalResponse(
                res,
                {
                    Records: [],
                    Pagination: {
                        total_pages: 0,
                        total_records: 0,
                        current_page: 1,
                        records_per_page: 10
                    }
                },
                "No Level / Level found",
                true,
                true,
                200
            );

        }
        
        return generalResponse(res, levelList, "List found", true, false, 200)
        
    } catch (err) {
        console.log("Error in level", err);
        return generalResponse(res, {success: false}, "Something went wrong while Leves Get !", false, true);
    }
}


module.exports ={
    get_all_levels,
    createLevelList,
}