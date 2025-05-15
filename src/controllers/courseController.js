const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { HTTP_STATUS_CODES, ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/enum');


const addCursoAoUser = async ({ userId, courseId }) => {
    try {
        // Verificar se o curso existe
        const course = await prisma.course.findUnique({ where: { id: (courseId) } });
        if (!course) {
            return {
                status: 404,
                data: { message: "Curso não encontrado" },
            };
        }

        // Verificar se o usuário existe
        const user = await prisma.user.findUnique({
            where: { id: (userId) },
            include: { courses: true },
        });
        if (!user) {
            return {
                status: 404,
                data: { message: "Usuário não encontrado" },
            };
        }

        // Verificar se o curso já está associado ao usuário
        const isAlreadyAdded = user.courses.some(c => c.id === course.id);
        if (isAlreadyAdded) {
            return {
                status: 400,
                data: { message: "Curso já está associado ao usuário" },
            };
        }

        // Adicionar o curso ao usuário
        await prisma.user.update({
            where: { id: (userId) },
            data: {
                courses: {
                    connect: { id: courseId },
                },
            },
        });

        return {
            status: 200,
            data: { message: "Curso adicionado ao usuário com sucesso!" },
        };
    } catch (error) {
        console.error(`Erro ao adicionar curso ao usuário: ${error.message}`);
        return {
            status: 500,
            data: { message: "Erro ao adicionar curso ao usuário" },
        };
    }
};

const createCourse = async ({ title, description, price, videoUrl, coverImage }) => {
    try {
        const newCourse = await prisma.course.create({
            data: {
                title,
                description,
                price,
                videoUrl,
                coverImage, // Incluindo a imagem de capa
            },
        });

        return {
            status: HTTP_STATUS_CODES.CREATED,
            data: {
                message: SUCCESS_MESSAGES.COURSE_CREATED,
                course: newCourse,
            },
        };
    } catch (error) {
        console.error('Erro ao criar curso:', error.message);
        return {
            status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
            data: { message: ERROR_MESSAGES.ERROR_CREAT_COURSE },
        };
    }
};

const createCourseWithSubcourses = async ({ title, description, price, videoUrl, coverImage, subCourses }) => {
    try {

        const priceNumber = parseFloat(price);
        if (isNaN(priceNumber)) {
            throw new Error("Valor inválido para price");
        }

        const course = await prisma.course.create({
            data: {
                title,
                description,
                price: priceNumber,
                videoUrl,
                coverImage,
            },
        });

        // Criar subcursos como herança do curso principal
        const subCoursesData = subCourses.map(subCourse => ({
            title: subCourse.title,
            description: subCourse.description,
            price: parseFloat(subCourse.price), // Convertendo o preço para float
            videoUrl: subCourse.videoUrl,
            coverImage: subCourse.coverImage, // Incluindo a imagem de capa dos subcursos
            parentCourseId: course.id,
        }));

        await prisma.course.createMany({ data: subCoursesData });

        // Retornar curso com subcursos
        const courseWithSubcourses = await prisma.course.findUnique({
            where: { id: course.id },
            include: { subCourses: true },
        });

        return {
            status: HTTP_STATUS_CODES.CREATED,
            data: {
                message: SUCCESS_MESSAGES.COURSE_AND_SUBCOURSES_CREATED,
                course: courseWithSubcourses,
                subCourses: { count: subCourses.length },
            },
        };
    } catch (error) {
        console.error('Erro ao criar curso e subcursos:', error.message);
        return {
            status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
            data: { message: ERROR_MESSAGES.ERROR_CREAT_COURSE_WITH_SUBCOURSES },
        };
    }
};

// Listar todos os cursos
const getCourses = async () => {
    try {
        const courses = await prisma.course.findMany({
            include: { subCourses: true }, // Inclui os subcursos ao listar cursos
        });
        return {
            status: HTTP_STATUS_CODES.OK,
            data: courses,
        };
    } catch (error) {
        console.error('Erro ao buscar cursos:', error.message);
        return {
            status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
            data: { message: ERROR_MESSAGES.ERROR_FETCH_COURSES },
        };
    }
};

// Buscar curso por ID
const getCourseById = async ({ id }) => {
    try {
        const course = await prisma.course.findUnique({
            where: { id: id },
            include: { subCourses: true }, // Inclui os subcursos ao buscar por ID
        });

        if (!course) {
            return {
                status: HTTP_STATUS_CODES.NOT_FOUND,
                data: { message: ERROR_MESSAGES.COURSE_NOT_FOUND },
            };
        }

        return {
            status: HTTP_STATUS_CODES.OK,
            data: course,
        };
    } catch (error) {
        console.error('Erro ao buscar curso por ID:', error.message);
        return {
            status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
            data: { message: ERROR_MESSAGES.ERROR_FETCH_COURSE },
        };
    }
};

// Atualizar curso
const updateCourse = async ({ id, title, description, price, videoUrl, coverImage }) => {
    try {
        const updatedCourse = await prisma.course.update({
            where: { id: id },
            data: {
                ...(title && { title }),
                ...(description && { description }),
                ...(price && { price }),
                ...(videoUrl && { videoUrl }),
                ...(coverImage && { coverImage }), // Atualizando a imagem de capa se fornecida
            },
        });

        return {
            status: HTTP_STATUS_CODES.OK,
            data: {
                message: SUCCESS_MESSAGES.COURSE_UPDATED,
                course: updatedCourse,
            },
        };
    } catch (error) {
        console.error('Erro ao atualizar curso:', error.message);
        return {
            status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
            data: { message: ERROR_MESSAGES.ERROR_UPDATE_COURSE },
        };
    }
};

// Deletar curso
const deleteCourse = async ({ id }) => {
    try {
        const courseId = id;

        // Verifica se existem cursos filhos com parentId igual ao ID do curso que está sendo deletado
        const subCourses = await prisma.course.findMany({
            where: { parentCourseId: courseId }
        });

        // Se houver cursos filhos, deleta todos primeiro
        if (subCourses.length > 0) {
            await prisma.course.deleteMany({
                where: { parentCourseId: courseId }
            });
        }

        // Agora deleta o curso principal
        await prisma.course.delete({ where: { id: courseId } });

        return {
            status: HTTP_STATUS_CODES.NO_CONTENT,
            data: { message: SUCCESS_MESSAGES.COURSE_DELETED },
        };
    } catch (error) {
        console.error('Erro ao deletar curso:', error.message);
        return {
            status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
            data: { message: ERROR_MESSAGES.ERROR_DELETE_COURSE },
        };
    }
};

const removeCursoDoUser = async ({ userId, courseId }) => {
    try {
        // Verificar se o curso existe
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course) {
            return {
                status: 404,
                data: { message: "Curso não encontrado" },
            };
        }

        // Verificar se o usuário existe
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { courses: true },
        });
        if (!user) {
            return {
                status: 404,
                data: { message: "Usuário não encontrado" },
            };
        }

        // Verificar se o curso está associado ao usuário
        const isAssociated = user.courses.some(c => c.id === course.id);
        if (!isAssociated) {
            return {
                status: 400,
                data: { message: "Curso não está associado ao usuário" },
            };
        }

        // Remover o curso do usuário
        await prisma.user.update({
            where: { id: userId },
            data: {
                courses: {
                    disconnect: { id: courseId },
                },
            },
        });

        return {
            status: 200,
            data: { message: "Curso removido do usuário com sucesso!" },
        };
    } catch (error) {
        console.error(`Erro ao remover curso do usuário: ${error.message}`);
        return {
            status: 500,
            data: { message: "Erro ao remover curso do usuário" },
        };
    }
};

module.exports = {
    createCourse,
    getCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
    createCourseWithSubcourses,
    addCursoAoUser,
    removeCursoDoUser,
};