module.exports = (sequelize, DataTypes) => {
  const Vip_privilege_type = sequelize.define("Vip_privilege_type", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(100) },
    icon_active: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
      get() {
        const raw_urls = this.getDataValue("icon_active");
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
    icon_inactive: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
      get() {
        const raw_urls = this.getDataValue("icon_inactive");
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
    sort_order: { type: DataTypes.INTEGER },
    created_at: { type: DataTypes.INTEGER },
    status: { type: DataTypes.BOOLEAN, defaultValue: true },
    privilege_category: { type: DataTypes.INTEGER, defaultValue: 1 },
  }, {
    tableName: "Vip_privilege_type",
    timestamps: false,
  });

  Vip_privilege_type.associate = (models) => {
    Vip_privilege_type.hasMany(models.Vip_privilege_mapping, {
      foreignKey: "privilege_id",
      sourceKey: "id",
      as: "pMap",
      onDelete: "CASCADE",
    });
  };

  return Vip_privilege_type;
};
