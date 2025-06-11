// Cloudinary configuration
export const cloudinaryConfig = {
  cloudName: 'dmgkk6yyw', // You'll need to replace this with your Cloudinary cloud name
  uploadPreset: 'ml_default', // You can create a custom upload preset in your Cloudinary settings
};

// Function to upload image to Cloudinary
export const uploadToCloudinary = async (base64Image) => {
  try {
    // Remove the data:image/jpeg;base64, prefix if it exists
    const base64Data = base64Image.includes('base64,') 
      ? base64Image.split('base64,')[1] 
      : base64Image;

    const formData = new FormData();
    formData.append('file', `data:image/jpeg;base64,${base64Data}`);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    return {
      url: data.secure_url,
      publicId: data.public_id
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};