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
  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate("places");
  } catch (e) {
    const error = new HttpError(e.message, 500);
    return next(500);
  }
  if (userWithPlaces.places.length === 0) {
    return next(
      new HttpError("Could not find a place for provided user id.", 404)
    );
  }
  res.json({
    places: userWithPlaces.places.map((place) =>
      place.toObject({ getters: true })
    ),
  });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Invalid inputs passed", 422));
  }
  const { title, description, address, creator } = req.body;
  let coordinates = {
    lat: 4.125,
    lng: -99.45,
  };
  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: req.file.path,
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
    await user.save({ session: sess });

    await sess.commitTransaction();
  } catch (e) {
    const error = new HttpError(e.message, 500);
    return next(error);
  }
  res.status(201).json({ place: createdPlace.toObject({ getters: true }) });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    throw new HttpError("Invalid inputs passed", 422);
  }
  const placeId = req.params.placeId;
  const { title, description } = req.body;

  let place;

  try {
    place = await Place.findById(placeId);
  } catch (e) {
    const error = new HttpError(e.message, 500);
    return next(error);
  }

  console.log(place.creator + " " + req.userData.userId);


  if (place.creator.toString() !== req.userData.userId) {
    const error = new HttpError(
      "You're not allowed to perform this action!",
      401
    );
    return next(error);
  }

  place.title = title;
  place.description = description;

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
    place = await Place.findById(placeId).populate("creator");
  } catch (e) {
    const error = new HttpError(e.message, 500);
    return next(error);
  }
  console.log(place.creator.id.toString() + " " + req.userData.userId);

  if (place.creator.id.toString() !== req.userData.userId) {
    const error = new HttpError(
      "You're not allowed to perform this action!",
      401
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError("Could not find a place with provided id", 500);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
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
