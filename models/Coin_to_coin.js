module.exports = (sequelize, DataTypes) => {
    const Coin_to_coin = sequelize.define("Coin_to_coin", {
        transaction_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        
        coin: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        success: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
        },

        gift_value:{
            type: DataTypes.INTEGER,
            allowNull: false,   
        },
        quantity:{
            type: DataTypes.INTEGER,
            allowNull: false, 
            defaultValue: 1  
        },

        transaction_ref:{
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",  // live , social pk
        },
        transaction_ref_id:{
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "0",  // live , social , pk
        },
    });
    Coin_to_coin.associate = function (models) {
        Coin_to_coin.belongsTo(models.User, {
            as:"sender",
            foreignKey: "sender_id",
            allowNull: false,
            onDelete: 'CASCADE'
        });
        Coin_to_coin.belongsTo(models.User, {
            as:"reciever",
            foreignKey: "reciever_id",
            allowNull: false,
            onDelete: 'CASCADE'
        });
        Coin_to_coin.belongsTo(models.Gift, {
            foreignKey: "gift_id",
            allowNull: true,
            onDelete: 'CASCADE'
        });
        Coin_to_coin.belongsTo(models.Social, {
            foreignKey: "social_id",
            allowNull: true,
            onDelete: 'CASCADE'
        });
    }
    return Coin_to_coin;
}