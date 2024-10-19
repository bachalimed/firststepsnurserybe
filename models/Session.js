const mongoose = require("mongoose");

function capitalizeFirstLetter(str) {
  if (typeof str !== "string" || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const studentsSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId, // Reference to the user who created the session
      ref: "Student",
    },
  },
  { _id: false }
);

const gradesSchema = new mongoose.Schema(
  { type: String, enum: ["0", "1", "2", "3", "4", "5", "6", "7"] },
  { _id: false }
);
const sectionsSchema = new mongoose.Schema(
  { sectionName: { type: mongoose.Schema.Types.ObjectId } },
  { _id: false }
);

const SessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,

      set: capitalizeFirstLetter,
    },
    sessionYear: {
      type: String,
    },
    
    animator: {
      type: mongoose.Schema.Types.ObjectId, // Reference to the user who created the session
      ref: "User",
    },
    students: [studentsSchema],
    sessionType: {
      type: String,
    },
    description: {
      type: String,
      set: capitalizeFirstLetter,
    },
    subject: {
      type: String,
      set: capitalizeFirstLetter,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendedSchool",
    },
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
    },

    location: {
      type: String,
      set: capitalizeFirstLetter,
    },
    color: {
      type: String,
      default:"#ff5657"
     
    },
    trip: {
      type: String,
      set: capitalizeFirstLetter,
    },
    grades: [gradesSchema],
    sections: [sectionsSchema],
    note: {
      type: String,
    },
    recurrenceRule: {
      type: String, // Recurrence rule in iCalendar (RFC 5545) format (e.g., 'FREQ=DAILY;INTERVAL=1')
    },
    recurrenceID: {
      type: String, // To uniquely identify recurring instances
    },
    recurrenceException: {
      type: [Date], // Dates to exclude from the recurrence series
    },
    isAllDay: {
      type: Boolean,
      default: false,
    },
    isBlock: {
      type: Boolean,
      default: false,
    },
    isReadonly: {
      type: Boolean,
      default: false,
    },
    sessionStatus: {
      type: String,
      enum: ["Planned", "Executing", "Done", "Cancelled", "Postponed"],
      default: "New",
      set: capitalizeFirstLetter,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId, // Reference to the user who created the session
      ref: "User",
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

// Index for faster queries on recurring sessions
SessionSchema.index({ startTime: 1, endTime: 1 });

module.exports = mongoose.model("Session", SessionSchema, "sessions");
