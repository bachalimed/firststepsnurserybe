const express = require('express')
const router = express.Router()
const usersController = require('../controllers/usersController')
const multer = require('multer')//will help for upload of files to backend


const photoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '/uploads/photos');
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
console.log('in the photstorage router now')
const upload = multer({ photoStorage });

router.post('newUser/', upload.single('userPhoto'), usersController.createNewUser)//this '/' is now  'usersManagemnt/newUSer because we are inrtercepting the user controller see the server.js
    
    
module.exports = router
