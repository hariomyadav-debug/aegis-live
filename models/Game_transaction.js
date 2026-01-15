module.exports = (sequelize, DataTypes) => {
    const Game_transaction = sequelize.define("Game_transaction", {
        transaction_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },

        app_id: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue:""
        },

        user_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0
        },

        client_ip: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "0.0.0.0",
        },

        currency_diff: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: "Negative for debit, positive for credit",
        },

        game_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },

        game_round_id: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ""
        },

        order_id: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ""
        },

        room_id: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ""
        },

        extend: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ""
        },

        diff_msg: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
            comment: "bet / win / refund etc",
        },

        timestamp: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0,
            comment: "Game provider timestamp",
        },

        status: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 1, // 1 = active, 0 = inactive
            comment: "0 = pandding, 1 = success, 2 = failed"
        }

    }, {
        tableName: "game_transaction",
        timestamps: true, // adds createdAt & updatedAt
        underscored: true
    });

    Game_transaction.associate = function (models) {

        // If you have User model
        // Game_transaction.belongsTo(models.User, {
        //     foreignKey: "userid",
        //     as: "User",
        //     onDelete: "CASCADE"
        // });

        // Optional: Game master table
        // Game_transaction.belongsTo(models.Game, {
        //     foreignKey: "game_id",
        //     as: "Game",
        //     onDelete: "CASCADE"
        // });

    };

    return Game_transaction;
};
