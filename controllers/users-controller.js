const HttpError = require("../models/http-error");
const { v4: uuid } = require("uuid");
const { validationResult } = require("express-validator");
const User = require("../models/users");

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
  const { name, email, password, image } = req.body;
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
  const createdUser = new User({
    name,
    email,
    password,
    image: "https://live.staticflickr.com/7631/26849088292_36fc52ee90_b.jpg",
  });
  try {
    await createdUser.save();
  } catch (e) {
    const error = new HttpError(e.message, 500);
    return next(error);
  }
  res.status(201).json({ user: createdUser.toObject({ getUsers: true }) });
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
    return next(new HttpError("Email not registered", 401));
  }
  if (identifiedUser.password !== password) {
    return next(new HttpError("Incorrect password.", 401));
  }
  res.json({ message: "Logged in." });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
