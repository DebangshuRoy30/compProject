const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

const Admin = require("../models/admin");
const User = require("../models/user");

exports.signUp = (req, res, next) => {
  const email = "debangshuroy060@gmail.com";
  const password = "Debangshu@30";
  bcrypt
    .hash(password, 12)
    .then((hashPassword) => {
      const admin = new Admin({
        email: email,
        password: hashPassword,
      });
      return admin.save();
    })
    .then((adminData) => {
      res.status(200).json({
        message: "Admin created!",
        admin: adminData._id,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.login = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("No admin Found!");
    error.statusCode = 422;
    throw error;
  }
  const email = req.body.email;
  const password = req.body.password;
  let loadedAdmin;
  Admin.findOne({ email: email })
    .then((admin) => {
      if (!admin) {
        const error = new Error("A admin with this email could not be found!");
        error.statusCode = 401;
        throw error;
      }
      loadedAdmin = admin;
      return bcrypt.compare(password, admin.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error("Wrong Password!");
        error.statusCode = 401;
        throw error;
      }
      const token = jwt.sign(
        {
          email: loadedAdmin.email,
          userId: loadedAdmin._id.toString(),
        },
        "mysecret",
        { expiresIn: "1h" }
      );
      res.status(200).json({
        token: token,
        userId: loadedAdmin._id.toString(),
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getAllUsers = (req, res, next) => {
  User.find({}, { name: 1, email: 1, _id: 0, phonenumber: 1 })
    .then((users) => {
      if (!users) {
        const error = new Error("No users found!");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({
        message: "Users Found",
        users: users,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.removeUser = (req, res, next) => {
  const userId = req.body.userId;
  User.findByIdAndRemove(userId)
    .then((done) => {
      if (!done) {
        const error = new Error("No such user!");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({
        message: "User Removed!",
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.logout = (req, res, next) => {
  res.status(200).json({
    token: "",
    userId: "",
  });
}
