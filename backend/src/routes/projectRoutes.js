const router = require('express').Router();
const ctrl = require('../controllers/projectController');
const { authenticate, authorize } = require('../middleware/auth');

const ALL_ROLES   = ['ADMIN', 'MANAGING_DIRECTOR', 'PPM_MANAGER', 'SECTOR_FINANCE', 'DESIGN_DIRECTOR', 'CONTRACT_ADMIN_DIRECTOR'];
const WRITE_ROLES = ['ADMIN', 'MANAGING_DIRECTOR', 'PPM_MANAGER'];

router.use(authenticate);
router.get('/',     authorize(...ALL_ROLES),   ctrl.getAll);
router.get('/:id',  authorize(...ALL_ROLES),   ctrl.getById);
router.post('/',    authorize(...WRITE_ROLES), ctrl.create);
router.put('/:id',  authorize(...WRITE_ROLES), ctrl.update);
router.delete('/:id', authorize('ADMIN'),      ctrl.remove);

module.exports = router;
