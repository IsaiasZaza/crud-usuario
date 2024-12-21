const { PrismaClient } = require('@prisma/client');
const { MercadoPagoConfig, Payment } = require('mercadopago');
require('dotenv').config();

const prisma = new PrismaClient();

const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
});

const paymentClient = new Payment(client);

const handleWebhookPaymentStatus = async (paymentId) => {
    try {
        if (!paymentId) {
            return { status: 400, message: 'ID de pagamento não fornecido.' };
        }

        let paymentData;
        try {
            const response = await paymentClient.get({ id: paymentId });
            paymentData = response.body || response;
        } catch (error) {
            console.error('Erro ao consultar pagamento:', error.message, error.stack);
            return { status: 500, message: 'Erro ao consultar o pagamento.' };
        }

        console.log('Detalhes do pagamento:', paymentData);

        const { status: paymentStatus, external_reference } = paymentData;

        // Validação da referência externa
        if (!external_reference || !/^[a-zA-Z0-9-]+$/.test(external_reference)) {
            console.error('Referência inválida ou ausente:', external_reference);
            return { status: 400, message: 'Referência do pedido inválida.' };
        }

        const purchase = await prisma.purchase.findUnique({
            where: { id: external_reference },
        });

        if (!purchase) {
            console.error('Compra não encontrada:', external_reference);
            return { status: 404, message: 'Compra não encontrada.' };
        }

        switch (paymentStatus) {
            case 'approved':
                await prisma.purchase.update({
                    where: { id: purchase.id },
                    data: { status: 'paid', updatedAt: new Date() },
                });

                try {
                    await prisma.user.update({
                        where: { id: purchase.userId },
                        data: {
                            courses: {
                                connect: { id: purchase.courseId },
                            },
                        },
                    });
                } catch (error) {
                    console.error('Erro ao associar curso:', error.message);
                    return {
                        status: 500,
                        message: 'Pagamento aprovado, mas erro ao associar curso.',
                    };
                }

                return { status: 200, message: 'Pagamento aprovado e curso associado.' };

            case 'cancelled':
                await prisma.purchase.update({
                    where: { id: purchase.id },
                    data: { status: 'cancelled', updatedAt: new Date() },
                });
                return { status: 200, message: 'Pagamento cancelado.' };

            case 'pending':
                await prisma.purchase.update({
                    where: { id: purchase.id },
                    data: { status: 'pending', updatedAt: new Date() },
                });
                return { status: 200, message: 'Pagamento pendente.' };

            default:
                console.warn('Status desconhecido:', paymentStatus);
                return { status: 400, message: `Status desconhecido: ${paymentStatus}` };
        }
    } catch (error) {
        console.error('Erro no webhook:', error.message, error.stack);
        return { status: 500, message: 'Erro interno ao processar o pagamento.' };
    }
};

module.exports = { handleWebhookPaymentStatus };
