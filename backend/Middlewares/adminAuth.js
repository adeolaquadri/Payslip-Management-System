import jsonwebtoken from "jsonwebtoken"
import dotenv from "dotenv"


dotenv.config()

export const verifyToken = (req, res, next) => {
  try {
      const authHeader = req.headers.authorization;
  
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Access Denied: No token provided" });
      }
  
      const token = authHeader.split(" ")[1];
      const verified = jsonwebtoken.verify(token, process.env.secret_key);
      req.user = verified;
      next();
  
    } catch (error) {
      return res.status(403).json({ message: "Invalid or expired token", error: error.message });
    }
};