const express = require('express')
const path = require('path');
const app = express();

app.use('/images', express.static(path.join(__dirname, '../../images')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'html', 'index.html'));
    console.log(`Request served by ${process.env.SERVER_HOST}`);
});

app.get('/script.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'script.js'));
});

app.listen(process.env.SERVER_PORT, () => {
    console.log(`${process.env.SERVER_HOST} is listening on port ${process.env.SERVER_PORT}`);
});