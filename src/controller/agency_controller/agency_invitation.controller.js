const { generalResponse } = require("../../helper/response.helper");
const {
    sendHostInvitation,
    getUserInvitations,
    getInvitationById,
    acceptRejectInvitation,
    rejectInvitation,
    isAlreadyMember,
    hasPendingInvitation,
    getAgencyPendingInvitations,
    deleteInvitation
} = require("../../service/repository/Invitation.service");
const {
    getAgencyById,
    getAgency
} = require("../../service/repository/Agency.service");
const {
    createAgencyUser,
    getAgencyUser
} = require("../../service/repository/Agency_user.service");
const { User, Agency, Agency_user, Hostinvite } = require("../../../models");
const { getUser } = require("../../service/repository/user.service");
const { Op } = require("sequelize");

/**
 * Send invitation to host to join agency
 * POST /api/agency/invite/send-to-host
 */
async function sendInvitationToHost(req, res) {
    try {
        const { agency_id, host_user_id, message = "We are inviting you to join our agency!" } = req.body;
        const agencyOwnerId = req.authData?.user_id;

        if (!agency_id || !host_user_id) {
            return generalResponse(
                res,
                {},
                "Agency ID and User ID required",
                false,
                true,
                400
            );
        }

        // Verify agency owner
        const agency = await getAgencyById({ id: agency_id });
        if (!agency || agency.user_id !== agencyOwnerId) {
            return generalResponse(
                res,
                {},
                "Only agency owner can send invitations",
                false,
                false,
                403
            );
        }

        // Check if user exists
        const hostUser = await getUser({ user_id: host_user_id });

        if (!hostUser) {
            return generalResponse(
                res,
                {},
                "User not found",
                false,
                false,
                404
            );
        }

        // Check if already member
        const isMember = await isAlreadyMember(host_user_id, agency_id);
        const existingInvitation = await getInvitationById({
            user_id: host_user_id,
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
                    "User is already a member of the agency",
                    false,
                    true,
                    400
                );
            }
        }

        // Check for pending invitation
        const hasPending = await hasPendingInvitation(host_user_id, agency_id, "agency");
        if (hasPending) {
            return generalResponse(
                res,
                {},
                "Invitation already pending for this user",
                false,
                true,
                400
            );
        }

        // Send invitation
        const invitation = await sendHostInvitation(agency_id, host_user_id, req.authData?.user_id, "agency", message);

        return generalResponse(
            res,
            invitation,
            "Invitation sent successfully",
            true,
            true,
            201
        );
    } catch (error) {
        console.error("Error sending invitation", error);
        return generalResponse(
            res,
            { success: false },
            "Error sending invitation",
            false,
            true,
            500
        );
    }
}

/**
 * Get invitations for current user
 * POST /api/agency/invite/my-invitations
 */
async function getMyInvitations(req, res) {
    try {
        const { page = 1, pageSize = 20 } = req.body;
        const userId = req.authData?.user_id;

        const invitations = await getUserInvitations({ user_id: userId, requester_id: { [Op.ne]: req.authData?.user_id }, status: 0 }, { page, pageSize });

        console.log("User invitations: ", invitations);
        return generalResponse(
            res,
            invitations,
            "Invitations retrieved",
            true,
            false,
            200
        );
    } catch (error) {
        console.error("Error fetching invitations", error);
        return generalResponse(
            res,
            { success: false },
            "Error retrieving invitations",
            false,
            true,
            500
        );
    }
}

/**
 * Accept invitation to join agency as host
 * POST /api/agency/invite/:invitation_id/accept
 */
async function actionAgencyInvitation(req, res) {
    try {
        const { invitation_id, action, agency_id = 0 } = req.body;
        const userId = req.authData?.user_id;

        if (!invitation_id) {
            return generalResponse(
                res,
                {},
                "Invitation ID required",
                false,
                true,
                400
            );
        }

        // Get invitation
        const invitation = await getInvitationById({ id: invitation_id, ref_type: "agency" });
        if (!invitation) {
            return generalResponse(
                res,
                {},
                "Invitation not found",
                false,
                false,
                404
            );
        }

        // Check if invitation is for this user already a member or not
        const isMember = await isAlreadyMember(invitation.user_id);
        if (isMember) {
            return generalResponse(
                res,
                {},
                "You are already a member",
                false,
                true,
                400
            );
        }

        // This api can use only agency and user who is invited can accept/reject the invitation. if agency owner is accepting/rejecting the invitation, then return updated pending invitations for that agency. if host is accepting/rejecting the invitation, then return updated invitation details along with agency user record if accepted
        let agency = null;
        if ((invitation.user_id !== userId) || (agency_id != 0 && agency_id != invitation.ref_id)) {
            agency = await getAgency({ id: invitation.ref_id, user_id: userId });
            agency = agency ? agency.get({ plain: true }) : null;
            if (!agency || agency.id !== invitation.ref_id) {
                return generalResponse(
                    res,
                    {},
                    "This invitation is not for you",
                    false,
                    false,
                    403
                );
            }
        }

        if (invitation.status !== 0) {
            return generalResponse(
                res,
                {},
                "Invitation is no longer pending",
                false,
                true,
                400
            );
        }

        // Accept invitation
        await acceptRejectInvitation({ id: invitation_id }, { status: action == "accept" ? 1 : 2, update_time: Date.now() });

        // Create agency user record
        let agencyUser = null;
        if (action == "accept") {
            agencyUser = await createAgencyUser({
                user_id: userId,
                agency_id: invitation.ref_id,
                state: 2, // approved
                add_time: Math.floor(Date.now()),
                up_time: Math.floor(Date.now())
            });
        }

        const updatedInvitation = await getInvitationById({ id: invitation_id });

        let message = action == "accept" ? "Invitation accepted successfully" : "Invitation rejected successfully";


        // when agency owner accepts/rejects an invitation, return updated pending invitations for that agency
        if ((agency_id != 0) && agency && (agency.id == agency_id)) {

            const sendRequestList = await getAgencyPendingInvitations({
                ref_id: agency.id,
                requester_id: agency.user_id,
                status: 0
            });

            const getRequestList = await getAgencyPendingInvitations({
                ref_id: agency.id,
                requester_id: { [Op.ne]: agency.user_id },
                status: 0
            });

            message = action == "accept" ? "Invitation accepted successfully" : "Invitation rejected successfully";
            return generalResponse(
                res,
                {
                    send_requests: sendRequestList,
                    receive_requests: getRequestList
                },
                message,
                true,
                false,
                200
            );
        }

        // when host accepts/rejects an invitation, return updated invitation details along with agency user record if accepted
        return generalResponse(
            res,
            {
                invitation: updatedInvitation,
                agency_user: agencyUser
            },
            message,
            true,
            true,
            200
        );
    } catch (error) {
        console.error("Error accepting invitation", error);
        return generalResponse(
            res,
            { success: false },
            "Error accepting invitation",
            false,
            true,
            500
        );
    }
}

/**
 * Reject invitation
 * POST /api/agency/invite/:invitation_id/reject
 */
async function rejectAgencyInvitation(req, res) {
    try {
        const { invitation_id } = req.params;
        const userId = req.authData?.user_id;

        if (!invitation_id) {
            return generalResponse(
                res,
                {},
                "Invitation ID required",
                false,
                true,
                400
            );
        }

        // Get invitation
        const invitation = await getInvitationById({ id: invitation_id });
        if (!invitation) {
            return generalResponse(
                res,
                {},
                "Invitation not found",
                false,
                false,
                404
            );
        }

        if (invitation.user_id !== userId) {
            return generalResponse(
                res,
                {},
                "This invitation is not for you",
                false,
                false,
                403
            );
        }

        if (invitation.status !== 0) {
            return generalResponse(
                res,
                {},
                "Invitation is no longer pending",
                false,
                true,
                400
            );
        }

        // Reject invitation
        await rejectInvitation(invitation_id);
        const updatedInvitation = await getInvitationById({ id: invitation_id });

        return generalResponse(
            res,
            updatedInvitation,
            "Invitation rejected successfully",
            true,
            true,
            200
        );
    } catch (error) {
        console.error("Error rejecting invitation", error);
        return generalResponse(
            res,
            { success: false },
            "Error rejecting invitation",
            false,
            true,
            500
        );
    }
}

/**
 * Get pending invitations for agency
 * POST /api/agency/:agency_id/invitations/pending
 */
async function getPendingInvitations(req, res) {
    try {
        const { agency_id } = req.params;
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

        // Check if user owns this agency
        const agency = await getAgencyById({ id: agency_id });
        if (!agency || agency.user_id !== userId) {
            return generalResponse(
                res,
                {},
                "Only agency owner can view pending invitations",
                false,
                false,
                403
            );
        }

        const sendRequestList = await getAgencyPendingInvitations({
            ref_id: agency_id,
            requester_id: userId,
            status: 0
        });

        const getRequestList = await getAgencyPendingInvitations({
            ref_id: agency_id,
            requester_id: { [Op.ne]: userId },
            status: 0
        });

        return generalResponse(
            res,
            { sendRequests: sendRequestList, getRequests: getRequestList },
            "Pending invitations retrieved",
            true,
            false,
            200
        );
    } catch (error) {
        console.error("Error fetching pending invitations", error);
        return generalResponse(
            res,
            { success: false },
            "Error retrieving pending invitations",
            false,
            true,
            500
        );
    }
}

/**
 * Cancel invitation
 * DELETE /api/agency/invite/:invitation_id
 */
async function cancelInvitation(req, res) {
    try {
        const { invitation_id } = req.params;
        const userId = req.authData?.user_id;

        if (!invitation_id) {
            return generalResponse(
                res,
                {},
                "Invitation ID required",
                false,
                true,
                400
            );
        }

        // Get invitation
        const invitation = await getInvitationById({ id: invitation_id });
        if (!invitation) {
            return generalResponse(
                res,
                {},
                "Invitation not found",
                false,
                false,
                404
            );
        }

        // Check if user owns the agency
        if (invitation.Agency && invitation.Agency.user_id !== userId) {
            return generalResponse(
                res,
                {},
                "Only agency owner can cancel invitations",
                false,
                false,
                403
            );
        }

        // Delete invitation
        await deleteInvitation(invitation_id);

        return generalResponse(
            res,
            {},
            "Invitation cancelled successfully",
            true,
            true,
            200
        );
    } catch (error) {
        console.error("Error cancelling invitation", error);
        return generalResponse(
            res,
            { success: false },
            "Error cancelling invitation",
            false,
            true,
            500
        );
    }
}

module.exports = {
    sendInvitationToHost,
    getMyInvitations,
    actionAgencyInvitation,
    rejectAgencyInvitation,
    getPendingInvitations,
    cancelInvitation
};
