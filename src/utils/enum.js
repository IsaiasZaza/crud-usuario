const ERROR_MESSAGES = {
    USER_NOT_FOUND: 'Usuário não encontrado.',
    USER_NOT_UPDATE: 'Ocorreu um erro ao atualizar o usuário.',
    USER_NOT_ID: 'Erro ao obter usuário por ID.',
    USERS_NOT_EXIST: 'Erro ao solicitar a lista de usuários.',
    ERROR_CREAT_USER: 'Erro ao criar usuário.',
    USER_ERROR_EMAIL: 'Já existe um usuário com este email.',
    FILDS_INVALID: 'Todos os campos obrigatórios devem ser fornecidos.',
    ERROR_USER_OR_PASSWORD: 'Credenciais inválidas.',
    USER_DELETED: 'Usuário excluído com sucesso.',
    ERROR_INTERNAL_SERVER: 'Erro interno no servidor.',
    NOT_AUTHORIZED: 'Não autorizado.',
    FORBIDDEN: 'Acesso negado.',
    TOKEN_REQUIRED: 'Token de autenticação é obrigatório.',
    INVALID_TOKEN: 'Token de autenticação inválido.',
    ERROR_LOGIN: 'Erro ao fazer login.',
    EMAIL_AND_PASSWORD_REQUIRED: 'Email e senha são obrigatórios.',
    PASSWORD_REQUIRED: 'Senha atual e nova senha são obrigatórias.',
    VALIDATION_ERROR: 'Erro de validação nos campos enviados.',
    RESOURCE_NOT_FOUND: 'Recurso solicitado não encontrado.',
    METHOD_NOT_ALLOWED: 'Método HTTP não permitido.',
    SERVICE_UNAVAILABLE: 'Serviço temporariamente indisponível.',
    INVALID_ROLE: 'Função inválida. Escolha entre ADMIN, PROFESSOR ou ALUNO.',
    INVALID_REQUESTED_ROLE: 'A função solicitada para login é inválida.',
    ROLE_NOT_ALLOWED: 'Você não possui permissão para acessar como a função solicitada.'
};

const SUCCESS_MESSAGES = {
    SUCCESS_USER_CREATED: 'Usuário criado com sucesso.',
    SUCCESS_USER_UPDATED: 'Usuário atualizado com sucesso.',
    SUCCESS_USER_DELETED: 'Usuário deletado com sucesso.',
    USER_CREATED: 'Usuário criado com sucesso.',
    LOGIN_SUCCESS: 'Login realizado com sucesso.',
    SUCCESS_PASSWORD_CHANGED: 'Senha alterada com sucesso.',
    USERS_FOUND: 'Usuários encontrados com sucesso.',
    USER_FOUND: 'Usuário encontrado com sucesso.',
    USER_UPDATED: 'Usuário atualizado com sucesso.',
    USER_DELETED: 'Usuário deletado com sucesso.',
    EMAIL_SENT: 'E-mail de redefinição de senha enviado com sucesso.',
};

const USER_ROLES_DESCRIPTION = {
    ADMIN: 'admin',
    READ: 'read',
    WRITE: 'write',
    SUPER_ADMIN: 'super_admin',
    GUEST: 'guest',
};

const HTTP_STATUS_CODES = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
};

module.exports = {
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    USER_ROLES_DESCRIPTION,
    HTTP_STATUS_CODES,
};
