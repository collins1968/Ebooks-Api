import {
  CreateCart,
  AddToCart,
  UpdateCart,
  RemoveFromCart,
  GetUserCart,
  getCartItems,
  GetTotal,
  PostPayment
} from "../controllers/PaymentControllers.js";

import { loginRequired } from "../controllers/UsersController.js";

export const paymentRoutes = (app) => {
  app.route("/carts")
   .post(CreateCart)
   .get(GetUserCart); 
  app.route("/cart/:cartId/items")
   .post(loginRequired, AddToCart)
   .get(loginRequired, getCartItems);
  app.route("/cart/:cartId/items/:itemId")
    .put(loginRequired, UpdateCart)
    .delete(loginRequired, RemoveFromCart);
  app.route("/cart/:cartId/total")
    .get(loginRequired, GetTotal);
  app.route("/create-payment-intent/:cartId")
    .post(PostPayment)
};
