const Family = require("../models/Family");
const User = require("../models/User"); //we might need the user controller with this model
const Student = require("../models/Student");
// const studentController = require ('../controllers/studentsController')
// const Student = require ('../models/Student')
const asyncHandler = require("express-async-handler"); //instead of using try catch
const bcrypt = require("bcrypt"); //to hash passwords before saving them
const mongoose = require("mongoose");

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
  let filteredFamilies;

  if (req.query.selectedYear) {
    const { selectedYear } = req.query;
    console.log("selectedYear in getallfamilies", selectedYear);
    //retrive all families
    const families = await Family.find()
      .populate("children.child")
      .populate(
        "father",
        "-password -userSex -username -userRoles -userAllowedActions"
      )
      .populate(
        "mother",
        "-password -userSex -username -userRoles -userAllowedActions"
      )
      .lean();

    //  console.log(families,'families retriecved')
    // families.forEach(family => {
    //     console.log('Family:', family);
    //     family.children.forEach((child, index) => {
    //         console.log(`Child ${index + 1}:`, child);
    //     });
    // });

    if (!families?.length) {
      return res.status(400).json({ message: "No families found !" });
    } else if (selectedYear === "1000") {
      //if selectedYEar is 1000 we retreive all families
      filteredFamilies = families;
      //console.log(filteredParents,'filteredParents')
    } else {
      //keep only the parent with students having the selectedyear value

      filteredFamilies = families.filter((family) =>
        family?.children?.some((child) =>
          child?.child?.studentYears?.some(
            (year) => year.academicYear === selectedYear
          )
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
      return res.status(400).json({ message: "No families found !" });
    } else {
      res.json(filteredFamilies);
    }
  } else if (req.query.id) {
    const { id } = req.query;
    if (req.query.criteria) {
      const criteria = req.query.criteria;
      console.log("in teh criteria", criteria);
      if (criteria == "Dry") {
        console.log("in teh dry");
        const family = await Family.find({ _id: id })
          .populate(
            "children.child",
            "-studentEducation -studentAdmissions -studentYears -studentGardien -studentDob -studentSex -studentIsActive -lastModified -operator"
          )
          .populate(
            "father",
            "-password -userSex -username -userRoles -userAllowedActions"
          )
          .populate(
            "mother",
            "-password -userSex -username -userRoles -userAllowedActions"
          )
          .lean();
        if (!family) {
          return res.status(400).json({ message: "No family found" });
        }
        if (family) {
          res.status(200).json(family);
          console.log(family);
        }
      }
    } else {
      const families = await Family.find({ _id: id })
        .populate("children.child")
        .populate(
          "father",
          "-password -userSex -username -userRoles -userAllowedActions"
        )
        .populate(
          "mother",
          "-password -userSex -username -userRoles -userAllowedActions"
        );
      //   .lean();
      if (!families?.length) {
        return res.status(400).json({ message: "No parents found" });
      }
      if (families) {
        // //  find the users that corresponds to the parents
        // const usersAndParents  = await findAttachUsersToParents(families)
        //   //console.log(usersAndParents)
        res.status(200).json(families);
      }
    }
  }
});

//remove data from teh child object

const formatChildren = (children) => {
  return children.map((child) => {
    // Extract necessary fields from the populated child object
    const { _id, studentName } = child.child;
    const studentFullName = `${studentName.firstName} ${
      studentName.middleName || ""
    } ${studentName.lastName}`.trim();
    return { _id, studentFullName };
  });
};

const getFamilyById = asyncHandler(async (req, res) => {
  console.log("hellloooww");
  try {
    const { id, criteria } = req.params;
    console.log(id, criteria);

    const path = "children.child";
    const selection = "_id studentName";

    console.log("now in the controller to get family id", id);
    if (!id) {
      return res
        .status(400)
        .json({ message: "Missing required parameters: id" });
    }
    let family;
    if (criteria === "Dry") {
      console.log("dry");
      family = await Family.findOne({ _id: id })
        .populate({ path: path, select: selection })
        .populate(
          "father",
          "-password",
          "-userSex",
          "-username",
          "-userRoles",
          "-userAllowedActions"
        )
        .populate(
          "mother",
          "-password",
          "-userSex",
          "-username",
          "-userRoles",
          "-userAllowedActions"
        )
        .exec(); //adde exec
    } else {
      family = await Family.findOne({ _id: id })
        .populate("children.child")
        .populate(
          "father",
          "-password",
          "-userSex",
          "-username",
          "-userRoles",
          "-userAllowedActions"
        )
        .populate(
          "mother",
          "-password",
          "-userSex",
          "-username",
          "-userRoles",
          "-userAllowedActions"
        );
      //   .lean();
    }
    if (!family) {
      return res.status(404).json({ message: "Family not found" });
    }
    if (family) {
      res.status(200).json(family);
    }
  } catch (err) {
    console.error("Error in request:", err);
    res.status(500).send("Error in request");
  }
});

//----------------------------------------------------------------------------------
//@desc Create new parent, check how to save user and parent from the same form, check if year is same as current before rejecting duplicate
//@route POST /students/studentsParents/families
//@access Private
//first we save the studentsm then user then parent
const createNewFamily = asyncHandler(async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: "no request body received" });
  }
  const { father, mother, children, familySituation } = req.body; //this will come from front end we put all the fields ofthe collection here

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
    userContact: fatherContact,
  } = father;

  //Confirm data for user will be checked by the user controller
  if (
    !fatherFullName ||
    !fatherUsername ||
    !fatherDob ||
    !fatherSex ||
    !fatherPassword ||
    !fatherContact.primaryPhone ||
    !Array.isArray(fatherRoles) ||
    !fatherRoles.length
  ) {
    return res
      .status(400)
      .json({ message: "All fields are required for Father" }); //400 : bad request
  }

  // Check for duplicate username/ if the user has no isParent we will update only the parent isParent and create it
  const duplicateFather = await User.findOne({ fatherUsername }).lean().exec(); //because we re receiving only one response from mongoose

  if (duplicateFather) {
    return res.status(409).json({ message: "Duplicate username for Father" });
  }

  // Hash password
  //console.log(password, 'password')
  const hashedFatherPwd = await bcrypt.hash(fatherPassword, 10); // salt roundsm we will implement it laterm normally password is without''

  // res.status(201).json({ message: `New user ${username} created` })

  const fatherObject = { ...father, password: hashedFatherPwd }; //construct new user to be stored
  //console.log(fatherObject);
  const savedFather = await User.create(fatherObject);

  const {
    userFullName: motherFullName,
    username: motherUsername,
    password: motherPassword,
    userDob: motherDob,
    userSex: motherSex,
    userIsActive: motherIsActive,
    userRoles: motherRoles,
    userAddress: motherAddress,
    userContact: motherContact,
  } = mother;
  //Confirm data for user will be checked by the user controller
  if (
    !motherFullName ||
    !motherUsername ||
    !motherDob ||
    !motherSex ||
    !motherPassword ||
    !motherContact.primaryPhone ||
    !Array.isArray(motherRoles) ||
    !motherRoles.length
  ) {
    return res
      .status(400)
      .json({ message: "All fields are required for Mother" }); //400 : bad request
  }
  // Check for duplicate username/ if the user has no isParent we will update only the parent isParent and create it
  const duplicateMother = await User.findOne({ motherUsername }).lean().exec(); //because we re receiving only one response from mongoose

  if (duplicateMother) {
    return res.status(409).json({ message: "Duplicate username for Mother" });
  }
  // Hash password
  const hashedMotherPwd = await bcrypt.hash(motherPassword, 10); // salt roundsm we will implement it laterm normally password is without''

  // res.status(201).json({ message: `New user ${username} created` })

  const motherObject = { ...mother, password: hashedMotherPwd }; //construct new user to be stored

  const savedMother = await User.create(motherObject);
  if (savedFather && savedMother) {
    //if created
    const familyObject = {
      father: savedFather?._id,
      mother: savedMother?._id,
      children: children,
      familySituation: familySituation,
    };
    const family = await Family.create(familyObject);
    if (family) {
      res.status(201).json({
        message: `New family created ${family._id},  ${
          father.userFullName.userFirstName + ","
        } ${father.userFullName.userMiddleName + ","} ${
          father.userFullName.userLastName + ","
        } 
                and new mother ${mother.userFullName.userFirstName + ","} ${
          mother.userFullName.userMiddleName + ","
        } ${mother.userFullName.userLastName + ","}  created`,
      }); //change parentYear later to show the parent full name
    } else {
      res.status(400).json({ message: "unable to save family" });
    }
  } else {
    //delete the user already craeted to be done

    res.status(400).json({ message: "unable to save user" });
  }
}); //we need to delete the user if the parent is not saved

const updateFamily = asyncHandler(async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: "no request body received" });
  }
  const { _id, father, mother, children, familySituation } = req.body; //this will come from front end we put all the fields ofthe collection here

  //saving teh father
  const {
    _id: fatherId,
    userFullName: fatherFullName,
    userDob: fatherDob,
    userAddress: fatherAddress,
    userContact: fatherContact,
  } = father;

  //Confirm data for user will be checked by the user controller
  if (!fatherFullName || !fatherDob || !fatherContact.primaryPhone) {
    return res
      .status(400)
      .json({ message: "All fields are required for Father" }); //400 : bad request
  }

  // Check for duplicate username/ if the user has no isParent we will update only the parent isParent and create it
  const duplicateFather = await User.findById(fatherId).exec();

  if (!duplicateFather) {
    return res
      .status(409)
      .json({ message: "no father found for the provided id" });
  }

  duplicateFather.userFullName = fatherFullName; //it will only allow updating properties that are already existant in the model
  duplicateFather.userDob = fatherDob;
  duplicateFather.userAddress = fatherAddress;
  duplicateFather.userContact = fatherContact;

  const savedFather = await duplicateFather.save();
  console.log(savedFather, "savedFather");

  const {
    _id: motherId,
    userFullName: motherFullName,
    userDob: motherDob,
    userAddress: motherAddress,
    userContact: motherContact,
  } = mother;
  //Confirm data for user will be checked by the user controller
  if (!motherFullName || !motherDob || !motherContact.primaryPhone) {
    return res
      .status(400)
      .json({ message: "All fields are required for Mother" }); //400 : bad request
  }
  // Check for duplicate username/ if the user has no isParent we will update only the parent isParent and create it
  const duplicateMother = await User.findById(motherId).exec();

  if (!duplicateMother) {
    return res
      .status(409)
      .json({ message: "no mother found for the provided id" });
  }

  duplicateMother.userFullName = motherFullName; //it will only allow updating properties that are already existant in the model
  duplicateMother.userDob = motherDob;
  duplicateMother.userAddress = motherAddress;
  duplicateMother.userContact = motherContact;

  const savedMother = await duplicateMother.save();
  console.log(savedMother, "savedMother");
  if (savedFather && savedMother) {
    //if father andmother updated, we update the family
    const duplicateFamily = await Family.findById(_id).exec();

    duplicateFamily.children = children;
    duplicateFamily.familySituation = familySituation; //it will only allow updating properties that are already existant in the model

    const savedFamily = await duplicateFamily.save();
    console.log(savedFamily, "savedFamily");
    if (savedFamily) {
      res.status(201).json({
        message: `family with id ${savedFamily._id}, father ${father.userFullName.userFirstName} ${father.userFullName.userMiddleName} ${father.userFullName.userLastName}, & mother ${mother.userFullName.userFirstName} ${mother.userFullName.userMiddleName} ${mother.userFullName.userLastName} updated`,
      }); //change parentYear later to show the parent full name
    } else {
      res.status(400).json({ message: "unable to update family" });
    }
  } else {
    //delete the user already craeted to be done

    res.status(400).json({ message: "unable to update  user" });
  }
}); //we need to delete the user if the parent is not saved

//--------------------------------------------------------------------------------------1
// @desc Delete a only the father and mother if they are niot empoloyees,  studetns can be deleted from the student window
// @route DELETE /students/studentsParents/parents
// @access Private
const deleteFamily = asyncHandler(async (req, res) => {
  //uses parent id
  const { id } = req.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "family Id not provided" });
  }


  // Does the parent exist to delete?
  const family = await Family.findById(id).exec();

  if (!family) {
    return res.status(400).json({ message: "Family not found for the provided id" });
  }
  const {father, mother, children}=familyToDelete
  const fatherToDelete = await User.findById(father);

//   if (!fatherToDelete) {
//     return res.status(400).json({ message: "corresponding father not found" });//already not found to be deleted
//   }
  //if user is also an employee, delete only the parent collection and keep user
  let deletedFather
  let replyFather
  if (!fatherToDelete.isEmployee) {
     deletedFather = await fatherToDelete.deleteOne();
     replyFather = `father ${fatherToDelete.userFullName.userFirstName} ${fatherToDelete.userFullName.userMiddleName} ${fatherToDelete.userFullName.userLastName} deleted`;
    //res.json(reply);
  }
  const motherToDelete = await User.findById(mother)
  let deletedMother
  let replyMother
  if (!motherToDelete.isEmployee) {
     deletedMother = await motherToDelete.deleteOne();
     replyMother = `mother ${motherToDelete.userFullName.userFirstName} ${motherToDelete.userFullName.userMiddleName} ${motherToDelete.userFullName.userLastName} deleted`;
    //res.json(reply);
  }
  const familyToDelete = await User.findById(family)
  let deletedFamily
  let replyFamily
  
     deletedFamily = await familyToDelete.deleteOne();
     replyFamily = ` family  deleted`;
    //res.json(reply);
  
    const reply = `${replyFather}, ${replyMother} ${replyFamily}`;

    res.json(reply);
 
});

module.exports = {
  getAllFamilies,
  createNewFamily,
  updateFamily,
  deleteFamily,
  getFamilyById,
};
