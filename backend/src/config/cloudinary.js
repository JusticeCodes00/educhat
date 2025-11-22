import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper function to upload base64 to Cloudinary
export const uploadBase64ToCloudinary = async (base64String, folder = 'educhat') => {
    try {
        const result = await cloudinary.uploader.upload(base64String, {
            folder: folder,
            resource_type: 'auto'
        });

        return {
            url: result.secure_url,
            publicId: result.public_id
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
    }
};

// Helper function to delete from Cloudinary
export const deleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw error;
    }
};

export default cloudinary;