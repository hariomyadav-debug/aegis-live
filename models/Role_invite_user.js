module.exports = (sequelize, DataTypes) => {
    const Role_invite_user = sequelize.define("Role_invite_user", {

        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },

        ref_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: "ID of the reference (e.g., agency_id, host_id, etc.)",
        },

        ref_type: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "agency",
            comment: "Type of reference (e.g., agency, host, etc.)",
        },

        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },

        message: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },

        status: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0,
            comment: "0 = pending, 1 = accepted, 2 = rejected",
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
        }


    }, {
        timestamps: false,
    });

    Role_invite_user.associate = function (models) {
        Role_invite_user.belongsTo(models.User, {
            foreignKey: "user_id",
            onDelete: "CASCADE"
        });

        Role_invite_user.belongsTo(models.Agency, {
            foreignKey: "ref_id",
            constraints: false,
            as: "agency",
            onDelete: "CASCADE"
        });

    };

    return Role_invite_user;
};
