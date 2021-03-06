"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize) => {
  class User extends Sequelize.Model {}
  User.init(
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      emailAddress: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: {
          msg: 'email is already in use'
        },
        validate: {
          isEmail: true
        }
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      
    },
    { sequelize }
  );

  User.associate = (models) => {
    User.hasMany(models.Course, { foreignKey: "userId", allowNull: false });
  };

  return User;
};
