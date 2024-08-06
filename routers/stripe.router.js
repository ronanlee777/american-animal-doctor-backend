var passport = require("passport"),
    express = require("express"),
    requireAuth = passport.authenticate("jwt", { session: false }),
    router = require("express").Router(),
    stripeCtr = require("../controllers/stripe.controller");

router.post("/check-customer", requireAuth, stripeCtr.checkCustomer);
router.post("/create-customer", requireAuth, stripeCtr.createCustomer);
router.post("/create-subscription", requireAuth, stripeCtr.createSubscription);
router.post("/webhook",  stripeCtr.webhook);
router.post("/check-subscription", requireAuth, stripeCtr.checkSubscription);
router.post("/update-subscription", requireAuth, stripeCtr.updateSubscription);
router.post("/check-payment", requireAuth, stripeCtr.checkPayment);
router.post("/cancel-subscription", requireAuth, stripeCtr.cancelSubscription);
router.post("/create-products", requireAuth, stripeCtr.createProducts);
router.post("/create-prices", requireAuth, stripeCtr.createPrices);

module.exports = router;