
require('dotenv').config()
const express = require('express')
const app = express()
const path = require('path')
const { logger, logEvents } = require('./middleware/logger')
const errorHandler = require('./middleware/errorHandler')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const corsOptions = require('./config/corsOptions')
const connectDB = require('./config/dbConn')
const mongoose = require('mongoose')
const PORT = process.env.PORT ||3500


console.log(process.env.NODE_ENV)

connectDB()

app.use(logger)

app.use(cors(corsOptions))

app.use(express.json())

app.use(cookieParser())

app.use('/', express.static(path.join(__dirname, 'public')))

app.use('/', require('./routes/root'))
app.use('/admin/users', require('./routes/userRoutes'))//this will decide which request is used from front end
//app.use('/notes', require('./routes/noteRoutes'))

app.use('/students/studentsParents/parents', require('./routes/parentRoutes'))
app.use('/students/studentsParents/students', require('./routes/studentRoutes'))
app.use('/hr/employees', require('./routes/employeeRoutes'))

app.all('*', (req,res)=>{
    res.status(404)
    if (req.accepts('html')){
        res.sendFile(path.join(__dirname, 'views', '404.html'))
    }else if (req.accepts('json')){
    res.json({message:'404 page not found'})
    } else {
        res.type('txt').send('404 not found')
    }
})

app.use(errorHandler)

mongoose.connection.once('open', () => {
    console.log('\x1b[36m%s\x1b[0m','Connected to MongoDB')
    app.listen(PORT, () => console.log('\x1b[36m%s\x1b[0m',`Server running on port ${PORT}`))
})

mongoose.connection.on('error', err => {
    console.log(err)
    logEvents(`${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`, 'mongoErrLog.log')
})
