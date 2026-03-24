const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const verifyToken = require('../middleware/auth');

router.post('/addtocart', verifyToken, cartController.addToCart);
router.get('/getcart', verifyToken, cartController.getCart);
router.put('/updatecart', verifyToken, cartController.updateCart);
router.delete('/deletecartitem/:cartItemId', verifyToken, cartController.deleteCartItem);
router.get('/latestcartitem', verifyToken, cartController.getLatestCartItem);

module.exports = router;
