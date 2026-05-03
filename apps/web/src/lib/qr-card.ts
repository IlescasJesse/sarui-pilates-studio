export async function buildBrandedCanvas(qrImage: string, name: string): Promise<HTMLCanvasElement> {
  const W = 600, H = 720;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#254F40";
  ctx.fillRect(0, 0, W, 110);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 26px 'Arial', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SARUI PILATES STUDIO", W / 2, 52);
  ctx.font = "15px 'Arial', sans-serif";
  ctx.fillStyle = "#a7c4b5";
  ctx.fillText("Acceso con código QR", W / 2, 82);

  const img = new Image();
  img.src = qrImage;
  await new Promise<void>((res) => { img.onload = () => res(); });
  const qrSize = 370;
  ctx.drawImage(img, (W - qrSize) / 2, 140, qrSize, qrSize);

  ctx.fillStyle = "#254F40";
  ctx.font = "bold 22px 'Arial', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(name, W / 2, 560);

  ctx.fillStyle = "#e5e7eb";
  ctx.fillRect(60, 582, W - 120, 1);

  ctx.fillStyle = "#6b7280";
  ctx.font = "13px 'Arial', sans-serif";
  ctx.fillText("Presenta este código en el kiosk de acceso", W / 2, 610);
  ctx.fillStyle = "#9ca3af";
  ctx.font = "12px 'Arial', sans-serif";
  ctx.fillText("sarui.com.mx", W / 2, 632);

  ctx.fillStyle = "#254F40";
  ctx.fillRect(0, H - 18, W, 18);

  return canvas;
}

export async function downloadQRCard(qrImage: string, name: string): Promise<void> {
  const canvas = await buildBrandedCanvas(qrImage, name);
  const link = document.createElement("a");
  link.download = `qr-sarui-${name.replace(/\s+/g, "-").toLowerCase()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
