const express = require("express");
const adminController = require("../controllers/admin");
const isAuth = require("../middleware/is-auth");
const { body } = require("express-validator");
const router = express.Router();

// /admin/products => GET
// All rendered products
router.get("/products", isAuth, adminController.getProducts);
// /admin/add-product => GET
// Add product
router.get("/add-product", isAuth, adminController.getAddProduct);
router.post(
  "/add-product",
  [
    body("title", "title charcter shoud more then 3 and String")
      .isLength({ min: 3 })
      .trim()
      .isString(),
    body("price", "shoud a dicemal number").isFloat(),
    body("decrption", "decription charcter shoud more then 12")
      .isLength({ min: 12, max: 200 })
      .trim(),
  ],
  isAuth,
  adminController.postAddProduct
);

// Edit product
router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);
router.post(
  "/edit-product",
  [
    body("title", "title charcter shoud more then 3 and String")
      .isLength({ min: 3 })
      .trim()
      .isString(),
    body("price", "shoud a dicemal number").isDecimal(),
    body("decrption", "decription charcter shoud more then 12")
      .isLength({ min: 12, max: 200 })
      .trim(),
  ],
  isAuth,
  adminController.postEditProduct
);

// Delete product
router.delete("/product/:productId", isAuth, adminController.deleteProduct);

module.exports = router;
