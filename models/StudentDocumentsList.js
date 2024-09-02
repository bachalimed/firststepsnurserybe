const mongoose = require('mongoose')

const documentsListSchema = new mongoose.Schema({
    documentReference: {type: mongoose.Schema.Types.ObjectId},
    documentTitle: {type: String, required:true, index: true},
    isRequired: {type: Boolean, required:true, index: true},
    isLegalised: {type: Boolean, required:true, index: true},
}, { _id: false }) // Disable the creation of _id for this subdocument

const studentDocumentsListSchema = new mongoose.Schema({
    documentsList:  [documentsListSchema],
    documentsAcademicYear: {type: String, required:true, index: true},
})
module.exports = mongoose.model('studentDocumentsList', studentDocumentsListSchema,'studentDocumentsLists')
