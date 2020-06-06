const { Router } = require("express");
const { check } = require("express-validator");
const fileUpload = require("../middleware/file-upload");
const placesController = require("../controllers/places-controller");
const checkAuth = require("../middleware/check-auth");
const router = Router();

router.get("/:placeId", placesController.getPlaceById);
router.get("/user/:userId", placesController.getPlacesByUserId);

router.use(checkAuth);

router.post(
  "/",
  fileUpload.single("image"),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
    check("creator").notEmpty(),
  ],
  placesController.createPlace
);
router.patch(
  "/:placeId",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  placesController.updatePlace
);
router.delete("/:placeId", placesController.deletePlace);

module.exports = router;
