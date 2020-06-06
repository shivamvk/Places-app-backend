const jwt = require("jsonwebtoken");
const HttpError = require("../models/http-error");

module.exports = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }
  try {
    const token = req.header("Authorization").split(" ")[1];
    if (!token) {
      throw new Error("Auth failed!");
    }
    const data = jwt.verify(token, process.env.JWT_KEY);
    req.userData = { userId: data.userId };
    next();
  } catch (err) {
    const error = new HttpError(err.message, 403);
    return next(error);
  }
};
