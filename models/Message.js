module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define("Message", {
    message_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    message_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message_content: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const message_type = this.getDataValue("message_type");
        const raw_urls = this.getDataValue("message_content");
        if (
          message_type == "image" ||
          message_type == "video" ||
          message_type == "gif" ||
          message_type == "doc"
        ) {
          if (raw_urls?.includes("amazonaws.com") || raw_urls?.includes("cloudfront.net")) {
            return raw_urls
          }
          const imageUrls = `${process.env.baseUrl}/${raw_urls}`;
          
          return imageUrls != process.env.baseUrl
            ? imageUrls
            : `${process.env.baseUrl}uploads/not-found-images/group-image.png`;
        }
        else {
          return this.getDataValue("message_content");
        }
      },
    },
    message_thumbnail: {
      type: DataTypes.TEXT,
      defaultValue: "",
      allowNull: false,
      get() {
        const message_type = this.getDataValue("message_type");
        const raw_urls = this.getDataValue("message_thumbnail");
        if (message_type == "video") {
          if (raw_urls?.includes("amazonaws.com") || raw_urls?.includes("cloudfront.net")) {
            return raw_urls
          }
          const imageUrls = `${process.env.baseUrl}/${raw_urls}`;
          return imageUrls != `${process.env.baseUrl}/`
            ? imageUrls
            : `${process.env.baseUrl}uploads/not-found-images/group-image.png`;
        }
      }
    },
    message_length: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    message_seen_status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "sent",
    },
    message_size: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    reply_to: {
      type: DataTypes.INTEGER,
      allowNull: true, // Allow null for messages that are not replies
      onDelete: "CASCADE", // Optional: Delete replies if the parent message is deleted
      get() {
        const reply = this.getDataValue("reply_to");
        if (reply === null) {
          return 0;
        }
      },
    },
    social_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Allow null for messages that are not replies
      onDelete: "CASCADE", // Optional: Delete replies if the parent message is deleted
      get() {
        const social = this.getDataValue("social_id");
        if (social === null) {
          return 0;
        }
      },
    },
    deleted_for: {
      type: DataTypes.ARRAY(DataTypes.DECIMAL),
      allowNull: true,
      defaultValue: [], // Array of user_ids who deleted the message
    },
    deleted_for_everyone: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
  });

  // sender_id
  // chat_id
  // socila_id
  Message.associate = (models) => {
    Message.hasMany(models.Message, {
      as: "ParentMessage",
      foreignKey: "reply_to",
    });
    Message.belongsTo(models.User, {
      foreignKey: "sender_id",
      allowNull: true,
      defaultValue: 0,
      onDelete: "CASCADE",
    });
    Message.belongsTo(models.Chat, {
      foreignKey: "chat_id",
      allowNull: true,
      defaultValue: 0,
      onDelete: "CASCADE",
    });
    Message.belongsTo(models.Social, {
      foreignKey: "social_id",
      allowNull: true,
      defaultValue: 0,
      onDelete: "CASCADE",
    });

    Message.hasMany(models.Message, {
      as: "Replies",
      foreignKey: "reply_to",
    });
    Message.hasMany(models.Message_seen, {
      foreignKey: "message_id",
      onDelete: "CASCADE",

    });
  };

  return Message;
};
