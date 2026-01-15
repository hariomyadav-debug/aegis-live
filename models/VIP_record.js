module.exports = (sequelize, DataTypes) => {
  const Vip_record = sequelize.define("Vip_record", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    category: {
      type: DataTypes.ENUM("gift", "recharge", "buy"),
      allowNull: false,
    },
    user_id: { type: DataTypes.INTEGER },
    no_of_days: DataTypes.INTEGER,
    kicked_out: { type: DataTypes.INTEGER, defaultValue: 0 },
    hide_gift: { type: DataTypes.INTEGER, defaultValue: 0 },
    following_room: { type: DataTypes.INTEGER, defaultValue: 0 },
    note: {type: DataTypes.TEXT, allowNull: false, defaultValue: ""},
    vip_id: {type: DataTypes.INTEGER, allowNull: false},
    timestamp: {type: DataTypes.STRING, defaultValue: () => Date.now().toString(), Comment: "Epoch time by generated server side"}
  });

  return Vip_record;
};
