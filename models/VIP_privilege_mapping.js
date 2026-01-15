module.exports = (sequelize, DataTypes) => {
  const Vip_privilege_mapping = sequelize.define("Vip_privilege_mapping", {
    id: { 
      type: DataTypes.INTEGER, 
      primaryKey: true, 
      autoIncrement: true 
    },
    vip_level_ids: { 
      type: DataTypes.JSONB, 
      allowNull: true, 
      defaultValue: [], 
      comment: "Array of store vip level ids", 
    },
    privilege_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      defaultValue: 0 

    },
    title: { 
      type: DataTypes.STRING(200), 
      allowNull: false 

    },
    description_img: { 
      type: DataTypes.STRING, 
      allowNull: false, 
      defaultValue: "" 

    },
    description: { 
      type: DataTypes.TEXT, 
      allowNull: false, 
      defaultValue: "" 
      
    },
    vehicle_id: { 
      type: DataTypes.INTEGER, 
      defaultValue: 0 
      
    },
    exp_multiplier: { 
      type: DataTypes.STRING(5), 
      defaultValue: "1" 
      
    },
    status: { 
      type: DataTypes.BOOLEAN, 
      defaultValue: true 
      
    },
    privilege_type: { 
      type: DataTypes.INTEGER, 
      defaultValue: 1 
      
    },
    sort_order: { 
      type: DataTypes.INTEGER, 
      defaultValue: 99 
      
    },
  });

   Vip_privilege_mapping.associate = function (models) {
    Vip_privilege_mapping.belongsTo(models.Vip_privilege_type, {
      foreignKey: "privilege_id",
      targetKey: "id",
      as: "pType",
      onDelete: "CASCADE",
    });
  }

  return Vip_privilege_mapping;
};
