const { generalResponse } = require("../../helper/response.helper");
const {
    createAgencyUser,
    getAgencyUsers,
    getAgencyUserById,
    getAgencyUser,
    updateAgencyUser,
    deleteAgencyUser,
    countAgencyUsers,
    getAgencyUsersByAgencyId,
    getUsersByAgencyId
} = require("../../service/repository/Agency_user.service");
const { User } = require("../../../models");

/**
 * Create a new Agency User
 * POST /api/agency-user/create
 */
async function createAgencyUserHandler(req, res) {
    try {
        const { user_id, agency_id, reason, divide_agency, pre_target_coins } = req.body;

        // Validate required fields
        if (!user_id || !agency_id) {
            return generalResponse(
                res,
                {},
                "User ID and Agency ID are required",
                false,
                true,
                400
            );
        }

        // Check if user already exists in agency
        const existingAgencyUser = await getAgencyUser({
            user_id,
            agency_id
        });

        if (existingAgencyUser) {
            return generalResponse(
                res,
                {},
                "User already exists in this agency",
                false,
                true,
                400
            );
        }

        const agencyUserPayload = {
            user_id,
            agency_id,
            reason: reason || null,
            state: 0,  // pending
            divide_agency: divide_agency || 0,
            pre_target_coins: pre_target_coins || 0,
            add_time: Date.now().toString(),
            up_time: Date.now().toString()
        };

        const newAgencyUser = await createAgencyUser(agencyUserPayload);

        return generalResponse(
            res,
            newAgencyUser,
            "Agency user created successfully",
            true,
            true,
            201
        );
    } catch (error) {
        console.error("Error in creating agency user", error);
        return generalResponse(
            res,
            { success: false },
            "Error creating agency user",
            false,
            true,
            500
        );
    }
}

/**
 * Get all agency users with pagination and filters
 * POST /api/agency-user/list
 */
async function getAgencyUsersHandler(req, res) {
    try {
        const { page = 1, pageSize = 10, agency_id, state, user_id } = req.body;

        const filterPayload = {};
        if (agency_id !== undefined && agency_id !== null) {
            filterPayload.agency_id = agency_id;
        }
        if (state !== undefined && state !== null) {
            filterPayload.state = state;
        }
        if (user_id !== undefined && user_id !== null) {
            filterPayload.user_id = user_id;
        }

        const includeOptions = [
            {
                model: User,
                as: 'User',
                attributes: ['user_id', 'full_name', 'user_name', 'email', 'profile_pic', 'country']
            }
        ];

        const agencyUsers = await getAgencyUsers(filterPayload, includeOptions, { page, pageSize });

        if (agencyUsers.Pagination.total_records === 0) {
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
                "No agency users found",
                true,
                false,
                200
            );
        }

        return generalResponse(
            res,
            agencyUsers,
            "Agency users retrieved successfully",
            true,
            false,
            200
        );
    } catch (error) {
        console.error("Error in fetching agency users", error);
        return generalResponse(
            res,
            { success: false },
            "Error fetching agency users",
            false,
            true,
            500
        );
    }
}

/**
 * Get agency user by ID
 * GET /api/agency-user/:id
 */
async function getAgencyUserHandler(req, res) {
    try {
        const { id } = req.params;

        if (!id) {
            return generalResponse(
                res,
                {},
                "Agency User ID is required",
                false,
                true,
                400
            );
        }

        const includeOptions = [
            {
                model: User,
                as: 'User',
                attributes: ['user_id', 'full_name', 'user_name', 'email', 'profile_pic', 'country']
            }
        ];

        const agencyUser = await getAgencyUserById(id, includeOptions);

        if (!agencyUser) {
            return generalResponse(
                res,
                {},
                "Agency user not found",
                false,
                false,
                404
            );
        }

        return generalResponse(
            res,
            agencyUser,
            "Agency user retrieved successfully",
            true,
            false,
            200
        );
    } catch (error) {
        console.error("Error in fetching agency user", error);
        return generalResponse(
            res,
            { success: false },
            "Error fetching agency user",
            false,
            true,
            500
        );
    }
}

/**
 * Update agency user
 * PUT /api/agency-user/:id
 */
async function updateAgencyUserHandler(req, res) {
    try {
        const { id } = req.params;
        const { state, divide_agency, pre_target_coins, reason, istip, signout_reason, signout_istip } = req.body;

        if (!id) {
            return generalResponse(
                res,
                {},
                "Agency User ID is required",
                false,
                true,
                400
            );
        }

        // Check if user exists
        const existingAgencyUser = await getAgencyUserById(id);
        if (!existingAgencyUser) {
            return generalResponse(
                res,
                {},
                "Agency user not found",
                false,
                false,
                404
            );
        }

        const updatePayload = {
            up_time: Date.now().toString()
        };

        if (state !== undefined) updatePayload.state = state;
        if (divide_agency !== undefined) updatePayload.divide_agency = divide_agency;
        if (pre_target_coins !== undefined) updatePayload.pre_target_coins = pre_target_coins;
        if (reason !== undefined) updatePayload.reason = reason;
        if (istip !== undefined) updatePayload.istip = istip;
        if (signout_reason !== undefined) updatePayload.signout_reason = signout_reason;
        if (signout_istip !== undefined) updatePayload.signout_istip = signout_istip;

        const updated = await updateAgencyUser(updatePayload, { id });

        if (updated[0] === 0) {
            return generalResponse(
                res,
                {},
                "No changes made",
                true,
                false,
                200
            );
        }

        const includeOptions = [
            {
                model: User,
                as: 'User',
                attributes: ['user_id', 'full_name', 'user_name', 'email', 'profile_pic', 'country']
            }
        ];

        const updatedAgencyUser = await getAgencyUserById(id, includeOptions);

        return generalResponse(
            res,
            updatedAgencyUser,
            "Agency user updated successfully",
            true,
            true,
            200
        );
    } catch (error) {
        console.error("Error in updating agency user", error);
        return generalResponse(
            res,
            { success: false },
            "Error updating agency user",
            false,
            true,
            500
        );
    }
}

/**
 * Delete agency user
 * DELETE /api/agency-user/:id
 */
async function deleteAgencyUserHandler(req, res) {
    try {
        const { id } = req.params;

        if (!id) {
            return generalResponse(
                res,
                {},
                "Agency User ID is required",
                false,
                true,
                400
            );
        }

        // Check if user exists
        const existingAgencyUser = await getAgencyUserById(id);
        if (!existingAgencyUser) {
            return generalResponse(
                res,
                {},
                "Agency user not found",
                false,
                false,
                404
            );
        }

        await deleteAgencyUser({ id });

        return generalResponse(
            res,
            {},
            "Agency user deleted successfully",
            true,
            true,
            200
        );
    } catch (error) {
        console.error("Error in deleting agency user", error);
        return generalResponse(
            res,
            { success: false },
            "Error deleting agency user",
            false,
            true,
            500
        );
    }
}

/**
 * Get users by agency ID
 * POST /api/agency-user/by-agency
 */
async function getAgencyUsersByAgencyHandler(req, res) {
    try {
        const { agency_id, page = 1, pageSize = 10, state } = req.body;

        if (!agency_id) {
            return generalResponse(
                res,
                {},
                "Agency ID is required",
                false,
                true,
                400
            );
        }

        const filterPayload = { agency_id };
        if (state !== undefined && state !== null) {
            filterPayload.state = state;
        }

        const includeOptions = [
            {
                model: User,
                as: 'User',
                attributes: ['user_id', 'full_name', 'user_name', 'email', 'profile_pic', 'country']
            }
        ];

        const agencyUsers = await getAgencyUsersByAgencyId(agency_id, { page, pageSize }, includeOptions);

        if (agencyUsers.Pagination.total_records === 0) {
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
                "No users found for this agency",
                true,
                false,
                200
            );
        }

        return generalResponse(
            res,
            agencyUsers,
            "Agency users retrieved successfully",
            true,
            false,
            200
        );
    } catch (error) {
        console.error("Error in fetching agency users by agency id", error);
        return generalResponse(
            res,
            { success: false },
            "Error fetching agency users",
            false,
            true,
            500
        );
    }
}

/**
 * Approve agency user
 * POST /api/agency-user/:id/approve
 */
async function approveAgencyUserHandler(req, res) {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!id) {
            return generalResponse(
                res,
                {},
                "Agency User ID is required",
                false,
                true,
                400
            );
        }

        const agencyUser = await getAgencyUserById(id);
        if (!agencyUser) {
            return generalResponse(
                res,
                {},
                "Agency user not found",
                false,
                false,
                404
            );
        }

        const updated = await updateAgencyUser(
            {
                state: 1,  // approved
                reason: reason || null,
                up_time: Date.now().toString()
            },
            { id }
        );

        const includeOptions = [
            {
                model: User,
                as: 'User',
                attributes: ['user_id', 'full_name', 'user_name', 'email', 'profile_pic', 'country']
            }
        ];

        const updatedAgencyUser = await getAgencyUserById(id, includeOptions);

        return generalResponse(
            res,
            updatedAgencyUser,
            "Agency user approved successfully",
            true,
            true,
            200
        );
    } catch (error) {
        console.error("Error in approving agency user", error);
        return generalResponse(
            res,
            { success: false },
            "Error approving agency user",
            false,
            true,
            500
        );
    }
}

/**
 * Reject agency user
 * POST /api/agency-user/:id/reject
 */
async function rejectAgencyUserHandler(req, res) {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!id) {
            return generalResponse(
                res,
                {},
                "Agency User ID is required",
                false,
                true,
                400
            );
        }

        if (!reason) {
            return generalResponse(
                res,
                {},
                "Reason for rejection is required",
                false,
                true,
                400
            );
        }

        const agencyUser = await getAgencyUserById(id);
        if (!agencyUser) {
            return generalResponse(
                res,
                {},
                "Agency user not found",
                false,
                false,
                404
            );
        }

        const updated = await updateAgencyUser(
            {
                state: 2,  // rejected
                reason: reason,
                up_time: Date.now().toString()
            },
            { id }
        );

        const includeOptions = [
            {
                model: User,
                as: 'User',
                attributes: ['user_id', 'full_name', 'user_name', 'email', 'profile_pic', 'country']
            }
        ];

        const updatedAgencyUser = await getAgencyUserById(id, includeOptions);

        return generalResponse(
            res,
            updatedAgencyUser,
            "Agency user rejected successfully",
            true,
            true,
            200
        );
    } catch (error) {
        console.error("Error in rejecting agency user", error);
        return generalResponse(
            res,
            { success: false },
            "Error rejecting agency user",
            false,
            true,
            500
        );
    }
}

module.exports = {
    createAgencyUserHandler,
    getAgencyUsersHandler,
    getAgencyUserHandler,
    updateAgencyUserHandler,
    deleteAgencyUserHandler,
    getAgencyUsersByAgencyHandler,
    approveAgencyUserHandler,
    rejectAgencyUserHandler
};
