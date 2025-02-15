
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
const verifyJWT = require("./middleware/verifyJWT");

console.log(process.env.NODE_ENV)

connectDB()

app.use(logger)

app.use(cors(corsOptions))

app.use(express.json())

app.use(cookieParser())

app.use('/', express.static(path.join(__dirname, 'public')))
app.use('/', require('./routes/root'))

//access token before verify because it issues accessa dn cookies with refresh token
app.use('/auth', require('./routes/authRoutes'))

//all routes after this need access token present to  run
app.use(verifyJWT);

app.use('/admin/usersManagement/users/', require('./routes/userRoutes'))//this will decide which request is used from front end
app.use('/admin/usersManagement/:id/', require('./routes/userRoutes'))//this will decide which request is used from front end
app.use('/admin/usersManagement/newUser/', require('./routes/userRoutes'))//check if the path photos is the correct one in storage ROutes
app.use('/students/studentsParents/families/:id', require('./routes/familyRoutes'))
app.use('/students/studentsParents/families/', require('./routes/familyRoutes'))
app.use('/students/studentsParents/students/', require('./routes/studentRoutes'))
app.use('/students/admissions/admissions/', require('./routes/admissionRoutes'))
app.use('/students/enrolments/enrolments/', require('./routes/enrolmentRoutes'))
app.use('/academics/sessions', require('./routes/sessionRoutes'))
app.use('/academics/sections', require('./routes/sectionRoutes'))
app.use('/academics/animatorsAssignments/', require('./routes/animatorsAssignmentRoutes'))
app.use('/students/studentsParents/studentDocuments/', require('./routes/studentDocumentsRoutes'))
app.use('/students/studentsParents/studentDocuments/:id/', require('./routes/studentDocumentsRoutes'))
app.use('/finances/invoices/', require('./routes/invoiceRoutes'))
app.use('/finances/payments/', require('./routes/paymentRoutes'))
app.use('/finances/expenses/', require('./routes/expenseRoutes'))
app.use('/hr/employees/employeeDocuments/', require('./routes/employeeDocumentsRoutes'))
app.use('/hr/employees/employeeDocuments/:id/', require('./routes/employeeDocumentsRoutes'))
app.use('/hr/employees', require('./routes/employeeRoutes'))
app.use('/hr/payslips', require('./routes/payslipRoutes'))
app.use('/hr/leaves', require('./routes/leaveRoutes'))
app.use('/desk/tasks', require('./routes/taskRoutes'))
app.use('/settings/academicsSet/academicYears/', require('./routes/academicYearRoutes'))
app.use('/settings/academicsSet/attendedSchools/', require('./routes/attendedSchoolRoutes'))
app.use('/settings/studentsSet/studentDocumentsLists/', require('./routes/studentDocumentsListRoutes'))
app.use('/settings/hrSet/employeeDocumentsLists/', require('./routes/employeeDocumentsListRoutes'))
app.use('/settings/studentsSet/services/', require('./routes/serviceRoutes'))
app.use('/settings/academicsSet/classrooms/', require('./routes/classroomRoutes'))
app.use('/settings/financesSet/payees/', require('./routes/payeeRoutes'))
app.use('/settings/financesSet/expenseCategories/', require('./routes/expenseCategoryRoutes'))
app.use('/notifications/notifications/', require('./routes/notificationRoutes'))
app.use('/admin/crmManagement/textSettings/', require('./routes/textSettingRoutes'))



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
