import jwt from "jsonwebtoken";

export const genAccessToken = (user) => {
  return jwt.sign(
    { _id: user._id, email: user.email },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );
};

export const genRefreshToken = (user) => {
  return jwt.sign(
    { _id: user._id, tokenVersion: user.tokenVersion },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
};