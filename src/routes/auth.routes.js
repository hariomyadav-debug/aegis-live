const express = require('express');
const {authMiddleware} = require('../middleware/authMiddleware');

const { generalResponse } = require('../helper/response.helper');

const router = express.Router();

router.use(authMiddleware)
// No Auth Routes
router.post('/validate-token', (req, res)=>{
    console.log(req.authData, 'ffffffffffffff--------')
     return generalResponse(res, { success: true, data: req.authData }, "User validate successfully", true, true);
});



module.exports = router;