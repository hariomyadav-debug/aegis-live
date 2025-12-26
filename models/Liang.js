module.exports = (sequelize, DataTypes) => {
    const Liang = sequelize.define("Liang", {
        liang_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },

        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: "",
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },

        need_coin: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },

        score: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },

        list_order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },

        words: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        status: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        state: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },

        buy_time: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    });

    return Liang;
};
