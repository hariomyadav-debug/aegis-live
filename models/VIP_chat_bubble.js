module.exports = (sequelize, DataTypes) => {
  const Vip_chat_bubble = sequelize.define("Vip_chat_bubble", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
      get() {
        const raw_urls = this.getDataValue("address");
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
    name: { type: DataTypes.STRING(50) },
  }, {
    tableName: "Vip_chat_bubble",
    timestamps: false,
  });

  Vip_chat_bubble.associate = (models) => {
    Vip_chat_bubble.hasMany(models.Vip_level, {
      foreignKey: "chat_bubble",
      sourceKey: "id",
      as: "vipLevels",
      onDelete: "CASCADE",
    });
  };

  return Vip_chat_bubble;
};
