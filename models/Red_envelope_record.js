module.exports = (sequelize, DataTypes) => {
    const Red_envelope_record = sequelize.define("Red_envelope_record", {

        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },

        envelope_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0,
            comment: "Red envelope ID"
        },

        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: "Reciever user ID"
        },

        coin: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0,
            comment: "Coins claimed in this record"
        },

        addtime: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: () => Date.now().toString(),
            comment: "Epoch time when claimed"
        },

    }, {
        tableName: "Red_envelope_record",
        timestamps: false,
    });

    Red_envelope_record.associate = function (models) {
        Red_envelope_record.belongsTo(models.Red_envelope, {
            foreignKey: "envelope_id",
            onDelete: "CASCADE"
        });
        Red_envelope_record.belongsTo(models.User, {
            foreignKey: "user_id",
            onDelete: "CASCADE"
        });
    };

    return Red_envelope_record;
};
