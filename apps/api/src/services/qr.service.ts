import { v4 as uuidv4 } from 'uuid'
import QRCode from 'qrcode'

export function generateQRCode(): string {
  return uuidv4()
}

export async function generateQRImage(qrCode: string): Promise<string> {
  return QRCode.toDataURL(qrCode, {
    width: 256,
    margin: 2,
    color: { dark: '#254F40', light: '#FDFFEC' },
  })
}
