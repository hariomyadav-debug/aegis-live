const { Vip_avatar_icon, Vip_card_icon, Vip_chat_bubble, Vip_entry_vehicle, Vip_mic_wave, Vip_noble_icon, Vip_poster, sequelize } = require("../../../models");
const { generalResponse } = require("../../helper/response.helper");
const updateFieldsFilter = require("../../helper/updateField.helper");
const { getFrameBy, getFrame_User, updateFrame_User, insertFrame_user } = require("../../service/repository/Store/Frame.service");
const { getMountBy, getMount_User, updateMount_User, insertMount_user } = require("../../service/repository/Store/Mount.service");
const { getUser } = require("../../service/repository/user.service");
const { createVip_level, getVip_levelWithPagination, getPrivilagesByVipIds, getVip_record, updateVip_record, createVip_Record, createVip_history } = require("../../service/repository/Vip.service");

async function createVip_levelList(req, res) {
    const admin_id = req.authData.user_id
    try {
        let allowedUpdateFieldsMandatory = [];

        allowedUpdateFieldsMandatory = ['name', 'icon', 'info_bg', 'bg_image', 'bg_color', 'category']
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

        const created = await createVip_level(filteredData)

        if (created) {

            return generalResponse(
                res,
                {},
                "Vip level added Successfully",
                true,
                true
            )

        }
        return generalResponse(
            res,
            {},
            "Failed to add Vip level",
            ture,
            true
        )


    } catch (error) {
        console.error("Error in adding Vip level", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while adding Vip level!",
            false,
            true
        );
    }
}

// WP - with pagination
async function getVip_level_WP(req, res) {
    try {
        let includeData = [
            {
                model: Vip_avatar_icon,
                as: 'avatarIcon'
            },
            {
                model: Vip_card_icon,
                as: 'cardIcon'
            },
            {
                model: Vip_chat_bubble,
                as: 'bubbleIcon'
            },
            {
                model: Vip_entry_vehicle,
                as: 'entryIcon'
            },
            {
                model: Vip_mic_wave,
                as: 'micIcon'
            },
            {
                model: Vip_noble_icon,
                as: 'nobleIcon'
            },
            {
                model: Vip_poster,
                as: 'posterIcon'
            }
        ]
        let list = await getVip_levelWithPagination({}, includeData);

        if (list.Pagination.total_records == 0) {
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
                "No Level / VIP found",
                true,
                true,
                200
            );

        }
        // console

        let vip_ids = list.Records.map(data => data.id);
        const privileges = await getPrivilagesByVipIds(vip_ids);

        let allowedFields = ['id', 'name', 'icon', 'info_bg', 'bg_image', 'category', 'price_30_days']
        list = list.Records.map(data => ({
            ...updateFieldsFilter(data, allowedFields),
            props: [data?.avatarIcon && data?.avatarIcon,
            data?.cardIcon && data?.cardIcon,
            data?.entryIcon && data?.entryIcon,
            data?.bubbleIcon && data?.bubbleIcon,
            data?.micIcon && data?.micIcon,
            data?.posterIcon && data?.posterIcon,
            data?.nobleIcon && data?.nobleIcon
            ].filter(Boolean),
            privileges: privileges?.[data.id] || []
        }))

        return generalResponse(
            res,
            list,
            "List found",
            true,
            false,
            200
        );

    } catch (error) {
        console.error("Error in get vip list", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while geting vip list",
            false,
            true
        );
    }

}


async function applyVips(timestamp, noOfDays, vip_id, user_id, uid, vip_cost) {
    const startTime = new Date(timestamp).getTime() / 1000;
    const addTime = Math.floor(Date.now() / 1000);
    let endTime = startTime + 86400 * noOfDays;

    let frameId = 0;
    let carId = 0;

    const vipMap = {
        2: { frameId: 122 },
        3: { frameId: 123, carId: 53 },
        4: { frameId: 124, carId: 54 },
        5: { frameId: 125, carId: 55 },
        6: { frameId: 126, carId: 56 },
    };

    if (vipMap[vip_id]) {
        frameId = vipMap[vip_id].frameId || 0;
        carId = vipMap[vip_id].carId || 0;
    }

    /* FRAME */
    if (frameId) {
        const frame = await getFrameBy({ frame_id: frameId });
        if (frame) {
            const userFrame = await getFrame_User({
                where: { user_id: user_id, frame_id: frameId },
            });

            if (userFrame) {
                if (userFrame.endtime > addTime) {
                    endTime = userFrame.endtime + 86400 * noOfDays;
                }
                await updateFrame_User({ end_time: endTime }, { id: userFrame.id });
            } else {

                // TODO: correct timestemp
                await insertFrame_user({
                    user_id: user_id,
                    frame_id: frameId,
                    add_time: addTime,
                    end_time: endTime,
                    // add_time: addTime.toString(),
                    // end_time: endTime.toString(),
                });
            }
        }
    }

    /* CAR */
    if (carId) {
        const car = await getMountBy({ mount_id: carId });
        if (car) {
            const userCar = await getMount_User({ user_id: uid, mount_id: carId });

            if (userCar) {
                if (userCar.endtime > addTime) {
                    endTime = userCar.endtime + 86400 * noOfDays;
                }
                await updateMount_User({ endtime: endTime }, { id: userCar.id });
            } else {
                await insertMount_user({
                    uid,
                    car_id: carId,
                    addtime: addTime,
                    endtime: endTime,
                });
            }
        }
    }

    /* VIP HISTORY */
    await createVip_history({
        user_id: uid,
        coin: vip_cost,
        vip_id: vip_id,
        add_time: addTime.toString(),
        end_time: endTime.toString(),
    });
}


async function deductUserCoins(userCoin, vip_id, days, price, user_id, transaction) {
    if (userCoin - price < 0) {
        return { success: false, message: 'User insufficient balance' };
    }

    const result = await User.update(
        { coin: sequelize.literal(`coin - ${price}`) },
        { where: { id: user_id }, transaction }
    );

    if (result[0] > 0) {
        await UserCoinRecord.create(
            {
                type: 0,
                action: 18,
                uid: user_id,
                touid: user_id,
                giftid: vip_id,
                giftcount: days,
                totalcoin: price,
                addtime: Math.floor(Date.now() / 1000),
            },
            { transaction }
        );

        return { success: true, message: 'Updated user balance' };
    }

    return { success: false, message: 'Failed to update user balance' };
}


async function updateVip(
    category,
    timestamp,
    note,
    noOfDays,
    vip_id,
    user_id,
    recordVipId
) {
    const affected = await updateVip_record(
        {
            category,
            timestamp,
            note,
            no_of_days: noOfDays,
            vip_id: vip_id,
        },
        { where: { id: recordVipId, user_id } }
    );

    if (affected[0] === 0) {
        return { success: false, message: 'Failed to update SVIP record.' };
    }

    //   await applyVips(timestamp, noOfDays, vip_id, user_id, user_id, vip_cost);
    return {
        success: true,
        message: `SVIP for ${noOfDays} days acquired successfully.`,
    };
}


async function upgradeAndInsertVIPFunc(
    vipRecord,
    vipData,
    recordStatus,
    timestamp,
    user_id,
    note
) {
    if (vipRecord) {
        if (vipRecord.vip_id === vipData.id) {
            if (vipRecord.no_of_days === vipData.no_of_days) {
                return { success: true, message: 'You already acquired this VIP' };
            }

            if (vipRecord.no_of_days < vipData.no_of_days) {
                await updateVip_record(
                    {
                        no_of_days: vipData.no_of_days,
                        timestamp,
                    },
                    { where: { id: vipRecord.id } }
                );

                await applyVips(
                    timestamp,
                    vipData.no_of_days,
                    vipData.id,
                    user_id,
                    user_id,
                    vipData.target
                );

                return {
                    success: true,
                    message: `Your VIP upgraded to ${vipData.no_of_days} days.`,
                };
            }

            return {
                success: true,
                message:
                    recordStatus === 1
                        ? 'You already have a Higher VIP.'
                        : 'You already used Higher VIP.',
            };
        }

        if (vipData.id > vipRecord.vip_id) {
            return await updateVip(
                vipData.category,
                timestamp,
                note,
                vipData.no_of_days,
                vipData.id,
                user_id,
                vipRecord.id,
                vipData.target
            );
        }

        return { success: false, message: 'Cannot downgrade VIP.' };
    }

    /* NEW RECORD */
    await createVip_Record({
        vip_id: vipData.id,
        user_id,
        category: vipData.category,
        no_of_days: vipData.no_of_days,
        timestamp,
        note,
    });

    await applyVips(
        timestamp,
        vipData.no_of_days,
        vipData.id,
        user_id,
        user_id,
        vipData.target
    );


    return {
        success: true,
        message: `VIP acquired successfully for ${vipData.no_of_days} days.`,
    };
}


async function acquire_vip(req, res) {
    const u_id = req.authData.user_id;

    const timestamp = new Date().getTime();
    try {

        const isUser = await getUser({ user_id: u_id });

        if (!isUser) {
            return next(new Error("User not found."));
        }

        let allowedUpdateFieldsMandatory = [];

        allowedUpdateFieldsMandatory = ['user_id', 'vip_id', 'category', 'days']
        let filteredData;
        try {
            filteredData = updateFieldsFilter(req.body, allowedUpdateFieldsMandatory, true);
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

        const payload = { id: filteredData.vip_id, status: true };
        const attributes = [
            'id',
            'name',
            [sequelize.literal(`'buy'`), 'category'],
            [sequelize.literal(filteredData.days), 'no_of_days'],
            [
                sequelize.literal(`
          CASE 
            WHEN ${filteredData.days}=7 THEN price_7_days
            WHEN ${filteredData.days}=15 THEN price_15_days
            WHEN ${filteredData.days}=90 THEN price_30_days
            WHEN ${filteredData.days}=180 THEN price_180_days
            WHEN ${filteredData.days}=365 THEN price_365_days
          END
        `),
                'target',
            ],
        ];

        let vipData = await getVip_levelWithPagination(payload, [], attributes);
        vipData = vipData.Records[0];

        if (!vipData) {
            return generalResponse(
                res,
                { success: false },
                "Invalid VIP ID!",
                false,
                true
            );
        }

        console.log(vipData, isUser.available_coins)
        if(!vipData?.target && (vipData.target > isUser.available_coins)){
            return generalResponse(
                res,
                { success: false },
                "Insufficient coins!",
                false,
                true
            );
        }

        const record_payload = { user_id: filteredData.user_id };
        let vipRecord = await getVip_record(record_payload);
        if (vipRecord && vipRecord.length < 1) {
            vipRecord = null;
        }
        let recordStatus = 0;
        if (vipRecord) {
            const expire =
                new Date(vipRecord.timestamp).getTime() +
                vipRecord.no_of_days * 86400000;
            recordStatus = Date.now() < expire ? 1 : 2;
        }
        console.log(vipRecord);

        const result = await upgradeAndInsertVIPFunc(
            vipRecord,
            vipData,
            recordStatus,
            timestamp,
            filteredData.user_id,
            "note"
        );


        return generalResponse(
            res,
            result,
            "List found",
            true,
            false,
            200
        );

    } catch (error) {
        console.error("Error in buy vip", error);
        return generalResponse(
            res,
            { success: false },
            "Something went wrong while buy vip",
            false,
            true
        );
    }
}

// acquireVip({ body: { 'days': 90, 'user_id': 8, vip_id: 1, 'category': 'buy' } })


module.exports = {
    createVip_levelList,
    getVip_level_WP,
    acquire_vip
}