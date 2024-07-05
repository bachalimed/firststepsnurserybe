const mongoose = require('mongoose')

const parentsSchema = new mongoose.Schema({
   
    parentUserId: {
        type: String,
        required: true
    },
    parentYear: {
        type: String,
        required: true
    },
    child: [{
        Id:{
            type: mongoose.ObjectId ,
            required: true,
            index:true}
    }],
    partner: {
        type: mongoose.ObjectId ,
        index:true
    }
})

module.exports = mongoose.model('Parents', parentsSchema)

