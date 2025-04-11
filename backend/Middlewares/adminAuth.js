import jsonwebtoken from "jsonwebtoken"
import dotenv from "dotenv"


dotenv.config()

export const verifyToken = (req, res, next) => {
    if (!req.cookies.token)
        return res.status(401).json({ message: "Access Denied" });
    try {
        const verified = jsonwebtoken.verify(req.cookies.token, process.env.secret_key);
        req.user = verified; // Attach user data to request
        next();
    }catch(e){
        return res.status(403).json({message: e.message})
    }
};