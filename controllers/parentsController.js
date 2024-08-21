const Parent = require('../models/Parent')
const User = require('../models/User')//we might need the user controller with this model
const Student = require ('../models/Student')
// const studentController = require ('../controllers/studentsController')
// const Student = require ('../models/Student')
const asyncHandler = require('express-async-handler')//instead of using try catch
const bcrypt = require('bcrypt') //to hash passwords before saving them
const mongoose = require('mongoose')


//will find a user for each aparent and attach parent to the user
const findAttachUsersToParents = async (parents) => {
    
    const ParentsList = []
    if (parents?.length) {
        // const users = await User.find({ isParent: { $exists: true, $ne: null } });
        // const users2 = await User.find({ isParent: '66be308ab56faa4450991460' });
// console.log('debug',users, users2);
           
            await Promise.all(parents.map(async (eachParent) => {
    //console.log('id found',eachParent._id)
             const user = await User.findOne({ isParent: eachParent._id })
            //  console.log('user found',user)
            if (user) {
                // Attach the parent object to the user object
                // await user.populate('isParent') 
                // console.log('user after adding parent profiel',user)
                // console.log('Type of foundUsers:', typeof foundUsers)
                eachParent.userProfile = user
            // console.log('Is array:', Array.isArray(foundUsers));
                  ParentsList.push(eachParent)
                //console.log('usrs in controller from parents', eachParent)
                
            }}))
        
        }
        return ParentsList
}


// @desc Get all parents
// @route GET /students/studentsParents/parents              
// @access Private // later we will establish authorisations
const getAllParents = asyncHandler(async (req, res) => {
    // Get all parents from MongoDB according to the params
    if(req.query.selectedYear){
        const {selectedYear} = req.query
        console.log('selectedYear', selectedYear)
        const parents = await Parent.find({parentYears:{$elemMatch:{academicYear:selectedYear}}}).populate('children').populate('partner').lean()
        console.log('parents', parents)
    // If no parents found 
        if (!parents?.length) {
            return res.status(400).json({ message: 'No parents found' })
        }
        if (parents){
            //  find the users that corresponds to the parents
            const usersAndParents  = await findAttachUsersToParents(parents)
            //console.log(usersAndParents)
            res.status(200).json(usersAndParents)
        }

    }else if(req.query.id){
        const {id} = req.query
        const parents = await Parent.find({_id:id}).populate('children').populate('partner').lean()
        if (!parents?.length) {
            return res.status(400).json({ message: 'No parents found' })
        }
        if (parents){
            //  find the users that corresponds to the parents
            const usersAndParents  = await findAttachUsersToParents(parents)
              //console.log(usersAndParents)
          res.status(200).json(usersAndParents)
        }

    }else{
        console.log('helllllllow')
        //console.log('parents in controller',parents)
        const parents = await Parent.find().populate('children').populate('partner').lean()
        if (!parents?.length) {
        return res.status(400).json({ message: 'No parents found' })
        }
        if (parents){
            //  find the users that corresponds to the parents
            const usersAndParents  = await findAttachUsersToParents(parents)
          //console.log(usersAndParents)
            res.status(200).json(usersAndParents)
        }
    
    }
})

//----------------------------------------------------------------------------------
//@desc Create new parent, check how to save user and parent from the same form, check if year is same as current before rejecting duplicate
//@route POST /students/studentsParents/parents
//@access Private
//first we save the studentsm then user then parent
const createNewParent = asyncHandler(async (req, res) => {
    const { userFullName, username, password, accessToken, isEmployee, userDob, userIsActive, userRoles, userPhoto, userAddress, userContact, parentYear, children, partner } = req.body//this will come from front end we put all the fields ofthe collection here

    //Confirm data for parent is present in the request with all required fields, data for user will be checked by the user controller
    if ( !parentYear ||!children  ) {
        return res.status(400).json({ message: 'All fields are required' })//400 : bad request
    }
    // Check for duplicate parent by checking duplicate children
    const duplicateChild = await Parent.findOne({ children: children }).lean().exec()
    if (duplicateChild) {
        return res.status(409).json({ message: `Duplicate child found:${children} ` })//get the child name from student collection
    }
    
    //Confirm data is present in the request with all required fields
    if (!userFullName || !username ||!userDob ||!password ||!userContact || !Array.isArray(userRoles) || !userRoles.length) {
        return res.status(400).json({ message: 'All fields are required' })//400 : bad request
    }
    
    // Check for duplicate userFullName
    const duplicateName = await User.findOne({userFullName }).lean().exec()//because we re receiving only one response from mongoose
    const duplicateDob = await User.findOne({userDob }).lean().exec()//because we re receiving only one response from mongoose

    if (duplicateName&&duplicateDob) {//we will only save the parent and update the user to be done later

        return res.status(409).json({ message: 'Duplicate Full name and DOB' })
    }


    // Check for duplicate username/ if the user has no isParent we will update only the parent isParent and create it
    const duplicate = await User.findOne({username }).lean().exec()//because we re receiving only one response from mongoose

    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate username' })
    }

    
    
    // Hash password 
    const hashedPwd = await bcrypt.hash(password, 10) // salt roundsm we will implement it laterm normally password is without''
    
    
  //prepare new parent to be stored
    //get the user Id to store it with parent
    //const createdUserId = await User.findOne({username }).lean()/////////////////////
    ///const parentUserId= createdUserId._id/////////
    const parentObject = { parentYear, children, partner }//construct new parent to be stored
  
//  store new parent 
const parent = await Parent.create(parentObject)
  

    if (parent) { //if created we will create the parent inside the if statement
        // res.status(201).json({ message: `New user ${username} created` })
  
           // Create and store new user 
                const isParent = parent._id
                const userObject = { userFullName, username, "password" :hashedPwd, accessToken,  isParent, isEmployee, userDob, userIsActive, userRoles, userPhoto, userAddress, userContact  }//construct new user to be stored

        const user = await User.create(userObject)
         
         if (user) { //if created 
             
             //the following line res is not being executed and was causing the error [ERR_HTTP_HEADERS_SENT, now we send both res for user and parent  together in ne line
             res.status(201).json({ message: `New user ${username+","} and new parent ${userFullName.userFirstName+" "+userFullName.userMiddleName+" "+userFullName.userLastName+","} created` })//change parentYear later to show the parent full name
     } else { //delete the user already craeted to be done
 
         res.status(400).json({ message: 'Invalid parent data received' })
     }

    } else { 
        res.status(400).json({ message: 'Invalid user data received' })
        
    }
       
})//we need to delete the user if the parent is not saved



// @desc Update a parent, we will retrieve all information from user and parent and update and save in both collections
// @route PATCH /students/studentsParents/parents
// @access Private
const updateParent = asyncHandler(async (req, res) => {
    const { id, userFullName, username, password, accessToken, isParent, isEmployee, userDob, userIsActive, userRoles, userPhoto, userAddress, userContact,parentYear, children, partner  } = req.body

    // Confirm data 
    if (!id || !username || !Array.isArray(userRoles) || !userRoles.length || typeof userIsActive !== 'boolean') {
        return res.status(400).json({ message: 'All fields except password are required' })
    }

    // Does the user exist to update?
    const user = await User.findById(id).exec()//we did not lean becausse we need the save method attached to the response
    const parent= await Parent.findOne({_id:isParent}).exec() //find the parent with the id from the user

    if (!user) {
        return res.status(400).json({ message: 'User not found' })
    }
    if (!parent) {
        return res.status(400).json({ message: 'Parent not found' })
    }

    // Check for duplicate 
    const duplicate = await User.findOne({ username }).lean().exec()

    // Allow updates to the original user 
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate username' })
    }

    user.userFullName = userFullName//it will only allow updating properties that are already existant in the model
    user.username = username
    user.userRoles = userRoles
    user.accessToken = accessToken
    user.isParent = isParent
    user.isEmployee = isEmployee
    user.userDob = userDob
    user.userIsActive = userIsActive
    user.userRoles = userRoles
    user.userPhoto = userPhoto
    user.userAddress =userAddress
    user.userContact =userContact
    parent.parentYear=parentYear
    parent.children=children
    parent.partner=partner

    if (password) {//only if the password is requested to be updated
        // Hash password 
        user.password = await bcrypt.hash(password, 10) // salt rounds 
    }

    const updatedUser = await user.save()//save method received when we did not include lean
    

    // res.json({ message: `${updatedUser.username} updated` })



    if (updatedUser) { //if updated we will update the parent inside the if statement
        
        const updatedParent = await parent.save()
         
        
         if (updatedParent) { //if updated the parent 
               
             res.json({ message: ` ${updatedUser.username} updated, and parent ${updatedUser.userFullName.userFirstName+" "+updatedUser.userFullName.userMiddleName+" "+updatedUser.userFullName.userLastName+","} updated` })//change parentYear later to show the parent full name
     } else { //delete the user already craeted to be done later
 
         res.status(400).json({ message: 'Invalid parent data received' })
     }

    } else { 
        res.status(400).json({ message: 'Invalid user data received' })       
    }

})


//--------------------------------------------------------------------------------------1   
// @desc Delete a parent, if no isEmployee, then delete the user orelse delete only parent and keep its user, if students are active dont delete
// @route DELETE /students/studentsParents/parents
// @access Private
const deleteParent = asyncHandler(async (req, res) => {//uses parent id
    const { id } = req.body

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    // Does the parent still have assigned active students?
    // const student = await Student.findOne({ parent: id }).lean().exec()
    // if (student) {
    //     return res.status(400).json({ message: 'Parent has assigned active students' })//to be checked later
    // }


    // Does the parent exist to delete?
    const parent = await Parent.findById(id).exec()

    if (!parent) {
        return res.status(400).json({ message: 'Parent not found' })
    }
    const user = await User.findOne({isParent:id})
    
    if (!user) {
        return res.status(400).json({ message: 'corresponding User not found' })
    }
    //if user is also an employee, delete only the parent collection and keep user
    if(user.isEmployee){
        const result1 = await parent.deleteOne()
        const reply = `parent ${result1.id} deleted`
       res.json(reply)
    } else{

         const result1 = await parent.deleteOne()
        	const result2 = await user.deleteOne()
			//console.log(result2)

        	const reply = `Username ${user.username} deleted, parent ${user.userFullName.userFirstName + " " + user.userFullName.userMiddleName+ " "+ user.userFullName.userLastName} deleted`

			  res.json(reply)
		}

})




module.exports = {
    getAllParents,
    createNewParent,
    updateParent,
    deleteParent
}