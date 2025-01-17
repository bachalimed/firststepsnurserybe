const Family = require("../models/Family");
const User = require("../models/User");
const asyncHandler = require("express-async-handler"); //instead of using try catch
const bcrypt = require("bcrypt"); //to hash passwords before saving them
const mongoose = require("mongoose");

const getFamilyStatisticsByYear = async (selectedYear) => {
  try {
    // Step 1: Retrieve all families and populate their children with matching students by academicYear
    const families = await Family.aggregate([
      {
        $lookup: {
          from: "students", // Assume the collection is named "students"
          localField: "children.child", // Assuming the "children.child" field in Family references Student _id
          foreignField: "_id",
          as: "children",
        },
      },
      {
        $project: {
          _id: 1,
          familyName: 1, // Optional field to help identify families, adjust as needed
          familySituation: 1, // Include familySituation for counting
          children: 1, // See what children look like after $lookup
        },
      },
      {
        $addFields: {
          // Filter children array to include only those students with the selected academicYear
          children: {
            $filter: {
              input: "$children",
              as: "childWrapper",
              cond: {
                $in: [selectedYear, "$$childWrapper.studentYears.academicYear"],
              },
            },
          },
        },
      },
    ]);

    // Step 2: Count the number of families with each number of children
    const familiesChildren = families.reduce((acc, family) => {
      const childrenCount = family.children.length;

      // Increment the count for this number of children
      if (!acc[childrenCount]) {
        acc[childrenCount] = 0;
      }
      acc[childrenCount]++;

      return acc;
    }, {});

    // Step 3: Count the number of families by familySituation
    const familySituationCount = families.reduce((acc, family) => {
      const situation = family.familySituation || "Unknown";

      // Increment the count for each situation
      if (!acc[situation]) {
        acc[situation] = 0;
      }
      acc[situation]++;

      return acc;
    }, {});

    // Step 4: Count the total number of families that have at least one student in the selected year
    const familiesWithStudentsInYear = families.filter(
      (family) => family.children.length > 0
    ).length;

    // Step 5: Return the result with all statistics
    return {
      familiesChildren, // Number of families with each number of children for the selected year
      familySituationCount, // Number of families for each situation
      familiesWithStudentsInYear, // Total number of families with at least one student in the selected year
    };
  } catch (error) {
    console.error("Error retrieving family statistics:", error);
    throw error;
  }
};

// @desc Get all parents
// @route GET /students/studentsParents/parents
// @access Private // later we will establish authorisations
const getAllFamilies = asyncHandler(async (req, res) => {
  // Get all parents from MongoDB according to the params

  const { selectedYear, id, criteria } = req.query;
  let filteredFamilies;
  if (selectedYear !== "1000" && criteria === "familiesTotalStats") {
    //console.log("here");
    try {
      // Wait for the `countStudents` function to resolve
      const {
        familiesChildren, // Number of families with each number of children for the selected year
        familySituationCount, // Number of families for each situation
        familiesWithStudentsInYear,
      } = await getFamilyStatisticsByYear(selectedYear);

      // Check if all counts are missing or zero
      if (!familiesChildren || !familiesWithStudentsInYear) {
        return res.status(400).json({
          message: "No family Stats found for the Year provided",
        });
      }

      // If counts are valid, return them in the response
      return res.json({
        familiesChildren, // Number of families with each number of children for the selected year
        familySituationCount, // Number of families for each situation
        familiesWithStudentsInYear,
      });
    } catch (error) {
      console.error("Error fetching monthly Stats :", error);
      return res
        .status(500)
        .json({ message: "Error retrieving enrolment data", error });
    }
  }

  if (selectedYear) {
   
    //console.log("selectedYear in getallfamilies", selectedYear);
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

    //console.log(families, "families retriecved");
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

    //console.log(updatedParentsArray,'updatedParentsArray')
    if (!filteredFamilies?.length) {
      return res.status(400).json({
        message: "No families with students found for the selected Year !",
      });
    } else {
      res.json(filteredFamilies);
    }
  }
  if (id) {
    if (req.query.criteria) {
      const criteria = req.query.criteria;
      //console.log("in teh criteria", criteria);
      if (criteria == "Dry") {
        //console.log("in teh dry");
        const family = await Family.find({ _id: id })
          .populate(
            "children.child",
            "-studentEducation -studentAdmissions -studentYears -studentGardien -studentDob -studentSex -studentIsActive -lastModified -operator"
          )
          .populate(
            "father",
            "-password -userSex  -username -userRoles -userAllowedActions"
          )
          .populate(
            "mother",
            "-password -userSex  -username -userRoles -userAllowedActions"
          )
          .lean();
        if (!family) {
          return res.status(400).json({ message: "No family found" });
        }
        if (family) {
          res.status(200).json(family);
          //console.log(family);
        }
      }
    } else {
      const families = await Family.find({ _id: id })
        .populate("children.child")
        .populate(
          "father",
          "-password -userSex  -username -userRoles -userAllowedActions"
        )
        .populate(
          "mother",
          "-password -userSex  -username -userRoles -userAllowedActions"
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
  //console.log("hellloooww");
  try {
    const { id, criteria } = req.params;
    //console.log(id, criteria);

    const path = "children.child";
    const selection = "_id studentName";

    //console.log("now in the controller to get family id", id);
    if (!id) {
      return res.status(400).json({ message: "Required data is missing" });
    }
    let family;
    if (criteria === "Dry") {
      //console.log("dry");
      family = await Family.findOne({ _id: id })
        .populate({ path: path, select: selection })
        .populate(
          "father",
          "-password",
          "-userSex",
          "-cin",
          "-username",
          "-userRoles",
          "-userAllowedActions"
        )
        .populate(
          "mother",
          "-password",
          "-userSex",
          "-cin",
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
          "-cin",
          "-username",
          "-userRoles",
          "-userAllowedActions"
        )
        .populate(
          "mother",
          "-password",
          "-userSex",
          "-cin",
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
    cin: fatherCin,
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
    !fatherCin ||
    !fatherPassword ||
    !fatherContact.primaryPhone ||
    !Array.isArray(fatherRoles) ||
    !fatherRoles.length
  ) {
    return res.status(400).json({ message: "Required data is missing" }); //400 : bad request
  }

  // Check for duplicate username/ if the user has no isParent we will update only the parent isParent and create it
  const duplicateFather = await User.findOne({ fatherUsername }).lean().exec(); //because we re receiving only one response from mongoose

  if (duplicateFather) {
    return res
      .status(409)
      .json({ message: "Duplicate username for Father found" });
  }

  // Hash password
  //console.log(password, 'password')
  const hashedFatherPwd = await bcrypt.hash(fatherPassword, 10); // salt roundsm we will implement it laterm normally password is without''

  // res.status(201).json({ message: `New user ${username} created successfully` })

  const fatherObject = { ...father, password: hashedFatherPwd }; //construct new user to be stored
  //console.log(fatherObject);
  const savedFather = await User.create(fatherObject);

  const {
    userFullName: motherFullName,
    username: motherUsername,
    password: motherPassword,
    userDob: motherDob,
    cin: motherCin,
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
    !motherCin ||
    !motherSex ||
    !motherPassword ||
    !motherContact.primaryPhone ||
    !Array.isArray(motherRoles) ||
    !motherRoles.length
  ) {
    return res.status(400).json({ message: "Required data is missing" }); //400 : bad request
  }
  // Check for duplicate username/ if the user has no isParent we will update only the parent isParent and create it
  const duplicateMother = await User.findOne({ motherUsername }).lean().exec(); //because we re receiving only one response from mongoose

  if (duplicateMother) {
    return res
      .status(409)
      .json({ message: "Duplicate username for Mother found" });
  }
  // Hash password
  const hashedMotherPwd = await bcrypt.hash(motherPassword, 10); // salt roundsm we will implement it laterm normally password is without''

  // res.status(201).json({ message: `New user ${username} created successfully` })

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

    const savedFamily = await Family.create(familyObject);
    if (!savedFamily) {
      return res.status(400).json({ message: "unable to save family" });
    }

    //update teh users with the familyId
    savedFather.familyId = savedFamily._id;
    savedMother.familyId = savedFamily._id;
    const finalFather = await savedFather.save();
    const finalMother = await savedMother.save();
    if (finalFather && finalMother) {
      return res.status(201).json({
        message: `New family, Father,
         and Mother created successfully`,
      }); //change parentYear later to show the parent full name
    } else {
      return res
        .status(400)
        .json({ message: "unable to update users with family Id" });
    }
  } else {
    //delete the user already craeted to be done

    res.status(400).json({ message: "unable to save one or two users" });
  }
}); //we need to delete the user if the parent is not saved

const updateFamily = asyncHandler(async (req, res) => {
  const { _id, father, mother, children, familySituation } = req.body; //this will come from front end we put all the fields ofthe collection here

  //saving teh father
  const {
    _id: fatherId,
    userFullName: fatherFullName,
    userDob: fatherDob,
    cin: fatherCin,
    userAddress: fatherAddress,
    userContact: fatherContact,
  } = father;

  //Confirm data for user will be checked by the user controller
  if (
    !fatherFullName ||
    !fatherDob ||
    !fatherCin ||
    !fatherContact.primaryPhone
  ) {
    return res.status(400).json({ message: "Required data is missing" }); //400 : bad request
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
  duplicateFather.cin = fatherCin;
  duplicateFather.userAddress = fatherAddress;
  duplicateFather.userContact = fatherContact;

  const savedFather = await duplicateFather.save();
  //console.log(savedFather, "savedFather");

  const {
    _id: motherId,
    userFullName: motherFullName,
    userDob: motherDob,
    cin: motherCin,
    userAddress: motherAddress,
    userContact: motherContact,
  } = mother;
  //Confirm data for user will be checked by the user controller
  if (
    !motherFullName ||
    !motherDob ||
    !motherCin ||
    !motherContact.primaryPhone
  ) {
    return res.status(400).json({ message: "Required data is missing" }); //400 : bad request
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
  duplicateMother.cin = motherCin;
  duplicateMother.userAddress = motherAddress;
  duplicateMother.userContact = motherContact;

  const savedMother = await duplicateMother.save();
  //console.log(savedMother, "savedMother");
  if (savedFather && savedMother) {
    //if father andmother updated, we update the family
    const duplicateFamily = await Family.findById(_id).exec();

    duplicateFamily.children = children;
    duplicateFamily.familySituation = familySituation; //it will only allow updating properties that are already existant in the model

    const savedFamily = await duplicateFamily.save();
    //console.log(savedFamily, "savedFamily");
    if (savedFamily) {
      res.status(201).json({
        message: `Family, father, & mother updated successfully`,
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
    return res.status(400).json({ message: "Required data is missing" });
  }

  // Does the parent exist to delete?
  const family = await Family.findById(id).exec();

  if (!family) {
    return res.status(400).json({ message: "Family not found" });
  }
  const { father, mother, children } = family;
  const fatherToDelete = await User.findById(father);

  //   if (!fatherToDelete) {
  //     return res.status(400).json({ message: "corresponding father not found" });//already not found to be deleted
  //   }
  //if user is also an employee, delete only the parent collection and keep user
  let deletedFather;
  let replyFather;
  if (!fatherToDelete.isEmployee) {
    deletedFather = await fatherToDelete.deleteOne();
    replyFather = `Deleted ${deletedFather?.deletedCount} father, `;
  }
  const motherToDelete = await User.findById(mother);
  let deletedMother;
  let replyMother;
  if (!motherToDelete.isEmployee) {
    deletedMother = await motherToDelete.deleteOne();
    replyMother = `${deletedMother?.deletedCount} mother, `;
  }
  const familyToDelete = await Family.findById(id);
  let deletedFamily;
  let replyFamily;

  deletedFamily = await familyToDelete.deleteOne();
  replyFamily = `and ${deletedFamily?.deletedCount} family`;

  const reply = `${replyFather}, ${replyMother} ${replyFamily}`;

  return res.json({ message: reply });
});

module.exports = {
  getAllFamilies,
  createNewFamily,
  updateFamily,
  deleteFamily,
  getFamilyById,
};
