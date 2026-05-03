// Genera credencial de acceso estilo tarjeta horizontal con branding Sarui
export async function buildBrandedCanvas(qrImage: string, name: string): Promise<HTMLCanvasElement> {
  const W = 900, H = 500;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ── Fondo general ─────────────────────────────────────────────────────────
  ctx.fillStyle = "#f4f8f6";
  ctx.fillRect(0, 0, W, H);

  // ── Panel izquierdo verde ──────────────────────────────────────────────────
  const panelW = 260;
  ctx.fillStyle = "#254F40";
  ctx.fillRect(0, 0, panelW, H);

  // Círculo decorativo (fondo sutil)
  ctx.beginPath();
  ctx.arc(panelW / 2, H - 30, 200, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fill();

  // "SARUI"
  ctx.fillStyle = "#F6FFB5";
  ctx.font = "bold 48px 'Arial', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SARUI", panelW / 2, 140);

  // "PILATES STUDIO"
  ctx.fillStyle = "#a7c4b5";
  ctx.font = "bold 14px 'Arial', sans-serif";
  ctx.letterSpacing = "3px";
  ctx.fillText("PILATES STUDIO", panelW / 2, 168);

  // Línea separadora
  ctx.fillStyle = "#3d7a62";
  ctx.fillRect(40, 188, panelW - 80, 1);

  // "CREDENCIAL DE ACCESO"
  ctx.fillStyle = "#6bab90";
  ctx.font = "11px 'Arial', sans-serif";
  ctx.fillText("CREDENCIAL DE ACCESO", panelW / 2, 212);

  // sarui.com.mx abajo
  ctx.fillStyle = "#5a8f78";
  ctx.font = "12px 'Arial', sans-serif";
  ctx.fillText("sarui.com.mx", panelW / 2, H - 30);

  // ── QR code ───────────────────────────────────────────────────────────────
  const qrSize = 240;
  const qrX = panelW + 50;
  const qrY = (H - qrSize) / 2;

  // Sombra/contenedor del QR
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.08)";
  ctx.shadowBlur = 16;
  ctx.beginPath();
  roundRect(ctx, qrX - 14, qrY - 14, qrSize + 28, qrSize + 28, 14);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";

  const img = new Image();
  img.src = qrImage;
  await new Promise<void>((res) => { img.onload = () => res(); });
  ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

  // ── Sección derecha: nombre y detalles ────────────────────────────────────
  const rightX = qrX + qrSize + 50;
  const rightW = W - rightX - 30;
  const centerRightX = rightX + rightW / 2;

  // Badge "SOCIO ACTIVO"
  const badgeW = 120, badgeH = 28, badgeX = rightX, badgeY = qrY;
  ctx.fillStyle = "#254F40";
  ctx.beginPath();
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 14);
  ctx.fill();
  ctx.fillStyle = "#F6FFB5";
  ctx.font = "bold 11px 'Arial', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("● SOCIO ACTIVO", badgeX + 14, badgeY + 18);

  // Nombre del cliente
  ctx.fillStyle = "#1a3d30";
  ctx.font = "bold 26px 'Arial', sans-serif";
  ctx.textAlign = "center";
  // Partir nombre en dos líneas si es largo
  const nameParts = name.split(" ");
  if (nameParts.length >= 2 && name.length > 18) {
    const mid = Math.ceil(nameParts.length / 2);
    const line1 = nameParts.slice(0, mid).join(" ");
    const line2 = nameParts.slice(mid).join(" ");
    ctx.fillText(line1, centerRightX, qrY + 80);
    ctx.fillText(line2, centerRightX, qrY + 112);
  } else {
    ctx.fillText(name, centerRightX, qrY + 90);
  }

  // Línea decorativa
  ctx.fillStyle = "#d1e8de";
  ctx.fillRect(rightX, qrY + 130, rightW, 1);

  // Instrucción
  ctx.fillStyle = "#4a7a65";
  ctx.font = "13px 'Arial', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Presenta al ingresar", centerRightX, qrY + 158);
  ctx.fillText("al estudio", centerRightX, qrY + 176);

  // Ícono QR pequeño decorativo
  ctx.fillStyle = "#c5dfd5";
  ctx.font = "28px 'Arial', sans-serif";
  ctx.fillText("▦", centerRightX, qrY + 224);

  // ── Franja inferior ───────────────────────────────────────────────────────
  ctx.fillStyle = "#254F40";
  ctx.fillRect(0, H - 12, W, 12);

  return canvas;
}

// Helper para rectángulos redondeados (compatible sin roundRect nativo)
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export async function downloadQRCard(qrImage: string, name: string): Promise<void> {
  const canvas = await buildBrandedCanvas(qrImage, name);
  const link = document.createElement("a");
  link.download = `credencial-sarui-${name.replace(/\s+/g, "-").toLowerCase()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
