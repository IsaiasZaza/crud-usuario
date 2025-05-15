const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { HTTP_STATUS_CODES, ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/enum');


const createCoursePresencial = async ({
    title,
    subtitle,
    description,
    overview,
    material,
    price,
    videoUrl,
    coverImage,
    type = 'PRESENTIAL',
    location,
    durationHours,
    periodoCurso,
    schedule,
    audience,
    instructorName,
    instructorTitle,
    instructorCRM,
    instructorRQE,
    organizerName,
    organizerFullName,
    organizerInstagram,

}) => {
    try {
        const newCourse = await prisma.course.create({
            data: {
                title,
                subtitle,
                description,
                overview,
                material,
                price,
                videoUrl,
                coverImage,
                type,
                location,
                durationHours,
                periodoCurso,
                schedule,
                audience,
                instructorName,
                instructorTitle,
                instructorCRM,
                instructorRQE,
                organizerName,
                organizerFullName,
                organizerInstagram,
            },
        });

        return {
            status: HTTP_STATUS_CODES.CREATED,
            data: {
                message: SUCCESS_MESSAGES.COURSE_CREATED,
                course: newCourse,
            },
        };
    }
    catch (error) {
        console.error('Erro ao criar curso presencial:', error.message);
        return {
            status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
            data: { message: ERROR_MESSAGES.ERROR_CREAT_COURSE },
        };
    }
}

const updateCoursePresencial = async ({ 
    id, 
    title,
    subtitle,
    description,
    overview,
    material,
    price,
    videoUrl,
    coverImage,
    type,
    location,
    durationHours,
    periodoCurso,
    schedule,
    audience,
    instructorName,
    instructorTitle,
    instructorCRM,
    instructorRQE,
    organizerName,
    organizerFullName,
    organizerInstagram, }) => {
    try {
        const updatedCourse = await prisma.course.update({
            where: { id: parseInt(id, 10) },
            data: {
                ...(title && { title }),
                ...(description && { description }),
                ...(price && { price }),
                ...(material && { material }),
                ...(location && { location }),
                ...(coverImage && { coverImage }),
                ...(durationHours && { durationHours }),
                ...(periodoCurso && { periodoCurso }),
            },
        });

        if (!updatedCourse) {
            return {
                status: HTTP_STATUS_CODES.NOT_FOUND,
                data: { message: ERROR_MESSAGES.COURSE_NOT_FOUND },
            };
        }

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

const getCoursePresencialId = async ({ id }) => {
    try {
        const course = await prisma.course.findUnique({
            where: { id: parseInt(id, 10), type: 'PRESENTIAL' },
        });

        if (!course) {
            return {
                status: HTTP_STATUS_CODES.NOT_FOUND,
                data: { message: ERROR_MESSAGES.ERROR_COURSE_NOT_FOUND },
            };
        }

        return {
            status: HTTP_STATUS_CODES.OK,
            data: course,
        };
    } catch (error) {
        console.error('Erro ao buscar curso presencial:', error.message);
        return {
            status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
            data: { message: ERROR_MESSAGES.ERROR_FETCH_COURSE },
        };
    }
}

const getCoursesPresential = async () => {
    try {
        const courses = await prisma.course.findMany({
            where: { type: 'PRESENTIAL' },
        });

        if (!courses || courses.length === 0) {
            return {
                status: HTTP_STATUS_CODES.NOT_FOUND,
                data: { message: ERROR_MESSAGES.ERROR_COURSES_NOT_FOUND },
            };
        }

        return {
            status: HTTP_STATUS_CODES.OK,
            data: courses,
        };

    } catch (error) {
        console.error('Erro ao buscar cursos presenciais:', error.message);
        return {
            status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
            data: { message: ERROR_MESSAGES.ERROR_FETCH_COURSE },
        };
    }
};

const deleteCoursePresential = async ({ id }) => {
    try {
        const deletedCourse = await prisma.course.delete({
            where: { id: parseInt(id, 10) },
        });


        if (!deletedCourse) {
            return {
                status: HTTP_STATUS_CODES.NOT_FOUND,
                data: { message: ERROR_MESSAGES.ERROR_COURSES_NOT_FOUND },
            };
        }

        return {
            status: HTTP_STATUS_CODES.OK,
            data: {
                message: SUCCESS_MESSAGES.COURSE_DELETED,
                data: deletedCourse,
            },
        };

    } catch (error) {
        console.error('Erro ao deletar curso presencial:', error.message);
        return {
            status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
            data: { message: ERROR_MESSAGES.ERROR_DELETE_COURSE },
        };
    }
}

const addCursoAoUserPresential = async ({ userId, courseId }) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId, 10) },
            include: { courses: true },
        });

        if (!user) {
            return {
                status: HTTP_STATUS_CODES.NOT_FOUND,
                data: { message: ERROR_MESSAGES.ERROR_USER_NOT_FOUND },
            };
        }

        const course = await prisma.course.findUnique({
            where: { id: parseInt(courseId, 10) },
        });

        if (!course) {
            return {
                status: HTTP_STATUS_CODES.NOT_FOUND,
                data: { message: ERROR_MESSAGES.ERROR_COURSE_NOT_FOUND },
            };
        }

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(userId, 10) },
            data: {
                courses: {
                    connect: { id: parseInt(courseId, 10) },
                },
            },
        });

        return {
            status: HTTP_STATUS_CODES.OK,
            data: updatedUser,
        };
    } catch (error) {
        console.error('Erro ao adicionar curso ao usuário:', error.message);
        return {
            status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
            data: { message: ERROR_MESSAGES.ERROR_ADD_COURSE_TO_USER },
        };
    }
}

module.exports = {
    createCoursePresencial,
    updateCoursePresencial,
    getCoursePresencialId,
    getCoursesPresential,
    deleteCoursePresential,
    addCursoAoUserPresential,
};