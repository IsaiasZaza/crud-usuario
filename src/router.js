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
    handleWebhookPaymentStatus
} = require('./controllers/userController');
const authenticateUser = require('./middlewares/authMiddlewares');
const { ERROR_MESSAGES, HTTP_STATUS_CODES } = require('./utils/enum');
const { MercadoPagoConfig, Preference } = require('mercadopago');


const router = express.Router();

const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

require('dotenv').config();

router.post('/payment-webhook', async (req, res) => {
    const { id, status } = req.body;  // Dados enviados pelo Mercado Pago (payment_id, status)

    if (!id) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
            message: 'ID de pagamento é obrigatório.',
        });
    }

    try {
        // Chama a função para processar o status do pagamento
        const result = await handleWebhookPaymentStatus(id, status);

        return res.status(result.status).json({ message: result.message });
    } catch (error) {
        console.error('Erro ao processar webhook de pagamento:', error.message);
        return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            message: 'Erro interno ao processar o webhook de pagameno.',
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
        const { title, quantity, price } = req.body;

        // Criando a preferência de pagamento
        const preference = new Preference(client);
        const result = await preference.create({
            body: {
                items: [
                    {
                        title, 
                        quantity,
                        currency_id: 'BRL',
                        unit_price: parseFloat(price),
                    },
                ],
                back_urls: {
                    success: `${process.env.FRONTEND_URL}/payment-success`,
                    failure: `${process.env.FRONTEND_URL}/payment-failure`,
                    pending: `${process.env.FRONTEND_URL}/payment-pending`,
                },
                auto_return: 'approved',
            },
        });

        return res.status(200).json({
            message: 'Link do pagamento gerado com sucesso',
            checkoutUrl: result.init_point,
        });
    } catch (error) {
        console.error('Erro ao criar pagamento:', error);
        return res.status(500).json({
            message: 'Erro interno ao criar pagamento',
        });
    }
});

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

module.exports = router;
