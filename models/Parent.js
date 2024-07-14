const mongoose = require('mongoose')

const parentsSchema = new mongoose.Schema({
   
  
    parentYear: {
        type: String,
        required: true
    },
    child: [{
        id:{
            type: mongoose.Schema.Types.ObjectId ,
            required: true,
            index:true}
    }],
    partner: {
        type: mongoose.Schema.Types.ObjectId,
        index:true}
})

module.exports = mongoose.model('Parents', parentsSchema)

