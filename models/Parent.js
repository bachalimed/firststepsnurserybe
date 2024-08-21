const mongoose = require('mongoose')
const User = require ('./User')

const parentSchema = new mongoose.Schema({
   
  
    parentYears:  [{academicYear: {type: String, index: true}}],
    children: [
        {type: mongoose.Schema.Types.ObjectId ,
            ref:'Student',//this is added to refernce student model revisit
        
         index:true}
    ],
    partner: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'Parent',//this is added to refernce Parent model revisit
        index:true}
})

module.exports = mongoose.model('Parent', parentSchema,'parents');