const fileHelper = require("../util/file");
const Product = require("../models/product");
const { validationResult } = require("express-validator");

exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    pageTitle: "Add product",
    path: "/admin/add-product",
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: [],
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const price = req.body.price;
  const image = req.file;
  const decription = req.body.decrption;

  if (!image) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add product",
      path: "/admin/add-product",
      editing: false,
      products: {
        title: title,
        price: price,
        description: decription,
      },
      hasError: true,
      errorMessage: "Atteched file is not an image",
      validationErrors: [],
    });
  }

  // Validation for Add product
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add product",
      path: "/admin/add-product",
      editing: false,
      products: {
        title: title,
        price: price,
        description: decription,
      },
      hasError: true,
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  // image path
  const imageUrl = image.path;

  const product = new Product({
    title: title,
    price: price,
    description: decription,
    imageUrl: imageUrl,
    userId: req.user,
  });

  product
    .save()
    .then((result) => {
      console.log("Created Product");
      res.redirect("/admin/products");
    })
    .catch((err) => {
      //#1# handel the error by rendering the page an getting alert message
      // return res.status(422).render("admin/edit-product", {
      //   pageTitle: "Add product",
      //   path: "/admin/add-product",
      //   editing: false,
      //   products: {
      //     title: title,
      //     price: price,
      //     description: decrption,
      //     imageUrl: imageUrl,
      //   },
      //   hasError: true,
      //   errorMessage: "Database operation failed, please try again.",
      //   validationErrors: [],
      // });
      //#2# handel the error by redirecting to 500 error page
      // res.redirect("/500");

      //#3# handel the error by httpStatusCode new error
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect("/");
  }

  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return res.render("/");
      }
      res.render("admin/edit-product", {
        pageTitle: "Edit product",
        path: "admin/edit-product",
        editing: editMode,
        products: product,
        hasError: false,
        errorMessage: null,
        validationErrors: [],
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productID;

  const updatedTitle = req.body.title;
  const updatedImage = req.file;
  const updatedPrice = req.body.price;
  const updatedDesc = req.body.decrption;

  // Validation for Edit product
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Edit product",
      path: "/admin/add-product",
      editing: true,
      products: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc,
      },
      hasError: true,
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  Product.findById(prodId)
    .then((product) => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect("/");
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      // check befor updating the image
      if (updatedImage) {
        fileHelper.deleteFile(product.imageUrl);
        product.imageUrl = updatedImage.path;
      }

      return product.save().then((result) => {
        console.log("UPDATED PRODUCT!");
        res.redirect("/admin/products");
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;

  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return next(new Error("Product not found."));
      }
      // deleting the image link releted to deleted product
      fileHelper.deleteFile(product.imageUrl);

      // Deleting the whole product
      return Product.deleteOne({ _id: prodId, userId: req.user._id });
    })
    .then(() => {
      console.log("PRODUCT Deleted!");
      res.status(200).json({ message: "Successfuly Deleted!" });
    })
    .catch((err) => {
      res.status(500).json({ message: "Cannot Delete The Product" });
    });
};

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    .then((products) => {
      // console.log(products);
      res.render("admin/products", {
        prou: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
