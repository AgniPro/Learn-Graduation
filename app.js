//jshint esversion:6

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const sesssion = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
const _ = require("lodash");

const homeStartingContent = "Application are under progress so please visit to learngraduation.blogspot.com or click on below link"
const contactContent = "Contact us at agnipro(at)gmail(dot)com"
const aboutContent = "this is blog post templet designed by agnipro and the creator is abhidhek mehta"


const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));

app.use(sesssion({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());



mongoose.connect("mongodb+srv://agnipro:agnipro%40@agnipro.absogmm.mongodb.net/learngraduation", {
    useNewUrlParser: true
});

const postSchema = {
    _id: String,
    title: String,
    content: String
}
const Post = mongoose.model("Post", postSchema);


app.get("/", function (req, res) {

    Post.find({}, function (err, posts) {
        res.render("home", {
            startingContent: homeStartingContent,
            posts: posts,
        });
    });

});
app.get("/contact", function (req, res) {
    res.render("contact", {
        contactpg: contactContent
    });

});
app.get("/about", function (req, res) {
    res.render("about", {
        aboutpg: aboutContent
    });

});

app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/register", function (req, res) {
    res.render("register");

});

app.get("/", function (req, res) {
    User.find({"/":{$ne:null}}, function(err, foundUser){
     if(err){
         console.log(err);
     }else{
         if (foundUser){
             res.render("/", {userslogin: foundUser})
         }
     }
    });
 
 });
 
 app.get("/compose", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("compose");
    } else {
        res.redirect("/login");
    }

});

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});
passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: process.env.CALLBACK_URL,
        passReqToCallback: true
    },
    function (request, accessToken, refreshToken, profile, cb) {
        User.findOrCreate({
            googleId: profile.id
        }, function (err, user) {
            return cb(err, user);
        });
    }
));

app.get("/auth/google",
    passport.authenticate("google", {
        scope: ["email", "profile"]
    }));

app.get("/auth/google/compose",
    passport.authenticate("google", {
        successRedirect: "/compose",
        failureRedirect: "/login"
    }));

app.get("/logout", function (req, res) {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });

});

app.post("/register", function (req, res) {
    User.register({
        username: req.body.username
    }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/");
            })
        }
    })

});

app.post("/login", function (req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("compose");
            });
        }
    });
});

app.post("/submit", function (req, res) {
    const submittedSecret = req.body.secret;

    //Once the user is authenticated and their session gets saved, their user details are saved to req.user.
    // console.log(req.user.id);

    User.findById(req.user.id, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                foundUser.secret = submittedSecret;
                foundUser.save(function () {
                    res.redirect("/");
                });
            }
        }
    });
});


app.get("/posts/:postId", function (req, res) {

    const requestedPostId = req.params.postId;

    Post.findOne({
        _id: requestedPostId
    }, function (err, post) {
        res.render("post", {
            _id: post.purl,
            title: post.title,
            content: post.content,

        });
    });

});


app.listen(port, () => {
  console.log(`server is live ${port}`);
});