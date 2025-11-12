module.exports = (sequelize, DataTypes) => {
    const Media = sequelize.define("Media", {
        media_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        social_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            get() {
                const social_id = this.getDataValue('social_id');
                return social_id === null ? 0 : social_id;
            },
        },

        media_location: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
            get() {
                let rawUrl = this.getDataValue("media_location");
                if (!rawUrl || rawUrl == "") {
                    return "";
                }
                if (rawUrl?.includes("amazonaws.com") || rawUrl?.includes("cloudfront.net")) {
                    return rawUrl
                }
                let fullUrl = process.env.baseUrl + "/" + rawUrl;

                fullUrl == process.env.baseUrl + "/" ? ""
                    : fullUrl;

                return fullUrl;
            },
        }
    })

    Media.associate = function (models) {
        Media.belongsTo(models.Social, {
            foreignKey: "social_id",
            allowNull: false,
            defaultValue: 0,
            onDelete: 'CASCADE'
        })
    }
    return Media
}