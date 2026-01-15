module.exports = (sequelize, DataTypes) => {
    const Mount_user = sequelize.define("Mount_user", {
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
        mount_id: {
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
        tableName: "Mount_user",
        timestamps: false   // 👈 IMPORTANT
    });

    Mount_user.associate = function (models) {
        // Mount_user.belongsTo(models.User, {
        //     foreignKey: 'user_id',
        //     onDelete: 'CASCADE'
        // });
        Mount_user.belongsTo(models.Mount, {
            foreignKey: 'mount_id',
            targetKey: 'mount_id',
            onDelete: 'CASCADE'
        });
        
    };


    return Mount_user;
};
