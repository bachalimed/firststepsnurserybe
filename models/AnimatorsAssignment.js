const mongoose = require("mongoose");



const assignmentsSchema = new mongoose.Schema(
  {
    animator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    schools: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    }],
  },
  { _id: false }
);


const AnimatorsAssignmentSchema = new mongoose.Schema(
  {
    assignementYear: {
      type: String,
      required: true,
    },
    assignments:[assignmentsSchema],

    assignedFrom: {
      type: Date,
      required: true,
    },
    assignedTo: {
      type: Date,
      required: true,
    },

    creator: {
      type: mongoose.Schema.Types.ObjectId, // Reference to the user who created the animatorsAssignment
      ref: "User",
    },
    operator: {
      type: mongoose.Schema.Types.ObjectId, // Reference to the user who created the animatorsAssignment
      ref: "User",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },

  {
    timestamps: true, // Automatically create `createdAt` and `updatedAt` fields
  }
);

// Index for faster queries on recurring animatorsAssignments
AnimatorsAssignmentSchema.index({ startTime: 1, endTime: 1 });

module.exports = mongoose.model(
  "AnimatorsAssignment",
  AnimatorsAssignmentSchema,
  "animatorsAssignments"
);
