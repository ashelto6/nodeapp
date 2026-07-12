const { Router } = require('express');
const { getHealth } = require('../controllers/health.controller');

// Routes stay thin: they only map paths/methods to controller
// functions. Logic belongs in controllers, never here.
const router = Router();

router.get('/', getHealth);

module.exports = router;
