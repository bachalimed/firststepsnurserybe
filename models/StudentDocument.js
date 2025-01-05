const mongoose = require("mongoose");

function capitalizeFirstLetter(str) {
  if (typeof str !== "string" || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const studentDocumentSchema = new mongoose.Schema(
  {
    //id is already assigned automatically by mongo

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
      required: true,
      ref: "Student",
    },
    file: {
      type: String,
      required: true,
    },
    studentDocumentReference: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
      required: true,
      ref: "StudentDocumentsList.documentsList",
    },
    studentDocumentYear: {
      type: String,
      required: true,
    },
    studentDocumentLabel: {
      type: String,
      set: capitalizeFirstLetter,
    },
  },
  {
    timestamps: true, // Automatically create `createdAt` and `updatedAt` fields
  }
);
module.exports = mongoose.model(
  "StudentDocument",
  studentDocumentSchema,
  "studentDocuments"
);
