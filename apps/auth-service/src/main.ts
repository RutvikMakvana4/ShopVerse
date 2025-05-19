import express from 'express';

const app = express();

app.get('/', (req, res) => {
    res.send({ 'message': 'Hello Auth API' });
});

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 6001;

const server = app.listen(port, () => {
    console.log(`[ ready ] Auth service running at http://${host}:${port}`);
})

server.on("error", (err) => {
    console.log('Server Error: ', err)
})
