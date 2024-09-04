const mongoose = require('mongoose')


const parentSchema = new mongoose.Schema({
   
  
    
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