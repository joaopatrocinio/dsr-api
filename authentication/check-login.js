function checkLogin(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.status(403).json({ message: "You need to be logged in to make this request" })
    }
}

module.exports = checkLogin;