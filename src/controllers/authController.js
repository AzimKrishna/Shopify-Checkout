const OTPService = require('../services/otpService');
const jwt = require('jsonwebtoken');

class AuthController {
    static async sendOTP(req, res, next){
        try {
            const { phone } = req.body;
            OTPService.validatePhone(phone);
            const otp = OTPService.generateOTP();
            await OTPService.storeOTP(phone, otp);
            // await OTPService.sendOTP(phone, otp);

            res.status(200).json({ message: `OTP sent successfully` });
        } catch (error) {
            next(error);
        }
    }

    static async verifyOTP(req, res, next){
        try{
            const { phone, otp } = req.body;
            OTPService.validatePhone(phone);
            await OTPService.verifyOTP(phone, otp);
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