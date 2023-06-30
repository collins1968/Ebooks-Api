import Stripe from 'stripe';
import sql from 'mssql';
import config from '../db/config.js';
import { connectDB } from '../utils/database.js';
function generateCartId() {
  const randomNumber = Math.floor(10000 + Math.random() * 90000);
  return randomNumber.toString();
}



//get the cart ite for the user
export const GetCart = async (req, res) => {
  try {
    // const cartId = req.params.cartId;
    const cartItems = await sql.query(
      `SELECT book_id, quantity
       FROM CartItems
       WHERE cart_id = ${cartId} `
    );
    res.status(200).json(cartItems.recordset);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
  finally {
    // sql.close()
  }
}


//get the cart items for the user
export const GetUserCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    let pool = await connectDB();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(
        `SELECT *
         FROM Carts
         WHERE user_id = @userId`
      );

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const cart = result.recordset[0];
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
};
}



//create a cart for the user when they register or log in
export const CreateCart = async (req, res) => {
  try {
    const {userId} = req.body;
    const cartId = generateCartId();
    let pool = await connectDB();
    const result = await pool.request()
    
    
    .input('cartId', sql.Int, cartId)
    .input('userId', sql.Int, userId)
    .input('created_at', sql.DateTime, new Date())
    .input('updated_at', sql.DateTime, new Date())
    .query(`
    SET IDENTITY_INSERT Carts ON;
    INSERT INTO Carts (cart_id, user_id, created_at, updated_at)
    VALUES (@cartId, @userId, @created_at, @updated_at);
    SET IDENTITY_INSERT Carts OFF;
    SELECT @cartId AS cartId;
  `);

    res.status(200).json({ message: 'Cart created successfully', cartId: cartId  });
    console.log(cartId);
    
  } catch (error) {
    res.status(201).json({ error: error.message }); 
  }
}

// get cart items
export const getCartItems = async (req, res) => {
  try {
    // const {cartId} = req.params;
    const cartId = req.params.cartId;
    let pool = await connectDB();
    const result = await pool.request()
    .query(
      `SELECT c.cart_item_id, c.cart_id, b.title, b.price, c.quantity, b.image
        FROM CartItems c
        Join Books b ON c.book_id = b.book_id
        WHERE cart_id = ${cartId}`
    );
    res.status(200).json(result.recordset);
  } catch (error) {
    res.status(201).json({ error: error.message });
  }
}

// export const AddToCart = async (req, res) => {
//   try {
//     const cartId = req.params.cartId;
//     const { bookId, quantity } = req.body;
//     let pool = await connectDB();

//     // Check if the book already exists in the cart
//     const existingCartItem = await pool
//       .request()
//       .input('cartId', sql.Int, cartId)
//       .input('bookId', sql.Int, bookId)
//       .query(
//         `SELECT *
//          FROM CartItems
//          WHERE cart_id = @cartId
//            AND book_id = @bookId`
//       );

//     if (existingCartItem.recordset.length > 0) {
//       // Update the quantity if the book already exists
//       await pool
//         .request()
//         .input('cartId', sql.Int, cartId)
//         .input('bookId', sql.Int, bookId)
//         .input('quantity', sql.Int, quantity)
//         .query(
//           `UPDATE CartItems
//            SET quantity = @quantity, updated_at = GETDATE()
//            WHERE cart_id = @cartId
//              AND book_id = @bookId`
//         );
//     } else {
//       // Insert a new record if the book doesn't exist
//       await pool
//         .request()
//         .input('cartId', sql.Int, cartId)
//         .input('bookId', sql.Int, bookId)
//         .input('quantity', sql.Int, quantity)
//         .query(
//           `INSERT INTO CartItems (cart_id, book_id, quantity, created_at, updated_at)
//            VALUES (@cartId, @bookId, @quantity, GETDATE(), GETDATE())`
//         );
//     }

//     res.status(200).json({ message: 'Book added to cart successfully' });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

//add a book to the cart
export const AddToCart = async (req, res) => {
  try {
    const  cartId  = req.params.cartId;
    const { bookId, quantity } = req.body;
    const pool = await connectDB();
    const request = pool.request();
    request.input('cartId', sql.Int, cartId);
    request.input('bookId', sql.Int, bookId);
    request.input('quantity', sql.Int, quantity);
    request.input('createdAt', sql.DateTime, new Date());
    request.input('updatedAt', sql.DateTime, new Date());

    const query = `
      INSERT INTO CartItems (cart_id, book_id, quantity, created_at, updated_at)
      VALUES (@cartId, @bookId, @quantity, @createdAt, @updatedAt)`;

    const result = await request.query(query);

    res.status(200).json({ message: 'Book added to cart successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//update the quantity of a book in the cart
export const UpdateCart = async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const { quantity } = req.body;
    let pool = await connectDB();
   await pool.request()
   .input("itemId", sql.Int, itemId )
   .input("quantity", sql.Int, quantity)
    .query(
      `UPDATE CartItems
       SET quantity = @quantity, updated_at = GETDATE()
       WHERE cart_item_id = @itemId`
    );
  } catch (error) {
    res.status(201).json({ error: message.error});
  }  
}


//remove a book from the cart
export const RemoveFromCart = async (req, res) => {
  try {
    const itemId   = req.params.itemId;
    await connectDB();
    // console.log(itemId);
    await sql.query(
      `DELETE FROM CartItems WHERE cart_item_id = ${itemId}`
    );
    res.status(200).json({message: 'item deleted successfully'})
  } catch (error) {
    res.status(201).json({ error: error.message });
  }
}

//calculate total amount
export const GetTotal = async (req, res) => {
  try {
    const cartId = req.params.cartId;
    const pool = await connectDB();
    const result = await pool
      .request()
      .input('cartId', sql.Int, cartId)
      .query(`
        SELECT SUM(ci.quantity * b.price) AS total_amount
        FROM CartItems ci
        INNER JOIN Books b ON ci.book_id = b.book_id
        WHERE ci.cart_id = @cartId
      `);
    const totalAmount = result.recordset[0].total_amount;
    res.json({ total_amount: totalAmount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



//proceed to checkout and create an order
export const Checkout = async (req, res) => {
  try {
    const userId = req.body.userId;
    const totalAmount = req.body.totalAmount;
    const orderDate = new Date().toISOString().split('T')[0];

    // Connect to the database
    await connectDB();

    // Begin a database transaction
    await sql.query('BEGIN');

    // Create a new order record
    const result = await sql.query(
      `INSERT INTO Orders (user_id, total_amount, order_date, created_at, updated_at)
       OUTPUT INSERTED.order_id
       VALUES (${userId}, ${totalAmount}, '${orderDate}', GETDATE(), GETDATE())`
    );

    const orderId = result.recordset[0].order_id;

    // Retrieve the cart items for the user
    const cartItems = await sql.query(
      `SELECT book_id, quantity
       FROM CartItems
       WHERE cart_id = ${cartId}`
    );

    // Insert the cart items as order item records
    for (const cartItem of cartItems.recordset) {
      await sql.query(
        `INSERT INTO OrderItems (order_id, book_id, quantity, created_at, updated_at)
         VALUES (${orderId}, ${cartItem.book_id}, ${cartItem.quantity}, GETDATE(), GETDATE())`
      );
      }

    // Clear the user's cart by deleting the cart item records
    await sql.query(`DELETE FROM CartItems WHERE cart_id = ${cartId}`);

    // Commit the transaction
    await sql.query('COMMIT');

    // Close the database connection
    // await sql.close();

    res.sendStatus(201);
  } catch (err) {
    console.error(err);

    // Rollback the transaction in case of any errors
    await sql.query('ROLLBACK');

    res.status(500).json({ error: 'Failed to create order' });
  }
}

//checkout using stripes


// Stripe secret key

const stripe = new Stripe('sk_test_51NM8u2LGQyKikAGGwFg0GZq0y1Wjc6w06B2RntwLuC28Tsy2QVuGNnP8gGOzx7MrW3z5ZAGArok6Y5bxSIQ76z5k00QE5QYyGV');

// testing stripe payment
export const PostPayment = async (req, res) => {


    const calculateOrderAmount = (items) => {
        // Replace this constant with a calculation of the order's amount
        // Calculate the order total on the server to prevent
        // people from directly manipulating the amount on the client
        return 1400;
      };
      const { items } = req.body;
       // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: calculateOrderAmount(items),
    currency: "usd",
    automatic_payment_methods: {
      enabled: true,
    },
  });
  res.send({
    clientSecret: paymentIntent.client_secret,
  });
    }

//integrating checkout using stripes
export const CheckoutStripes = async(req, res) => {
  try {
    const  cartId  = req.params.cartId;
    const {userId} = req.body;
    //  const userId = req.body.userId;
    const totalAmount = req.body.totalAmount;
    const orderDate = new Date().toISOString().split('T')[0];

    // Connect to the database
    await connectDB();

    // Begin a database transaction
    // await sql.query('BEGIN TRANSACTION');

    // Create a new order record
    const result = await sql.query(
      `INSERT INTO Orders (user_id, total_amount, order_date, created_at, updated_at)
       OUTPUT INSERTED.order_id
       VALUES (${userId}, ${totalAmount}, '${orderDate}', GETDATE(), GETDATE())`
    );

    const orderId = result.recordset[0].order_id;

    // Retrieve the cart items for the user
    const cartItems = await sql.query(
      `SELECT book_id, quantity
       FROM CartItems
       WHERE cart_id = ${cartId}`
    );

    // Insert the cart items as order item records
    for (const cartItem of cartItems.recordset) {
      await sql.query(
        `INSERT INTO OrderItems (order_id, book_id, quantity, created_at, updated_at)
         VALUES (${orderId}, ${cartItem.book_id}, ${cartItem.quantity}, GETDATE(), GETDATE())`
      );
    }

    // Clear the user's cart by deleting the cart item records
    await sql.query(`DELETE FROM CartItems WHERE cart_id = ${cartId}`);

    // Commit the transaction
    // await sql.query('COMMIT');

    // Close the database connection
    

    // Create a payment intent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount * 100, // Stripe accepts amount in cents
      currency: 'usd',
      payment_method_types: ['card'],
    });

    res.status(201).json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);

    // Rollback the transaction in case of any errors
    // await sql.query('ROLLBACK');

    res.status(500).json({ error: 'Failed to create order' });
  }
}




