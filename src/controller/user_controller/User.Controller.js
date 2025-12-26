const { getUsers, getUser, getRecommendedUsers } = require("../../service/repository/user.service");
const { generalResponse } = require("../../helper/response.helper");
const updateFieldsFilter = require("../../helper/updateField.helper");
const { getblock } = require("../../service/repository/Block.service");
const { isFollow, getFollow } = require("../../service/repository/Follow.service");
const { Follow, Sequelize } = require("../../../models");
const { getReports } = require("../../service/repository/Report.service");
const { getNotifications, updateNotification } = require("../../service/repository/notification.service");
const { showSocials } = require("../social_controller/social.controller");
require("dotenv").config();

async function findUser(req, res) {
    try {
        let allowedUpdateFields = [];
        let filteredData;
        let pagination;
        allowedUpdateFields = ['user_id', 'user_name', 'user_check', 'total_social']
        allowedUpdateFieldsPagination = ['page', 'pageSize']
        let user_id = req.authData.user_id
        try {
            filteredData = updateFieldsFilter(req.body, allowedUpdateFields, false);
            pagination = updateFieldsFilter(req.body, allowedUpdateFieldsPagination, false);
        }
        catch (err) {
            console.log(err);

            return generalResponse(
                res,
                {},
                "Data is Missing",
                false,
                true
            );
        }
        let excludedUserIds = []
        if (filteredData.user_name && filteredData.user_check) {
            const isUser = await getUsers(filteredData, pagination)

            if (isUser?.Records?.length <= 0) {

                return generalResponse(
                    res,
                    {
                        Records: [],
                        Pagination: {},
                    },
                    "UserName Available",
                    true,
                    true
                );
            }
            else {
                return generalResponse(
                    res,
                    {
                        Records: [],
                        Pagination: {}
                    },
                    "UserName Unavailable",
                    false,
                    true
                );
            }

        }

        const uniqueIds = new Set();

        const block1 = await getblock({ user_id: user_id })
        const block2 = await getblock({ blocked_id: user_id })
        if (block1?.Records?.length > 0 || block1?.Records?.length > 0) {
            block1?.Records?.forEach(blocks => {
                uniqueIds.add(blocks?.dataValues?.blocked_id);
            });
            block2?.Records?.forEach(blocks => {
                uniqueIds.add(blocks?.dataValues?.user_id);
            });
            excludedUserIds = Array.from(uniqueIds);
        }

        if (excludedUserIds.includes(req.body?.user_id)) {
            return generalResponse(
                res,
                {
                    Records: [],
                    pagination: {}
                },
                "User Not found",
                true,
                true,
            );
        }
        const attributes = ['updatedAt', 'profile_pic', 'user_id', 'full_name', 'user_name', 'email', 'country_code', 'country', 'gender', 'bio', 'profile_verification_status', 'login_verification_status']
        const isUser = await getUsers(filteredData, pagination, attributes)

        if (isUser?.Records?.length <= 0) {

            return generalResponse(
                res,
                {
                    Records: [],
                    Pagination: {}
                },
                "User Not found",
                true,
                true
            );
        }


        const updatedRecords = await Promise.all(
            isUser.Records.map(async (record) => {
                let is_follow = false;
                // Assuming isFollow returns a boolean indicating if the user is followed
                const Alread_follow = await isFollow({ follower_id: user_id, user_id: record.user_id });

                if (Alread_follow) {
                    is_follow = true;  // Set is_follow to true if already followed
                }
                return {
                    //Invoked Geters
                    ...record.get(),
                    is_follow   // Spread the existing record data
                };
            })
        );

        return generalResponse(
            res,
            {
                Records: updatedRecords,
                Pagination: isUser.Pagination
            },
            "User Found",
            true,
            false,
        );

    } catch (error) {
        console.error("Error in Findng User", error);
        return generalResponse(
            res,
            {},
            "Something went wrong while Finding User!",
            false,
            true
        );
    }
}


async function findUser_no_auth(req, res) {
    try {
        let allowedUpdateFields = [];
        let filteredData;
        let pagination;
        let { sort_by = "createdAt", sort_order = "DESC" } = req.body
        allowedUpdateFields = ['user_id', 'user_name']
        allowedUpdateFieldsPagination = ['page', 'pageSize']

        try {
            filteredData = updateFieldsFilter(req.body, allowedUpdateFields, false);
            pagination = updateFieldsFilter(req.body, allowedUpdateFieldsPagination, false);
        }
        catch (err) {
            console.log(err);

            return generalResponse(
                res,
                {},
                "Data is Missing",
                false,
                true
            );
        }

        const attributes = [
            'updatedAt',
            'profile_pic',
            'user_id',
            'full_name',
            'user_name',
            'email',
            'country_code',
            'country',
            'gender',
            'bio',
            'profile_verification_status',
            'login_verification_status',
            'socket_id',
            'mobile_num',
            'login_type',
            'blocked_by_admin',
            'available_coins',
            'createdAt'
        ]
        filteredData.blocked_by_admin = false
        filteredData.login_verification_status = true
        const isUser = await getUsers(filteredData, pagination, attributes, [], Sequelize.literal('RANDOM()'))

        if (isUser?.Records?.length <= 0) {

            return generalResponse(
                res,
                {
                    Records: [],
                    Pagination: {}
                },
                "User Not found",
                true,
                true
            );
        }
        // const enrichedUsers = await Promise.all(
        //     isUser.Records.map(async (user) => {
        //         const followingCount = await getFollow({ follower_id: user.user_id }, [], { page: 1, pageSize: 1 })
        //         const followerCount = await getFollow({ user_id: user.user_id }, [], { page: 1, pageSize: 1 })
        //         const reportCounts = await getReports({ report_to: user.user_id }, pagination = { page: 1, pageSize: 1 })

        //         return {
        //             ...user.toJSON?.() || user,
        //             followingCount: followingCount.Pagination.total_records,
        //             followerCount: followerCount.Pagination.total_records,
        //             reportCounts: reportCounts.Pagination.total_records
        //         };
        //     })
        // );

        return generalResponse(
            res,
            isUser,
            "User Found",
            true,
            false,
        );

    } catch (error) {
        console.error("Error in Findng User", error);
        return generalResponse(
            res,
            {},
            "Something went wrong while Finding User!",
            false,
            true
        );
    }
}
async function findUser_not_following(req, res) {
    try {
        let allowedUpdateFields = [];
        let filteredData;
        let pagination;
        let { sort_by = "createdAt", sort_order = "DESC" } = req.body
        allowedUpdateFields = ['user_id', 'user_name']
        allowedUpdateFieldsPagination = ['page', 'pageSize']
        let user_id = req.authData.user_id

        try {
            filteredData = updateFieldsFilter(req.body, allowedUpdateFields, false);
            pagination = updateFieldsFilter(req.body, allowedUpdateFieldsPagination, false);
        }
        catch (err) {
            console.log(err);

            return generalResponse(
                res,
                {},
                "Data is Missing",
                false,
                true
            );
        }

        const attributes = [
            'updatedAt',
            'profile_pic',
            'user_id',
            'full_name',
            'user_name',
            'email',
            'country_code',
            'country',
            'gender',
            'bio',
            'profile_verification_status',
            'login_verification_status',
            'socket_id',
            'mobile_num',
            'login_type',
            'blocked_by_admin',
            'available_coins',
            'createdAt'
        ]
        filteredData.blocked_by_admin = false
        filteredData.login_verification_status = true
        const followingUsers = await Follow.findAll({
            where: { follower_id: user_id },
            attributes: ['user_id']
        });
        const includes = [
            {
                model:Social,
                include : {
                    model: Media,

                },
                limit:5
            }
        ]
        const excludedUserIds = followingUsers.map(f => f.user_id);
        const isUser = await getUsers(filteredData, pagination, attributes, excludedUserIds, Sequelize.literal('RANDOM()'),includes)

        if (isUser?.Records?.length <= 0) {

            return generalResponse(
                res,
                {
                    Records: [],
                    Pagination: {}
                },
                "User Not found",
                true,
                true
            );
        }
        // const enrichedUsers = await Promise.all(
        //     isUser.Records.map(async (user) => {
        //         const followingCount = await getFollow({ follower_id: user.user_id }, [], { page: 1, pageSize: 1 })
        //         const followerCount = await getFollow({ user_id: user.user_id }, [], { page: 1, pageSize: 1 })
        //         const reportCounts = await getReports({ report_to: user.user_id }, pagination = { page: 1, pageSize: 1 })

        //         return {
        //             ...user.toJSON?.() || user,
        //             followingCount: followingCount.Pagination.total_records,
        //             followerCount: followerCount.Pagination.total_records,
        //             reportCounts: reportCounts.Pagination.total_records
        //         };
        //     })
        // );

        return generalResponse(
            res,
            isUser,
            "User Found",
            true,
            false,
        );

    } catch (error) {
        console.error("Error in Findng User", error);
        return generalResponse(
            res,
            {},
            "Something went wrong while Finding User!",
            false,
            true
        );
    }
}
async function findUser_Admin(req, res) {
    try {
        let allowedUpdateFields = [];
        let filteredData;
        let pagination;
        let { sort_by = "createdAt", sort_order = "DESC" } = req.body
        allowedUpdateFields = ['user_id', 'user_name']
        allowedUpdateFieldsPagination = ['page', 'pageSize']
        let admin_id = req.authData.admin_id
        if (req.authData.admin_id == null) {
            return generalResponse(
                res,
                {},
                "Forbidden",
                false,
                true,
                401
            );
        }
        try {
            filteredData = updateFieldsFilter(req.body, allowedUpdateFields, false);
            pagination = updateFieldsFilter(req.body, allowedUpdateFieldsPagination, false);
        }
        catch (err) {
            console.log(err);

            return generalResponse(
                res,
                {},
                "Data is Missing",
                false,
                true
            );
        }

        const attributes = [
            'updatedAt',
            'profile_pic',
            'user_id',
            'full_name',
            'user_name',
            'email',
            'country_code',
            'country',
            'gender',
            'bio',
            'profile_verification_status',
            'login_verification_status',
            'socket_id',
            'mobile_num',
            'login_type',
            'blocked_by_admin',
            'available_coins',
            'createdAt'
        ]

        const isUser = await getUsers(filteredData, pagination, attributes, [], [[sort_by, sort_order]])

        if (isUser?.Records?.length <= 0) {

            return generalResponse(
                res,
                {
                    Records: [],
                    Pagination: {}
                },
                "User Not found",
                true,
                true
            );
        }
        const enrichedUsers = await Promise.all(
            isUser.Records.map(async (user) => {
                const followingCount = await getFollow({ follower_id: user.user_id }, [], { page: 1, pageSize: 1 })
                const followerCount = await getFollow({ user_id: user.user_id }, [], { page: 1, pageSize: 1 })
                const reportCounts = await getReports({ report_to: user.user_id }, pagination = { page: 1, pageSize: 1 })

                return {
                    ...user.toJSON?.() || user,
                    followingCount: followingCount.Pagination.total_records,
                    followerCount: followerCount.Pagination.total_records,
                    reportCounts: reportCounts.Pagination.total_records
                };
            })
        );

        return generalResponse(
            res,
            {
                Records: enrichedUsers,
                Pagination: isUser.Pagination
            },
            "User Found",
            true,
            false,
        );

    } catch (error) {
        console.error("Error in Findng User", error);
        return generalResponse(
            res,
            {},
            "Something went wrong while Finding User!",
            false,
            true
        );
    }
}


async function get_notificationList(req, res) {
    try {
        const { page = 1, pageSize = 10 } = req.body;

        const notificationList = await getNotifications({ reciever_id: req.authData.user_id, view_status: req.body.view_status }, pagination = { page: page, pageSize: pageSize }, [], [['createdAt', 'DESC']]);
        if (notificationList?.Records?.length <= 0) {
            return generalResponse(
                res,
                {
                    Records: [],
                    Pagination: {}
                },
                "No notifications found",
                true,
                true
            );
        }
        return generalResponse(
            res,
            notificationList,
            "Notification list found",
            true,
            false
        );
    } catch (error) {
        console.error("Error in fetching notification list", error);
        return generalResponse(
            res,
            {},
            "Something went wrong while fetching notification list!",
            false,
            true
        );

    }

}
async function update_notificationList(req, res) {
    try {
        const { notification_ids } = req.body;

        notification_ids.map(id =>
            updateNotification({ view_status: "seen" }, { reciever_id: req.authData.user_id, notification_id: id })
        )
        return generalResponse(
            res,
            {

            },
            "Notifications Updated",
            true,
            true
        );

    } catch (error) {
        console.error("Error in fetching notification list", error);
        return generalResponse(
            res,
            {},
            "Something went wrong while fetching notification list!",
            false,
            true
        );

    }

}


async function getUserDetails(req, res) {
    try {
        const currentUserId = req.authData.user_id;

        const recommendedUsers = await getRecommendedUsers(currentUserId, 1);

        const userData = await getUser({user_id: currentUserId});


        const structuredData = [
            {title : "Level", iconUrl :"https://cdn-icons-png.flaticon.com/512/3584/3584344.png", launchUrl: "http://151.243.116.51:3000/level", type: 1},
            {title : "Daily tasks", iconUrl :"https://www.iconpacks.net/icons/free-icons-6/free-bookmark-yellow-circle-icon-20560-thumb.png", launchUrl: "daily_tasks", type: 1},
            {title : "Ranking", iconUrl :"https://cdn-icons-png.freepik.com/256/8429/8429708.png?semt=ais_white_label", launchUrl: "ranking", type: 1},
            {title : "Entries & frames", iconUrl :"https://img.freepik.com/premium-photo/gold-frame-with-red-pink-flower-it3d-avatar-frame-cartoon-photo-border-rendering-game_432516-32302.jpg?w=360", launchUrl: "entries_frames", type: 1},
            {title : "Backpack", iconUrl :"https://tr.rbxcdn.com/180DAY-c4736a14adc02461144ed1709b1c7dee/420/420/BackAccessory/Png/noFilter", launchUrl: "http://151.243.116.51:3000/backpack", type: 1},
            {title : "Family center", iconUrl :"https://media.istockphoto.com/id/2163738562/vector/thin-outline-icon-two-hands-holding-or-hugging-group-people-symbol-or-family-line-sign-group.jpg?s=612x612&w=0&k=20&c=nB2qepcgr6BWjL7Y-cZ-1Q91PFKnng9HOZUV-9PFzfg=", launchUrl: "family_center", type: 2},
            {title : "Winning record", iconUrl :"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQMs8SWnzw2edXhpugdckq1mYr8RgH5-8U4eQ&s", launchUrl: "winning_record", type: 2},
            {title : "Invitaion rewards", iconUrl :"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSIrHK41OGOEwnRrwtXRH46GDvBNLN0y4xLXA&s", launchUrl: "invitation_rewards", type: 2},
            {title : "Setting", iconUrl :"https://img.icons8.com/fluent/1200/settings.jpg", launchUrl: "settings", type: 3},
            {title : "Room Admin", iconUrl :"https://static.thenounproject.com/png/95188-200.png", launchUrl: "room_admin", type: 3},
            {title : "Help & Feedback", iconUrl :"https://icons.veryicon.com/png/o/application/spanner-app/help-feedback.png", launchUrl: "help_feedback", type: 3},
        ]
         const profile_manu = [
            // {title : "Bank details", iconUrl :"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSg5hmIJwYjTpHQqKB8ytlEqK0V17EpGlTERA&s", launchUrl: "bank_details"},
            // {title : "Wallet", iconUrl :"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSg5hmIJwYjTpHQqKB8ytlEqK0V17EpGlTERA&s", launchUrl: "wallet"},
            // {title : "Coin Histroy", iconUrl :"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSg5hmIJwYjTpHQqKB8ytlEqK0V17EpGlTERA&s", launchUrl: "coin_history"},
            {title : "Post", iconUrl :"https://cdn-icons-png.freepik.com/256/7087/7087136.png?semt=ais_white_label", launchUrl: "post", type: 1},
            {title : "Earnings", iconUrl :"https://cdn-icons-png.flaticon.com/512/5206/5206272.png", launchUrl: "earnings", type: 1},
            {title : "Recharge", iconUrl :"https://img.freepik.com/premium-vector/business-finance-icon-vector-illustration_1253044-51259.jpg", launchUrl: "recharge", type: 1},
            {title : "Messages", iconUrl :"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTH6z2xQRkrrxxGmdzkt129Qjq0SYsgFk5NlA&s", launchUrl: "message", type: 1},
            {title : "Live Data", iconUrl :"https://img.freepik.com/premium-vector/live-streaming-icon-live-broadcasting-button-online-stream-icon_349999-1413.jpg", launchUrl: "http://151.243.116.51:3000/livedata", type: 1},
            {title : "Verify", iconUrl :"https://cdn-icons-png.freepik.com/256/18290/18290780.png?semt=ais_white_label", launchUrl: "verify", type: 1},
            ]

        return generalResponse(
            res,
            {
                data: structuredData,
                daimond: userData.get("diamond"),
                recommendedData: recommendedUsers,
                profile_manu
            },
            "Data Found",
            true,
            false,
        );

    } catch (error) {
        console.error("Error in Finding Details", error);
        return generalResponse(
            res,
            {},
            "Something went wrong while Finding Details!",
            false,
            true
        );
    }
}



module.exports = {
    findUser,
    findUser_Admin,
    get_notificationList,
    update_notificationList,
    findUser_no_auth,
    findUser_not_following,
    getUserDetails
};  