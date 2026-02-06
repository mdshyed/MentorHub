const express = require("express");
const mentorController = require("../../controllers/mentor.controller");
const asyncHandler = require("../../helper/asyncHandler");

const router = express.Router();

// IMPORTANT: More specific routes (like "/") must come before parameterized routes (like "/:username")
router.get("/", asyncHandler(mentorController.getAllMentors));

router.get(
  "/:username",
  asyncHandler(mentorController.getMentorInfoByUsername)
);

module.exports = router;
