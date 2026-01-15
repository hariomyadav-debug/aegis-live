module.exports = (sequelize, DataTypes) => {
    const Frame_user = sequelize.define("Frame_user", {
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
        tableName: "Frame_user",
        timestamps: false   // 👈 IMPORTANT
    });

    Frame_user.associate = function (models) {
        Frame_user.belongsTo(models.User, {
            foreignKey: 'user_id',
            onDelete: 'CASCADE'
        });

        Frame_user.belongsTo(models.Frame, {
            foreignKey: 'frame_id',
            targetKey: 'frame_id',
            onDelete: 'CASCADE'
        });
    };


    return Frame_user;
};
