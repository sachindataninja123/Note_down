import crypto from "crypto";
import bcrypt from "bcryptjs";

export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 10;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
export const MAX_OTP_ATTEMPTS = 5;

export const generateOtp = () => {
  return crypto.randomInt(0, 1000000).toString().padStart(OTP_LENGTH, "0");
};

export const hashOtp = async (otp) => {
  return await bcrypt.hash(otp, 10);
};

export const compareOtp = async (otp, hashedOtp) => {
  return await bcrypt.compare(otp, hashedOtp);
};