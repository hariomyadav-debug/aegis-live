module.exports = (sequelize, DataTypes) => {
  const Vip_history = sequelize.define("Vip_history", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    add_time: { type: DataTypes.STRING, allowNull: false, defaultValue: () => Date.now().toString() },
    end_time: { type: DataTypes.STRING, allowNull: false, defaultValue: () => Date.now().toString() },
    vipid: { type: DataTypes.INTEGER, allowNull: false },
  }, {
    tableName: "Vip_history",
    timestamps: false,
  });

  return Vip_history;
};
