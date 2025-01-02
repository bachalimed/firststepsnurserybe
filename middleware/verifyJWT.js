//this will verify the cookies for us for every request received, needs to be applied to all protected routes(that need authetication)
require("dotenv").config();
const jwt = require('jsonwebtoken')

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' })
    }

    const token = authHeader.split(' ')[1]

    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
            if (err) return res.status(403).json({ message: 'Forbidden' })
            // req.user = decoded.userInfo.username
            // req.userRoles = decoded.userInfo.userRoles
            // req.userId =decoded.userInfo.userId
            // req.userAllowedActions=decoded.userInfo.userAllowedActions
            next()
        }
    )
}

module.exports = verifyJWT 
