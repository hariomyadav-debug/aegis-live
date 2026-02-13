module.exports = (sequelize, DataTypes) => {
    const Hostinvite = sequelize.define("Hostinvite", {

        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },

        agency_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
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

        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        },

        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
            onUpdate: sequelize.literal('CURRENT_TIMESTAMP'),
        },

    }, {
        timestamps: true,
        tableName: "Hostinvite",
    });

    Hostinvite.associate = function (models) {
        Hostinvite.belongsTo(models.Agency, {
            foreignKey: "agency_id",
            onDelete: "CASCADE"
        });
        Hostinvite.belongsTo(models.User, {
            foreignKey: "user_id",
            onDelete: "CASCADE"
        });
    };

    return Hostinvite;
};
