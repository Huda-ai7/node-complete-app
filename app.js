const path = require("path");
const fs = require("fs");
const https = require("https");
const errorController = require("./controllers/error404");
const dotenv = require("dotenv").config();
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
// node pakges
const express = require("express"); // npm install --save express
const bodyParser = require("body-parser"); //npm install --save body-parser
// const expressHdbs = require("express-handlebars"); //we have to import this view engine

const mongoose = require("mongoose");
const session = require("express-session");
const mongodbStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
// make the website https
// const privateKey = fs.readFileSync("key.pem");
// const certificate = fs.readFileSync("cert.pem");

const flash = require("connect-flash");
const multer = require("multer");

const User = require("./models/user");

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.cs7t2em.mongodb.net/${process.env.MONGODB_NAME}`;

const app = express();
const store = new mongodbStore({
  uri: MONGODB_URI,
  collection: "sessions",
});
const csrfProtection = csrf();

// storing image in folder
const fileStorge = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toString() + "-" + file.originalname);
  },
});
// adding file filter argument
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
// view engine
// #ejs
app.set("view engine", "ejs");
app.set("views", "views"); // ('views','folder name that have all the html files')

const adminRouter = require("./routes/admin");
const shopRouter = require("./routes/shop");
const authRouter = require("./routes/auth");

// helmet middelware
app.use(helmet());
// compression middelware
app.use(compression());
// morgan middelware
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);
app.use(morgan("combined", { stream: accessLogStream }));

app.use(bodyParser.urlencoded({ extended: false }));

// image middelware
app.use(
  multer({ storage: fileStorge, fileFilter: fileFilter }).single("image")
);

// If you also use JSON requests:
app.use(express.json());

// adding the css file
app.use(express.static(path.join(__dirname, "public")));
// adding the images file
app.use("/images", express.static(path.join(__dirname, "images")));

app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

// User middleware
app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      next(new Error(err));
    });
});

// Using Express Router
app.use("/admin", adminRouter);
app.use(shopRouter);
app.use(authRouter);

// Adding a 500 an Error handling page
app.get("/500", errorController.get500);

// Adding a 404 Error page
app.use(errorController.get404);

// Error handing middelware
app.use((error, req, res, next) => {
  // res.redirect("/500");
  res.status(500).render("500", {
    pageTitle: "Error page",
    path: "/500",
    isAuthenticated: req.session.isLoggedIn,
  });
});

mongoose
  .connect(MONGODB_URI)
  .then((res) => {
    // make the website https
    // https
    //   .createServer({ key: privateKey, cert: certificate }, app)
    //   .listen(process.env.PORT || 3000);
    app.listen(process.env.PORT || 3000);
  })
  .catch((err) => console.log(err));
