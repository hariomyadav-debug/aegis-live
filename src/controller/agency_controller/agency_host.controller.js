const { generalResponse } = require("../../helper/response.helper");
const {
    getAgencyUsers,
    getAgencyUserById,
    getAgencyUser,
    updateAgencyUser,
    deleteAgencyUser,
    getAgencyUsersByAgencyId,
    getUsersByAgencyId
} = require("../../service/repository/Agency_user.service");
const {
    getAgencies,
    getAgencyById,
    getAgency
} = require("../../service/repository/Agency.service");
const { User, Agency, Agency_user } = require("../../../models");
const { Op } = require('sequelize');
const { getInvitationById, sendHostInvitation, isAlreadyMember } = require("../../service/repository/Invitation.service");

/**
 * Get host dashboard
 * POST /api/agency/host/dashboard
 */
async function getHostDashboard(req, res) {
    try {
        const { agency_id } = req.body;
        const userId = req.authData?.user_id;

        if ( !userId) {
            return generalResponse(
                res,
                {},
                "Agency ID and User ID required",
                false,
                true,
                400
            );
        }

        let filterPayload = { user_id: userId, state: 2 };
        if (agency_id) {
            filterPayload.agency_id = agency_id;
        }

        // Check if user is a host in this agency
        const hostInfo = await getAgencyUser(filterPayload);

        if (!hostInfo) {
            return generalResponse(
                res,
                {},
                "Access denied",
                false,
                false,
                403
            );
        }

        return generalResponse(
            res,
            {
                host_info: hostInfo,
            },
            "Host dashboard retrieved",
            true,
            false,
            200
        );
    } catch (error) {
        console.error("Error in host dashboard", error);
        return generalResponse(
            res,
            { success: false },
            "Error retrieving host dashboard",
            false,
            true,
            500
        );
    }
}

/**
 * Get team members/hosts in agency
 * POST /api/agency/:agency_id/members
 */
async function getTeamMembers(req, res) {
    try {
        const userId = req.authData.user_id;
        const { page = 1, pageSize = 20, state=2 } = req.body;

        const agency = await getAgencyById({ user_id: userId, state: 2 });
        if (!agency) {
            return generalResponse(
                res,
                {},
                "Agency not found",
                false,
                true,
                400
            );
        }

        const filterPayload = { agency_id: parseInt(agency.id) };
        if (state !== undefined && state !== null) {
            filterPayload.state = state;
        }

        const includeOptions = [
            {
                model: User,
                as: 'user',
                attributes: ['user_id', 'full_name', 'user_name', 'profile_pic']
            }
        ];

        const members = await getAgencyUsers(filterPayload, includeOptions, { page, pageSize });

        return generalResponse(
            res,
            members,
            "Team members retrieved",
            true,
            false,
            200
        );
    } catch (error) {
        console.error("Error in get team members", error);
        return generalResponse(
            res,
            { success: false },
            "Error retrieving team members",
            false,
            true,
            500
        );
    }
}

/**
 * Remove member from agency
 * POST /api/agency/:agency_id/member/:member_id/remove
 */
async function removeMember(req, res) {
    try {
        const { agency_id, member_id } = req.params;
        const userId = req.authData?.user_id;

        if (!agency_id || !member_id) {
            return generalResponse(
                res,
                {},
                "Agency ID and Member ID required",
                false,
                true,
                400
            );
        }

        if (parseInt(userId) === parseInt(member_id)) {
            return generalResponse(
                res,
                {},
                "You cannot remove yourself",
                false,
                true,
                400
            );
        }

        // Check if requester is agency owner
        const agency = await getAgencyById({id: agency_id, state: 2, user_id: userId});
        if (!agency) {
            return generalResponse(
                res,
                {},
                "Only agency owner can remove members",
                false,
                false,
                403
            );
        }

        // Verify member exists in agency
        const member = await getAgencyUser({
            id: parseInt(member_id),
            agency_id: parseInt(agency_id)
        });

        if (!member) {
            return generalResponse(
                res,
                {},
                "Member not found",
                false,
                false,
                404
            );
        }

        await deleteAgencyUser({ id: parseInt(member_id) });

        return generalResponse(
            res,
            {},
            "Member removed successfully",
            true,
            true,
            200
        );
    } catch (error) {
        console.error("Error in remove member", error);
        return generalResponse(
            res,
            { success: false },
            "Error removing member",
            false,
            true,
            500
        );
    }
}

/**
 * Get member work stats (votes/earnings in period)
 * POST /api/agency/:agency_id/member/:member_id/stats
 */
async function getMemberStats(req, res) {
    try {
        const { agency_id, member_id } = req.params;
        const { start_date, end_date } = req.body;

        if (!agency_id || !member_id) {
            return generalResponse(
                res,
                {},
                "Agency ID and Member ID required",
                false,
                true,
                400
            );
        }

        // Verify member exists
        const member = await getAgencyUserById(member_id);
        if (!member) {
            return generalResponse(
                res,
                {},
                "Member not found",
                false,
                false,
                404
            );
        }

        // TODO: Query vote records and calculate stats based on date range

        return generalResponse(
            res,
            {
                member_id: member_id,
                total_votes: 0,
                commission: 0,
                salary: 0
            },
            "Member stats retrieved",
            true,
            false,
            200
        );
    } catch (error) {
        console.error("Error in member stats", error);
        return generalResponse(
            res,
            { success: false },
            "Error retrieving member stats",
            false,
            true,
            500
        );
    }
}

/**
 * Update member commission/split
 * POST /api/agency/:agency_id/member/:member_id/commission
 */
async function updateMemberCommission(req, res) {
    try {
        const { agency_id, member_id } = req.params;
        const { divide_agency } = req.body;
        const userId = req.authData?.user_id;

        if (!agency_id || !member_id || divide_agency === undefined) {
            return generalResponse(
                res,
                {},
                "Missing required fields",
                false,
                true,
                400
            );
        }

        // Check if requester is agency owner
        const agency = await getAgencyById({id: agency_id});
        if (!agency || agency.user_id !== userId) {
            return generalResponse(
                res,
                {},
                "Only agency owner can update commissions",
                false,
                false,
                403
            );
        }

        // Verify member exists
        const member = await getAgencyUserById(member_id);
        if (!member) {
            return generalResponse(
                res,
                {},
                "Member not found",
                false,
                false,
                404
            );
        }

        // Validate divide_agency value (should be 0-100 or -1)
        if (divide_agency < -1 || divide_agency > 100) {
            return generalResponse(
                res,
                {},
                "Commission must be between -1 and 100",
                false,
                true,
                400
            );
        }

        const updated = await updateAgencyUser(
            { divide_agency: divide_agency },
            { id: parseInt(member_id) }
        );

        const updatedMember = await getAgencyUserById(member_id);

        return generalResponse(
            res,
            updatedMember,
            "Commission updated successfully",
            true,
            true,
            200
        );
    } catch (error) {
        console.error("Error in update commission", error);
        return generalResponse(
            res,
            { success: false },
            "Error updating commission",
            false,
            true,
            500
        );
    }
}

/**
 * Apply to join as host to agency
 * POST /api/agency/apply-as-host
 */
async function applyAsHost(req, res) {
    try {
        const { agency_id, message="I want to join your agency." } = req.body;
        const userId = req.authData?.user_id;

        if (!agency_id) {
            return generalResponse(
                res,
                {},
                "Agency ID required",
                false,
                true,
                400
            );
        }

        // Check if agency exists
        const agency = await getAgencyById({id: agency_id});
        if (!agency) {
            return generalResponse(
                res,
                {},
                "Agency not found",
                false,
                false,
                404
            );
        }

        // Check if user is already a member
        const isMember = await isAlreadyMember(userId, agency_id);


        const existingInvitation = await getInvitationById({
                user_id: userId,
                // ref_id: agency_id,
                status: 0 // pending
        });

        if (isMember || existingInvitation) {
            if (existingInvitation && existingInvitation.state === 0) {
                return generalResponse(
                    res,
                    {},
                    "Application already pending",
                    false,
                    true,
                    400
                );
            } else if (isMember) {
                return generalResponse(
                    res,
                    {},
                    "User is already a member",
                    false,
                    true,
                    400
                );
            }
        }

        const invitation = await sendHostInvitation(agency_id, userId, userId, "agency", message);


        // Create new application
        // const agencyUserPayload = {
        //     user_id: userId,
        //     agency_id: agency_id,
        //     reason: reason || null,
        //     state: 0, // pending
        //     add_time: Math.floor(Date.now() / 1000),
        //     up_time: Math.floor(Date.now() / 1000)
        // };

        // const newApplication = await createAgencyUser(agencyUserPayload);

        return generalResponse(
            res,
            invitation,
            "Application submitted successfully",
            true,
            true,
            201
        );
    } catch (error) {
        console.error("Error in apply as host", error);
        return generalResponse(
            res,
            { success: false },
            "Error submitting application",
            false,
            true,
            500
        );
    }
}

/**
 * Search available agencies to join
 * POST /api/agency/search-available
 */
async function searchAvailableAgencies(req, res) {
    try {
        const { search_term, page = 1, pageSize = 20 } = req.body;

        const filterPayload = {
            state: 1, // only approved agencies
            disable: false
        };

        if (search_term) {
            filterPayload.name = { [Op.like]: `%${search_term}%` };
        }

        const agencies = await getAgencies(filterPayload, [], { page, pageSize });

        return generalResponse(
            res,
            agencies,
            "Available agencies retrieved",
            true,
            false,
            200
        );
    } catch (error) {
        console.error("Error in search agencies", error);
        return generalResponse(
            res,
            { success: false },
            "Error searching agencies",
            false,
            true,
            500
        );
    }
}

module.exports = {
    getHostDashboard,
    getTeamMembers,
    removeMember,
    getMemberStats,
    updateMemberCommission,
    applyAsHost,
    searchAvailableAgencies
};
