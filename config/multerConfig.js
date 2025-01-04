const multer = require('multer')
const path = require('path')
const fs=require('fs')



// Ensure the 'uploads' directory exists
const uploadPath = path.join(__dirname, '/uploads');//////////changed from'../uploads/documents'
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

// Define storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null,  uploadPath) // Specify the directory to save the files
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Specify the file naming convention
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
const upload = multer({storage : storage})

module.exports = upload