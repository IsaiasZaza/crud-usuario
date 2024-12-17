const { PrismaClient } = require('@prisma/client');
const { MercadoPagoConfig, Payment } = require('mercadopago');
require('dotenv').config();

// Instância do Prisma para banco de dados
const prisma = new PrismaClient();

// Configura o SDK do Mercado Pago
const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
});

// Instância do Payment
const paymentClient = new Payment(client);

const handleWebhookPaymentStatus = async (paymentId) => {
    try {
        if (!paymentId) {
            return {
                status: 400,
                message: 'ID de pagamento não fornecido.',
            };
        }

        // Recuperar os detalhes do pagamento com a nova SDK
        let paymentData;
        try {
            const response = await paymentClient.get({ id: paymentId });
            paymentData = response; // Agora 'response' contém o pagamento direto
        } catch (error) {
            console.error('Erro ao consultar o pagamento do Mercado Pago:', error);
            return {
                status: 500,
                message: 'Erro ao consultar o pagamento do Mercado Pago.',
            };
        }

        console.log('Detalhes do pagamento:', paymentData);

        // Extraia os dados necessários
        const { status: paymentStatus, external_reference } = paymentData;

        // Verificar se a referência externa (ID da compra) está presente
        if (!external_reference) {
            console.error('Referência do pedido ausente no pagamento.');
            return {
                status: 400,
                message: 'Referência do pedido ausente no pagamento.',
            };
        }

        // Buscar a compra associada no banco de dados
        const purchase = await prisma.purchase.findUnique({
            where: { id: external_reference }, // external_reference é o ID da compra
        });

        if (!purchase) {
            console.error('Compra não encontrada para o ID:', external_reference);
            return {
                status: 404,
                message: 'Compra não encontrada.',
            };
        }

        // Lógica de atualização da compra com base no status do pagamento
        switch (paymentStatus) {
            case 'approved':
                // Atualizar status da compra para 'paid' e associar o curso ao usuário
                await prisma.purchase.update({
                    where: { id: purchase.id },
                    data: {
                        status: 'paid',
                        updatedAt: new Date(),
                    },
                });

                await prisma.user.update({
                    where: { id: purchase.userId },
                    data: {
                        courses: {
                            connect: { id: purchase.courseId },
                        },
                    },
                });

                return {
                    status: 200,
                    message: 'Pagamento aprovado. Curso adicionado ao usuário.',
                };

            case 'cancelled':
                // Atualizar status da compra para 'cancelled'
                await prisma.purchase.update({
                    where: { id: purchase.id },
                    data: {
                        status: 'cancelled',
                        updatedAt: new Date(),
                    },
                });

                return {
                    status: 200,
                    message: 'Pagamento cancelado. Status da compra atualizado.',
                };

            case 'pending':
                // Atualizar status da compra para 'pending'
                await prisma.purchase.update({
                    where: { id: purchase.id },
                    data: {
                        status: 'pending',
                        updatedAt: new Date(),
                    },
                });

                return {
                    status: 200,
                    message: 'Pagamento pendente. Status da compra atualizado.',
                };

            default:
                return {
                    status: 400,
                    message: 'Status de pagamento desconhecido.',
                };
        }
    } catch (error) {
        console.error('Erro ao processar o webhook do Mercado Pago:', error);
        return {
            status: 500,
            message: 'Erro interno ao processar o pagamento.',
        };
    }
};

// Exportar a função
module.exports = {
    handleWebhookPaymentStatus,
};
