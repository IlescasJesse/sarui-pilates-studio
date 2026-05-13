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

const WEBHOOK_PATH = '/api/v1/portal/webhook/mercadopago';

function isHttps(url: string) {
  return url.startsWith('https://');
}

function addBackUrls(body: Record<string, any>, baseUrl: string, successPath: string) {
  if (!isHttps(baseUrl)) return;
  body.back_urls = {
    success: `${baseUrl}${successPath}`,
    failure: `${baseUrl}/tienda/pago/fallido`,
    pending: `${baseUrl}/tienda/pago/pendiente`,
  };
  body.auto_return = 'approved';
}

function addNotificationUrl(body: Record<string, any>) {
  if (!isHttps(env.API_URL)) return;
  body.notification_url = `${env.API_URL}${WEBHOOK_PATH}`;
}

export async function createPreference(params: CreatePreferenceParams) {
  const preference = new Preference(mp);

  const body: Record<string, any> = {
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
  };

  addBackUrls(body, env.FRONTEND_URL, '/tienda/pago/exitoso');
  addNotificationUrl(body);

  const result = await preference.create({ body: body as any });
  return result;
}

export async function getPayment(paymentId: string) {
  const payment = new Payment(mp);
  return payment.get({ id: paymentId });
}

export interface CreatePackagePreferenceParams {
  packageId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  packageName: string;
  sessions: number;
  amount: number;
}

export async function createPackagePreference(params: CreatePackagePreferenceParams) {
  const preference = new Preference(mp);
  const externalRef = `PKG:${params.packageId}:${params.clientId}`;

  const body: Record<string, any> = {
    items: [
      {
        id: externalRef,
        title: `Paquete: ${params.packageName}`,
        description: `${params.sessions} sesión${params.sessions !== 1 ? 'es' : ''}`,
        quantity: 1,
        unit_price: params.amount,
        currency_id: 'MXN',
      },
    ],
    payer: { name: params.clientName, email: params.clientEmail },
    external_reference: externalRef,
  };

  addBackUrls(body, env.FRONTEND_URL, '/tienda/pago/membresia-exitosa');
  addNotificationUrl(body);

  const result = await preference.create({ body: body as any });
  return result;
}
