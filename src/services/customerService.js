const { default: mongoose } = require("mongoose");
const Customer = require("../models/Customer");


class CustomerService{

    static async getCustomer(customer_id){
        if(!mongoose.Types.ObjectId.isValid(customer_id)){
            throw new Error('Invalid customer ID');
        }

        const customer = await Customer.findById(customer_id);
        if(!customer){
            throw new Error('Customer not found');
        }

        return customer;
    }

    static async addAddress(customer_id, addressData){
        try {
            if (!mongoose.Types.ObjectId.isValid(customer_id)) {
                throw new Error('Invalid customer ID');
            }
            const customer = await Customer.findById(customer_id);
            if (!customer) {
                throw new Error('Customer not found');
            }

            const { first_name, last_name, street, city, state, pincode, is_default } = addressData;
            if (!street || !city || !state || !pincode) {
                throw new Error('Missing required address fields');
            }
            if (!/^[0-9]{6}$/.test(pincode)) {
                throw new Error('Invalid pincode format');
            }

            const newAddress = {
                first_name, last_name,
                street,
                city,
                state,
                pincode,
                is_default: is_default || false,
            }

            if(is_default){
                customer.addresses.forEach((addr) => (addr.is_default = false));
            }

            customer.addresses.push(newAddress);
            await customer.save();

            return customer.addresses[customer.addresses.length - 1];
        } catch (err) {
            console.error(`Add address error: ${err.message}`);
            throw err;
        }
    }

    static async updateAddress(customer_id, address_id, addressData){
        try {
            if (!mongoose.Types.ObjectId.isValid(customer_id) || !mongoose.Types.ObjectId.isValid(address_id)) {
                throw new Error('Invalid ID');
            }
            const customer = await Customer.findById(customer_id);
            if (!customer) {
                throw new Error('Customer not found');
            }

            const address = customer.addresses.id(address_id);
            if (!address) {
                throw new Error('Address not found');
            }

            const { first_name, last_name, street, city, state, pincode, is_default } = addressData;
            if (street) address.street = street;
            if (city) address.city = city;
            if (state) address.state = state;
            if (pincode) {
                if (!/^[0-9]{6}$/.test(pincode)) {
                    throw new Error('Invalid pincode format');
                }
                address.pincode = pincode;
            }

            if (is_default !== undefined) {
                if (is_default) {
                    customer.addresses.forEach((addr) => (addr.is_default = false));
                    address.is_default = true;
                } else {
                    address.is_default = false;
                }
            }

            address.updated_at = Date.now();
            await customer.save();
            return address;
        } catch (err) {
            console.error(`Update address error: ${err.message}`);
            throw err;
        }
    }

    static async deleteAddress(customer_id, address_id){
        try {
            if (!mongoose.Types.ObjectId.isValid(customer_id) || !mongoose.Types.ObjectId.isValid(address_id)) {
                throw new Error('Invalid ID');
            }
            const customer = await Customer.findById(customer_id);
            if (!customer) {
                throw new Error('Customer not found');
            }

            const address = customer.addresses.id(address_id);
            if (!address) {
                throw new Error('Address not found');
            }

            customer.addresses.pull(address_id);
            await customer.save();
            return { message: 'Address deleted' };
        } catch (err) {
            console.error(`Delete address error: ${err.message}`);
            throw err;
        }
    }

    static async getAddresses(customer_id) {
        try {
            const customer = await this.getCustomer(customer_id);
            return customer.addresses;
        } catch (err) {
            console.error(`Get addresses error: ${err.message}`);
            throw err;
        }
    }


}

module.exports = CustomerService;