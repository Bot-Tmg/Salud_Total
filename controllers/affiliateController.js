const { Affiliate } = require('../models/Affiliate');
const { successResponse, errorResponse } = require('../utils/responses');
const { sequelize } = require('../config/database');

// Crear nuevo afiliado
const createAffiliate = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      document_type,
      document_number,
      expedition_date,
      first_name,
      last_name,
      email,
      phone,
      birth_date,
      gender,
      address,
      city,
      country,
      profession,
      company,
      salary_range,
      education_level
    } = req.body;

    // Verificar si ya existe el documento
    const existingAffiliate = await Affiliate.findOne({
      where: { document_number },
      transaction
    });

    if (existingAffiliate) {
      await transaction.rollback();
      return errorResponse(
        res,
        'Ya existe un afiliado con este número de documento',
        409
      );
    }

    // Crear el afiliado
    const affiliate = await Affiliate.create({
      document_type,
      document_number,
      expedition_date,
      first_name,
      last_name,
      email,
      phone,
      birth_date,
      gender,
      address,
      city,
      country,
      profession,
      company,
      salary_range,
      education_level,
      status: 'pending'
    }, { transaction });

    await transaction.commit();

    // Éxito
    return successResponse(
      res,
      {
        id: affiliate.id,
        document_number: affiliate.document_number,
        full_name: `${affiliate.first_name} ${affiliate.last_name}`,
        status: affiliate.status,
        affiliate_code: `AF${affiliate.id.toString().padStart(6, '0')}`
      },
      'Afiliado creado exitosamente',
      201
    );

  } catch (error) {
    await transaction.rollback();
    console.error('Error creando afiliado:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return errorResponse(
        res,
        'Error de validación en los datos',
        422,
        error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      );
    }
    
    return errorResponse(res, 'Error interno del servidor', 500);
  }
};

// Obtener todos los afiliados con paginación
const getAllAffiliates = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: affiliates } = await Affiliate.findAndCountAll({
      attributes: [
        'id',
        'document_type',
        'document_number',
        'first_name',
        'last_name',
        'email',
        'phone',
        'status',
        'created_at'
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    return successResponse(res, {
      affiliates,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: count,
        items_per_page: limit,
        has_previous: page > 1,
        has_next: page < totalPages
      }
    }, 'Afiliados obtenidos exitosamente');

  } catch (error) {
    console.error('Error obteniendo afiliados:', error);
    return errorResponse(res, 'Error interno del servidor', 500);
  }
};

// Obtener afiliado por ID
const getAffiliateById = async (req, res) => {
  try {
    const { id } = req.params;

    const affiliate = await Affiliate.findByPk(id, {
      attributes: { exclude: ['updated_at'] }
    });

    if (!affiliate) {
      return errorResponse(res, 'Afiliado no encontrado', 404);
    }

    return successResponse(res, affiliate, 'Afiliado obtenido exitosamente');

  } catch (error) {
    console.error('Error obteniendo afiliado:', error);
    return errorResponse(res, 'Error interno del servidor', 500);
  }
};

// Obtener estadísticas
const getStats = async (req, res) => {
  try {
    const totalAffiliates = await Affiliate.count();
    
    const statusStats = await Affiliate.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const documentTypeStats = await Affiliate.findAll({
      attributes: [
        'document_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['document_type'],
      raw: true
    });

    // Afiliados de los últimos 7 días
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const recentAffiliates = await Affiliate.count({
      where: {
        created_at: {
          [sequelize.Op.gte]: lastWeek
        }
      }
    });

    return successResponse(res, {
      total_affiliates: totalAffiliates,
      status_distribution: statusStats,
      document_type_distribution: documentTypeStats,
      recent_affiliates: recentAffiliates,
      last_updated: new Date().toISOString()
    }, 'Estadísticas obtenidas exitosamente');

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return errorResponse(res, 'Error interno del servidor', 500);
  }
};

module.exports = {
  createAffiliate,
  getAllAffiliates,
  getAffiliateById,
  getStats
};