    require('dotenv').config()
    const bannerData = [
        {
            id: 1,
            image: `${process.env.baseUrl}/uploads/banner/aegislive-welcome.png`,
            name: "Item One",
            type: "webview",
            url: "https://www.google.com/"
        },
        {
            id: 2,
            image: `${process.env.baseUrl}/uploads/banner/rules-regulations.png`,
            name: "Item Two",
            type: "intent",
            intent: "phone",
            value: "+919755872746"
        },
        {
            id: 3,
            image: `${process.env.baseUrl}/uploads/banner/top_leaderboard.png`,
            name: "Item Three",
            type: "intent",
            intent: "stream",
            value: ""
        }
    ];


    module.exports = bannerData;