//this will specify which origins are allowed by cors to rquest from the server
//always allow use of www in the address of urls

const allowedOrigins = [
    'http://localhost:3000',//this will aloow access from local host on dev environment
    'https://firststepsnursery.onrender.com',
    'https://www.firststepsnursery.onrender.com'
]
module.exports = allowedOrigins