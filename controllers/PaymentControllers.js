import Stripe from 'stripe';
import sql from 'mssql';
import { connectDB } from '../utils/database.js';
function generateCartId() {
  const randomNumber = Math.floor(10000 + Math.random() * 90000);
  return randomNumber.toString();
}

// //get the cart ite for the user
// export const GetCart = async (req, res) => {
//   try {
//     // const cartId = req.params.cartId;
//     const cartItems = await sql.query(
//       `SELECT book_id, quantity
//        FROM CartItems
//        WHERE cart_id = ${cartId} `
//     );
//     res.status(200).json(cartItems.recordset);

//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
//   finally {
//     // sql.close()
//   }
// }


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
  } catch (error) {
    res.status(201).json({ error: error.message }); 
  }
}

// get cart items
export const getCartItems = async (req, res) => {
  try {
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


// function to calculate the total amount
const calculateTotalAmount = async (cartId) => {
  try {
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
    return totalAmount;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Handle the GET request for calculating the total amount
export const GetTotal = async (req, res) => {
  try {
    const cartId = req.params.cartId;
    const totalAmount = await calculateTotalAmount(cartId);
    res.json({ total_amount: totalAmount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Handle the POST request for payment
export const PostPayment = async (req, res) => {
  try {
    const stripe = new Stripe('sk_test_51NM8u2LGQyKikAGGwFg0GZq0y1Wjc6w06B2RntwLuC28Tsy2QVuGNnP8gGOzx7MrW3z5ZAGArok6Y5bxSIQ76z5k00QE5QYyGV');
    const  cartId  = req.params.cartId;
    const totalAmount = await calculateTotalAmount(cartId);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};






