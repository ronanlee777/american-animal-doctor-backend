var passport = require("passport"),
    requireAuth = passport.authenticate("jwt", { session: false }),
    router = require("express").Router(),
    adminCtr = require("../controllers/admin.controller");

router.post("/get-request-user", requireAuth, adminCtr.getRequestUser);
router.post("/get-active-user", requireAuth, adminCtr.getActiveUser);
router.post("/delete-permission", requireAuth, adminCtr.deletePermission);
router.post("/allow-permission", requireAuth, adminCtr.allowPermission);
router.post("/request-accept", requireAuth, adminCtr.requestAccept);
router.post("/remove-user", requireAuth, adminCtr.removeUser);

module.exports = router;