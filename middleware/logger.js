
const { format } = require('date-fns');
const { v4: uuid } = require('uuid');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

const logEvents = async (message, logFileName) => {
    const dateTime = format(new Date(), 'yyyyMMdd\tHH:mm:ss');
    const logItem = `${dateTime}\t${uuid()}\t${message}\n`;

    try { // Check if the directory exists or create it
        if (!fs.existsSync(path.join(__dirname, '..', 'logs'))) {
            await fsPromises.mkdir(path.join(__dirname, '..', 'logs'));
        }
        await fsPromises.appendFile(path.join(__dirname, '..', 'logs', logFileName), logItem);
    } catch (err) {
        console.error('Error in logger:', err);
    }
};

const logger = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'Unknown IP';
    //const userId = req.user ? req.user.id : 'Anonymous'; // Assuming req.user contains user information
   // const userAgent = req.headers['user-agent'] || 'Unknown User-Agent';
   
    res.on('finish', () => { // Log after response is sent
        const statusCode = res.statusCode;
        const message = `${req.headers.origin || 'Unknown Origin'}\t${req?.query?.endpointName}\t${req.method}\t${statusCode}\t${ip}\t${req.url}`;
        logEvents(message, 'reqLog.log');
        console.log(`${statusCode} - ${req.method} ${req.path}`);
    });

    next();
};

module.exports = { logEvents, logger };




















// const { format } = require('date-fns')
// const { v4: uuid } = require('uuid')
// const fs = require('fs')
// const fsPromises = require('fs').promises
// const path = require('path')

// const logEvents = async (message, logFileName) => {
//     const dateTime = format(new Date(), 'yyyyMMdd\tHH:mm:ss')
//     const logItem = `${dateTime}\t${uuid()}\t${message}\n`

//     try {//checking if the directory exists or create it
//         if (!fs.existsSync(path.join(__dirname, '..', 'logs'))) {
//             await fsPromises.mkdir(path.join(__dirname, '..', 'logs'))
//         }
//         await fsPromises.appendFile(path.join(__dirname, '..', 'logs', logFileName), logItem)
//     } catch (err) {
//         console.log('err in logger')
//         console.log(err)
//     }
// }

// const logger = (req, res, next) => {//it will log every request, a condition may be needed to only log requests from outside out url to reduce it s volume
//     logEvents(`${req.method}\t${req.url}\t${req.headers.origin}`, 'reqLog.log')
//     console.log(`${req.method} ${req.path}`)
//     next()
// }

// module.exports = { logEvents, logger }