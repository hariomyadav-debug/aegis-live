module.exports = (sequelize, DataTypes) => {
    const Live = sequelize.define("Live", {
        live_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        total_viewers: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        curent_viewers: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        likes: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        socket_room_id: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 0,
        },
        comments: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        live_title: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
        },
        live_status:{
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "live",
        },
        is_demo:{
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        }
       
    });
    Live.associate = function (models) {
        // Live.belongsTo(models.User, {
        //     foreignKey: "user_id",
        //     defaultValue: 0,
        //     onDelete: 'CASCADE'
        // })
        Live.hasMany(models.Live_host, {
            foreignKey: "live_id",
            defaultValue: 0,
            onDelete: 'CASCADE'
        })
    }
    return Live;
}