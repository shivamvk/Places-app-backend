const HttpError = require("../models/http-error");
const { v4: uuid } = require("uuid");
const { validationResult } = require("express-validator");
const Place = require("../models/places");
const User = require("../models/users");
const mongoose = require("mongoose");

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.placeId;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (e) {
    const error = new HttpError(e.message, 500);
    return next(error);
  }
  if (!place) {
    return next(new HttpError("Could not find a place for provided id.", 404));
  }
  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.userId;
  let places;
  try {
    places = await Place.find({ creator: userId });
  } catch (e) {
    const error = new HttpError(e.message, 500);
    return next(500);
  }
  if (places.length === 0) {
    return next(
      new HttpError("Could not find a place for provided user id.", 404)
    );
  }
  res.json({
    places: places.map((place) => place.toObject({ getters: true })),
  });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    throw new HttpError("Invalid inputs passed", 422);
  }
  const { title, description, address, image, creator } = req.body;
  let coordinates = {
    lat: 4.125,
    lng: -99.45,
  };
  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: image,
    creator,
  });

  let user;
  try {
    user = await User.findById(creator);
  } catch (e) {
    const error = new HttpError(e.message, 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id", 500);
    return next(error);
  }

  try {
    //to make sure both the tasks get completed and not only one
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({session: sess});
    
    await sess.commitTransaction();
  } catch (e) {
    const error = new HttpError(e.message, 500);
    return next(error);
  }
  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    throw new HttpError("Invalid inputs passed", 422);
  }
  const placeId = req.params.placeId;
  const { title, description, image } = req.body;

  let place;

  try {
    place = await Place.findById(placeId);
  } catch (e) {
    const error = new HttpError(e.message, 500);
    return next(error);
  }

  place.title = title;
  place.description = description;
  place.image = image;

  try {
    await place.save();
  } catch (e) {
    const error = new HttpError(e.message, 500);
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.placeId;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (e) {
    const error = new HttpError(e.message, 500);
    return next(error);
  }
  try {
    place.remove();
  } catch (e) {
    const error = new HttpError(e.message, 500);
    return next(error);
  }
  res.status(200).json({ message: "Place deleted successfully" });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
