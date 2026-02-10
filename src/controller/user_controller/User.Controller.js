const { getUsers, getUser, getRecommendedUsers } = require("../../service/repository/user.service");
const { generalResponse } = require("../../helper/response.helper");
const updateFieldsFilter = require("../../helper/updateField.helper");
const { getblock } = require("../../service/repository/Block.service");
const { isFollow, getFollow } = require("../../service/repository/Follow.service");
const { Follow, Sequelize } = require("../../../models");
const { getReports } = require("../../service/repository/Report.service");
const { getNotifications, updateNotification } = require("../../service/repository/notification.service");
const { showSocials } = require("../social_controller/social.controller");
const { Social, Media } = require("../../../models")
const { structuredData, profile_manu } = require("../../data/home_profile");
const { emojiData } = require("../../data/emoji.data");
const { getLevels, getUserLevel } = require("../../service/repository/Level.service");
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
                model: Social,
                include: {
                    model: Media,

                },
                limit: 5
            }
        ]
        const excludedUserIds = followingUsers.map(f => f.user_id);
        const isUser = await getUsers(filteredData, pagination, attributes, excludedUserIds, Sequelize.literal('RANDOM()'), includes)

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

        const userData = await getUser({ user_id: currentUserId });

        return generalResponse(
            res,
            {
                data: structuredData,
                daimond: userData.get("diamond"),
                recommendedData: recommendedUsers,
                profile_manu: profile_manu
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

async function geteUserEmoji(req, res) {
    try {
        const data = emojiData;

        return generalResponse(
            res,
            {
                data
            },
            "User emojis",
            true,
            true
        );
    } catch (error) {
        console.error("Error in fetching emoji list", error);
        return generalResponse(
            res,
            {},
            "Something went wrong while fetching emoji list!",
            false,
            true
        );

    }
}

async function getUserByAuth(req, res) {
    try {
        let data = {};
        const user = await getUser({user_id: req.authData.user_id});
        if(!user){
            throw new Error("User not found");
        }
        data.user = {
            name: user.full_name,
            profile_pic: user.profile_pic,
            consumption: user.consumption
        }
        if(user.level){
            data.current_level = user.lavel;
        }else{
             let level = await getUserLevel({level_id:  1});
            data.current_level = level;
        }
        
        
        let next_level = await getUserLevel({level_id: data.current_level.level_id + 1});
        if(!next_level){
            next_level = user.lavel;
        }
        data.next_level = next_level;

         return generalResponse(
            res,
            data,
            "User details",
            true,
            true
        );
        
    } catch (error) {
         console.error("Error in fetching user data", error);
        return generalResponse(
            res,
            {},
            "Something went wrong while fetching user data!",
            false,
            true
        );
    }
}

async function searchUserList(req, res) {
    try {
        const { search = '', page = 1, pageSize = 10 } = req.body;

        // Validate search input
        if (!search || search.trim() === '') {
            return generalResponse(
                res,
                { Records: [], Pagination: {} },
                "Please provide a search term",
                false,
                true
            );
        }

        // Define attributes to return
        const attributes = [
            'user_id',
            'full_name',
            'first_name',
            'last_name',
            'user_name',
            'email',
            'mobile_num',
            'profile_pic',
            'country',
            'gender',
            'bio',
            'profile_verification_status',
            'login_verification_status',
            'available_coins',
            'diamond',
            'blocked_by_admin',
            'createdAt'
        ];

        // Create search payload to pass to service
        const searchPayload = {
            search: search.trim(),
            isNumeric: !isNaN(search.trim())
        };

        // Get users based on search criteria across multiple fields
        const searchResults = await getUsers(searchPayload, { page, pageSize }, attributes, [], [['updatedAt', 'DESC']]);

        if (searchResults?.Records?.length <= 0) {
            return generalResponse(
                res,
                {
                    Records: [],
                    Pagination: searchResults.Pagination
                },
                "No users found matching your search",
                true,
                true
            );
        }

        return generalResponse(
            res,
            {
                Records: searchResults.Records,
                Pagination: searchResults.Pagination
            },
            "Users found successfully",
            true,
            false
        );

    } catch (error) {
        console.error("Error in searching users", error);
        return generalResponse(
            res,
            {},
            "Something went wrong while searching for users!",
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
    getUserDetails,
    geteUserEmoji,
    getUserByAuth,
    searchUserList
};  