const axios = require('axios');
const { redisClient } = require('../config/redis');
const Customer = require('../models/Customer');


class OTPService{
    static generateOTP(){
        return Math.floor(10000 + Math.random() * 900000).toString(); 
    }

    static async storeOTP(merchant_id, phone, otp){
        const key = `otp:${merchant_id}:${phone}`;
        await redisClient.setEx(key, 300, otp);
        console.log(`OTP stored for ${phone}, otp:${otp}`);
    }

    static async sendOTP(phone, otp){
        try{
            const response = await axios.post('https://api.textlocal.in/send/', null, {
                params: {
                    apikey: process.env.TEXTLOCAL_API_KEY,
                    numbers: phone,
                    message: `Your OTP is ${otp}. Valid for 5 minutes.`,
                    sender: 'TXTLCL'
                }
            });

            return response.data;
        } catch(error){
            console.error(`Textlocal error for ${phone}`, error.message);
            throw new Error('Failed to send OTP');
        }
    }

    static async verifyOTP(merchant_id, phone, otp){
        const key = `otp:${merchant_id}:${phone}`;
        const storedOTP = await redisClient.get(key);
        if(!storedOTP){
            console.warn(`OTP expired or not found for ${phone}`);
            throw new Error('OTP expired or invalid');
        }
        if(storedOTP !== otp){
            console.warn(`Invalid OTP for ${phone}`);
            throw new Error('Invalid OTP');
        }

        await redisClient.del(key);
        console.log(`OTP verified for ${phone}`);
        return true;
    }

    static validatePhone(phone){
        const regex = /^\+?[1-9]\d{1,14}$/;
        if(!regex.test(phone)){
            throw new Error('Invalid phone number');
        }

    }

    static async upsertCustomer(phone){
        try{
            const customer = await Customer.findOneAndUpdate(
                { phone },
                { phone, updated_at: Date.now() },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            console.log(`Customer upserted: ${phone}`);
            return customer;
        } catch(error){
            console.error(`Customer upsert error for ${phone}: ${err.message}`);
            throw new Error('Failed to upsert customer');
        }
    }
}

module.exports = OTPService;