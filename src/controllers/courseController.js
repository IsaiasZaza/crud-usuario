const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { HTTP_STATUS_CODES, ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/enum');

// Criar curso
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
        // Criação do curso principal
        const course = await prisma.course.create({
            data: {
                title,
                description,
                price,
                videoUrl,
                coverImage, // Incluindo a imagem de capa
            },
        });

        // Criar subcursos como herança do curso principal
        const subCoursesData = subCourses.map(subCourse => ({
            title: subCourse.title,
            description: subCourse.description,
            price: subCourse.price,
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
            where: { id: parseInt(id, 10) },
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
            where: { id: parseInt(id, 10) },
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
        await prisma.course.delete({ where: { id: parseInt(id, 10) } });

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

module.exports = {
    createCourse,
    getCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
    createCourseWithSubcourses
};