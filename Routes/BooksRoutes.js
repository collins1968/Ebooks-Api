import { getBooks, getBook, getCategories, AddBook, getAuthors, getBooksByCategory } from "../controllers/booksControllers.js";
import { PostPayment } from "../controllers/PaymentControllers.js";
import { loginRequired, isAdmin } from "../controllers/UsersController.js";

const booksRoutes = (app) => {
    app.route('/books')
        .get(loginRequired, getBooks)
        .post(loginRequired, AddBook)
    app.route('/book/:id')
        .get(loginRequired, getBook)
    app.route('/categories')
        .get(loginRequired, getCategories) 
    app.route('/authors')
        .get(loginRequired, getAuthors)  
    app.route('/books/:categoryName')
        .get(loginRequired, getBooksByCategory)
    

}

export default booksRoutes;