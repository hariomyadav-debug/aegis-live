module.exports = (sequelize, DataTypes) => {
  const Vip_poster = sequelize.define("Vip_poster", {
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
    name: { type: DataTypes.STRING(100) },
  }, {
    tableName: "Vip_poster",
    timestamps: false,
  });

  Vip_poster.associate = (models) => {
    Vip_poster.hasMany(models.Vip_level, {
      foreignKey: "poster",
      sourceKey: "id",
      as: "vipLevels",
      onDelete: "CASCADE",
    });
  };
  return Vip_poster;
};
