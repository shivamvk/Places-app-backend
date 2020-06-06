const HttpError = require("../models/http-error");
const { v4: uuid } = require("uuid");
const { validationResult } = require("express-validator");
const User = require("../models/users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (e) {
    const error = new HttpError(e.message, 500);
    return next(error);
  }
  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError("Invalid inputs passed", 422);
    return next(error);
  }
  const { name, email, password } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (e) {
    const error = new HttpError(e.message, 500);
    return next(error);
  }
  if (existingUser) {
    const error = new HttpError("Email already exists", 422);
    return next(error);
  }

  let hashedPassword;
  hashedPassword = await bcrypt.hash(password, 12);

  const createdUser = new User({
    name,
    email,
    password: hashedPassword,
    image: req.file.path,
  });
  const token = jwt.sign(
    { userId: createdUser.id, email: createdUser.email },
    process.env.JWT_KEY,
    { expiresIn: "1h" }
  );
  try {
    await createdUser.save();
  } catch (e) {
    const error = new HttpError(e.message, 500);
    return next(error);
  }
  res.status(201).json({ userId: createdUser.id, token: token });
};

const login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs passed", 422));
  }
  const { email, password } = req.body;
  let identifiedUser;
  try {
    identifiedUser = await User.findOne({ email: email });
  } catch (e) {
    const error = new HttpError(e.message, 500);
    return next(error);
  }
  if (!identifiedUser) {
    return next(
      new HttpError("Please check your credentials and try again!", 401)
    );
  }
  let isValidPassword = false;
  try {
    isValidPassword = bcrypt.compare(
      password,
      identifiedUser.password.toString()
    );
  } catch (err) {
    return next(new HttpError("Server error!", 500));
  }
  if (!isValidPassword) {
    return next(
      new HttpError("Please check your credentials and try again!", 401)
    );
  }

  const token = jwt.sign(
    { userId: identifiedUser.id, email: identifiedUser.email },
    process.env.JWT_KEY,
    { expiresIn: "1h" }
  );

  res.status(201).json({
    userId: identifiedUser.id,
    token: token,
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
