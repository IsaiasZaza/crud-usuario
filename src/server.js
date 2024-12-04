const express = require('express');
const routes = require('./router');
const cors = require('cors');
require('dotenv').config();



module.exports = (config) => {

    const { port } = config;
    const app = express();
    app.use(cors()); 

    // Middleware para interpretar JSON no corpo da requisição
    app.use(express.json());

    // Adicionando rotas
    app.use('/api', routes);

    // Middleware para tratamento de erros
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({ message: 'Ocorreu um erro no servidor!' });
    });

    // Iniciar o servidor
    app.listen(port, '0.0.0.0', () => {
        console.log(`Servidor rodando na porta ${port}`);
    });
};