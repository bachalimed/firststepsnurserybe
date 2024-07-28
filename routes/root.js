const express = require ('express')
const router = express.Router()
const path = require('path')


//uses only routes with only root slah or /index with html optional extention
router.get('^/$|/index(.html)?', (req, res) =>{
    res.sendFile(path.join(__dirname, '..', 'views', 'index.html')) //where to llok for the file
} )

module.exports = router
