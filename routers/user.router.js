var passport = require("passport"),
    requireSignin = passport.authenticate("local", { session: false }),
    requireAuth = passport.authenticate("jwt", { session: false }),
    router = require("express").Router(),
    userCtr = require("../controllers/user.controller");

router.post("/register", userCtr.register);
router.post("/login", requireSignin, userCtr.login);
router.post("/token-verification" ,userCtr.tokenVerification);
router.post("/login-with-token", userCtr.loginWithToken);
router.post("/payment-set", requireAuth, userCtr.paymentSet);
router.post("/setupProfileStep1", requireAuth, userCtr.setupProfileStep1);
router.post("/setupProfileStep2", requireAuth, userCtr.setupProfileStep2);
router.post("/profile-submit", requireAuth, userCtr.profileSubmit);
router.post("/upload-avatar", userCtr.uploadAvatar);
router.post("/subscribe", userCtr.subscribe);
router.post("/change-contact-info", requireAuth, userCtr.changeContactInfo);
router.post("/change-workingtime", requireAuth, userCtr.changeWorkingTime);
router.post("/change-avatar", requireAuth, userCtr.changeAvatar);
router.post("/change-title-website", requireAuth, userCtr.changeTitleWebsite);
router.post("/change-summary", requireAuth, userCtr.changeSummary);
router.post("/change-education", requireAuth, userCtr.changeEducation);
router.post("/send-verify-code", userCtr.sendVerifyCode);
router.post("/check-verify-code", userCtr.checkVerifyCode);
router.post("/change-password", userCtr.changePassword);

module.exports = router;