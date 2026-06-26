const express = require('express');
const router = express.Router();
const { getBudget, setBudget } = require('../controllers/budgetController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/current', getBudget);
router.post('/', setBudget);

module.exports = router;
