module.exports = (sequelize, DataTypes) => {
    const Agency_user = sequelize.define("Agency_user", {

        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },

        user_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },

        agency_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },

        add_time: {
            type: DataTypes.STRING, 
            defaultValue: () => Date.now().toString(), 
            Comment: "Epoch time by generated server side"
        },

        up_time: {
            type: DataTypes.STRING, 
            defaultValue: () => Date.now().toString(), 
            Comment: "Epoch time by generated server side"
        },

        reason: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },

        state: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0,
            comment: "0 = pending, 1 = approved, 2 = rejected",
        },

        signout: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0,
        },

        istip: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0,
        },

        signout_reason: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: "",
        },

        signout_istip: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0,
        },

        divide_agency: {
            type: DataTypes.SMALLINT,
            allowNull: true,
            defaultValue: 0,
            comment: "Agency revenue split percentage",
        },

        pre_target_coins: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },

    }, {
        tableName: "Agency_user",
        timestamps: false,          // adds createdAt & updatedAt
        // underscored: true,         // created_at, updated_at
    });

    return Agency_user;
};
