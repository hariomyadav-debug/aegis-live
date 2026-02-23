module.exports = (sequelize, DataTypes) => {
    const Transfer_record = sequelize.define("Transfer_record", {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },

        from_user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "Sender user ID"
        },

        to_user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "Recipient user ID"
        },

        agency_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: "Agency ID if agency Transfer_record"
        },

        amount: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0,
            comment: "Amount Transfer_recordred"
        },


        closing: {
            type: DataTypes.BIGINT,
            allowNull: true,
            defaultValue: 0,
            comment: "Closing balance after Transfer_record"
        },

        Balance: {
            type: DataTypes.BIGINT,
            allowNull: true,
            defaultValue: 0,
            comment: "Alias for closing balance"
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: "Transfer_record description/notes"
        },

        status: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 1,
            comment: "0=pending, 1=completed, 2=cancelled, 3=failed"
        },

        add_time: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: () => Date.now().toString(),
            comment: "Epoch time - Record creation time"
        },

        ip: {
            type: DataTypes.STRING(45),
            allowNull: true,
            comment: "Client IP address"
        },

    }, {
        timestamps: false,
        // tableName: "Transfer_records"
    });

    Transfer_record.associate = function (models) {
        Transfer_record.belongsTo(models.User, {
            foreignKey: "from_user_id",
            as: "from_user",
            onDelete: "CASCADE"
        });

        Transfer_record.belongsTo(models.User, {
            foreignKey: "to_user_id",
            as: "to_user",
            onDelete: "CASCADE"
        });

        Transfer_record.belongsTo(models.Agency, {
            foreignKey: "agency_id",
            as: "agency_record",
            onDelete: "CASCADE"
        });
    };

    return Transfer_record;
};
