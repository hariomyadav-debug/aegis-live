const { Router } = require("express")

const userRoutes = require("./user.routes");
const socialRoutes = require("./social.routes")
const followRoutes = require("./follow.routes") 
const blockRoutes = require("./block.routes") 
const reportRoutes = require("./report.routes") 
const likeRoutes = require("./like.routes") 
const saveRoutes = require("./saves.routes") 
const commentRoutes = require("./comment.routes") 
const chatRoutes = require("./chat.routes") 
const productRoutes = require("./product.routes") 
const musicRoutes = require("./Music.routes") 
const giftRoutes = require("./gift.routes")
const gameRoutes = require("./game.routes") 
const transactionRoutes = require("./transaction.routes") 
const liveRoutes = require("./live.routes") 
const hashtag_routes = require("./hashtag.routes")
const admin_routes= require("./admin.routes") 
const auth_routes = require('./auth.routes')
const avatar_routes= require("./Avatar.routes") 
const language_routes= require("./Language.routes"); 
const leaderboard_routes= require("./leaderboard.routes"); 
const contribution_routes = require("./contribution.routes");

const store_routes = require("./store.routes");
const level_routes = require('./level.routes');
const vip_routes = require('./vip.routes');
const agency_routes = require('./agency.routes');
const red_envelope_routes = require('./red_envelope.routes');

const { get_Config } = require("../controller/Admin_controller/ProjectConf.controller");
const pkRoutes = require("./pk.routes");

const router = Router();


router.use('/users', userRoutes);
router.use('/social', socialRoutes);
router.use('/follow', followRoutes);
router.use('/block', blockRoutes);
router.use('/report', reportRoutes);
router.use('/like', likeRoutes);
router.use('/save', saveRoutes);
router.use('/comment', commentRoutes);
router.use('/chat', chatRoutes);
router.use('/ecommerce',productRoutes );

router.use("/music" , musicRoutes)
router.use("/gift" , giftRoutes)
router.use("/game" , gameRoutes)
router.use("/transaction", transactionRoutes)
router.use("/leader-board", leaderboard_routes)
router.use("/contribution", contribution_routes)
router.use("/live", liveRoutes )
router.use("/pk", pkRoutes )

router.use("/hashtag", hashtag_routes )

router.use("/avatar", avatar_routes )

router.use("/language", language_routes )
// Admin routes
router.use("/admin", admin_routes )
router.use("/auth", auth_routes )

// Conf routes 
router.get("/project_conf", get_Config)

// New addeding
router.use('/store', store_routes)
router.use('/level', level_routes)
router.use('/vip', vip_routes)
router.use('/agency', agency_routes)
router.use('/red-envelope', red_envelope_routes)

module.exports = router;