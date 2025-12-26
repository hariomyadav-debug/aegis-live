module.exports = (sequelize, DataTypes) => {
    const Mount = sequelize.define("Mount", {
        mount_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },

        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: "",
        },

        thumb: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: "",
            get() {
                let rawUrl = this.getDataValue("thumb");
                if (rawUrl?.includes("amazonaws.com") || rawUrl?.includes("cloudfront.net") ) {
                    return rawUrl
                }
                let fullUrl =
                    // process.env.baseUrl + ":" + process.env.Port + "/" + rawUrl;
                    process.env.baseUrl + "/" + rawUrl;
                fullUrl == process.env.baseUrl ? "" : fullUrl;
                return fullUrl;
            },
        },

        need_coin: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },

        score: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },

        list_order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },

        words: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        status: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },

        add_time: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    });

    return Mount;
};
