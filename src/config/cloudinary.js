const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

/**
 * Check if Cloudinary credentials are fully provided
 */
const isCloudinaryConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
};

/**
 * Upload buffer to Cloudinary or fallback to local storage
 * @param {Buffer} buffer - File buffer
 * @param {string} originalname - Original file name
 * @param {string} mimetype - MIME type
 * @returns {Promise<{ fileUrl: string, publicId: string, storageType: string }>}
 */
const uploadFile = async (buffer, originalname, mimetype) => {
  // If Cloudinary credentials are configured, try uploading to Cloudinary
  if (isCloudinaryConfigured()) {
    try {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'freelance_workspaces',
            resource_type: 'auto',
            public_id: `${Date.now()}_${path.parse(originalname).name.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(buffer);
      });

      return {
        fileUrl: result.secure_url || result.url,
        publicId: result.public_id,
        storageType: 'cloudinary',
      };
    } catch (err) {
      console.warn('⚠️ Cloudinary upload failed, falling back to local storage:', err.message);
    }
  }

  // Fallback to local storage (e.g. dev mode without keys)
  const uploadsDir = path.join(__dirname, '../../uploads/workspaces');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const safeName = `${Date.now()}_${originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const filePath = path.join(uploadsDir, safeName);
  fs.writeFileSync(filePath, buffer);

  const baseUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
  return {
    fileUrl: `${baseUrl}/uploads/workspaces/${safeName}`,
    publicId: safeName,
    storageType: 'local',
  };
};

/**
 * Delete file from Cloudinary or local storage
 * @param {string} publicId - Storage public ID
 * @param {string} storageType - 'cloudinary' or 'local'
 */
const deleteFile = async (publicId, storageType = 'cloudinary') => {
  if (storageType === 'cloudinary') {
    if (!isCloudinaryConfigured()) {
      throw new Error('Cloudinary is not configured; the stored file cannot be deleted.');
    }

    let lastResult;
    let lastError;
    for (const resourceType of ['image', 'video', 'raw']) {
      try {
        lastResult = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        if (lastResult.result === 'ok') return lastResult;
      } catch (error) {
        lastError = error;
      }
    }
    if (lastError) throw lastError;
    if (lastResult?.result === 'not found') return lastResult;
    throw new Error(lastResult?.message || 'Cloudinary did not confirm file deletion.');
  }

  // Local storage cleanup
  const filePath = path.join(__dirname, '../../uploads/workspaces', path.basename(publicId));
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  uploadFile,
  deleteFile,
};
