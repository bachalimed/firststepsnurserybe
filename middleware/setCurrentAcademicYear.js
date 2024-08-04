//will update the db to set the current academiv year
const mongoose = require('mongoose')
const AcademicYear = require('../models/AcademicYear') // Adjust the path to your model

const setCurrentAcademicYear = async () => {
    const now = new Date()
    const currentYear = now.getFullYear()
    let currentAcademicYear = null
  try {
    // Define the date range
    console.log('startDate')
    const startDate = new Date(Date.UTC(currentYear, 8, 1, 0, 0, 0)) // 1st September of the current year at midnight UTC
    const endDate = new Date(Date.UTC(currentYear + 1, 7, 31, 23, 59, 59, 999)) // 31st August of the next year at one second before midnight UTC
    console.log(startDate)
    console.log(endDate)
    
    
    // Find the academic year that falls within this date range
  //  if(academicYearsOldList?.length){
    const currentAcademicYear = await AcademicYear.findOne({
        yearStart: { $lte: endDate },
        yearEnd: { $gte: startDate }
        
    })
  //}
    

    if (currentAcademicYear) {
      // Reset currentYear field for all academic years
      await AcademicYear.updateMany({}, { currentYear: false })

      // Set the found academic year as the current year
      currentAcademicYear.currentYear = true
      await currentAcademicYear.save()


      console.log(`Academic Year "${currentAcademicYear.title}" is set as the current year.`)
      //const  academicYearsNewList = await AcademicYear.find().lean()
    } else {
      console.log('No academic year found within the specified date range.')
    }
  } catch (error) {
    console.error('Error setting the current academic year:', error)
  }

return currentAcademicYear
}

module.exports = { setCurrentAcademicYear }