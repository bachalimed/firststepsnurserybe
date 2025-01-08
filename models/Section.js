const mongoose = require("mongoose");

function capitalizeFirstLetter(str) {
  if (typeof str !== "string" || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}



const SectionSchema = new mongoose.Schema(
  {
    // sectionType: {
    //   type: String,

    //   set: capitalizeFirstLetter,
    // },
    sectionLabel: {
      type: String,
      required:true,
      set: capitalizeFirstLetter,
    },
    sectionYear: {
      type: String,
      required:true,
    },
    sectionAnimator: {
      type: mongoose.Schema.Types.ObjectId, // Reference to the user who created the section
      ref: "Employee",
      required:true,
    },

    students: [
      {
        type: mongoose.Schema.Types.ObjectId, // Reference to the user who created the section
        ref: "Student",
      },
    ],
    sectionColor: { type: String, index: true, default: "#5978ee" },
    sectionType: {
      type: String,
    },

    sectionFrom: {
      type: Date,
      required: true,
    },

    sectionTo: {
      //the current section will not have an ending date
      type: Date,
      default: null,//we will ensure the curretn is empty string
    },

    sectionLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required:true,
    },
    operator: {
      type: mongoose.Schema.Types.ObjectId, // Reference to the user who created the section
      ref: "User",
      required:true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId, // Reference to the user who created the section
      ref: "User",
      required:true,
    },
  },

  {
    timestamps: true, // Automatically create `createdAt` and `updatedAt` fields
  }
);

// Index for faster queries on recurring sections
SectionSchema.index({ startTime: 1, endTime: 1 });

module.exports = mongoose.model("Section", SectionSchema, "sections");
