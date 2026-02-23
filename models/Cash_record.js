module.exports = (sequelize, DataTypes) => {
    const Cash_record = sequelize.define("Cash_record", {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },

        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "User requesting withdrawal"
        },

        amount: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0,
            comment: "Amount to be withdrawn"
        },

        order_number: {
            type: DataTypes.STRING(100),
            allowNull: true,
            unique: true,
            comment: "Unique order/transaction number"
        },

        status: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0,
            comment: "0=pending, 1=approved, 2=rejected, 3=completed, 4=failed"
        },

        type: {
            type: DataTypes.SMALLINT,
            allowNull: true,
            defaultValue: 1,
            comment: "1=bank transfer, 2=wallet, 3=other"
        },

        account_bank: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: "Bank name"
        },

        account: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: "Account number (masked)"
        },

        ifcs: {
            type: DataTypes.STRING(20),
            allowNull: true,
            comment: "IFSC code (India)"
        },

        name: {
            type: DataTypes.STRING(150),
            allowNull: true,
            comment: "Account holder name"
        },

        add_time: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: () => Math.floor(Date.now() / 1000),
            comment: "Epoch time - Request creation time"
        },

        up_time: {
            type: DataTypes.BIGINT,
            allowNull: true,
            comment: "Epoch time - Last update time"
        },

        update_time: {
            type: DataTypes.BIGINT,
            allowNull: true,
            comment: "Alias for up_time"
        },

        uptime: {
            type: DataTypes.BIGINT,
            allowNull: true,
            comment: "Alias for up_time"
        },

        reason: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: "Rejection reason or notes"
        },

        ip: {
            type: DataTypes.STRING(45),
            allowNull: true,
            comment: "Client IP address"
        },

        createdAt: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        },

        updatedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            // defaultValue: sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        }
    }, {
        timestamps: false,
        tableName: "Cash_records"
    });

    Cash_record.associate = function (models) {
        Cash_record.belongsTo(models.User, {
            foreignKey: "user_id",
            as: "user",
            onDelete: "CASCADE"
        });
    };

    return Cash_record;
};
