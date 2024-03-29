import sql from 'mssql';
import { connectDB } from '../utils/database.js';

// Get all books
export const getBooks = async (req, res) => {
  try {
    let pool = await connectDB();
    const result = await pool.request().query("SELECT b.book_id, b.title, b.pdf_url, b.image, b.price, a.author_name, c.category_name FROM Books b INNER JOIN Authors a ON b.author_id = a.author_id INNER JOIN Categories c ON b.category_id = c.category_id");
    !result.recordset[0] ? res.status(404).json({ message: 'Books not found' }) :
        res.status(200).json(result.recordset);
  } catch (error) {
    res.status(201).json({ error: error.message });
  }

};

//get book by id
export const getBook = async (req, res) => {
    try {
      const { id } = req.params;
      let pool = await connectDB();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT b.book_id, b.title, b.pdf_url, b.image, a.author_name, c.category_name FROM Books b INNER JOIN Authors a ON b.author_id = a.author_id INNER JOIN Categories c ON b.category_id = c.category_id where book_id = @id');
        res.status(200).json(result.recordset[0]);
    } catch (error) {
      res.status(201).json({ error: error.message });
    }

}

//add a book
export const AddBook = async (req, res) => {
    const { title, pdf_url, authorName, categoryName, price, image } = req.body;
    try {
        let pool = await connectDB();
     // Check if the category exists
     const categoryResult = await pool
     .request()
     .input('categoryName', sql.VarChar, categoryName)
     .query('SELECT category_id FROM Categories WHERE category_name = @categoryName');

   let categoryId;
   if (categoryResult.recordset.length === 0) {
     // Category does not exist, create a new one
     const createCategoryResult = await pool
       .request()
       .input('categoryName', sql.VarChar, categoryName)
       .query('INSERT INTO Categories (category_name) VALUES (@categoryName); SELECT SCOPE_IDENTITY() AS category_id');

     categoryId = createCategoryResult.recordset[0].category_id;
   } else {
     // Category exists, retrieve its ID
     categoryId = categoryResult.recordset[0].category_id;
   }

   // Check if the author exists
   const authorResult = await pool
     .request()
     .input('authorName', sql.VarChar, authorName)
     .query('SELECT author_id FROM Authors WHERE Author_name = @authorName');

   let authorId;
   if (authorResult.recordset.length === 0) {
     // Author does not exist, create a new one
     const createAuthorResult = await pool
       .request()
       .input('authorName', sql.VarChar, authorName)
       .query('INSERT INTO Authors (Author_name) VALUES (@authorName); SELECT SCOPE_IDENTITY() AS author_id');

     authorId = createAuthorResult.recordset[0].author_id;
   } else {
     // Author exists, retrieve its ID
     authorId = authorResult.recordset[0].author_id;
   }

   //insert the book into the database
    const result = await pool.request()
            .input('title', sql.VarChar, title)
            .input('pdf_url', sql.VarChar, pdf_url)
            .input('authorId', sql.Int, authorId)
            .input('categoryId', sql.Int, categoryId)
            .input('price', sql.VarChar, price)
            .input('image', sql.VarChar, image)
            .query('insert into Books (title, pdf_url, author_id, category_id, price, image) values (@title, @pdf_url, @authorId, @categoryId, @price, @image)');
            result.output.errorMessage ? res.status(400).json({ message: result.output.errorMessage }) :
            res.status(200).json({ message: 'Book created successfully' });
    } catch (error) {
        res.status(201).json({ error: error.message });
    }
  
}

//get books by category
export const getBooksByCategory = async (req, res) => {
  try {
    let pool = await connectDB();
  const result = await pool.request()
  .input('categoryName', sql.VarChar, req.params.categoryName)
  .query('select * from Books where category_id = (select category_id from Categories where category_name = @categoryName)');
  !result.recordset[0] ? res.status(404).json({ message: 'Books not found in that category' }) :
  res.status(200).json(result.recordset);
  } catch (error) {
    res.status(201).json({ error: error.message });
  }

}
  
// get all categories
export const getCategories = async (req, res) => {
  try {
    let pool = await connectDB();
    const result = await pool.request()
    .query("select * from Categories");
    !result.recordset[0] ? res.status(404).json({ message: 'Categories not found' }) :
        res.status(200).json(result.recordset);
  } catch (error) {
    res.status(201).json({ error: error.message });
  }
 
}

// get all authors
export const getAuthors = async (req, res) => {
  try {
    let pool = await connectDB();
    const result = await pool.request()
    .query("select * from Authors");
    !result.recordset[0] ? res.status(404).json({ message: 'Authors not found' }) :
        res.status(200).json(result.recordset);
  } catch (error) {
    res.status(201).json({ error: error.message });
  }

}



