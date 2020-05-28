const HttpError = require("../models/http-error");
const { v4: uuid } = require("uuid");

let DUMMY_PLACES = [
  {
    id: "p1",
    title: "Empire state building",
    description: "One of the most famous buiding",
    location: {
      lat: 40.7484474,
      lng: -73.9871516,
    },
    address: "20 w new york",
    creator: "u1",
  },
  {
    id: "p2",
    title: "Taj mahal",
    description: "One of the most famous buiding",
    location: {
      lat: 40.7484474,
      lng: -73.9871516,
    },
    address: "20 w new york",
    creator: "u2",
  },
  {
    id: "p3",
    title: "Indian Parliament",
    description: "One of the most famous buiding",
    location: {
      lat: 40.7484474,
      lng: -73.9871516,
    },
    address: "20 w new york",
    creator: "u2",
  },
];

const getPlaceById = (req, res, next) => {
  const placeId = req.params.placeId;
  const place = DUMMY_PLACES.find((p) => {
    return p.id === placeId;
  });
  if (!place) {
    return next(new HttpError("Could not find a place for provided id.", 404));
  }
  res.json({ place });
};

const getPlacesByUserId = (req, res, next) => {
  const userId = req.params.userId;
  const places = DUMMY_PLACES.filter((place) => {
    return place.creator === userId;
  });
  if (places.length === 0) {
    return next(
      new HttpError("Could not find a place for provided user id.", 404)
    );
  }
  res.json({ places });
};

const createPlace = (req, res, next) => {
  const { title, description, coordinates, address, creator } = req.body;
  const createdPlace = {
    id: uuid(),
    title,
    description,
    location: coordinates,
    address,
    creator,
  };
  DUMMY_PLACES.push(createdPlace);
  res.status(201).json({ place: createdPlace });
};

const updatePlace = (req, res, next) => {
  const placeId = req.params.placeId;
  const { title, description } = req.body;
  const updatedPlace = { ...DUMMY_PLACES.find((p) => p.id === placeId) };
  const placeIndex = DUMMY_PLACES.findIndex((p) => p.id === placeId);
  updatedPlace.title = title;
  updatedPlace.description = description;
  DUMMY_PLACES[placeIndex] = updatedPlace;

  res.status(200).json({ place: updatedPlace });
};

const deletePlace = (req, res, next) => {
    const placeId = req.params.placeId;
    DUMMY_PLACES = DUMMY_PLACES.filter(place => place.id !== placeId);
    res.status(200).json({message: "Place deleted successfully"});
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
