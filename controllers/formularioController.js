// ✅ IMPORTACIÓN CORRECTA - SIN destructuring
const FormularioAfiliacion = require('../models/FormularioAfiliacion');
const { successResponse, errorResponse } = require('../utils/responses');
const { sequelize } = require('../config/database');

console.log('🔄 Cargando formularioController...');
console.log('🔍 FormularioAfiliacion importado:', typeof FormularioAfiliacion);

const crearSolicitud = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      nombre,
      apellido,
      edad,
      tipo_documento,
      numero_documento,
      fecha_nacimiento,
      lugar_nacimiento,
      correo
    } = req.body;

    console.log('📨 Recibiendo solicitud:', req.body);
    console.log('🔍 FormularioAfiliacion en función:', FormularioAfiliacion);

    if (!FormularioAfiliacion) {
      throw new Error('Modelo FormularioAfiliacion no está definido');
    }

    // Verificar si ya existe el documento
    console.log('🔍 Buscando documento existente...');
    const existe = await FormularioAfiliacion.findOne({
      where: { numero_documento },
      transaction
    });

    console.log('🔍 Resultado búsqueda:', existe);

    if (existe) {
      await transaction.rollback();
      return errorResponse(res, 'Ya existe una solicitud con este documento', 409);
    }

    // Crear la solicitud
    console.log('🔍 Creando nueva solicitud...');
    const solicitud = await FormularioAfiliacion.create({
      nombre,
      apellido,
      edad,
      tipo_documento,
      numero_documento,
      fecha_nacimiento,
      lugar_nacimiento,
      correo
    }, { transaction });

    await transaction.commit();

    console.log('✅ Solicitud creada ID:', solicitud.id);

    return successResponse(
      res,
      {
        id: solicitud.id,
        nombre_completo: `${solicitud.nombre} ${solicitud.apellido}`,
        estado: solicitud.estado,
        codigo_solicitud: `SOL${solicitud.id.toString().padStart(6, '0')}`
      },
      'SOLICITUD RECIBIDA - Tu solicitud ha sido registrada exitosamente. Nos contactaremos en 48 horas hábiles.',
      201
    );

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error creando solicitud:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return errorResponse(
        res,
        'Error de validación en los datos',
        422,
        error.errors.map(err => ({
          campo: err.path,
          mensaje: err.message
        }))
      );
    }
    
    return errorResponse(res, 'Error interno del servidor: ' + error.message, 500);
  }
};

module.exports = { crearSolicitud };