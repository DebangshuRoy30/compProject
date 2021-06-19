const express = require("express");
const { body } = require("express-validator");

const userControllers = require("../controllers/userfunctions");

const isAuth = require("../middlewares/is-auth");

const User = require("../models/user");

const router = express.Router();

router.put(
  "/signup",
  [
    body("name").trim().notEmpty(),
    body("email")
      .isEmail()
      .withMessage("Please enter a valid Email!")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("Email address already exists!");
          }
        });
      }),
    body("phonenumber").trim().isMobilePhone(),
    body("password").trim().isLength({ min: 6 }),
  ],
  userControllers.signUp
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please check your entered email!"),
    body("password")
      .trim()
      .isLength({ min: 5 })
      .withMessage("Password must be minimum of length 5! Please do check it!"),
  ],
  userControllers.login
);

router.get("/allUsers", isAuth, userControllers.getAllUsers);

router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("Please check your entered email!")],
  userControllers.forgotPassword
);

router.post("/reset", [
  body("password").trim()
  .isLength({ min: 5 })
  .withMessage("Password must be minimum of length 5!"),
], userControllers.postRestPassword);

router.post("/logout", isAuth, userControllers.logout);

module.exports = router;
