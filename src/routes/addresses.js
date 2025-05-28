const express = require('express');
const authenticateSession = require('../middleware/auth');
const AddressController = require('../controllers/addressController');


const router = express.Router();

router.get('/', authenticateSession, AddressController.getAddresses);
router.post('/', authenticateSession, AddressController.addAddress);
router.put('/:address_id', authenticateSession, AddressController.updateAddress);
router.delete('/:address_id', authenticateSession, AddressController.deleteAddress);

module.exports = router;