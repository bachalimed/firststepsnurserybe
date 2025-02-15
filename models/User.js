const mongoose = require("mongoose");

function capitalizeFirstLetter(str) {
  if (typeof str !== "string" || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
const userSchema = new mongoose.Schema({
  //id is already assigned automatically by mongo
  userFullName: {
    userFirstName: {
      type: String,
      required: true,
      index: true,
      set: capitalizeFirstLetter,
    },
    userMiddleName: {
      type: String,
      index: true,
      set: capitalizeFirstLetter,
    },
    userLastName: {
      type: String,
      required: true,
      index: true,
      set: capitalizeFirstLetter,
    },
  },
  
  cin: { type: String, required: true, index: true, unique: true },
  username: { type: String, required: true, index: true, unique: true },
  password: { type: String, required: true, index: true },
  refreshToken: [{ type: String, index: true }],

  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    ref: "Employee",
  },
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    ref: "Family",
  },
  userDob: {
    type: Date,
    required: true,
  },
  userSex: {
    type: String,
    required: true,
  },
  userIsActive: {
    type: Boolean,

    default: true,
  },
  isForgotPassword: {
    type: Boolean,

    default: false,
  },
  userRoles: [
    {
      type: String,
      required: true,
      index: true,
    },
  ],
  userAllowedActions: [
    {
      type: String,
    },
  ],
  userPhoto: { type: String },
  // userPhotoLabel:{type: String},
  // userPhotoFormat:{type: String},
  userAddress: {
    house: { type: String },
    street: {
      type: String,
      set: capitalizeFirstLetter,
    },
    area: { type: String,
      set: capitalizeFirstLetter,
     },
    postCode: { type: String },
    city: {
      type: String,
      set: capitalizeFirstLetter,
    },
  },
  userContact: {
    primaryPhone: {
      type: String,
    },
    secondaryPhone: {
      type: String,
    },
    email: {
      type: String,
    },
  },
}, { timestamps: true }); // This option enables createdAt and updatedAt fields
module.exports = mongoose.model("User", userSchema, "users");