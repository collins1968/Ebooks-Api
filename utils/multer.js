//setup multer
import multer from "multer";
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "images"); //null is error
    },
    filename: (req, file, cb) => {
        cb(null, req.body.BookImage);
    },
  });
  
 export const upload = multer({ storage: storage });