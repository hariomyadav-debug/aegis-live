const { generalResponse } = require("../../helper/response.helper");
const updateFieldsFilter = require("../../helper/updateField.helper");
const { getFrames, createFrames, getFrameBy, getFrame_User, updateFrame_User, insertFrame_user, getAllFrame_User } = require("../../service/repository/Store/Frame.service");
const { getLiangs } = require("../../service/repository/Store/Liangnumber.service");
const { getMounts, getAllMount_User, insertMount_user, updateMount_User, getMount_User, getMountBy } = require("../../service/repository/Store/Mount.service");
const { getRoom_themes } = require("../../service/repository/Store/Room_theme.service");
const { getUser, updateUser } = require("../../service/repository/user.service");
const { Op } = require("sequelize");


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


// TODO: not completed
// async function buyFrame(req, res) {
//     const user_id = req.authData.user_id;

//     try {
//         let allowedUpdateFieldsMandatory = [];

//         allowedUpdateFieldsMandatory = ['frame_id', 'days']
//         let filteredData;
//         try {
//             filteredData = updateFieldsFilter(req.body, allowedUpdateFieldsMandatory, true);
//         }
//         catch (err) {
//             console.log(err);
//             return generalResponse(
//                 res,
//                 { success: false },
//                 "Data is Missing",
//                 false,
//                 true
//             );
//         }

//         const userData = await getUser({ user_id: user_id });
//         if (!userData) {
//             return generalResponse(
//                 res,
//                 {},
//                 "User not found!",
//                 ture,
//                 true
//             )
//         }
//         const frameData = await getFrameBy({ frame_id: req.body.frame_id, status: true }, ['frame_id', 'name', 'need_coin', 'score']);
//         if (!frameData) {
//             return generalResponse(
//                 res,
//                 {},
//                 "Invalid Frame ID!",
//                 ture,
//                 true
//             )
//         }

//         const balance = Number(userData.available_coin) - Number(frameData.need_coin);
//         if (balance < 0) {
//             return generalResponse(
//                 res,
//                 {},
//                 "Insufficient balance!",
//                 ture,
//                 true
//             )
//         }

//         const updated = await updateUser({ available_coins: balance }, { user_id: user_id });
//         if (updated) {
//             const isBought = await getFrame_User({ frame_id: frameData.frame_id, user_id });
//             if (isBought) {
//                 const updatePayload = {
//                     add_time: Date.now(),
//                     end_time: Date.now() * 30,
//                 }
//                 const updateedFU = await updateFrame_User(updatePayload, { id: isBought.id });
//                 if (!updateedFU) {
//                     return generalResponse(
//                         res,
//                         {},
//                         "Insufficient balance!",
//                         ture,
//                         true
//                     )
//                 }
//             }

//         } else {

//             const end_time = Date.now() * 30 // 30 days from today
//             const insertData = {
//                 user_id: user_id,
//                 frame_id: frameData.frame_id,
//                 status: false,
//                 add_time: Date.now(),
//                 end_time: end_time
//             }
//             const inserted = await insertFrame_user(insertData);
//             if (!inserted) {
//                 return generalResponse(
//                     res,
//                     {},
//                     "Insufficient balance!",
//                     ture,
//                     true
//                 )
//             }
//         }
//         return generalResponse(
//             res,
//             {},
//             "Buy Successfully",
//             true,
//             true
//         )

//     } catch (err) {
//         console.log('Error to buy frame', err);
//         return generalResponse(
//             res,
//             { success: false },
//             "Something went wrong while geting frame list",
//             false,
//             true
//         );
//     }
// }



async function buyFrame(req, res) {
    const user_id = req.authData.user_id;

    try {
        // validate input
        const allowedFields = ['frame_id', 'days'];
        const filteredData = updateFieldsFilter(req.body, allowedFields, true);

        const DAYS = Number(filteredData.days) || 30;
        const MS_IN_DAY = 24 * 60 * 60 * 1000;

        // get user
        const userData = await getUser({ user_id });
        if (!userData) {
            return generalResponse(res, {}, "User not found!", false, true);
        }

        // get frame
        const frameData = await getFrameBy(
            { frame_id: filteredData.frame_id, status: true },
            ['frame_id', 'name', 'need_coin', 'score']
        );

        if (!frameData) {
            return generalResponse(res, {}, "Invalid Frame ID!", false, true);
        }

        // check balance
        const balance =
            Number(userData.available_coins) - Number(frameData.need_coin);


        if (balance < 0) {
            return generalResponse(res, {}, "Insufficient balance!", false, true);
        }


        const now = new Date();
        const endTime = new Date(now.getTime() + DAYS * MS_IN_DAY);

        // check if frame already bought
        const isBought = await getFrame_User({
            frame_id: frameData.frame_id,
            user_id
        });
        if (isBought && (isBought.add_time < isBought.end_time)) {
            return generalResponse(
                res,
                {},
                "already buy",
                true,
                true
            );
        }

        // deduct coins (NO rollback)
        await updateUser(
            { available_coins: balance },
            { user_id }
        );


        if (isBought) {
            // renew frame
            await updateFrame_User(
                {
                    add_time: now,
                    end_time: endTime,
                    status: true
                },
                { id: isBought.id }
            );
            return generalResponse(
                res,
                {},
                "Frame renew successfully",
                true,
                true
            );
        } else {
            // insert new frame
            await insertFrame_user({
                user_id,
                frame_id: frameData.frame_id,
                status: true,
                add_time: now,
                end_time: endTime
            });
        }

        return generalResponse(
            res,
            {},
            "Frame purchased successfully",
            true,
            true
        );

    } catch (err) {
        console.error('Error to buy frame', err);

        return generalResponse(
            res,
            { success: false },
            "Something went wrong while buying frame",
            false,
            true
        );
    }
}

async function buyMount(req, res) {
    const user_id = req.authData.user_id;

    try {
        // validate input
        const allowedFields = ['mount_id', 'days'];
        const filteredData = updateFieldsFilter(req.body, allowedFields, true);

        const DAYS = Number(filteredData.days) || 30;
        const MS_IN_DAY = 24 * 60 * 60 * 1000;

        // get user
        const userData = await getUser({ user_id });
        if (!userData) {
            return generalResponse(res, {}, "User not found!", false, true);
        }

        // get mount
        const mountData = await getMountBy(
            { mount_id: filteredData.mount_id, status: true },
            ['mount_id', 'name', 'need_coin', 'score']
        );

        if (!mountData) {
            return generalResponse(res, {}, "Invalid Mount ID!", false, true);
        }

        // check balance
        const balance =
            Number(userData.available_coins) - Number(mountData.need_coin);


        if (balance < 0) {
            return generalResponse(res, {}, "Insufficient balance!", false, true);
        }


        const now = new Date();
        const endTime = new Date(now.getTime() + DAYS * MS_IN_DAY);

        // check if mount already bought
        const isBought = await getMount_User({
            mount_id: mountData.mount_id,
            user_id
        });
        if (isBought && (isBought.add_time < isBought.end_time)) {
            return generalResponse(
                res,
                {},
                "already buy",
                true,
                true
            );
        }

        // deduct coins (NO rollback)
        await updateUser(
            { available_coins: balance },
            { user_id }
        );


        if (isBought) {
            // renew mount
            await updateMount_User(
                {
                    add_time: now,
                    end_time: endTime,
                    status: true
                },
                { id: isBought.id }
            );
            return generalResponse(
                res,
                {},
                "Mount renew successfully",
                true,
                true
            );
        } else {
            // insert new mount
            await insertMount_user({
                user_id,
                mount_id: mountData.mount_id,
                status: true,
                add_time: now,
                end_time: endTime
            });
        }

        return generalResponse(
            res,
            {},
            "Mount purchased successfully",
            true,
            true
        );

    } catch (err) {
        console.error('Error to buy mount', err);

        return generalResponse(
            res,
            { success: false },
            "Something went wrong while buying mount",
            false,
            true
        );
    }
}

async function applyFrame(req, res) {
    const user_id = req.authData.user_id;
    const { frame_user_id } = req.body;
    try {
        const isExixt = await getFrame_User({
            user_id, id: frame_user_id, end_time: {
                [Op.gt]: new Date()
            }
        });

        if (!isExixt && (isExixt.length < 1)) {
            return generalResponse(
                res,
                {},
                "Expired frame!",
                false,
                true
            );
        }
        if (isExixt && isExixt.status) {
            return generalResponse(
                res,
                {},
                "Already applied!",
                false,
                true
            );
        }
        // 2️⃣ Deactivate all active frames
        await updateFrame_User(
            { status: false },
            { user_id, status: true }
        );


        await updateFrame_User({ status: true }, { user_id: user_id, id: frame_user_id });

        return generalResponse(
            res,
            { success: true },
            "Activated Frame",
            true,
            true,
            200
        );

    } catch (error) {
        console.error('Frame active error', error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while apply frame",
            false,
            true
        );
    }
}
async function removeFrame(req, res) {
    const user_id = req.authData.user_id;
    const { frame_user_id } = req.body;
    try {
        const isExixt = await getFrame_User({
            user_id, id: frame_user_id, end_time: {
                [Op.gt]: new Date()
            }
        });

        if (!isExixt && (isExixt.length < 1)) {
            return generalResponse(
                res,
                {},
                "Expired frame!",
                false,
                true
            );
        }
        if (isExixt && !isExixt.status) {
            return generalResponse(
                res,
                {},
                "Already Removed!",
                false,
                true
            );
        }

        await updateFrame_User({ status: false }, { user_id: user_id, id: frame_user_id });

        return generalResponse(
            res,
            { success: true },
            "Removed Frame!",
            true,
            true,
            200
        );

    } catch (error) {
        console.error('Frame removed error', error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while apply frame",
            false,
            true
        );
    }
}


async function applyMount(req, res) {
    const user_id = req.authData.user_id;
    const { mount_user_id } = req.body;
    console.log(mount_user_id);
    try {
        const isExixt = await getMount_User({
            user_id, id: mount_user_id, end_time: {
                [Op.gt]: new Date()
            }
        });

        if (!isExixt && (isExixt.length < 1)) {
            return generalResponse(
                res,
                {},
                "Expired Mount!",
                false,
                true
            );
        }
        console.log(isExixt)
        if (isExixt && isExixt.status) {
            return generalResponse(
                res,
                {},
                "Already applied!",
                false,
                true
            );
        }
        // 2️⃣ Deactivate all active mount
        await updateMount_User(
            { status: false },
            { user_id, status: true }
        );


        await updateMount_User({ status: true }, { user_id: user_id, id: mount_user_id });

        return generalResponse(
            res,
            { success: true },
            "Activated Mount",
            true,
            true,
            200
        );

    } catch (error) {
        console.error('Mount active error', error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while apply Mount",
            false,
            true
        );
    }
}
async function removeMount(req, res) {
    const user_id = req.authData.user_id;
    const { mount_user_id } = req.body;
    try {
        const isExixt = await getMount_User({
            user_id, id: mount_user_id, end_time: {
                [Op.gt]: new Date()
            }
        });

        if (!isExixt && (isExixt.length < 1)) {
            return generalResponse(
                res,
                {},
                "Expired mount!",
                false,
                true
            );
        }
        if (isExixt && !isExixt.status) {
            return generalResponse(
                res,
                {},
                "Already Removed!",
                false,
                true
            );
        }

        await updateMount_User({ status: false }, { user_id: user_id, id: mount_user_id });

        return generalResponse(
            res,
            { success: true },
            "Removed Mount!",
            true,
            true,
            200
        );

    } catch (error) {
        console.error('Mount removed error', error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while apply mount",
            false,
            true
        );
    }
}


async function getStoreList(req, res) {
    const { user_id } = req.authData;

    try {
        const frameList = await getFrames({});
        const frameUser = await getAllFrame_User({ user_id });
        const activeFrameIds = frameUser
            .filter(frame => frame.end_time > Date.now())
            .map(frame => frame.frame_id);
        frameList.Records = frameList.Records.map(frame => ({
            ...frame.get({ plain: true }),
            isBought: activeFrameIds.includes(frame.frame_id),
        }));

        const liangList = await getLiangs({});
        const mountUser = await getAllMount_User({ user_id })
        const mountList = await getMounts({});
        const activeMountIds = mountUser
            .filter(mount => mount.end_time > Date.now())
            .map(mount => mount.mount_id);
        mountList.Records = mountList.Records.map(mount => ({
            ...mount.get({ plain: true }),
            isBought: activeMountIds.includes(mount.mount_id),
        }));

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


async function getEquipmentsList(req, res) {
    const user_id = req.authData.user_id;
    try {
        const frameList = await getAllFrame_User({ user_id });
        const liangList = [];
        const mountList = await getAllMount_User({ user_id });
        const roomThemeList = [];

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
    getStoreList,
    getEquipmentsList,
    buyFrame,
    buyMount,
    applyFrame,
    removeFrame,
    applyMount,
    removeMount
}