var passport = require("passport"),
    requireAuth = passport.authenticate("jwt", { session: false }),
    router = require("express").Router(),
    articleCtr = require("../controllers/articles.controller");

router.post("/search", articleCtr.search);
router.post("/submit", requireAuth, articleCtr.submit);
router.post("/get-by-id", articleCtr.getById);
router.post("/latest", articleCtr.latest);
router.post("/get-all-articles", articleCtr.getAllArticles);
router.post("/add-article", requireAuth, articleCtr.addArticle);
router.post("/remove", requireAuth, articleCtr.remove);

module.exports = router;