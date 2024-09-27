const mongoose = require("mongoose");

function capitalizeFirstLetter(str) {
  if (typeof str !== "string" || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const documentsListSchema = new mongoose.Schema(
  {
    documentReference: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true, // Ensures each document has a unique reference
      index: true,
    },
    documentTitle: {
      type: String,
      required: true,
      index: true,
      set: capitalizeFirstLetter,
    },
    isRequired: {
      type: Boolean,
      required: true,
      index: true,
    },
    isLegalised: {
      type: Boolean,
      required: true,
      index: true,
    },
  },
  { _id: false }
); // Disable the creation of _id for this subdocument

const studentDocumentsListSchema = new mongoose.Schema({
  documentsList: [documentsListSchema],
  documentsAcademicYear: { type: String, required: true, index: true },
});
module.exports = mongoose.model(
  "studentDocumentsList",
  studentDocumentsListSchema,
  "studentDocumentsLists"
);
