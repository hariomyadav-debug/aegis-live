const { generalResponse } = require("../../helper/response.helper");
const updateFieldsFilter = require("../../helper/updateField.helper");
const { getFrames, createFrames } = require("../../service/repository/Store/Frame.service");
const { getLiangs } = require("../../service/repository/Store/Liangnumber.service");
const { getMounts } = require("../../service/repository/Store/Mount.service");
const { getRoom_themes } = require("../../service/repository/Store/Room_theme.service");


async function createFrameList(req, res) {
    const admin_id = req.authData.user_id
    try {
        let allowedUpdateFieldsMandatory = [];

        allowedUpdateFieldsMandatory = ['name']
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

        const createdFrame = await createFrames(filteredData)

        if (createdFrame) {

            return generalResponse(
                res,
                {},
                "Frame added Successfully",
                true,
                true
            )

        }
        return generalResponse(
            res,
            {},
            "Failed to add frame",
            ture,
            true
        )


    } catch (error) {
        console.error("Error in adding Frame", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while adding Frame!",
            false,
            true
        );
    }
}

async function getFrameList(req, res) {
    try {
        const storeList = await getFrames({});

        if (storeList.Pagination.total_records == 0) {
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
                "No Frame / Frame found",
                true,
                true,
                200
            );

        }

        return generalResponse(
            res,
            storeList,
            "List found",
            true,
            false,
            200
        );

    } catch (error) {
        console.error("Error in get frame list", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while geting frame list",
            false,
            true
        );
    }

}


async function getStoreList(req, res) {
     try {
        const frameList = await getFrames({});
        const liangList = await getLiangs({});
        const mountList = await getMounts({});
        const roomThemeList = await getRoom_themes({});

        // if (storeList.Pagination.total_records == 0) {
        //     return generalResponse(
        //         res,
        //         {
        //             Records: [],
        //             Pagination: {
        //                 total_pages: 0,
        //                 total_records: 0,
        //                 current_page: 1,
        //                 records_per_page: 10
        //             }
        //         },
        //         "No Frame / Frame found",
        //         true,
        //         true,
        //         200
        //     );

        // }

        return generalResponse(
            res,
            {
                frameList,
                liangList,
                mountList,
                roomThemeList
            },
            "List found",
            true,
            false,
            200
        );

    } catch (error) {
        console.error("Error in get frame list", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while geting frame list",
            false,
            true
        );
    }
}



module.exports = {
    getFrameList,
    createFrameList,
    getStoreList
}