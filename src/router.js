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
    addProfilePicture,
    removeProfilePicture,
    logoutUser,
    removeCursoDoUser,
    upload,
} = require('./controllers/userController');
const authenticateUser = require('./middlewares/authMiddlewares');
const { ERROR_MESSAGES, HTTP_STATUS_CODES } = require('./utils/enum');
const { createCourse, getCourses, getCourseById, updateCourse, deleteCourse, createCourseWithSubcourses, checkoutPro, addCursoAoUser } = require('./controllers/courseController');
const { createEbook, getAllEbooks, getEbookById, updateEbook, deleteEbook } = requuire('./controllers/ebookController');
const router = express.Router();


require('dotenv').config();

router.post('/ebook', async (req, res) => {
    const result = await createEbook(req.body);
    res.status(result.status).json(result.data);
})

router.get('/ebooks', async (req, res) => {
    const result = await getAllEbooks();
    res.status(result.status).json(result.data);
});

router.put('/ebook/:id', async (req, res) => {
    const result = await updateEbook({ id: req.params.id, ...req.body });
    res.status(result.status).json(result.data);
});

router.delete('/ebook/:id', async (req, res) => {
    const result = await deleteEbook(req.params);
    res.status(result.status).json(result.data);
});

router.get('/ebook/:id', async (req, res) => {=
    const result = await getEbookById(req.params);
    res.status(result.status).json(result.data);
});

router.post('/adicionarCurso', async (req, res) => {
    const result = await addCursoAoUser(req.body);
    res.status(result.status).json(result.data);
});

router.post('/checkout', async (req, res) => { //checkout pro de pagamento
    const { courseId, userId } = req.body;

    if (!courseId || !userId) {
        return res.status(400).json({ message: 'courseId e userId são obrigatórios.' });
    }

    const result = await checkoutPro({ courseId, userId });

    res.status(result.status).json(result.data);
});

router.post('/user', async (req, res) => {
    const { nome, email, senha, role, cpf, profissao } = req.body;
    const { status, data } = await createUser({ nome, email, senha, role, cpf, profissao });
    return res.status(status).json(data);
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
    const { nome, email, sobre, estado, cpf, profissao } = req.body;
    const { status, data } = await updateUser({ id, nome, email, sobre, estado, cpf, profissao });
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

router.post('/', async (req, res) => {
    const result = await createCourse(req.body);
    res.status(result.status).json(result.data);
});

router.get('/cursos', async (req, res) => {
    const result = await getCourses();
    res.status(result.status).json(result.data);
});

router.get('/curso/:id', async (req, res) => {
    const result = await getCourseById(req.params);
    res.status(result.status).json(result.data);
});

router.put('/curso/:id', async (req, res) => {
    const result = await updateCourse({ id: req.params.id, ...req.body });
    res.status(result.status).json(result.data);
});

router.delete('/curso/:id', async (req, res) => {
    const result = await deleteCourse(req.params);
    res.status(result.status).json(result.data);
});

const validateCourseInput = (body) => {
    const { title, description, price, subCourses } = body;
    if (!title || !description || !price || !subCourses || !Array.isArray(subCourses)) {
        return false;
    }
    return true;
};

// Rota para criar curso e subcursos
router.post('/courses', async (req, res) => {
    const { title, description, price, subCourses } = req.body;

    // Validar entrada
    if (!validateCourseInput(req.body)) {
        return res.status(400).json({
            message: "Informações insuficientes para criar o curso e subcursos.",
        });
    }

    try {
        const result = await createCourseWithSubcourses({ title, description, price, subCourses });

        return res.status(result.status).json(result.data);
    } catch (error) {
        console.error('Erro ao criar curso e subcursos:', error.message);
        return res.status(500).json({
            message: 'Erro ao criar curso e subcursos.',
        });
    }
});

router.put('/user/:id/profile-picture', upload, async (req, res) => {
    const { id } = req.params;

    if (!req.file) {
        return res.status(400).json({ message: 'Nenhuma imagem foi enviada.' });
    }

    const { status, data } = await updateProfilePicture(id, `/uploads/${req.file.filename}`);
    return res.status(status).json(data);
});

router.delete('/user/:id/profile-picture', async (req, res) => {
    const { id } = req.params;
    const { status, data } = await removeProfilePicture({ id });
    return res.status(status).json(data);
});

router.post('/user/:id/profile-picture', async (req, res) => {
    const { id } = req.params;
    const { profilePicture } = req.body;
    const { status, data } = await addProfilePicture({ id, profilePicture });
    return res.status(status).json(data);
});

router.post('/user/logout', async (req, res) => {
    const { status, data } = await logoutUser(req, res);
    return res.status(status).json(data);
});

router.post('/removerCurso', async (req, res) => {
    const result = await removeCursoDoUser(req.body);
    res.status(result.status).json(result.data);
});

module.exports = router;
