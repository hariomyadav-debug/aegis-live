module.exports = (sequelize, DataTypes) => {
    const Pk_battles = sequelize.define("Pk_battles", {

        // Primary Key
        pk_battle_id: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
            comment: "UUID",
        },

        // Host Information
        host1_user_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
            comment: "User ID of Host 1",
        },
        host2_user_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
            comment: "User ID of Host 2",
        },

        host1_live_id: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: "",
            comment: "Live ID of Host 1",
        },
        host2_live_id: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: "",
            comment: "Live ID of Host 2",
        },

        host1_peer_id: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: "",
            comment: "Peer ID of Host 1",
        },
        host2_peer_id: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: "",
            comment: "Peer ID of Host 2",
        },

        host1_socket_room_id: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: "",
        },
        host2_socket_room_id: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: "",
        },

        // Battle Config & Status
        battle_duration: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 60,
            validate: {
                min: 60,
                max: 1200,
            },
            comment: "Duration must be between 60-1200 seconds",
        },
        actual_duration: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: "Duration",
        },
        time_remaining: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0,
            },
        },
        battle_status: {
            type: DataTypes.ENUM("pending", "active", "ended", "cancelled"),
            allowNull: false,
            defaultValue: "pending",
        },

        host1_score_coins: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0 } },
        host2_score_coins: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0 } },

        host1_total_points: { type: DataTypes.FLOAT, defaultValue: 0 },
        host2_total_points: { type: DataTypes.FLOAT, defaultValue: 0 },

        // Result Data
        winner: {
            type: DataTypes.ENUM("host1", "host2", "draw", "cancelled", "pending"),
            allowNull: false,
            defaultValue: "pending",
        },
        cancel_reason: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: "",
        },

        // Timestamps
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        started_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        ended_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    }, {
        timestamps: false,
        indexes: [
            { fields: ["host1_user_id"] },
            { fields: ["host2_user_id"] },
            { fields: ["battle_status"] },
            { fields: ["host1_user_id", "battle_status"] },
            { fields: ["host2_user_id", "battle_status"] },
            { fields: ["host1_live_id"] },
            { fields: ["host2_live_id"] },
            { fields: ["host1_socket_room_id"] },
            { fields: ["host2_socket_room_id"] },
            { fields: ["created_at"] },
        ],
    });

    Pk_battles.associate = function (models) {
        Pk_battles.hasOne(models.Pk_battle_results, {
            foreignKey: "pk_battle_id",
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        });
        Pk_battles.belongsTo(models.User, {
            foreignKey: "host1_user_id",
            as: "host1"
        });

        Pk_battles.belongsTo(models.User, {
            foreignKey: "host2_user_id",
            as: "host2"
        });
    };

    return Pk_battles;
};
