const express = require('express');
const routes = require('./router');
const cors = require('cors');
require('dotenv').config();



module.exports = (config) => {

    const { port } = config;
    const app = express();
    app.use(cors()); 

    app.use(express.json());

    app.use('/api', routes);

    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({ message: 'Ocorreu um erro no servidor!' });
    });

    app.listen(port, '0.0.0.0', () => {
        console.log(`Servidor rodando na porta ${port}`);
    });
};