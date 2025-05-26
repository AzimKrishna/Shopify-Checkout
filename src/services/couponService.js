const { default: mongoose } = require("mongoose");
const Coupon = require("../models/Coupon");


class CouponService{
    static async applyCoupon(checkout, coupon_code, merchant_id){
        try {
            if(!coupon_code){
                checkout.coupon_code = null;
                checkout.discount = 0;
                const subtotal = checkout.cart_items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                checkout.total = subtotal;
                console.log(`Discount removed from checkout: ${checkout._id}`);
                return checkout;
            }

            if(!mongoose.Types.ObjectId.isValid(merchant_id)){
                throw new Error('Invalid merchant ID');
            }

            const coupon = await Coupon.findOne({
                code: coupon_code.toString().toUpperCase().trim(),
                merchant_id
            });

            if(!coupon){
                throw new Error('Invalid coupon code');
            }
            if (coupon.used_count >= coupon.max_usage) {
                throw new Error('Coupon usage limit reached');
            }
            if (coupon.expires_at < new Date()) {
                throw new Error('Coupon expired');
            }

            let discount = 0;
            const subtotal = checkout.cart_items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            if(coupon.discount_type === 'fixed'){
                discount = Math.min(coupon.discount_value, subtotal);
            } else if(coupon.discount_type === 'percentage'){
                discount = (coupon.discount_value / 100) * subtotal;
                discount = Math.min(discount, subtotal);
            }

            checkout.coupon_code = coupon.code;
            checkout.discount = discount;
            checkout.total = subtotal - discount;

            if (checkout.total < 0) checkout.total = 0;

            coupon.used_count += 1;
            await coupon.save();
            console.log(`Coupon ${coupon.code} applied to checkout ${checkout._id}`);
            return checkout;
        } catch (err) {
            console.error(`Coupon application error: ${err.message}`);
            throw err;
        }
    }
}

module.exports = CouponService;