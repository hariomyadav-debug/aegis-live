module.exports = (sequelize, DataTypes) => {
    const Level = sequelize.define("Level", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },

        level_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },

        level_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            defaultValue: '',
        },
        level_up: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },

        add_time: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },

        thumb: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: '',
            get() {
                const raw_urls = this.getDataValue("thumb");
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

        colour: {
            type: DataTypes.STRING(20),
            allowNull: true,
            defaultValue: '',
        },

        thumb_mark: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: '',
        },

        bg: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: '',
        },

    },
        {
            tableName: "Levels",
            timestamps: false   // 👈 IMPORTANT
        });

    Level.associate = function (models) {
        // Example association (optional)
        // Level.hasMany(models.User, {
        //     foreignKey: "level_id",
        //     as: "users"
        // });
    };

    return Level;
};
