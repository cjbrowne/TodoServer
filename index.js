var express = require('express'),
    app = express(),
    passport = require('passport'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    morgan = require('morgan'),
    mongoose = require('mongoose'),
    LocalStrategy = require('passport-local').Strategy,
    db,
    session = require('express-session'),
    config = require('./config.js');

app.use(bodyParser.json());
app.use(morgan());
app.use(session({secret: 'foobar'}));
app.use(cookieParser('foobar'));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(config.mongoose.database);
db = mongoose.connection;

db.on('error', function (error) {
    console.log('database error: ', error);
});

db.once('open', function () {
    var user = require('./db/user.js')(mongoose);

    passport.serializeUser(function (user, done) {
        return done(null, user._id);
    });

    passport.deserializeUser(function (id, done) {
        user.model.findOne({_id: id}, function (error, result) {
            if(error) {
                done(error);
            } else {
                done(null, result);
            }
        });
    });

    passport.use(new LocalStrategy(
        {
        usernameField: 'username',
        passwordField: 'password'
        },
        function (username, password, done) {
            user.model.findOne({username: username}, function (error, result) {
                if(error) {
                    done(error);
                } else {
                    if(result && result.password_hash === password) {
                        done(null, result);
                    } else {
                        done(null, false, 'Authentication failed');
                    }
                }
            });
        }
    ));

    app.post('/login', function (req, res, next) {
        passport.authenticate('local', function (err, user, info) {
            if(err) {
                return next(err);
            } else if (!user) {
                return res.redirect('/login/fail');
            } else {
                req.logIn(user, function (err) {
                    if(err) {
                        return next(err);
                    } else {
                        return res.redirect('/login/success');
                    }
                });
            }
        })(req,res,next);
    });

    app.post('*', function (req, res) {
        res.send(404, {
            status: 404,
            error: "Resource not found",
            requestedResource: req.url
        });
    });

    app.get('/login/:success', function (req, res) {
        var success = req.params.success === 'success';
        res.send(200, {
            status: 200,
            success: success
        });
    });

    app.get('/', function (req, res) {
        if(req.isAuthenticated())  {
            res.send(200, {
                user: req.user
            });
        } else {
            res.send(403, {
                status: 403,
                error: "User not authenticated",
                requestedResource: req.url
            });
        }
    });

    app.get('*', function (req, res) {
        res.send(404, {
            status: 404,
            error: "Resource not found",
            requestedResource: req.url
        });
    });

    app.listen(config.listenPort);
});

