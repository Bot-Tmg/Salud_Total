const express = require('express');
const router = express.Router();
const {
  createAffiliate,
  getAllAffiliates,
  getAffiliateById,
  getStats
} = require('../controllers/affiliateController');
const { validateAffiliate, validateSearch } = require('../middleware/validation');

// Rutas de afiliados
router.post('/affiliates', validateAffiliate, createAffiliate);
router.get('/affiliates', getAllAffiliates);
router.get('/affiliates/stats', getStats);
router.get('/affiliates/:id', getAffiliateById);

module.exports = router;