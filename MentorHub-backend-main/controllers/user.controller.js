const cloudinary = require("cloudinary").v2;
const config = require("../config");
const userService = require("../services/user.service");
const httpStatus = require("../util/httpStatus");
const ApiError = require("../helper/apiError");
// Configure Cloudinary
cloudinary.config(config.cloudinary);

const uploadPhoto = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ 
      success: false,
      message: "No file uploaded" 
    });
  }

  try {
    console.log("Uploading file:", req.file.path);
    console.log("User ID:", req.user._id);
    
    let photoUrl;

    // Check if Cloudinary is configured
    if (config.cloudinary.cloud_name && config.cloudinary.api_key && config.cloudinary.api_secret) {
      // Use Cloudinary if configured
      console.log("Using Cloudinary for image upload");
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "user_photos",
        use_filename: true,
      });
      photoUrl = result.secure_url;
      console.log("Cloudinary upload result:", photoUrl);
    } else {
      // Fallback to local file storage
      console.log("Cloudinary not configured, using local file storage");
      const protocol = req.protocol;
      const host = req.get("host");
      // Generate URL: http://localhost:9900/uploads/filename.jpg
      photoUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
      console.log("Local file URL:", photoUrl);
    }

    // Update user with new photo URL
    const updatedUser = await userService.updateUserPhoto(
      req.user._id,
      photoUrl
    );

    if (!updatedUser) {
      console.error("User not found after photo update");
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    console.log("Updated user photoUrl:", updatedUser.photoUrl);

    res.status(200).json({
      success: true,
      message: "Photo uploaded successfully",
      photoUrl: updatedUser.photoUrl,
    });
  } catch (error) {
    console.error("Error uploading photo:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      success: false,
      message: error.message || "Error uploading photo. Please try again." 
    });
  }
};

const getUser = async (req, res, next) => {
  const userId = req.user._id;
  const user = await userService.getUserById(userId);

  if (!user) {
    return next(new ApiError(httpStatus.notFound, "User not found"));
  }

  res.status(httpStatus.ok).json({
    success: true,
    user,
  });
};

const updateUserProfile = async (req, res, next) => {
  const userId = req.user._id;
  const profileData = req.body;

  const updatedUser = await userService.updateUserProfile(userId, profileData);

  if (!updatedUser) {
    return next(new ApiError(httpStatus.notFound, "User not found"));
  }

  res.status(httpStatus.ok).json({
    success: true,
    message: "Profile updated successfully",
    user: updatedUser,
  });
};

module.exports = {
  uploadPhoto,
  getUser,
  updateUserProfile,
};
