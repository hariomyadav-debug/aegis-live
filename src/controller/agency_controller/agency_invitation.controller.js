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

/**
 * Send invitation to host to join agency
 * POST /api/agency/invite/send-to-host
 */
async function sendInvitationToHost(req, res) {
    try {
        const { agency_id, host_user_id, message } = req.body;
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
        const agency = await getAgencyById( {id: agency_id});
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

        // Check if host exists
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
        if (isMember) {
            return generalResponse(
                res,
                {},
                "User is already a member of the agency",
                false,
                true,
                400
            );
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
        const invitation = await sendHostInvitation(agency_id,  host_user_id, "agency", message);

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

        const invitations = await getUserInvitations(userId, "Agency", { page, pageSize });

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
async function acceptAgencyInvitation(req, res) {
    try {
        const { invitation_id, action } = req.params;
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

        // Accept invitation
        await acceptRejectInvitation({status: 1, action_time: Date.now()} ,{id: invitation_id});

        // Create agency user record
        const agencyUser = await createAgencyUser({
            user_id: userId,
            agency_id: invitation.agency_id,
            state: 1, // approved
            add_time: Math.floor(Date.now() / 1000),
            up_time: Math.floor(Date.now() / 1000)
        });

        const updatedInvitation = await getInvitationById({ id: invitation_id });

        return generalResponse(
            res,
            {
                invitation: updatedInvitation,
                agency_user: agencyUser
            },
            "Invitation accepted successfully",
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
        const agency = await getAgencyById({id: agency_id});
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

        const invitations = await getAgencyPendingInvitations(agency_id);

        return generalResponse(
            res,
            { invitations: invitations },
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
    acceptAgencyInvitation,
    rejectAgencyInvitation,
    getPendingInvitations,
    cancelInvitation
};
