function userSession(req, res, next) {
    res.locals.userId = req.session.userId || null;
    res.locals.userName = req.session.userName || null;
    next();
}

module.exports = userSession;