import sql from 'mssql';
import config from '../db/config.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

//check if user is logged in
export const loginRequired = (req, res, next) => {
    if (req.user) {
        next();
    } else {
        return res.status(401).json({ message: 'Unauthorized user!' });
    }
}


//check if user is admin
export const isAdmin = async (req, res) => {
    const { username } = req.body;
    try {
        let pool = await sql.connect(config.sql);
        const result = await pool.request()
            .input('username', sql.VarChar, username)
            .query('SELECT isAdmin FROM Users WHERE username = @username');
        const user = result.recordset[0];
        if (!user) {
            res.status(401).json({ error: 'user not available' });
        } else {
            if (user.isAdmin == 0) {
                res.status(401).json({ error: 'user is not admin' });
            } else {
                res.status(200).json({ message: 'User is admin' });
            }
        }
    } catch (error) {
        res.status(201).json({ error: error.message });
    } finally {
        sql.close(); // Close the SQL connection
    }
}



// // Get all users
export const getUsers = async (req, res) => {
    try {
        let pool = await sql.connect(config.sql);
        const result = await pool.request().query("select * from Users");
        !result.recordset[0] ? res.status(404).json({ message: 'Users not found' }) :
            res.status(200).json(result.recordset);
    } catch (error) {
        res.status(201).json({ error: 'an error occurred while retrieving users' });
    } finally {
        sql.close(); // Close the SQL connection
    }
};

//get a user by id
export const PostUsers = async (req, res) => {
    try {
        res.status(200).json({ message: 'PostUsers' }); 
    } catch (error) {
        res.status(201).json({ error: 'an error occurred while retrieving users' });
    } finally {
        sql.close(); // Close the SQL connection

    }
};


// Authentication
//register new using this fields username, email, password, first_name, last_name)
export const register = async (req, res) => {
    const { username, email, password, first_name, last_name } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    try {
        let pool = await sql.connect(config.sql);
        const result = await pool.request()
            .input("username", sql.VarChar, username)
            .input("email", sql.VarChar, email)
            .query("select * from users where username = @username or email = @email");
        const user = result.recordset[0];
        if (user) {
            res.status(401).json({ error: 'User already exists' });
        } 
        else{
            await pool.request()
            .input('username', sql.VarChar, username)
            .input('email', sql.VarChar, email)
            .input('hashedPassword', sql.VarChar, hashedPassword)
            .input('first_name', sql.VarChar, first_name)
            .input('last_name', sql.VarChar, last_name)
            .input('createdAt', sql.DateTime, new Date()) // Add current date and time as 'createdAt' input
            .input('updatedAt', sql.DateTime, new Date())
            .input('isAdmin', sql.Bit, isAdmin)
            .query('insert into Users (username, email, password, first_name, last_name,  created_at, updated_at, isAdmin) values (@username, @email, @hashedPassword, @first_name, @last_name,  @createdAt, @updatedAt, @isAdmin)');
        result.output.errorMessage ? res.status(400).json({ message: result.output.errorMessage }) :
            res.status(200).json({ message: 'User created successfully' });
     } }
    catch (error) {
        res.status(201).json({ error: error.message });
    } finally {
        sql.close(); // Close the SQL connection
    }
}

export const login = async (req, res) => {
    const { username, password } = req.body;
    let pool = await sql.connect(config.sql);
    const result = await pool.request()
        .input('username', sql.VarChar, username)
        .query('SELECT * FROM Users WHERE username = @username');
    const user = result.recordset[0];
    if (!user) {
        res.status(401).json({ error: 'Authentication failed. Wrong credentials.' });
    } else {
        if (!bcrypt.compareSync(password, user.password)) {
            res.status(401).json({ error: 'Authentication failed. Wrong credentials.' });
        } else {
            const token = `JWT ${jwt.sign({ userId: user.user_id, username: user.username, email: user.email, isAdmin: user.isAdmin }, config.jwt_secret)}`;
            res.status(200).json({ userId: user.user_id, email: user.email, username: user.username, id: user.id, isAdmin: user.isAdmin, token: token });
        }
    }
};



