const { v2: cloudinary } = require("cloudinary");
require("dotenv").config();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.cloud_name, // Replace with your Cloudinary cloud name
  api_key: process.env.api_key, // Replace with your API key
  api_secret: process.env.api_secret, // Replace with your API secret
});

exports.uploadToCloudinary = async (imagePath) => {
  // console.log("=========================== uploadToCloudinary ========================");

  try {
    const uploadResult = await cloudinary.uploader.upload(imagePath, {
      resource_type: "image", // Ensure it's treated as an image
    });
    // console.log("uplaodResult: ", uploadResult);

    // Generate an optimized URL
    const optimizedUrl = cloudinary.url(uploadResult.public_id, {
      fetch_format: "auto",
      quality: "auto",
    });
    // console.log("optimizedUrl: ", optimizedUrl);

    // return { url: optimizedUrl, public_id: uploadResult.public_id };
    return optimizedUrl;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw new Error("Failed to upload image to Cloudinary");
  }
};

exports.deleteFromCloudinary = async (image) => {
  const publicId = image.split("/").pop().split(".")[0];
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("Cloudinary Delete Result:", result);
    if (result.result === "ok") {
      return true; // Image deleted successfully
    } /* else {
            throw new Error(`Failed to delete image: ${result.result}`);
        } */
  } catch (error) {
    console.error("Cloudinary Deletion Error:", error);
    throw new Error("Failed to delete image from Cloudinary");
  }
};
