import 'dotenv/config';
const manu_url = `${process.env.baseUrl}/uploads/home_profiles`;
const baseUrl_Web = `${process.env.baseUrl_aapapi}/appapi/pages`;

export let structuredData = [
    { title: "Level", iconUrl: `${manu_url}/level.png`, launchUrl: `${baseUrl_Web}/level`, type: 1 },
    // { title: "Daily tasks", iconUrl: `${manu_url}/dailytasks.png`, launchUrl: "daily_tasks", type: 1 },
    // { title: "Ranking", iconUrl: `${manu_url}/ranking.png`, launchUrl: "ranking", type: 1 },
    { title: "Store", iconUrl: `${manu_url}/store.png`, launchUrl: `${baseUrl_Web}/props`, type: 1 },
    { title: "Backpack", iconUrl: `${manu_url}/backpack.png`, launchUrl: `${baseUrl_Web}/props/backpack`, type: 1 },
    { title: "VIP", iconUrl: `${manu_url}/vip.png`, launchUrl: `${baseUrl_Web}/vip/vip`, type: 1 },
    // { title: "Family center", iconUrl: `${manu_url}/family.png`, launchUrl: "family_center", type: 1 },
    // { title: "Winning record", iconUrl: `${manu_url}/winrecoard.png`, launchUrl: "winning_record", type: 1 },
    // { title: "Invitaion rewards", iconUrl: `${manu_url}/invitation.png`, launchUrl: "invitation_rewards", type: 1 },
    { title: "Setting", iconUrl: `${manu_url}/setting.png`, launchUrl: `${baseUrl_Web}/settings`, type: 2 },
    // { title: "Room Admin", iconUrl: `${manu_url}/roomadmin.png`, launchUrl: "room_admin", type: 1 },
    // { title: "Help & Feedback", iconUrl: `${manu_url}/help.png`, launchUrl: "help_feedback", type: 2 },
]

export const profile_manu = [
    // {title : "Bank details", iconUrl :"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSg5hmIJwYjTpHQqKB8ytlEqK0V17EpGlTERA&s", launchUrl: "bank_details"},
    // {title : "Wallet", iconUrl :"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSg5hmIJwYjTpHQqKB8ytlEqK0V17EpGlTERA&s", launchUrl: "wallet"},
    // {title : "Coin Histroy", iconUrl :"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSg5hmIJwYjTpHQqKB8ytlEqK0V17EpGlTERA&s", launchUrl: "coin_history"},
    { title: "Post", iconUrl: `${manu_url}/post.png`, launchUrl: "post", type: 1 },
    { title: "Earnings", iconUrl: `${manu_url}/earnings.png`, launchUrl: "earnings", type: 1 },
    { title: "Recharge", iconUrl: `${manu_url}/recharge.png`, launchUrl: "recharge", type: 1 },
    // { title: "Messages", iconUrl: `${manu_url}/message.png`, launchUrl: "message", type: 1 },
    { title: "Live Data", iconUrl: `${manu_url}/livedata.png`, launchUrl: `${baseUrl_Web}/livedata`, type: 1 },
    // { title: "Verify", iconUrl: `${manu_url}/verify.png`, launchUrl: "verify", type: 1 },
]
