
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
app.use('/auth', require('./routes/authRoutes'))
//app.use('/admin/usersManagement/', require('./routes/userRoutes'))//this was hidden for testing, was visible and working
app.use('/admin/usersManagement/photos/', require('./routes/photoStorageRoutes'))//will try to access user controller toupdate the photo
app.use('/admin/usersManagement/users/', require('./routes/userRoutes'))//this will decide which request is used from front end
app.use('/admin/usersManagement/:id/', require('./routes/userRoutes'))//this will decide which request is used from front end
app.use('/admin/usersManagement/newUser/', require('./routes/userRoutes'))//check if the path photos is the correct one in storage ROutes
//app.use('/notes', require('./routes/noteRoutes'))
//app.use('/students/studentsParent/', require('./routes/parentRoutes'))//no need to specify each sub url to get the requests working
app.use('/students/studentsParents/families/:id', require('./routes/familyRoutes'))
app.use('/students/studentsParents/families/', require('./routes/familyRoutes'))
app.use('/students/studentsParents/students/', require('./routes/studentRoutes'))

app.use('/students/studentsParents/studentDocuments/', require('./routes/studentDocumentsRoutes'))
app.use('/students/studentsParents/studentDocuments/:id/', require('./routes/studentDocumentsRoutes'))



app.use('/hr/employees', require('./routes/employeeRoutes'))
app.use('/desk/tasks', require('./routes/taskRoutes'))
// app.use('/desk/tasks/myTasks', require('./routes/taskRoutes') )
app.use('/settings/academicsSet/academicYears/', require('./routes/academicYearRoutes'))
app.use('/settings/academicsSet/attendedSchools/', require('./routes/attendedSchoolRoutes'))
app.use('/settings/studentsSet/studentDocumentsLists/', require('./routes/studentDocumentsListRoutes'))




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
