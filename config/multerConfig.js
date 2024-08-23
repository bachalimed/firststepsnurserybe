const multer = require('multer');
const path = require('path');

// Define storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null,  '../uploads') // Specify the directory to save the files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Specify the file naming convention
  },
});

// // Define file filter function (optional)
// const fileFilter = (req, file, cb) => {
//   const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'));
//   }
// };

// Create the Multer instance
const upload = multer({
  storage: storage,
 // fileFilter: fileFilter,
 limits: { fileSize: 5000000 }, //max 5Mb
   // Limit file size to 5MB
})//max 10 files

module.exports = upload