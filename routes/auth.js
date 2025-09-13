const express = require("express");
const { check, body } = require("express-validator");
const authController = require("../controllers/auth");
const User = require("../models/user");

const router = express.Router();

// sign-up
router.get("/sign-up", authController.getSignup);
router.post(
  "/sign-up",
  [
    check("myEmail")
      .isEmail()
      .withMessage("Please enter a vaild email")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("Email is already exist");
          }
        });
      })
      .normalizeEmail(),
    body(
      "myPassword",
      "Please enter a password with only number and text & at lest 5 charcters"
    )
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
    body("myPasswordC")
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.myPassword) {
          throw new Error("Password have to match");
        }
        return true;
      }),
  ],
  authController.postSignup
);

// Login
router.get("/login", authController.getLogin);
router.post(
  "/login",
  [
    check("myEmail")
      .isEmail()
      .withMessage("Please enter a vaild email")
      .normalizeEmail(),
    body(
      "myPassword",
      "Please enter a password with only number and text & at lest 5 charcters"
    )
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
  ],
  authController.postLogin
);

// Logout
router.post("/logout", authController.postLogout);

// reset password using Token
router.get("/reset", authController.getReset);
router.post("/reset", authController.postReset);

router.get("/reset/:token", authController.getNewPass);
router.post("/new-password", authController.postNewPass);

module.exports = router;
