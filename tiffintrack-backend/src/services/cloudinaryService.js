const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Streams the uploaded file straight to Cloudinary — no temp file ever
// touches your Render disk. Files land in a "tiffintrack/kitchens" folder
// so they're easy to find in the Cloudinary dashboard.
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "tiffintrack/kitchens",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1000, height: 1000, crop: "limit" }],
  },
});

// 5MB limit — a phone photo is typically 2-4MB, this leaves headroom
// without letting someone upload something huge on a free Cloudinary tier.
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = { cloudinary, upload };
