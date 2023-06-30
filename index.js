import express from 'express';
import bodyParser from 'body-parser';
import config from './db/config.js';
import routes from './Routes/UserRoutes.js';
import booksRoutes from './Routes/BooksRoutes.js';
import cors from 'cors';
import jsonwebtoken from 'jsonwebtoken';
import { paymentRoutes } from './Routes/PaymentRoutes.js';
import { closeDb, connectDB } from './utils/database.js';

const app = express();
app.use(express.static("public"));
app.use(express.json());

//middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use("/images", express.static('images'));



//database middleware
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        next(error);
        
    }
})

//JWT setup
app.use((req, res, next) => {
    if (req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'JWT') {
        console.log(req.user);
        jsonwebtoken.verify(req.headers.authorization.split(' ')[1], `${process.env.JWT_SECRET}`, (err, decode) => {
            if (err) req.user = undefined;
            req.user = decode;
            next();
        });
    } else {
        req.user = undefined;
        next();
    }
});

//my routes
//user routes
routes(app);
booksRoutes(app);
paymentRoutes(app);


app.get('/', (req, res) => {
    res.send('Hello World welcome!');
    }       
);

app.use(async (req, res, next) => {
    try {
        await closeDb();
        process.exit(1);
    } catch (error) {
        console.error('Failed to close database connection')
        process.exit(1);
        
    }
})

app.listen(config.port || 8080, () => {
    console.log("Server is running");
    }   
);
