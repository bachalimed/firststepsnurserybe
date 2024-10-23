const mongoose = require("mongoose");

function capitalizeFirstLetter(str) {
  if (typeof str !== "string" || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const studentsSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId, // Reference to the user who created the section
      ref: "Student",
    },
  },
  { _id: false }
);

const SectionSchema = new mongoose.Schema(
  {
    sectionType: {
      type: String,

      set: capitalizeFirstLetter,
    },
    sectionYear: {
      type: String,
    },

    operator: {
      type: mongoose.Schema.Types.ObjectId, // Reference to the user who created the section
      ref: "User",
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId, // Reference to the user who created the section
        ref: "Student",
      },
    ],
    serviceType: {
      type: String,
    },
    sectionLabel: {
      type: String,
      set: capitalizeFirstLetter,
    },

    sectionFrom: {
      type: Date,
      required: true,
    },
    sectionTo: {//the current section will not have an ending date
      type: Date,
      
    },

    sectionLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
    },
  },

  {
    timestamps: true, // Automatically create `createdAt` and `updatedAt` fields
  }
);

// Index for faster queries on recurring sections
SectionSchema.index({ startTime: 1, endTime: 1 });

module.exports = mongoose.model("Section", SectionSchema, "sections");
