import express from "express";
import path from "path";
const app = express();
const vpath = path();


app.use('/images', express.static(path.join(__dirname, '../images')));


app.use('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
    console.log(`Request served by ${process.env.SERVER_HOST}`);
});


app.listen(process.env.SERVER_PORT, () => {
    console.log(`${process.env.SERVER_HOST} is listening on port ${process.env.SERVER_PORT}`);
});