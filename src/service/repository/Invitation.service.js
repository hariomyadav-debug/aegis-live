const { raw } = require("mysql2");
const { Hostinvite, Agencyinvite, User, Agency, Agency_user, Role_invite_user, Level } = require("../../../models");
const { Op } = require('sequelize');
const { get } = require("../../routes/agency.routes");
const { getAgencyById } = require("./Agency.service");

/**
 * Create host invitation
 */
async function createHostInvitation(invitationData) {
    try {
        const invitation = await Hostinvite.create(invitationData);
        return invitation;
    } catch (error) {
        console.error('Error creating host invitation:', error);
        throw error;
    }
}

/**
 * Get invitations for user
 */
async function getUserInvitations(wherePayload, pagination = { page: 1, pageSize: 20 }) {
    try {
        let { page, pageSize } = pagination;
        page = Number(page);
        pageSize = Number(pageSize);

        const offset = (page - 1) * pageSize;

        const { rows, count } = await Role_invite_user.findAndCountAll({
            where: wherePayload,
            raw: true,
            // limit: pageSize,
            // offset: offset,
            // order: [['created_at', 'DESC']]
        });
        console.log("Raw invitations: ", rows);

        const updatedRows = await Promise.all(rows.map(async (invitation) => {
            if (invitation.ref_type === "agency") {
                invitation.agency = await getAgencyById({ id: invitation.ref_id });
            }
            return invitation;
        }));

        console.log("Updated invitations with agency details: ", updatedRows);

        return {
            Records: updatedRows,
            Pagination: {
                total_pages: Math.ceil(count / pageSize),
                total_records: Number(count),
                current_page: Number(page),
                records_per_page: Number(pageSize),
            },
        };
    } catch (error) {
        console.error('Error fetching invitations:', error);
        throw error;
    }
}

/**
 * Get invitation by ID
 */
async function getInvitationById(payload) {
    try {
        const invitation = await Role_invite_user.findOne({
            where: payload,
        });
        return invitation;
    } catch (error) {
        console.error('Error fetching invitation:', error);
        throw error;
    }
}

/**
 * Check if pending invitation exists
 */
async function hasPendingInvitation(userId, agencyId, ref_type) {
    try {
        const invitation = await Role_invite_user.findOne({
            where: {
                user_id: userId,
                // ref_id: agencyId,
                // ref_type: ref_type,
                status: 0 // pending
            }
        });
        return invitation;
    } catch (error) {
        console.error('Error checking pending invitation:', error);
        throw error;
    }
}

/**
 * Accept invitation
 */
async function acceptRejectInvitation(whereCondition, updatePayload) {
    try {
        const invitation = await Role_invite_user.update(
            updatePayload,
            { where: whereCondition }
        );
        return invitation;
    } catch (error) {
        console.error('Error accepting invitation:', error);
        throw error;
    }
}

/**
 * Reject invitation
 */
async function rejectInvitation(invitationId) {
    try {
        const invitation = await Hostinvite.update(
            {
                status: 2, // rejected
                action_time: Math.floor(Date.now() / 1000)
            },
            { where: { id: invitationId } }
        );
        return invitation;
    } catch (error) {
        console.error('Error rejecting invitation:', error);
        throw error;
    }
}

/**
 * Check if user is already member of agency
 */
async function isAlreadyMember(userId, agencyId) {
    try {
        const member = await Agency_user.findOne({
            where: {
                user_id: userId,
            }
        });

        const agency = await Agency.findOne({
            where: {
                user_id: userId,
            }
        });

        if(member || agency) {
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error checking membership:', error);
        throw error;
    }
}

/**
 * Send invitation to host
 */
async function sendHostInvitation(agencyId, hostUserId, requester_id, ref_type = "", message = "") {
    try {
        const invitation = await Role_invite_user.create({
            ref_id: agencyId,
            ref_type: ref_type,
            user_id: hostUserId,
            requester_id: requester_id,
            status: 0, // pending
            message: message
        });
        return invitation;
    } catch (error) {
        console.error('Error sending invitation:', error);
        throw error;
    }
}

/**
 * Get pending invitations for agency
 */
async function getAgencyPendingInvitations(wherePayload) {
    try {
        const invitations = await Role_invite_user.findAll({
            where: wherePayload,
            include: [{
                model: User,
                attributes: ['user_id', 'full_name', 'profile_pic', 'consumption']
            }],
            order: [['add_time', 'DESC']]
        });

        const levels = await Level.findAll({
            order: [['level_up', 'ASC']]
        });


        const updatedInvitations = invitations.map(invite => {
            const user = invite.User;

            let userLevel = null;

            for (let lvl of levels) {
                if (user.consumption >= lvl.level_up) {
                    userLevel = lvl;
                } else {
                    break;
                }
            }

            return {
                ...invite.toJSON(),
                User: {
                    ...user.toJSON(),
                    level: userLevel
                }
            };
        });

        return updatedInvitations;
    } catch (error) {
        console.error('Error fetching pending invitations:', error);
        throw error;
    }
}

/**
 * Delete invitation
 */
async function deleteInvitation(invitationId) {
    try {
        const result = await Hostinvite.destroy({
            where: { id: invitationId }
        });
        return result;
    } catch (error) {
        console.error('Error deleting invitation:', error);
        throw error;
    }
}

module.exports = {
    createHostInvitation,
    getUserInvitations,
    getInvitationById,
    hasPendingInvitation,
    acceptRejectInvitation,
    rejectInvitation,
    isAlreadyMember,
    sendHostInvitation,
    getAgencyPendingInvitations,
    deleteInvitation
};
