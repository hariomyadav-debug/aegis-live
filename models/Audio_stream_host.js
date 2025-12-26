module.exports = (sequelize, DataTypes) => {
    const Audio_stream_host = sequelize.define("Audio_stream_host", {
        stream_host_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        is_stream: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        is_main_host: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        peer_id: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 0,
        },
        stream_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        is_muted: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        seat_number: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        start_time: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0,
        },

        stop_time: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0,
        },

    });
    Audio_stream_host.associate = function (models) {
        Audio_stream_host.belongsTo(models.User, {
            foreignKey: "user_id",
            defaultValue: 0,
            onDelete: 'CASCADE'
        })
        Audio_stream_host.belongsTo(models.Audio_stream, {
            foreignKey: "stream_id",
            defaultValue: 0,
            onDelete: 'CASCADE'
        })
    }
    return Audio_stream_host;
}