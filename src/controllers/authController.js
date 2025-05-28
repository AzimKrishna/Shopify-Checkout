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

            const userPayload = { customer_id: customer._id, role: 'customer', phone: customer.phone };

            const authTokenForSdk = jwt.sign(
                userPayload,
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            const sessionToken = jwt.sign(
                userPayload,
                process.env.JWT_SESSION_SECRET || process.env.JWT_SECRET,
                { expiresIn: '30d' }
            );

            // This cookie will be set on your backend's domain.
            // The iframe (from the same backend domain) can then communicate this token
            // to its own JavaScript context to store it in its localStorage or a non-HttpOnly cookie if needed.
            res.cookie('session_token', sessionToken, {
                httpOnly: true,
                // secure: process.env.NODE_ENV === 'production', // True in production
                secure: true,
                sameSite: 'None',
                maxAge: 30 * 24 * 60 * 60 * 1000, // 7 days
                path: '/', // Make it available across your domain
                domain: '.serveo.net' // IMPORTANT for cross-subdomain if needed
            });

            res.status(200).json({
                message: 'OTP verified successfully. Session established.',
                // This sdk_token is for the SDK on the merchant's domain, to be passed via postMessage
                // if the SDK needs to make authenticated calls itself for *this specific checkout instance*.
                sdk_token: authTokenForSdk, // This is for the SDK on merchant's domain
                // No need to send sessionTokenForSharedDomain in JSON if it's set as an HttpOnly cookie.
                // The iframe JS will get it via a subsequent auth status check or it will be sent automatically.
                user: userPayload // Send some user info back if needed by frontend immediately
            });
        } catch(err){
            next(err);
        }
    }

    static async authStatus(req, res, next){
        if(req.user){
            res.status(200).json({
                isAuthenticated: true,
                user: {
                    customer_id: req.user.customer_id,
                    phone: req.user.phone
                }
            });
        } else {
            res.status(200).json({ isAuthenticated: false });
        }
    }

    static async logout(req, res, next){
        res.clearCookie('session_token', {
            httpOnly: true,
            // secure: process.env.NODE_ENV === 'production',
            secure: true,
            sameSite: 'None',
            path: '/',
            domain: '.serveo.net' // IMPORTANT for cross-subdomain if needed
        });

        res.status(200).json({ message: 'Logged out successfully' });
    }
}

module.exports = AuthController;