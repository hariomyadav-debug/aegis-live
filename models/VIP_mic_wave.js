module.exports = (sequelize, DataTypes) => {
  const Vip_mic_wave = sequelize.define("Vip_mic_wave", {
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
    name: { type: DataTypes.STRING(100), allowNull: true, },
  }, {
    tableName: "Vip_mic_wave",
    timestamps: false,
  });

  Vip_mic_wave.associate = (models) => {
    Vip_mic_wave.hasMany(models.Vip_level, {
      foreignKey: "mic_wave",
      sourceKey: "id",
      as: "vipLevels",
      onDelete: "CASCADE",
    });
  };

  return Vip_mic_wave;
};
