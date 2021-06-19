const express = require("express");
const { body } = require("express-validator");

const router = express.Router();

const adminController = require("../controllers/adminfunctions");
const isAuth = require("../middlewares/is-auth");

router.put("/signup", adminController.signUp);

router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid Email!"),
    body("password").trim().isLength({ min: 6 }),
  ],
  adminController.login
);

router.get("/allUsers", isAuth, adminController.getAllUsers);

router.post("/removeUser", isAuth, adminController.removeUser);

router.post("/logout", isAuth, adminController.logout);

module.exports = router;
