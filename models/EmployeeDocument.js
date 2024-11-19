const mongoose = require("mongoose");

function capitalizeFirstLetter(str) {
  if (typeof str !== "string" || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
} 

const employeeDocumentSchema = new mongoose.Schema({
  //id is already assigned automatically by mongo

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    required: true,
    ref: "Employee",
  },
  file: {
    type: String,
    required: true,
  },
  employeeDocumentReference: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    required: true,
    ref: 'EmployeeDocumentsList.documentsList',
  },
  employeeDocumentYear: {
    type: String,
    required: true,
  },
  employeeDocumentLabel: {
    type: String,
    set: capitalizeFirstLetter,
  },
});
module.exports = mongoose.model(
  "EmployeeDocument",
  employeeDocumentSchema,
  "employeeDocuments"
);
