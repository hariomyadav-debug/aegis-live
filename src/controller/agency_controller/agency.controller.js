const { generalResponse } = require("../../helper/response.helper");
const {
    createAgency,
    getAgencies,
    getAgencyById,
    getAgency,
    updateAgency,
    deleteAgency,
    countAgencies,
    searchAgencies
} = require("../../service/repository/Agency.service");
const { User } = require("../../../models");

/**
 * Create a new Agency
 * POST /api/agency/create
 */
async function createAgencyHandler(req, res) {
    try {
        const { name, full_name, badge, trading_balance, country, whatsapp_number, briefing, user_id } = req.body;

        const isAgency = await getAgencies({ user_id: user_id });
        if (isAgency.Records.length > 0) {
            return generalResponse(
                res,
                {},
                "User already has an agency",
                false,
                true,
                400
            );
        }
        const user = await User.findOne({ where: { id: user_id } });
        if (!user) {
            return generalResponse(

                res,
                {},
                "User not found",
                false,
                true,
                404
            );
        }

        // Validate required fields
        if (!name || !full_name) {
            return generalResponse(
                res,
                {},
                "Name and Full Name are required",
                false,
                true,
                400
            );
        }

        // req.files might be an array (legacy 'files') or an object with named fields (upload.fields)
        const uploadedFiles = req.files || {};

        const agencyPayload = {
            user_id: user_id || req.authData?.user_id || 0,
            name,
            full_name,
            badge: badge || "",
            trading_balance: trading_balance || 0,
            country: country || null,
            whatsapp_number: whatsapp_number || null,
            briefing: briefing || null,
            add_time: Date.now().toString(),
            update_time: Date.now().toString(),
            state: 0  // pending state
        };

        // If files were uploaded (via middleware), attach them.
        // When using named fields (id_front, id_back, agency_pic) the upload middleware
        // will provide req.files as an object with arrays under those keys.
        try {
            const filesObj = uploadedFiles;

            const normalizeFilePath = (file) => {
                if (!file) return null;
                // common multer/diskStorage properties
                if (file.path) return file.path;
                if (file.location) return file.location; // e.g., s3
                if (file.destination && file.filename) {
                    // ensure forward slashes
                    return `${file.destination.replace(/\\\\/g, '/')}/${file.filename}`;
                }
                if (file.filename) return `uploads/${file.filename}`;
                return null;
            };

            // legacy array form (req.files replaced to an array)
            if (Array.isArray(filesObj) && filesObj.length > 0) {
                const firstPath = normalizeFilePath(filesObj[0]);
                if (firstPath) agencyPayload.badge = firstPath;
                if (filesObj.length > 1) {
                    const attachments = filesObj.slice(1).map(f => normalizeFilePath(f)).filter(Boolean);
                    if (attachments.length > 0) agencyPayload.briefing = JSON.stringify({ text: agencyPayload.briefing || null, attachments });
                }
            } else if (filesObj && typeof filesObj === "object") {
                const getFirst = (key) => normalizeFilePath(filesObj[key]?.[0]);

                const agencyPicPath = getFirst('agency_pic') || getFirst('picture') || getFirst('files');
                const idFrontPath = getFirst('id_front') || getFirst('idFront') || getFirst('idfront');
                const idBackPath = getFirst('id_back') || getFirst('idBack') || getFirst('idback');

                if (agencyPicPath) agencyPayload.badge = agencyPicPath;

                const attachments = [idFrontPath, idBackPath].filter(Boolean);
                if (attachments.length > 0) agencyPayload.briefing = JSON.stringify({ text: agencyPayload.briefing || null, attachments });
            }
        } catch (e) {
            // ignore file attach errors
        }

        const newAgency = await createAgency(agencyPayload);

        return generalResponse(
            res,
            newAgency,
            "Agency created successfully",
            true,
            true,
            201
        );
    } catch (error) {
        console.error("Error in creating agency", error);
        return generalResponse(
            res,
            { success: false },
            "Error creating agency",
            false,
            true,
            500
        );
    }
}

/**
 * Get all agencies with pagination and filters
 * POST /api/agency/list
 */
async function getAgenciesHandler(req, res) {
    try {
        const { page = 1, pageSize = 10, state, user_id, country } = req.body;

        const filterPayload = {};
        if (state !== undefined && state !== null) {
            filterPayload.state = state;
        }
        if (user_id !== undefined && user_id !== null) {
            filterPayload.user_id = user_id;
        }
        if (country) {
            filterPayload.country = country;
        }

        const agencies = await getAgencies(filterPayload, [], { page, pageSize });

        if (agencies.Pagination.total_records === 0) {
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
                "No agencies found",
                true,
                false,
                200
            );
        }

        return generalResponse(
            res,
            agencies,
            "Agencies retrieved successfully",
            true,
            false,
            200
        );
    } catch (error) {
        console.error("Error in fetching agencies", error);
        return generalResponse(
            res,
            { success: false },
            "Error fetching agencies",
            false,
            true,
            500
        );
    }
}

/**
 * Get agency by ID
 * GET /api/agency/:id
 */
async function getAgencyHandler(req, res) {
    try {
        const { id } = req.params;

        if (!id) {
            return generalResponse(
                res,
                {},
                "Agency ID is required",
                false,
                true,
                400
            );
        }

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

        return generalResponse(
            res,
            agency,
            "Agency retrieved successfully",
            true,
            false,
            200
        );
    } catch (error) {
        console.error("Error in fetching agency", error);
        return generalResponse(
            res,
            { success: false },
            "Error fetching agency",
            false,
            true,
            500
        );
    }
}

/**
 * Update agency
 * PUT /api/agency/:id
 */
async function updateAgencyHandler(req, res) {
    try {
        const { id } = req.params;
        const { name, full_name, badge, trading_balance, country, whatsapp_number, briefing, state, is_seller, senior, disable } = req.body;

        if (!id) {
            return generalResponse(
                res,
                {},
                "Agency ID is required",
                false,
                true,
                400
            );
        }

        // Check if agency exists
        const existingAgency = await getAgencyById({id: id});
        if (!existingAgency) {
            return generalResponse(
                res,
                {},
                "Agency not found",
                false,
                false,
                404
            );
        }

        const updatePayload = {
            update_time: Date.now().toString()
        };

        if (name !== undefined) updatePayload.name = name;
        if (full_name !== undefined) updatePayload.full_name = full_name;
        if (badge !== undefined) updatePayload.badge = badge;
        if (trading_balance !== undefined) updatePayload.trading_balance = trading_balance;
        if (country !== undefined) updatePayload.country = country;
        if (whatsapp_number !== undefined) updatePayload.whatsapp_number = whatsapp_number;
        if (briefing !== undefined) updatePayload.briefing = briefing;
        if (state !== undefined) updatePayload.state = state;
        if (is_seller !== undefined) updatePayload.is_seller = is_seller;
        if (senior !== undefined) updatePayload.senior = senior;
        if (disable !== undefined) updatePayload.disable = disable;

        const updated = await updateAgency(updatePayload, { id });

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

        const updatedAgency = await getAgencyById({id: id});

        return generalResponse(
            res,
            updatedAgency,
            "Agency updated successfully",
            true,
            true,
            200
        );
    } catch (error) {
        console.error("Error in updating agency", error);
        return generalResponse(
            res,
            { success: false },
            "Error updating agency",
            false,
            true,
            500
        );
    }
}

/**
 * Delete agency
 * DELETE /api/agency/:id
 */
async function deleteAgencyHandler(req, res) {
    try {
        const { id } = req.params;

        if (!id) {
            return generalResponse(
                res,
                {},
                "Agency ID is required",
                false,
                true,
                400
            );
        }

        // Check if agency exists
        const existingAgency = await getAgencyById(id);
        if (!existingAgency) {
            return generalResponse(
                res,
                {},
                "Agency not found",
                false,
                false,
                404
            );
        }

        await deleteAgency({ id });

        return generalResponse(
            res,
            {},
            "Agency deleted successfully",
            true,
            true,
            200
        );
    } catch (error) {
        console.error("Error in deleting agency", error);
        return generalResponse(
            res,
            { success: false },
            "Error deleting agency",
            false,
            true,
            500
        );
    }
}

/**
 * Search agencies
 * POST /api/agency/search
 */
async function searchAgenciesHandler(req, res) {
    try {
        const { searchTerm, page = 1, pageSize = 10 } = req.body;

        if (!searchTerm) {
            return generalResponse(
                res,
                {},
                "Search term is required",
                false,
                true,
                400
            );
        }
        console.log("searchAgenciesHandler searchTerm:", searchTerm, page, pageSize);

        const searchPayload = {
            searchTerm: searchTerm.trim(),
            isNumeric: !isNaN(searchTerm.trim())
        };

        const agencies = await searchAgencies(searchPayload, { page, pageSize });

        if (agencies.Pagination.total_records === 0) {
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
                "No agencies found",
                true,
                false,
                200
            );
        }

        return generalResponse(
            res,
            agencies,
            "Agencies found",
            true,
            false,
            200
        );
    } catch (error) {
        console.error("Error in searching agencies", error);
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

/**
 * Approve agency
 * POST /api/agency/:id/approve
 */
async function approveAgencyHandler(req, res) {
    try {
        const { reason, id: agencyid } = req.body || { reason: "Approved by admin", id: null };

        if (!agencyid) {
            return generalResponse(
                res,
                {},
                "Agency ID is required",
                false,
                true,
                400
            );
        }

        const agency = await getAgencyById({id: agencyid, state: 0}); // only pending agencies can be approved
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

        const updated = await updateAgency(
            {
                state: 2,  // approved
                reason: reason || null,
                update_time: Date.now().toString()
            },
            { id: agencyid }
        );

        const updatedAgency = await getAgencyById({id: agencyid});

        return generalResponse(
            res,
            updatedAgency,
            "Agency approved successfully",
            true,
            true,
            200
        );
    } catch (error) {
        console.error("Error in approving agency", error);
        return generalResponse(
            res,
            { success: false },
            "Error approving agency",
            false,
            true,
            500
        );
    }
}

/**
 * Reject agency
 * POST /api/agency/:id/reject
 */
async function rejectAgencyHandler(req, res) {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!id) {
            return generalResponse(
                res,
                {},
                "Agency ID is required",
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

        const agency = await getAgencyById({id: id});
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

        const updated = await updateAgency(
            {
                state: 2,  // rejected
                reason: reason,
                update_time: Date.now().toString()
            },
            { id }
        );

        const updatedAgency = await getAgencyById({id: id});

        return generalResponse(
            res,
            updatedAgency,
            "Agency rejected successfully",
            true,
            true,
            200
        );
    } catch (error) {
        console.error("Error in rejecting agency", error);
        return generalResponse(
            res,
            { success: false },
            "Error rejecting agency",
            false,
            true,
            500
        );
    }
}

module.exports = {
    createAgencyHandler,
    getAgenciesHandler,
    getAgencyHandler,
    updateAgencyHandler,
    deleteAgencyHandler,
    searchAgenciesHandler,
    approveAgencyHandler,
    rejectAgencyHandler
};
