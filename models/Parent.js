const mongoose = require('mongoose')
const User = require ('./User')

const parentSchema = new mongoose.Schema({
   
  
    parentYear: {
        type: String,
        required: true
    },
    children: [
        {type: mongoose.Schema.Types.ObjectId ,
            ref:'Student',//this is added to refernce student model revisit
        required: true,
         index:true}
    ],
    partner: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'Parent',//this is added to refernce Parent model revisit
        index:true}
})

module.exports = mongoose.model('Parent', parentSchema,'parents');