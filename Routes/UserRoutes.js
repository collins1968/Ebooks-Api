import { getUsers, PostUsers, register, login, isAdmin } from "../controllers/UsersController.js";

const routes = (app) => {
    app.route('/users')
        .get(getUsers)
        .post(PostUsers);
    app.route('/users/:id')
        .get(getUsers)
    app.route('/register')
        .post(register);   
    app.route('/login')
        .post(login); 
    app.route('/isAdmin')
        .post(isAdmin);

}

export default routes;