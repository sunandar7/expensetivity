const fs = require('fs');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

/**
 * Uploads a local file to Cloudinary and deletes the local file.
 * @param {string} localFilePath - Path to the local file.
 * @param {string} folder - Folder name in Cloudinary.
 * @returns {Promise<{ url: string, publicId: string, resourceType: string }>}
 */
const uploadToCloudinary = async (fileInput, folder = 'expense-tracker') => {
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary is not configured.');
  }

  // Handle Buffer or Express File object with buffer (from multer.memoryStorage)
  const buffer = Buffer.isBuffer(fileInput) ? fileInput : fileInput?.buffer;
  if (buffer) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload_stream error:', error);
            return reject(error);
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: result.resource_type
          });
        }
      );
      uploadStream.end(buffer);
    });
  }

  // Handle local file path string (legacy disk storage)
  if (typeof fileInput === 'string') {
    try {
      const result = await cloudinary.uploader.upload(fileInput, {
        folder,
        resource_type: 'auto'
      });

      if (fs.existsSync(fileInput)) {
        fs.unlinkSync(fileInput);
      }

      return {
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      if (fs.existsSync(fileInput)) {
        fs.unlinkSync(fileInput);
      }
      throw error;
    }
  }

  throw new Error('Invalid file input provided to uploadToCloudinary.');
};

/**
 * Deletes a file from Cloudinary.
 * @param {string} publicId - The Cloudinary public ID.
 * @param {string} resourceType - The Cloudinary resource type (e.g., 'image', 'raw').
 * @returns {Promise<any>}
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  if (!isCloudinaryConfigured || !publicId) {
    return null;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return null;
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary
};
