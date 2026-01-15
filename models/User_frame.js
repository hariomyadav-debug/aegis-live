module.exports = (sequelize, DataTypes) => {
    const User_frame = sequelize.define("User_frame", {
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
        frame_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
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
        end_time: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
        
    }, {
        tableName: "User_frame",
        timestamps: false   // 👈 IMPORTANT
    });

    return User_frame;
};
