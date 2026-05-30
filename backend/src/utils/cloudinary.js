const fs = require('fs');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

/**
 * Uploads a local file to Cloudinary and deletes the local file.
 * @param {string} localFilePath - Path to the local file.
 * @param {string} folder - Folder name in Cloudinary.
 * @returns {Promise<{ url: string, publicId: string, resourceType: string }>}
 */
const uploadToCloudinary = async (localFilePath, folder = 'expense-tracker') => {
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary is not configured.');
  }

  try {
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder,
      resource_type: 'auto'
    });

    // Remove local file after successful upload to Cloudinary
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    // Remove local file if upload fails to avoid local leakage
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    throw error;
  }
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
