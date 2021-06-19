const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sgMail = require("@sendgrid/mail");
const crypto = require("crypto");


sgMail.setApiKey(process.env.SENDGRID_KEY);

const User = require("../models/user");

exports.signUp = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Please provide valid credentials");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const email = req.body.email;
  const password = req.body.password;
  const name = req.body.name;
  const phonenumber = req.body.phonenumber;
  bcrypt
    .hash(password, 12)
    .then((hashPassword) => {
      const user = new User({
        name: name,
        email: email,
        phonenumber: phonenumber,
        password: hashPassword,
      });
      return user.save();
    })
    .then((userData) => {
      res.status(201).json({ message: "User Created", userId: userData._id });
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
    const error = new Error("Please provide valid credentials");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        const error = new Error("A user with this email could not be found!");
        error.statusCode = 401;
        throw error;
      }
      loadedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error("Wrong Password!");
        error.statusCode = 401;
        throw error;
      }
      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser._id.toString(),
        },
        "mysecret",
        { expiresIn: "1h" }
      );
      res.status(200).json({
        token: token,
        userId: loadedUser._id.toString(),
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

exports.forgotPassword = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Please provide valid credentials");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const email = req.body.email;
  let newToken;
  User.findOne({email: email})
  .then(user => {
    if (!user) {
      const error = new Error("Please check email!No such user")
      error.statusCode = 404;
      throw error;
    }
    crypto.randomBytes(32, (err, buffer) => {
      if (err) {
        const error = new Error("error in processing")
        error.statusCode = 500;
        throw error;
      }
      const token = buffer.toString("hex");
      user.resetToken = token;
      newToken = token;
      user.resetTokenExpiration = Date.now() + 3600000;
      return user.save()  
      .then(result => {
        sgMail.send({
          to: email,
          from: "debangshuroy060@gmail.com",
          subject: "Password Reset",
          html: `
        <p>You requested a password reset!</p>
        <p>Click this <a href="http://localhost:3030/reset/${token}">link</a> to set a new password</p>
        `,
        });
        res.status(200).json({
          message: "Rest Link has been send",
          resetToken: token
        });
      });
    })
  })
  .catch((err) => {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  })
};

exports.postRestPassword = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Please provide valid credentials");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const passwordToken = req.body.resetToken;
  const password = req.body.password;
  let resetUser;
  User.findOne({resetToken: passwordToken, resetTokenExpiration: {$gt: Date.now()}})
  .then(user => {
    if (!user) {
      const error = new Error("No such user")
      error.statusCode = 404;
      throw error;
    }
    resetUser = user;
    return bcrypt.hash(password, 12);
  })
  .then(hashPassword => {
    resetUser.password = hashPassword;
    resetUser.resetToken = undefined;
    resetUser.resetTokenExpiration = undefined;
    return resetUser.save();
  })
  .then(result => {
    res.status(200).json({message: "password changed"})
  })
  .catch((err) => {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  })
};

exports.logout = (req, res, next) => {
  res.status(200).json({
    token: "",
    userId: "",
  });
}
