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
    allowNull: false,
    validate: {
      notNull: { msg: 'El nombre es requerido' },
      notEmpty: { msg: 'El nombre no puede estar vacío' },
      len: {
        args: [2, 100],
        msg: 'El nombre debe tener entre 2 y 100 caracteres'
      }
    }
  },
  apellido: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notNull: { msg: 'El apellido es requerido' },
      notEmpty: { msg: 'El apellido no puede estar vacío' },
      len: {
        args: [2, 100],
        msg: 'El apellido debe tener entre 2 y 100 caracteres'
      }
    }
  },
  edad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: { msg: 'La edad es requerida' },
      min: {
        args: [0],
        msg: 'La edad no puede ser menor a 0'
      },
      max: {
        args: [120],
        msg: 'La edad no puede ser mayor a 120'
      }
    }
  },
  tipo_documento: {
    type: DataTypes.ENUM('CC', 'CE', 'TI', 'RC'),
    allowNull: false,
    validate: {
      notNull: { msg: 'El tipo de documento es requerido' },
      isIn: {
        args: [['CC', 'CE', 'TI', 'RC']],
        msg: 'Tipo de documento no válido'
      }
    }
  },
  numero_documento: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: {
      name: 'numero_documento_unique',
      msg: 'Ya existe una solicitud con este número de documento'
    },
    validate: {
      notNull: { msg: 'El número de documento es requerido' },
      notEmpty: { msg: 'El número de documento no puede estar vacío' },
      len: {
        args: [3, 20],
        msg: 'El número de documento debe tener entre 3 y 20 caracteres'
      }
    }
  },
  fecha_nacimiento: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notNull: { msg: 'La fecha de nacimiento es requerida' },
      isDate: { msg: 'La fecha de nacimiento debe ser válida' }
    }
  },
  lugar_nacimiento: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: {
      notNull: { msg: 'El lugar de nacimiento es requerido' },
      notEmpty: { msg: 'El lugar de nacimiento no puede estar vacío' },
      len: {
        args: [2, 150],
        msg: 'El lugar de nacimiento debe tener entre 2 y 150 caracteres'
      }
    }
  },
  correo: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: {
      notNull: { msg: 'El correo es requerido' },
      isEmail: { msg: 'Debe proporcionar un correo válido' }
    }
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'procesando', 'completado'),
    defaultValue: 'pendiente'
  }
}, {
  tableName: 'formulario_afiliaciones',
  indexes: [
    {
      unique: true,
      fields: ['numero_documento']
    },
    {
      fields: ['estado']
    },
    {
      fields: ['created_at']
    }
  ]
});

module.exports = FormularioAfiliacion;