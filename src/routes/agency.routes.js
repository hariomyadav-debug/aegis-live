const express = require('express');
const { authMiddleware, agencyAuthMiddleware} = require('../middleware/authMiddleware');

const agencyController = require('../controller/agency_controller/agency.controller');
const agencyUserController = require('../controller/agency_controller/agency_user.controller');
const agencyOperationsController = require('../controller/agency_controller/agency_operations.controller');
const agencyHostController = require('../controller/agency_controller/agency_host.controller');
const agencyInvitationController = require('../controller/agency_controller/agency_invitation.controller');

const router = express.Router();

// ==================== AGENCY ROUTES ====================

// Public routes (no auth required)
router.post('/list', agencyController.getAgenciesHandler);
// router.get('/:id', agencyController.getAgencyHandler);

// Protected routes (auth required)
router.use(authMiddleware);
router.post('/create', agencyController.createAgencyHandler);
router.post('/search', agencyController.searchAgenciesHandler);
router.get('/home', agencyOperationsController.getAgencyHome);
router.get('/host-agency-home', agencyOperationsController.getAgencyHome);

//  Invitation routes for agency and host
router.post('/invite/send-to-host', agencyInvitationController.sendInvitationToHost);
router.post('/invitations/:agency_id', agencyInvitationController.getPendingInvitations);

router.post('/apply-as-host', agencyHostController.applyAsHost);
router.post('/invite/my-invitations', agencyInvitationController.getMyInvitations);
router.post('/host-dashboard', agencyHostController.getHostDashboard);
router.post('/invite-action', agencyInvitationController.actionAgencyInvitation);
router.post('/members-list', agencyHostController.getTeamMembers);

// wallet operations
router.get('/wallet', agencyOperationsController.getAgencyWallet);

router.post('/exchange', agencyAuthMiddleware, agencyOperationsController.exchangeMoneyForCoins);
router.post('/exchange-history', agencyAuthMiddleware, agencyOperationsController.getExchangeHistoryHandler);

router.post('/transfer', agencyAuthMiddleware, agencyOperationsController.transferMoney);
router.post('/transfer-history', agencyAuthMiddleware, agencyOperationsController.getTransferHistoryHandler);

router.post('/:agency_id/member/:member_id/remove', agencyHostController.removeMember);







// ----------------  Pendding routes ------------------

// Withdrawal operations
router.post('/withdrawal-request', agencyOperationsController.requestWithdrawal);
router.post('/withdrawal-history', agencyOperationsController.getWithdrawalHistoryHandler);

// working on this
// router.post('/invite/:invitation_id/reject', agencyInvitationController.rejectAgencyInvitation);
router.post('/user/:id/approve', agencyUserController.approveAgencyUserHandler);


router.put('/:id', agencyController.updateAgencyHandler);
router.delete('/:id', agencyController.deleteAgencyHandler);
router.post('/:id/approve', agencyController.approveAgencyHandler);
router.post('/:id/reject', agencyController.rejectAgencyHandler);

// ==================== AGENCY OPERATIONS ROUTES ====================

// Agency home and wallet


// Exchange operations


// ==================== AGENCY USER/HOST ROUTES ====================

router.post('/user/create', agencyUserController.createAgencyUserHandler);
router.post('/user/list', agencyUserController.getAgencyUsersHandler);
router.get('/user/:id', agencyUserController.getAgencyUserHandler);
router.put('/user/:id', agencyUserController.updateAgencyUserHandler);
router.delete('/user/:id', agencyUserController.deleteAgencyUserHandler);
router.post('/user/by-agency', agencyUserController.getAgencyUsersByAgencyHandler);
router.post('/user/:id/reject', agencyUserController.rejectAgencyUserHandler);

// ==================== HOST/TEAM MANAGEMENT ROUTES ====================

router.post('/host/dashboard', agencyHostController.getHostDashboard);
router.post('/:agency_id/member/:member_id/stats', agencyHostController.getMemberStats);
router.post('/:agency_id/member/:member_id/commission', agencyHostController.updateMemberCommission);
router.post('/search-available', agencyHostController.searchAvailableAgencies);

// ==================== INVITATION ROUTES ====================

router.delete('/invite/:invitation_id', agencyInvitationController.cancelInvitation);

module.exports = router;
