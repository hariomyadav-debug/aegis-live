module.exports = (sequelize, DataTypes) => {
    const Agency = sequelize.define("Agency", {

        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },

        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },

        name: {
            type: DataTypes.STRING(100),
            allowNull: true,
            defaultValue: "",
        },
        badge: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: "",
            get() {
                const raw_urls = this.getDataValue("badge");
                // If the URL is already an S3 URL, return as-is
                if (raw_urls?.includes(".amazonaws.com/") || raw_urls?.includes(".cloudfront.net/")) {
                    return raw_urls;
                }
                const imageUrls = `${process.env.baseUrl}/${raw_urls}`;
                return imageUrls != `${process.env.baseUrl}/`
                    ? imageUrls
                    : `${process.env.baseUrl}/uploads/not-found-images/profile-image.png`;
            },
        },

        apply_pos: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },

        apply_side: {
            type: DataTypes.STRING(50),
            allowNull: true,
            defaultValue: null,
        },

        briefing: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },

        full_name: {
            type: DataTypes.STRING(150),
            allowNull: true,
            defaultValue: "",
        },

        trading_balance: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0,
        },

        add_time: {
            type: DataTypes.STRING,
            defaultValue: () => Date.now().toString(),
            Comment: "Epoch time by generated server side"
        },

        update_time: {
            type: DataTypes.STRING,
            defaultValue: () => Date.now().toString(),
            Comment: "Epoch time by generated server side"
        },

        state: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0,
            comment: "0=pending, 1=approved, 2=rejected",
        },

        is_seller: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0,
        },

        reason: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },

        senior: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0,
        },

        disable: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },

        divide_agency: {
            type: DataTypes.SMALLINT,
            allowNull: true,
            defaultValue: 0,
        },

        is_tip: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0,
        },

        country: {
            type: DataTypes.STRING(50),
            allowNull: true,
            defaultValue: null,
        },

        whatsapp_number: {
            type: DataTypes.STRING(20),
            allowNull: true,
            defaultValue: null,
        },

    }, {
        // freezeTableName: true,
        timestamps: false,        // using addtime/update_time instead
    });
    Agency.associate = function (models) {
        Agency.belongsTo(models.User, {
            as: "user",              // ✅ changed
            foreignKey: "user_id",   // keep this
            onDelete: "CASCADE"
        });
    };
    return Agency;
};
