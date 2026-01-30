module.exports = (sequelize, DataTypes) => {
  const Vip_level = sequelize.define("Vip_level", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    icon: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
      get() {
        const raw_urls = this.getDataValue("icon");
        // If the URL is already an S3 URL, return as-is
        if (raw_urls?.includes(".amazonaws.com/") || raw_urls?.includes(".cloudfront.net/")) {
          return raw_urls;
        }
        const imageUrls = `${process.env.baseUrl}/${raw_urls}`;
        return imageUrls != `${process.env.baseUrl}/`
          ? imageUrls
          : `${process.env.baseUrl}/uploads/not-found-images/profile-image.png`;
      },
    },
    sort: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    info_bg: { type: DataTypes.STRING, allowNull: false, defaultValue: "" },
    bg_image: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
      get() {
        const raw_urls = this.getDataValue("bg_image");
        // If the URL is already an S3 URL, return as-is
        if (raw_urls?.includes(".amazonaws.com/") || raw_urls?.includes(".cloudfront.net/")) {
          return raw_urls;
        }
        const imageUrls = `${process.env.baseUrl}/${raw_urls}`;
        return imageUrls != `${process.env.baseUrl}/`
          ? imageUrls
          : `${process.env.baseUrl}/uploads/not-found-images/profile-image.png`;
      },
    },
    add_time: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: () => Date.now().toString()
    },
    status: { type: DataTypes.BOOLEAN, defaultValue: true },
    noble_icon: DataTypes.INTEGER,
    card_icon: DataTypes.INTEGER,
    entry: DataTypes.INTEGER,
    avatar_icon: DataTypes.INTEGER,
    chat_bubble: DataTypes.INTEGER,
    mic_wave: DataTypes.INTEGER,
    poster: DataTypes.INTEGER,
    bg_color: { type: DataTypes.STRING(50), allowNull: false },
    price_7_days: { type: DataTypes.INTEGER, defaultValue: 0 },
    price_15_days: { type: DataTypes.INTEGER, defaultValue: 0 },
    price_30_days: { type: DataTypes.INTEGER, defaultValue: 0 },
    price_180_days: { type: DataTypes.INTEGER, defaultValue: 0 },
    price_365_days: { type: DataTypes.INTEGER, defaultValue: 0 },
    category: {
      type: DataTypes.ENUM("gift", "recharge", "level", "buy"),
      defaultValue: "gift",
    },
  }, {
    tableName: "Vip_level",
    timestamps: false,
  });

  Vip_level.associate = function (models) {
    Vip_level.belongsTo(models.Vip_avatar_icon, {
      foreignKey: "avatar_icon",
      targetKey: "id",
      as: "avatarIcon",
      onDelete: "CASCADE",
    });

    Vip_level.belongsTo(models.Vip_card_icon, {
      foreignKey: "card_icon",
      targetKey: "id",
      as: "cardIcon",
      onDelete: "CASCADE",
    });

    Vip_level.belongsTo(models.Vip_chat_bubble, {
      foreignKey: "chat_bubble",
      targetKey: "id",
      as: "bubbleIcon",
      onDelete: "CASCADE",
    });
    Vip_level.belongsTo(models.Vip_entry_vehicle, {
      foreignKey: "entry",
      targetKey: "id",
      as: "entryIcon",
      onDelete: "CASCADE",
    });
    

    Vip_level.belongsTo(models.Vip_mic_wave, {
      foreignKey: "mic_wave",
      targetKey: "id",
      as: "micIcon",
      onDelete: "CASCADE",
    });
    Vip_level.belongsTo(models.Vip_noble_icon, {
      foreignKey: "noble_icon",
      targetKey: "id",
      as: "nobleIcon",
      onDelete: "CASCADE",
    });
    Vip_level.belongsTo(models.Vip_poster, {
      foreignKey: "poster",
      targetKey: "id",
      as: "posterIcon",
      onDelete: "CASCADE",
    });
  }

    return Vip_level;
  };
