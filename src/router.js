const express = require('express');
const {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    changeUserPassword,
    loginUser,
    forgotPassword,
    resetPassword,
    updateProfilePicture,
    removeProfilePicture
} = require('./controllers/userController');
const authenticateUser = require('./middlewares/authMiddlewares');
const { ERROR_MESSAGES, HTTP_STATUS_CODES } = require('./utils/enum');
const { MercadoPagoConfig, Payment } = require('mercadopago');
const axios = require('axios');



const router = express.Router();

const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

require('dotenv').config();

router.post('/pagamentoatualizado', async (req, res) => {
    try {
        console.log('Webhook recebido:', req.body);

        // Valida se a ação é 'payment.update'
        if (req.body.action === 'payment.update') {
            const paymentId = req.body.data.id; // ID do pagamento enviado no webhook

            // Valida se o ID do pagamento foi fornecido
            if (!paymentId) {
                return res.status(400).json({ message: 'ID do pagamento não fornecido' });
            }

            console.log(`Consultando pagamento: ${paymentId}`);

            // Consulta ao Mercado Pago para buscar os dados atualizados do pagamento
            const paymentInfo = await axios.get(
                `https://api.mercadopago.com/v1/payments/${paymentId}`,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
                    },
                }
            );

            const paymentData = paymentInfo.data;

            console.log('Dados do pagamento atualizados:', paymentData);

            // Processa os dados recebidos e implementa sua lógica de negócio
            const status = paymentData.status; // Status do pagamento (e.g., approved, pending, rejected)
            const transactionAmount = paymentData.transaction_amount; // Valor da transação

            // Exemplo: Atualizar status do pagamento no banco de dados
            console.log(
                `Pagamento ID: ${paymentId} | Status: ${status} | Valor: ${transactionAmount}`
            );

            // Implemente aqui a lógica de atualização no banco de dados

            return res.status(200).json({
                message: 'Pagamento atualizado com sucesso',
                status: status,
                paymentId: paymentId,
            });
        } else {
            // Caso a ação não seja payment.update
            console.log('Ação desconhecida recebida no webhook:', req.body.action);
            return res.status(400).json({ message: 'Ação desconhecida' });
        }
    } catch (error) {
        console.error('Erro ao processar webhook de pagamento:', error.message);
        return res.status(500).json({
            message: 'Erro ao processar webhook de pagamento',
        });
    }
});



router.post('/user', async (req, res) => {
    const { nome, email, senha, role } = req.body;
    const { status, data } = await createUser({ nome, email, senha, role });
    return res.status(status).json(data);
});

router.post('/create-payment', async (req, res) => {
    try {
        const { title, quantity, unit_price, payment_method_id, payer } = req.body;

        // Log para depuração
        console.log('Dados recebidos:', { title, quantity, unit_price, payment_method_id, payer });

        if (!title || !quantity || !unit_price || !payment_method_id || !payer) {
            return res.status(400).json({
                status: 'error',
                message: 'Parâmetros inválidos'
            });
        }

        const paymentData = {
            transaction_amount: quantity * unit_price,
            description: title,
            payment_method_id,
            payer,
        };

        console.log('Dados enviados ao Mercado Pago:', paymentData);

        const payment = new Payment(client);
        const response = await payment.create({ body: paymentData });

        return res.status(201).json({
            status: 'success',
            paymentId: response.payer.id,
            status_detail: response.money_release_status,
        });
    } catch (error) {
        console.error('Erro ao criar pagamento:', error);
        return res.status(error.status || 500).json({
            status: 'error',
            message: 'Não foi possível processar o pagamento.',
            error: error.message,
            cause: error.cause,
        });
    }
})

router.post('/login', async (req, res) => {
    const { email, senha, role } = req.body;

    if (!email || !senha) {
        return res
            .status(HTTP_STATUS_CODES.BAD_REQUEST)
            .json({ message: ERROR_MESSAGES.EMAIL_AND_PASSWORD_REQUIRED });
    }

    const { status, data } = await loginUser({ email, senha, role });
    return res.status(status).json(data);
});

router.get('/users', authenticateUser, async (req, res) => {
    const { status, data } = await getUsers();
    return res.status(status).json(data);
});

router.get('/user/:id', authenticateUser, async (req, res) => {
    const { id } = req.params;
    const { status, data } = await getUserById({ id });
    return res.status(status).json(data);
});

router.put('/user/:id', authenticateUser, async (req, res) => {
    const { id } = req.params;
    const { nome, email } = req.body;
    const { status, data } = await updateUser({ id, nome, email });
    return res.status(status).json(data);
});

router.delete('/user/:id', authenticateUser, async (req, res) => {
    const { id } = req.params;
    const { status, data } = await deleteUser({ id });
    return res.status(status).json(data);
});

router.put('/user/:id/change-password', authenticateUser, async (req, res) => {
    const { id } = req.params;
    const { senhaAtual, novaSenha } = req.body;

    if (!senhaAtual || !novaSenha) {
        return res
            .status(HTTP_STATUS_CODES.BAD_REQUEST)
            .json({ message: ERROR_MESSAGES.PASSWORD_REQUIRED });
    }

    const { status, data } = await changeUserPassword({ id, senhaAtual, novaSenha });
    return res.status(status).json(data);
});

router.post('/forgot-password', async (req, res) => {
    console.log('Recebendo requisição na rota /forgot-password');
    try {
        const { email } = req.body;
        if (!email) {
            console.error('Email não informado');
            return res.status(400).json({ message: 'Email é obrigatório' });
        }

        const response = await forgotPassword({ email });
        console.log('Resposta da função forgotPassword:', response);

        res.status(response.status).send(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Erro interno doservidor' });
    }
});

router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res
            .status(HTTP_STATUS_CODES.BAD_REQUEST)
            .json({ message: ERROR_MESSAGES.TOKEN_AND_PASSWORD_REQUIRED });
    }

    const { status, data } = await resetPassword({ token, password });
    return res.status(status).json(data);
});

router.put('/user/:id/profile-picture', async (req, res) => {
    const { id } = req.params;
    const { profilePicture } = req.body;
    const { status, data } = await updateProfilePicture({ id, profilePicture });
    return res.status(status).json(data);
});

// Rota para remover a foto de perfil
router.delete('/user/:id/profile-picture', async (req, res) => {
    const { id } = req.params;
    const { status, data } = await removeProfilePicture({ id });
    return res.status(status).json(data);
});

module.exports = router;
