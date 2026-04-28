// CouponManager.js - Utility for managing coupons and discounts

export const generateBillNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `BL${timestamp.slice(-6)}${random}`;
};

export const validateCoupon = (couponCode, availableCoupons) => {
  if (!couponCode || !availableCoupons[couponCode]) {
    return { valid: false, discount: 0, message: 'Invalid coupon code' };
  }
  return {
    valid: true,
    discount: availableCoupons[couponCode],
    message: `Coupon ${couponCode} applied! ${availableCoupons[couponCode]}% discount`
  };
};

export const calculateDiscount = (total, discountPercent) => {
  return Math.round((total * discountPercent) / 100);
};

export const calculateFinalTotal = (subtotal, discountPercent) => {
  const discount = calculateDiscount(subtotal, discountPercent);
  return Math.max(0, subtotal - discount);
};
