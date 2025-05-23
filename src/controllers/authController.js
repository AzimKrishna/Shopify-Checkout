const OTPService = require('../services/otpService');
const jwt = require('jsonwebtoken');

class AuthController {
    static async sendOTP(req, res, next){
        try {
            const { merchant_id, phone } = req.body;
            if (!merchant_id) {
                throw new Error('Merchant ID is required');
            }
            OTPService.validatePhone(phone);
            const otp = OTPService.generateOTP();
            await OTPService.storeOTP(merchant_id, phone, otp);
            // await OTPService.sendOTP(phone, otp);

            res.status(200).json({ message: `OTP sent successfully` });
        } catch (error) {
            next(error);
        }
    }

    static async verifyOTP(req, res, next){
        try{
            const { merchant_id, phone, otp } = req.body;
            if (!merchant_id) {
                throw new Error('Merchant ID is required');
            }
            OTPService.validatePhone(phone);
            await OTPService.verifyOTP(merchant_id, phone, otp);
            const customer = await OTPService.upsertCustomer(phone);
            const token = jwt.sign(
                { customer_id: customer._id, role: 'customer' },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );
            console.log(`JWT issued for ${phone}`);
            res.status(200).json({ message: 'OTP verified', token });
        } catch(err){
            next(err);
        }
    }
}

module.exports = AuthController;