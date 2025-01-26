const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;
const { generateToken } = require('../services/jwtService');
const nodemailer = require('nodemailer');
require('dotenv').config();



const { ERROR_MESSAGES, HTTP_STATUS_CODES, SUCCESS_MESSAGES } = require('../utils/enum');

const createUser = async ({ nome, email, senha, role = 'ALUNO', cpf, profissao }) => {
    try {
        // Verifica se o role fornecido é válido
        const validRoles = ['ADMIN', 'PROFESSOR', 'ALUNO'];
        if (!validRoles.includes(role.toUpperCase())) {
            return {
                status: HTTP_STATUS_CODES.BAD_REQUEST,
                data: { message: ERROR_MESSAGES.INVALID_ROLE },
            };
        }

        // Validação da senha
        const passwordRegex = /^(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
        if (!passwordRegex.test(senha)) {
            return {
                status: HTTP_STATUS_CODES.BAD_REQUEST,
                data: { message: "A senha deve ter no mínimo 8 caracteres e incluir pelo menos um caractere especial." },
            };
        }

        // Validação do CPF
        const cpfRegex = /^\d{11}$/;
        if (!cpfRegex.test(cpf)) {
            return {
                status: HTTP_STATUS_CODES.BAD_REQUEST,
                data: { message: "O CPF deve ser valido" },
            };
        }

        // Verifica se já existe um usuário com o mesmo CPF no banco de dados
        const existingUser = await prisma.user.findUnique({
            where: { cpf },
        });

        if (existingUser) {
            return {
                status: HTTP_STATUS_CODES.CONFLICT,
                data: { message: "Já existe um usuário cadastrado com este CPF." },
            };
        }

        const hashedPassword = await bcrypt.hash(senha, SALT_ROUNDS);

        const newUser = await prisma.user.create({
            data: {
                nome,
                email,
                senha: hashedPassword,
                role: role.toUpperCase(),
                estado: 'Brasília-DF',
                sobre: 'Bem-vindo(a) à Cetma',
                profilePicture: '',
                cpf,
                profissao
            },
        });

        const token = generateToken({
            id: newUser.id,
            email: newUser.email,
            nome: newUser.nome,
            role: newUser.role,
            estado: newUser.estado,
            sobre: newUser.sobre,
            profilePicture: newUser.profilePicture,
            cpf: newUser.cpf,
            profissao: newUser.profissao,
        });

        return {
            status: HTTP_STATUS_CODES.CREATED,
            data: {
                message: SUCCESS_MESSAGES.USER_CREATED,
                user: {
                    id: newUser.id,
                    nome: newUser.nome,
                    email: newUser.email,
                    role: newUser.role,
                    estado: newUser.estado,
                    sobre: newUser.sobre,
                    profilePicture: newUser.profilePicture,
                    cpf: newUser.cpf,
                    profissao: newUser.profissao
                },
                token
            },
        };
    } catch (error) {
        console.error('Erro ao criar usuário:', error.message);
        return {
            status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
            data: { message: ERROR_MESSAGES.ERROR_CREAT_USER },
        };
    }
};

const loginUser = async ({ email, senha, role }) => {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { courses: true },
        });

        if (!user) {
            return {
                status: HTTP_STATUS_CODES.UNAUTHORIZED,
                data: { message: ERROR_MESSAGES.ERROR_USER_OR_PASSWORD },
            };
        }

        // Verifica se a role solicitada é válida
        const validRoles = ['ALUNO', 'ADMIN', 'PROFESSOR'];
        if (!validRoles.includes(role)) {
            return {
                status: HTTP_STATUS_CODES.BAD_REQUEST,
                data: { message: ERROR_MESSAGES.INVALID_REQUESTED_ROLE },
            };
        }

        // Verifica se o usuário tem a role solicitada
        if (user.role !== role) {
            return {
                status: HTTP_STATUS_CODES.FORBIDDEN,
                data: { message: ERROR_MESSAGES.ROLE_NOT_ALLOWED },
            };
        }

        // Valida a senha
        const senhaValida = await bcrypt.compare(senha, user.senha);
        if (!senhaValida) {
            return {
                status: HTTP_STATUS_CODES.UNAUTHORIZED,
                data: { message: ERROR_MESSAGES.ERROR_USER_OR_PASSWORD },
            };
        }

        const token = generateToken({
            id: user.id,
            nome: user.nome,
            email: user.email,
            role: user.role,
            estado: user.estado,
            sobre: user.sobre,
            profilePicture: user.profilePicture,
            cpf: user.cpf,
            profissao: user.profissao,
            course: user.courses,
        });

        const { senha: _, ...userData } = user;

        return {
            status: HTTP_STATUS_CODES.OK,
            data: {
                message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
                user: userData,
                token,
            },
        };
    } catch (error) {
        console.error('Erro ao fazer login:', error.message);
        return {
            status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
            data: { message: ERROR_MESSAGES.ERROR_LOGIN },
        };
    }
};


const changeUserPassword = async ({ id, senhaAtual, novaSenha }) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: parseInt(id, 10) } });

        if (!user) {
            return {
                status: HTTP_STATUS_CODES.NOT_FOUND,
                data: { message: ERROR_MESSAGES.USER_NOT_FOUND },
            };
        }

        const senhaAtualValida = await bcrypt.compare(senhaAtual, user.senha);
        if (!senhaAtualValida) {
            return {
                status: HTTP_STATUS_CODES.BAD_REQUEST,
                data: { message: ERROR_MESSAGES.ERROR_USER_OR_PASSWORD },
            };
        }

        if (await bcrypt.compare(novaSenha, user.senha)) {
            return {
                status: HTTP_STATUS_CODES.BAD_REQUEST,
                data: { message: ERROR_MESSAGES.ERROR_USER_OR_PASSWORD },
            };
        }

        const novaSenhaHash = await bcrypt.hash(novaSenha, SALT_ROUNDS);

        await prisma.user.update({
            where: { id: parseInt(id, 10) },
            data: { senha: novaSenhaHash },
        });

        return {
            status: HTTP_STATUS_CODES.OK,
            data: { message: SUCCESS_MESSAGES.SUCCESS_PASSWORD_CHANGED },
        };
    } catch (error) {
        console.error('Erro ao trocar senha:', error.message);
        return {
            status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
            data: { message: ERROR_MESSAGES.ERROR_USER_OR_PASSWORD },
        };
    }
};

const getUsers = async () => {
    try {
        const users = await prisma.user.findMany();
        const usersWithoutPassword = users.map((user) => {
            const { senha, ...userData } = user;
            return userData;
        });

        return { status: HTTP_STATUS_CODES.OK, data: usersWithoutPassword };
    } catch (error) {
        console.error('Erro ao buscar usuários:', error.message);
        return {
            status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
            data: { message: ERROR_MESSAGES.USERS_NOT_EXIST },
        };
    }
};

const getUserById = async ({ id }) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id, 10) },
            include: { courses: true },
        });

        if (!user) {
            return {
                status: HTTP_STATUS_CODES.NOT_FOUND,
                data: { message: ERROR_MESSAGES.USER_NOT_ID },
            };
        }

        const { senha, ...userWithoutPassword } = user;
        return {
            status: HTTP_STATUS_CODES.OK,
            data: {
                message: SUCCESS_MESSAGES.USER_FOUND,
                user: userWithoutPassword,
                courses: user.courses // Retorna os cursos do usuário
            }
        };
    } catch (error) {
        console.error('Erro ao buscar usuário por ID:', error.message);
        return {
            status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
            data: { message: ERROR_MESSAGES.USER_NOT_ID },
        };
    }
};

const updateUser = async ({
    id,
    nome,
    email,
    estado,
    sobre,
    profilePicture,
    senha,
    cpf,
    profissao
}) => {
    try {
        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id, 10) },
            data: {
                ...(nome && { nome }),
                ...(email && { email }),
                ...(estado && { estado }),
                ...(sobre && { sobre }),
                ...(profilePicture && { profilePicture }),
                ...(senha && { senha }), // Atualizando a senha se fornecida
                ...(cpf && { cpf }),
                ...(profissao && { profissao }),
            },
            select: {  // Selecionando somente os campos desejados
                nome: true,
                email: true,
                estado: true,
                sobre: true,
                senha: true, 
                cpf: true,
                profissao: true,
            },
        });

        // Gerar novo token JWT com as informações atualizadas
        const newToken = jwt.sign(
            {
                id: updatedUser.id,
                nome: updatedUser.nome,
                email: updatedUser.email,
                estado: updatedUser.estado,
                sobre: updatedUser.sobre,
                senha: updatedUser.senha,
                cpf: updatedUser.cpf,
                profissao: updatedUser.profissao,
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" } // Expira em 1 hora
        );

        return {
            status: HTTP_STATUS_CODES.OK,
            data: {
                message: SUCCESS_MESSAGES.USER_UPDATED,
                user: updatedUser,
                token: newToken, // Retorna o novo token
            },
        };
    } catch (error) {
        console.error("Erro ao atualizar usuário:", error.message);
        return {
            status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
            data: { message: ERROR_MESSAGES.USER_NOT_UPDATE },
        };
    }
};



const deleteUser = async ({ id }) => {
    try {
        await prisma.user.delete({ where: { id: parseInt(id, 10) } });
        return {
            status: HTTP_STATUS_CODES.NO_CONTENT,
            data: { message: SUCCESS_MESSAGES.USER_DELETED }
        };

    } catch (error) {
        console.error('Erro ao deletar usuário:', error.message);
        return {
            status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
            data: { message: ERROR_MESSAGES.ERROR_INTERNAL_SERVER },
        };
    }
};

const forgotPassword = async ({ email }) => {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return {
                status: HTTP_STATUS_CODES.NOT_FOUND,
                data: { message: ERROR_MESSAGES.USER_NOT_FOUND },
            };
        }

        const resetToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Redefinição de Senha - CETMA',
            text: `Olá, ${user.nome},
          
          Recebemos uma solicitação para redefinir a sua senha na CETMA. Para continuar, basta clicar no link abaixo e seguir as instruções:
          
          [Redefinir minha senha](${process.env.FRONTEND_URL}/reset-password?token=${resetToken})
          
          Este link é válido por 1 hora, então não deixe de usá-lo dentro desse período.
          
          Caso não tenha solicitado a alteração de senha, por favor, desconsidere este e-mail. Se você tiver alguma dúvida ou precisar de ajuda, entre em contato com a nossa equipe de suporte.
          
          Atenciosamente,
          Equipe CETMA`,
        };

        await transporter.sendMail(mailOptions);

        return {
            status: HTTP_STATUS_CODES.OK,
            data: { message: SUCCESS_MESSAGES.EMAIL_SENT },
        };
    } catch (error) {
        return {
            status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
            data: { message: ERROR_MESSAGES.ERROR_INTERNAL_SERVER },
        };
    }
};

const resetPassword = async ({ token, password }) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });

        if (!user) {
            return {
                status: HTTP_STATUS_CODES.NOT_FOUND,
                data: { message: ERROR_MESSAGES.USER_NOT_FOUND },
            };
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        await prisma.user.update({
            where: { id: decoded.id },
            data: { senha: hashedPassword },
        });

        return {
            status: HTTP_STATUS_CODES.OK,
            data: { message: SUCCESS_MESSAGES.SUCCESS_PASSWORD_CHANGED },
        };
    } catch (error) {
        return {
            status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
            data: { message: ERROR_MESSAGES.ERROR_INTERNAL_SERVER },
        };
    }
};

const updateProfilePicture = async ({ id, profilePicture }) => {
    try {
        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id, 10) },
            data: { profilePicture },
        });

        // Gera um novo token com as informações atualizadas do usuário
        const newToken = generateToken({ id: updatedUser.id, ...updatedUser });

        return {
            status: HTTP_STATUS_CODES.OK,
            data: {
                message: SUCCESS_MESSAGES.USER_UPDATED,
                user: updatedUser,
                token: newToken, // Inclui o token atualizado na resposta
            },
        };
    } catch (error) {
        console.error('Erro ao atualizar foto de perfil:', error.message);
        return {
            status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
            data: { message: ERROR_MESSAGES.ERROR_UPDATING_USER },
        };
    }
};

const removeProfilePicture = async ({ id }) => {
    try {
        const updatedUser = await prisma.user.delete({
            where: { id: parseInt(id, 10) },
            data: { profilePicture: '' },
        });

        // Gera um novo token com as informações atualizadas do usuário
        const newToken = generateToken({ id: updatedUser.id, ...updatedUser });

        return {
            status: HTTP_STATUS_CODES.OK,
            data: {
                message: 'deletado com sucesso',
                user: updatedUser,
                token: newToken, // Inclui o token atualizado na resposta
            },
        };
    } catch (error) {
        console.error('Erro ao remover foto de perfil:', error.message);
        return {
            status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
            data: { message: ERROR_MESSAGES.ERROR_UPDATING_USER },
        };
    }
};

const addProfilePicture = async ({ id, profilePicture }) => {
    try {
        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id, 10) },
            data: { profilePicture },
        });

        // Gera um novo token com as informações atualizadas do usuário
        const newToken = generateToken({ id: updatedUser.id, ...updatedUser });

        return {
            status: HTTP_STATUS_CODES.OK,
            data: {
                message: SUCCESS_MESSAGES.USER_UPDATED,
                user: updatedUser,
                token: newToken, // Inclui o token atualizado na resposta
            },
        };
    } catch (error) {
        console.error('Erro ao adicionar foto de perfil:', error.message);
        return {
            status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
            data: { message: ERROR_MESSAGES.ERROR_UPDATING_USER },
        };
    }
};

module.exports = {
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
    removeProfilePicture,
    addProfilePicture
};
