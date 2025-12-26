module.exports = (sequelize, DataTypes) => {
    const Pk_battle_results = sequelize.define("Pk_battle_results", {

        // Auto Increment Primary Key
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },

        // Foreign Key (link to Pk_battles table)
        pk_battle_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "Pk_battles",
                key: "pk_battle_id",
            },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
            comment: "Refers to Pk_battles.pk_battle_id",
        },

        // Snapshot of Final Scores
        host1_final_coins: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: "Final total points of Host 1",
        },
        host2_final_coins: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: "Final total points of Host 2",
        },

        // Battle Meta
        winner: {
            type: DataTypes.ENUM("host1", "host2", "draw", "cancelled"),
            allowNull: false,
        },
        battle_duration: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: "Duration must be between 60-180 seconds",
        },
        actual_duration: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: "Duration",
        },

        ended_reason: {
            type: DataTypes.ENUM(
                "timer_expired",
                "host_left",
                "manual_end",
                "system_end",
                "unknown"
            ),
            allowNull: false,
            defaultValue: "timer_expired",
            comment: "Why battle ended",
        },

        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },

       ended_at: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: () => Date.now(),
            }
    },
        {
            timestamps: false,
            indexes: [
                { fields: ["winner"] },
                { fields: ["pk_battle_id"] },
                { fields: ["ended_at"] },
            ],
        },

    );

    // Associations
    Pk_battle_results.associate = function (models) {
        Pk_battle_results.belongsTo(models.Pk_battles, {
            foreignKey: "pk_battle_id",
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        });
    };

    return Pk_battle_results;
};
