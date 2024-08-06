var passport = require("passport"),
    router = require("express").Router(),
    doctorCtr = require("../controllers/doctors.controller");

router.post("/get-doctors-list", doctorCtr.getDoctorsList);
router.post("/getItembyId", doctorCtr.getItembyId);

module.exports = router;