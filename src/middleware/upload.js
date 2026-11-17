const multer = require('multer');

// Memory storage keeps file buffer in memory for direct stream to Cloudinary
const storage = multer.memoryStorage();

// File filter for safety
const fileFilter = (req, file, cb) => {
  // Allow all standard safe file formats
  const disallowedExtensions = /\.(exe|bat|cmd|sh|vbs|msi)$/i;
  if (disallowedExtensions.test(file.originalname)) {
    const error = new Error('Executable and script file uploads are not permitted for security reasons.');
    error.statusCode = 400;
    return cb(error, false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max file size
  },
  fileFilter,
});

module.exports = upload;
