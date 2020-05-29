const HttpError = require("../models/http-error");
const { v4: uuid } = require("uuid");
const { validationResult } = require("express-validator");

const DUMMY_USERS = [
  {
    id: "u1",
    name: "test",
    email: "tes@gmail.com",
    password: "test123",
  },
];

const getUsers = (req, res, next) => {
  res.json({ users: DUMMY_USERS });
};

const signup = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    throw new HttpError("Invalid inputs passed", 422);
  }
  const { name, email, password } = req.body;
  const createdUser = {
    id: uuid(),
    name,
    email,
    password,
  };
  DUMMY_USERS.push(createdUser);
  res.status(201).json({ user: createdUser });
};

const login = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    throw new HttpError("Invalid inputs passed", 422);
  }
  const { email, password } = req.body;
  const identifiedUser = DUMMY_USERS.find((u) => u.email === email);
  if (!identifiedUser) {
    throw new HttpError("Email not registered", 401);
  }
  if (identifiedUser.password !== password) {
    throw new HttpError("Incorrect password.", 401);
  }
  res.json({ message: "Logged in." });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
