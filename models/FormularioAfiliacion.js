const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FormularioAfiliacion = sequelize.define('FormularioAfiliacion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  apellido: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  edad: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tipo_documento: {
    type: DataTypes.ENUM('CC', 'CE', 'TI', 'RC'),
    allowNull: false
  },
  numero_documento: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  fecha_nacimiento: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  lugar_nacimiento: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  correo: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'procesando', 'completado'),
    defaultValue: 'pendiente'
  }
}, {
  tableName: 'formulario_afiliaciones',
  timestamps: true
});

// ✅ EXPORTACIÓN CORRECTA
module.exports = FormularioAfiliacion;