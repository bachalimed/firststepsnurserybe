const mongoose = require('mongoose')

const parentsSchema = new mongoose.Schema({
   
  
    parentYear: {
        type: String,
        required: true
    },
    child: [{
        id:{
            type: String ,
            required: true,
            index:true}
    }],
    partner: {
        type: String,
        index:true}
})

module.exports = mongoose.model('Parents', parentsSchema)

