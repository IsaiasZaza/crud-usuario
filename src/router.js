const express = require('express');
const {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    changeUserPassword,
    loginUser,
} = require('./controllers/userController');
const authenticateUser = require('./middlewares/authMiddlewares');
const { ERROR_MESSAGES, HTTP_STATUS_CODES } = require('./utils/enum');

const router = express.Router();

router.post('/user', async (req, res) => {
    const { nome, email, senha } = req.body;
    const { status, data } = await createUser({ nome, email, senha });
    return res.status(status).json(data);
});

router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res
            .status(HTTP_STATUS_CODES.BAD_REQUEST)
            .json({ message: ERROR_MESSAGES.EMAIL_AND_PASSWORD_REQUIRED });
    }

    const { status, data } = await loginUser({ email, senha });
    return res.status(status).json(data);
});

// As rotas abaixo estão protegidas pelo middleware authenticateUser
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

module.exports = router;
