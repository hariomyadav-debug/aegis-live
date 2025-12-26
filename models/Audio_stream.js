module.exports = (sequelize, DataTypes) => {
    const Audio_stream = sequelize.define("Audio_stream", {
        stream_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        start_time: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0,
            comment: "Start time (timestamp)",
        },
         stream_title: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
        },
        thumb: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
            comment: "Thumbnail image",
        },
        type: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0,
            comment: "Live type",
        },
        live_status:{
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "live",
            comment: "Live status ( stopped and live)",
        },
        isaudio: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0,
            comment: "(0 = no, 1 = yes)",
        },
        hotvotes: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: "Total hot gift amount",
        },
        ismic: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0,
            comment: "Mic connection switch (0 = off, 1 = on)",
        },
        device_info: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
            comment: "Device information",
        },
        off_time: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0,
            comment: "Disconnection time",
        },
        total_seat: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 8,
            comment: "Number of seats in chat room",
        },
        user_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: "Number of joined in chat room",
        },
        seat_map: {
            type: DataTypes.JSON,
            allowNull: true, // Change this
            defaultValue: [], // Prevent null issue
            comment: "Array of seats with availability",
        },
        background: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
            comment: "Background image",
        },
        gift_totalcoin: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0,
            comment: "Total gift coins received",
        },
        gift_user_total: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: "Total number of users who sent gifts",
        },
        voice_type: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0,
            comment: "Chat room type (0 = voice, 1 = video)",
        },
        sw_player_status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
            comment: "Agora cloud player status",
        },
        sw_player_id: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
            comment: "Agora cloud player ID",
        },
        socket_stream_room_id: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
        },
        comments: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        is_demo:{
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        }
       
    });
    Audio_stream.addHook("beforeCreate", (stream) => {
        stream.seat_map = Array.from({ length: stream.total_seat }, (_, i) => ({
            seat: i + 1,
            available: i !== 0
        }));
    });

    Audio_stream.associate = function (models) {
        Audio_stream.belongsTo(models.User, {
            foreignKey: "user_id",
            defaultValue: 0,
            onDelete: 'CASCADE'
        })
        Audio_stream.hasMany(models.Audio_stream_host, {
            foreignKey: "stream_id",
            defaultValue: 0,
            onDelete: 'CASCADE'
        })
    }
    return Audio_stream;
}