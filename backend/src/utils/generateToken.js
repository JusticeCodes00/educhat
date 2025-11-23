import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const { JWT_SECRET, NODE_ENV, FRONTEND_URL } = process.env;

  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const token = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: NODE_ENV === "production" ? "none" : "lax", // ⭐ Changed from "strict"
    secure: true, // ⭐ Always true for cross-domain
    path: "/",
    domain: NODE_ENV === "production" ? undefined : "localhost",
  });

  return token;
};