const express = require('express');
const authenticateJWT = require('../middleware/auth');
const AddressController = require('../controllers/addressController');


const router = express.Router();

router.get('/', authenticateJWT, AddressController.getAddresses);
router.post('/', authenticateJWT, AddressController.addAddress);
router.put('/:address_id', authenticateJWT, AddressController.updateAddress);
router.delete('/:address_id', authenticateJWT, AddressController.deleteAddress);

module.exports = router;