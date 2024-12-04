const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;
const { generateToken } = require('../services/jwtService'); 

const { ERROR_MESSAGES, HTTP_STATUS_CODES, SUCCESS_MESSAGES } = require('../utils/enum');

const createUser = async ({ nome, email, senha }) => {
    try {
        const hashedPassword = await bcrypt.hash(senha, SALT_ROUNDS);
        const newUser = await prisma.user.create({
            data: { nome, email, senha: hashedPassword },
        });

        const token = generateToken({ id: newUser.id, email: newUser.email, nome: newUser.nome });


        return {
            status: HTTP_STATUS_CODES.CREATED,
            data: { user: { id: newUser.id, nome: newUser.nome, email: newUser.email }, token },
        };
    } catch (error) {
        console.error('Erro ao criar usuário:', error.message);
        return {
            status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
            data: { message: ERROR_MESSAGES.ERROR_CREAT_USER },
        };
    }
};

const loginUser = async ({ email, senha }) => {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return {
                status: HTTP_STATUS_CODES.UNAUTHORIZED,
                data: { message: ERROR_MESSAGES.ERROR_USER_OR_PASSWORD },
            };
        }

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
        });

        const { senha: _, ...userData } = user;

        return {
            status: HTTP_STATUS_CODES.OK,
            data: { user: userData, token },
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
        const user = await prisma.user.findUnique({ where: { id: parseInt(id, 10) } });

        if (!user) {
            return {
                status: HTTP_STATUS_CODES.NOT_FOUND,
                data: { message: ERROR_MESSAGES.USER_NOT_ID },
            };
        }

        const { senha, ...userWithoutPassword } = user;
        return { status: HTTP_STATUS_CODES.OK, data: userWithoutPassword };
    } catch (error) {
        console.error('Erro ao buscar usuário por ID:', error.message);
        return {
            status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
            data: { message: ERROR_MESSAGES.USER_NOT_ID },
        };
    }
};

const updateUser = async ({ id, nome, email }) => {
    try {
        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id, 10) },
            data: { nome, email },
        });

        return { status: HTTP_STATUS_CODES.OK, data: updatedUser };
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error.message);
        return {
            status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
            data: { message: ERROR_MESSAGES.USER_NOT_UPDATE },
        };
    }
};

const deleteUser = async ({ id }) => {
    try {
        await prisma.user.delete({ where: { id: parseInt(id, 10) } });
        return { status: HTTP_STATUS_CODES.NO_CONTENT, data: null };
    } catch (error) {
        console.error('Erro ao deletar usuário:', error.message);
        return {
            status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
            data: { message: ERROR_MESSAGES.ERROR_INTERNAL_SERVER },
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
    loginUser
};
