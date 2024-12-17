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
        // Consultar o status do pagamento via MercadoPago
        const paymentData = await paymentClient.getPayment(paymentId);

        // Verificar o status do pagamento
        const { status, status_detail } = paymentData.response;

        // Atualizar o status no banco de dados
        const updatedPayment = await prisma.payment.update({
            where: { paymentId },
            data: {
                status,
                statusDetail: status_detail,
            },
        });

        console.log(`Pagamento atualizado: ${updatedPayment.id}, Status: ${status}`);
        return updatedPayment;
    } catch (error) {
        console.error('Erro ao processar o pagamento: ', error);
        throw new Error('Erro ao processar o pagamento');
    }
};

// Exportar a função
module.exports = {
    handleWebhookPaymentStatus,
};
