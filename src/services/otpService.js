const axios = require('axios');
const { redisClient } = require('../config/redis');


class OTPService{
    static generateOTP(){
        return Math.floor(10000 + Math.random() * 900000).toString(); 
    }

    static async storeOTP(phone, otp){
        const key = `otp:${phone}`;
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

    static validatePhone(phone){
        const regex = /^\+?[1-9]\d{1,14}$/;
        if(!regex.test(phone)){
            throw new Error('Invalid phone number');
        }

    }
}

module.exports = OTPService;