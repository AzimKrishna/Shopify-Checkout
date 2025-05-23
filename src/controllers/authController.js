const OTPService = require('../services/otpService');

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
}

module.exports = AuthController;