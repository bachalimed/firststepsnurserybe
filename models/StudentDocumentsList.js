const mongoose = require('mongoose')


const studentDocumentsListSchema = new mongoose.Schema({
   
  
    documentsList:  [{
        documentReference: {type: mongoose.Schema.Types.ObjectId},
        documentTitle: {type: String, required:true, index: true},
        isRequired: {type: String, required:true, index: true},
        isLegalised: {type: String, required:true, index: true},
    }],
    documentsAcademicYear: {type: String, required:true, index: true},
   
})

module.exports = mongoose.model('studentDocumentsList', studentDocumentsListSchema,'studentDocumentsLists')
