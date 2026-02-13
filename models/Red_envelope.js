module.exports = (sequelize, DataTypes) => {
    const Red_envelope = sequelize.define("Red_envelope", {

        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        show_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0,
            comment: "ID of the live show or stream associated with this red envelope"
        },

        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            references: {
                model: 'Users',
                key: 'user_id'
            }
        },

    
        ref_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
            comment: "ID of the referenced entity (e.g., stream ID, PK battle ID)"
        },

         ref_type: {
            type: DataTypes.STRING(50),
            allowNull: true,
            defaultValue: null,
            comment: "Stream, live, PK battle, etc."
        },

        type: {
            type: DataTypes.STRING(50),
            allowNull: true,
            defaultValue: null,
            comment: "Type of red envelope (normal, lucky, etc.)"
        },

        type_grant: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0,
            comment: "Type grant/permission level"
        },

        coin: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0,
            comment: "Total coins in red envelope"
        },

        nums: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            comment: "Number of red envelopes/portions"
        },

        des: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: "Congratulations on getting rich and good luck!",
            comment: "Description or message with red envelope"
        },

        effect_time: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: "Duration in seconds"
        },

        add_time: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: () => Date.now().toString(),
            comment: "Epoch time when red envelope was created"
        },

        status: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0,
            comment: "0 = available, 1 = claimed, 2 = expired, 3 = cancelled"
        },

        coin_rob: {
            type: DataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0,
            comment: "Total coins claimed/robbed from red envelope"
        },

        nums_rob: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: "Number of red envelopes claimed/robbed"
        },

    }, {
        tableName: "Red_envelope",
        timestamps: false,
    });

    Red_envelope.associate = function (models) {
        Red_envelope.belongsTo(models.User, {
            foreignKey: "user_id",
            onDelete: "CASCADE" 
        });
         Red_envelope.hasMany(models.Red_envelope_record, {
            foreignKey: "envelope_id",
            onDelete: "CASCADE"
        });
    };

    return Red_envelope;
};
