import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { env } from '../config/env';

const mp = new MercadoPagoConfig({ accessToken: env.MP_ACCESS_TOKEN });

export interface CreatePreferenceParams {
  reservationId: string;
  clientName: string;
  clientEmail: string;
  claseTitle: string;
  claseDate: string;
  amount: number;
}

export async function createPreference(params: CreatePreferenceParams) {
  const preference = new Preference(mp);

  const result = await preference.create({
    body: {
      items: [
        {
          id: params.reservationId,
          title: `Sesión: ${params.claseTitle}`,
          description: `Fecha: ${params.claseDate}`,
          quantity: 1,
          unit_price: params.amount,
          currency_id: 'MXN',
        },
      ],
      payer: {
        name: params.clientName,
        email: params.clientEmail,
      },
      external_reference: params.reservationId,
      back_urls: {
        success: `${env.FRONTEND_URL}/portal/pago/exitoso`,
        failure: `${env.FRONTEND_URL}/portal/pago/fallido`,
        pending: `${env.FRONTEND_URL}/portal/pago/pendiente`,
      },
      auto_return: 'approved',
      notification_url: `${env.API_URL}/api/v1/portal/webhook/mercadopago`,
    },
  });

  return result;
}

export async function getPayment(paymentId: string) {
  const payment = new Payment(mp);
  return payment.get({ id: paymentId });
}
