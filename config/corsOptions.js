//to check if the origin is allowed or not

const allowedOrigins = require('./allowedOrigins')

const corsOptions = {
    origin: (origin, callback) => {
       // if (allowedOrigins.indexOf(origin) !== -1 || !origin) {//this origin will allow postmen to access the API
        if (allowedOrigins.indexOf(origin) !== -1 ) {//this origin will allow postmen to access the API
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true,//allows cookies to be sent
    optionsSuccessStatus: 200
}

module.exports = corsOptions 