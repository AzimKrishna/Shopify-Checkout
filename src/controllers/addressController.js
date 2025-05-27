const CustomerService = require('../services/customerService');

class AddressController{
    
    static async addAddress(req, res, next) {
        try {
            const { first_name, last_name, street, city, state, pincode, is_default } = req.body;
            const customer_id = req.customer_id;
            const address = await CustomerService.addAddress(customer_id, {
                first_name,
                last_name,
                street,
                city,
                state,
                pincode,
                is_default
            });
            res.status(201).json({
                message: 'Address added',
                address
            });
        } catch (error) {
            next(error);
        }
    }

    static async updateAddress(req, res, next){
        try {
            const { address_id } = req.params;
            const { first_name, last_name, street, city, state, pincode, is_default } = req.body;
            const customer_id = req.customer_id;
            const address = await CustomerService.updateAddress(customer_id, address_id, {
                first_name,
                last_name,
                street,
                city,
                state,
                pincode,
                is_default
            });
            res.status(200).json({
                message: 'Address updated', address
            });

        } catch (error) {
            next(error);
        }
    }

    static async deleteAddress(req, res, next){
        try {
            const { address_id } = req.params;
            const customer_id = req.customer_id;
            const result = await CustomerService.deleteAddress(customer_id, address_id);
            res.status(200).json(result);
        } catch (error) {   
            next(error);
        }
    }

    static async getAddresses(req, res, next){
        try {
            const customer_id = req.customer_id;
            const addresses = await CustomerService.getAddresses(customer_id);
            res.status(200).json({
                addresses
            });
        } catch (error) {
            next(error);
        }
    }

}

module.exports = AddressController;