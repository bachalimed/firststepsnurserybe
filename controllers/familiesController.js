const Family = require('../models/Family')
const User = require('../models/User')//we might need the user controller with this model
const Student = require ('../models/Student')
// const studentController = require ('../controllers/studentsController')
// const Student = require ('../models/Student')
const asyncHandler = require('express-async-handler')//instead of using try catch
const bcrypt = require('bcrypt') //to hash passwords before saving them
const mongoose = require('mongoose')


//will find a user for each aparent and attach parent to the user
// const findAttachUsersToParents = async (parents) => {
    
//     const ParentsList = []
//     if (parents?.length) {
//         // const users = await User.find({ isParent: { $exists: true, $ne: null } });
//         // const users2 = await User.find({ isParent: '66be308ab56faa4450991460' });
// // console.log('debug',users, users2);
           
//             await Promise.all(parents.map(async (eachParent) => {
//     //console.log('id found',eachParent._id)
//              const user = await User.findOne({ isParent: eachParent._id })
//             //  console.log('user found',user)
//             if (user) {
//                 // Attach the parent object to the user object
//                  //await user.populate('isParent') 
//                 // console.log('user after adding parent profiel',user)
//                 // console.log('Type of foundUsers:', typeof foundUsers)
//                 eachParent.userProfile = user
//             // console.log('Is array:', Array.isArray(foundUsers));
//                   ParentsList.push(eachParent)
//                 //console.log('usrs in controller from parents', eachParent)
                
//             }}))
        
//         }
//         return ParentsList
// }


// @desc Get all parents
// @route GET /students/studentsParents/parents              
// @access Private // later we will establish authorisations
const getAllFamilies = asyncHandler(async (req, res) => {
    // Get all parents from MongoDB according to the params
  let filteredFamilies
 
    if(req.query.selectedYear){
        const {selectedYear} = req.query
        console.log('selectedYear', selectedYear)
        //retrive all families
       const  families = await Family.find().populate('children.child').populate('father','-password').populate('mother','-password').lean()
        
        //  console.log(families,'families retriecved')
        // families.forEach(family => {
        //     console.log('Family:', family);
        //     family.children.forEach((child, index) => {
        //         console.log(`Child ${index + 1}:`, child);
        //     });
        // });
        
            if (!families?.length) {
            return res.status(400).json({ message: 'No families found !' })
            }else if (selectedYear==='1000'){
                 //if selectedYEar is 1000 we retreive all families
                 filteredFamilies = families
                //console.log(filteredParents,'filteredParents')
            }else{
               
                  //keep only the parent with students having the selectedyear value
            
               filteredFamilies = families.filter(family => 
                    family?.children?.some(child => 
                        child?.child?.studentYears?.some(year => year.academicYear === selectedYear)
                    )
                );
            }
            //console.log(filteredFamilies,'filteredFamilies')
            // const usersAndParents  = await findAttachUsersToParents(filteredFamilies)
            // const updatedParentsArray = usersAndParents.map(family => {
            //     if (family.userProfile.userSex === 'Male') {
            //     // Find the partner object in the array
            //         const partnerObject = usersAndParents.find(
            //             p => p._id.toString() === parent.partner?.toString()
            //         );
                
            //         if (partnerObject) {
            //             // Replace the partner ID with the partner object
            //             family.partner = partnerObject;
                
            //             return family;
            //         }
            //     }
            //     return family;
            // }).filter(family => family.userProfile.userSex !== 'Female' || !usersAndParents.some(p => p?._id?.toString() === family?.partner?._id.toString()))

            //console.log(updatedParentsArray,'updatedParentsArray')
            if (!filteredFamilies?.length) {
                return res.status(400).json({ message: 'No Parents found !' })
            }else{
                

                res.json(filteredFamilies)}

    }else if(req.query.id){//to be updated
                    const {id} = req.query
                    const families = await Family.find({_id:id}).populate('children.child').populate('father','-password').populate('mother','-password').lean()
                    if (!families?.length) {
                        return res.status(400).json({ message: 'No parents found' })
                    }
                    if (families){
                        // //  find the users that corresponds to the parents
                        // const usersAndParents  = await findAttachUsersToParents(families)
                        //   //console.log(usersAndParents)
                      res.status(200).json(families)
                    }


                }
        })



//----------------------------------------------------------------------------------
//@desc Create new parent, check how to save user and parent from the same form, check if year is same as current before rejecting duplicate
//@route POST /students/studentsParents/families
//@access Private
//first we save the studentsm then user then parent
const createNewFamily = asyncHandler(async (req, res) => {
    
     
        if (!req.body){  return res.status(400).json({ message: 'no request body received' })}
        const { father, mother, children, familySituation} = req.body//this will come from front end we put all the fields ofthe collection here
       
        //saving teh father
        const {
            userFullName: fatherFullName,
            username: fatherUsername,
            password: fatherPassword,
            userDob: fatherDob,
            userSex: fatherSex,
            userIsActive: fatherIsActive,
            userRoles: fatherRoles,
            userAddress: fatherAddress,
            userContact: fatherContact
          } = father
        
        
        //Confirm data for user will be checked by the user controller
        if (!fatherFullName || !fatherUsername ||!fatherDob ||! fatherSex ||!fatherPassword ||!fatherContact.primaryPhone || !Array.isArray(fatherRoles) || !fatherRoles.length) {
            return res.status(400).json({ message: 'All fields are required for Father' })//400 : bad request
        }

        // Check for duplicate username/ if the user has no isParent we will update only the parent isParent and create it
        const duplicateFather = await User.findOne({fatherUsername }).lean().exec()//because we re receiving only one response from mongoose

        if (duplicateFather) {
            return res.status(409).json({ message: 'Duplicate username for Father' })
        }
        
        // Hash password 
        //console.log(password, 'password')
        const hashedFatherPwd = await bcrypt.hash(fatherPassword, 10) // salt roundsm we will implement it laterm normally password is without''

            // res.status(201).json({ message: `New user ${username} created` })

        const fatherObject = { ...father, password :hashedFatherPwd}//construct new user to be stored
        console.log(fatherObject)
        const savedFather = await User.create(fatherObject)

        const {
            userFullName: motherFullName,
            username: motherUsername,
            password: motherPassword,
            userDob: motherDob,
            userSex: motherSex,
            userIsActive: motherIsActive,
            userRoles: motherRoles,
            userAddress: motherAddress,
            userContact: motherContact
          } = mother
            //Confirm data for user will be checked by the user controller
            if (!motherFullName || !motherUsername ||!motherDob ||! motherSex ||!motherPassword ||!motherContact.primaryPhone || !Array.isArray(motherRoles) || !motherRoles.length) {
                return res.status(400).json({ message: 'All fields are required for Mother' })//400 : bad request
            }
        // Check for duplicate username/ if the user has no isParent we will update only the parent isParent and create it
        const duplicateMother = await User.findOne({motherUsername }).lean().exec()//because we re receiving only one response from mongoose

        if (duplicateMother) {
            return res.status(409).json({ message: 'Duplicate username for Mother' })
        }
        // Hash password 
        const hashedMotherPwd = await bcrypt.hash(motherPassword, 10) // salt roundsm we will implement it laterm normally password is without''

        // res.status(201).json({ message: `New user ${username} created` })

        const motherObject = { ...mother, "password" :hashedMotherPwd }//construct new user to be stored

        const savedMother = await User.create(motherObject)
        if (savedFather&&savedMother) { //if created 
            const familyObject = {father:savedFather?._id, mother:savedMother?._id, children:children, familySituation:familySituation}
            const family = await Family.create(familyObject)
            if (family){
                res.status(201).json({ message: `New family created ${family._id},  ${father.userFullName.userFirstName+","} ${father.userFullName.userMiddleName+","} ${father.userFullName.userLastName+","} 
                and new mother ${mother.userFullName.userFirstName+","} ${mother.userFullName.userMiddleName+","} ${mother.userFullName.userLastName+","}  created` })//change parentYear later to show the parent full name
            }else{res.status(400).json({ message: 'unable to save family' })
            }


            } else { //delete the user already craeted to be done

                res.status(400).json({ message: 'unable to save user' })
            }

                    
                
            
        
            
        
    
    })//we need to delete the user if the parent is not saved



// @desc Update a parent, we will retrieve all information from user and parent and update and save in both collections
// @route PATCH /students/studentsParents/parents
// @access Private
const updateFamily = asyncHandler(async (req, res) => {
    const { id, userFullName, username, password, accessToken, isParent, isEmployee, userDob, userIsActive, userRoles, userSex, userPhoto, userAddress, userContact,parentYear, children, partner  } = req.body

    // Confirm data 
    if (!id || !username ||!userSex || !Array.isArray(userRoles) || !userRoles.length || typeof userIsActive !== 'boolean') {
        return res.status(400).json({ message: 'All fields except password are required' })
    }

    // Does the user exist to update?
    const user = await User.findById(id).exec()//we did not lean becausse we need the save method attached to the response
    const parent= await Family.findOne({_id:isParent}).exec() //find the parent with the id from the user

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
    user.userSex = userSex
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
const deleteFamily = asyncHandler(async (req, res) => {//uses parent id
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
    const parent = await Family.findById(id).exec()

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
    getAllFamilies,
    createNewFamily,
    updateFamily,
    deleteFamily
}