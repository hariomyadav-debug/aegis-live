module.exports = (sequelize, DataTypes) => {
    const Exchange_record = sequelize.define("Exchange_record", {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },

        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "User ID performing the exchange"
        },

        coin: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0,
            comment: "Amount of coins received"
        },

        exchange_rate: {
            type: DataTypes.DECIMAL(10, 4),
            allowNull: false,
            defaultValue: 95,
            comment: "Exchange rate used (coins per unit)"
        },

        order_no: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: "Order number for this exchange"
        },

        trade_no: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: "Trade number/reference"
        },

        status: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0,
            comment: "0=pending, 1=completed, 2=cancelled"
        },

        add_time: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: () => Date.now().toString(),
            comment: "Epoch time - Record creation time"
        },

        up_time: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: "Epoch time - Record update time"
        },

    }, {
        timestamps: false,
        tableName: "Exchange_records"
    });

    Exchange_record.associate = function (models) {
        Exchange_record.belongsTo(models.User, {
            foreignKey: "user_id",
            as: "user",
            onDelete: "CASCADE"
        });
    };

    return Exchange_record;
};
