const mongoose = require("mongoose");

function capitalizeFirstLetter(str) {
  if (typeof str !== "string" || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const SessionSchema = new mongoose.Schema(
  {
    // title: {
    //   type: String,
    //  // required: true,
    //   set: capitalizeFirstLetter,
    //  // enum: ["School, Nursery,Collect, Drop"],
    // },
    sessionType: {
      type: String,
      required: true,
      
      enum: ["School", "Nursery","Collect", "Drop"],
    },
    sessionYear: {
      type: String,
    },
    // animator: {//is only required for nursery type
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Employee",
    // },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
   
    Description: {
      type: String,
      set: capitalizeFirstLetter,
    },
    Subject: {
      type: String,
      set: capitalizeFirstLetter,
      required: true,
    },
    StartTime: {
      type: Date,
      required: true,
    },
    EndTime: {
      type: Date,
      required: true,
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendedSchool",
      required: true,
    },
    // classroom: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Classroom",
    // },
    //site: { type: String, required: true, set: capitalizeFirstLetter },

    // location: {
    //   type: String,
    //   set: capitalizeFirstLetter,
    // },
    color: {
      type: String,
      default: "#ff5657",
    },
    
    RecurrenceRule: {
      type: String, // Recurrence rule in iCalendar (RFC 5545) format (e.g., 'FREQ=DAILY;INTERVAL=1')
    },
    
    RecurrenceID: {
      type: String, // To uniquely identify recurring instances
     
    },
    FollowingID: {
      type: String, // To uniquely identify recurring instances
    },
    RecurrenceException: [{////////////////////////shoulnt be an array?
      type: String, // Dates to exclude from the recurrence series
    }],
    IsAllDay: {
      type: Boolean,
      default: false,
    },
    IsBlock: {
      type: Boolean,
      default: false,
     
    },
    IsReadonly: {
      type: Boolean,
      default: false,
    
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId, // Reference to the user who created the session
      ref: "User",
    },
    operator: {
      type: mongoose.Schema.Types.ObjectId, // Reference to the user who created the session
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

// Index for faster queries on recurring sessions
SessionSchema.index({ startTime: 1, endTime: 1 });

module.exports = mongoose.model("Session", SessionSchema, "sessions");
