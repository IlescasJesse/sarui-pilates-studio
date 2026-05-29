// Genera credencial de acceso estilo tarjeta horizontal con branding Sarui
export async function buildBrandedCanvas(qrImage: string, name: string): Promise<HTMLCanvasElement> {
  const SCALE = 2; // retina quality
  const W = 900 * SCALE, H = 500 * SCALE;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(SCALE, SCALE);

  const RW = 900, RH = 500; // logical dimensions

  // ── Fondo general ────────────────────────────────────────────────────────────
  ctx.fillStyle = "#f4f8f6";
  ctx.fillRect(0, 0, RW, RH);

  // ── Panel izquierdo verde ─────────────────────────────────────────────────
  const panelW = 260;
  ctx.fillStyle = "#254F40";
  ctx.fillRect(0, 0, panelW, RH);

  // Círculo decorativo
  ctx.beginPath();
  ctx.arc(panelW / 2, RH - 30, 200, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fill();

  // "SARUI"
  ctx.fillStyle = "#F6FFB5";
  ctx.font = "bold 52px 'Arial', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SARUI", panelW / 2, 130);

  // "PILATES STUDIO"
  ctx.fillStyle = "#a7c4b5";
  ctx.font = "bold 13px 'Arial', sans-serif";
  ctx.letterSpacing = "4px";
  ctx.fillText("PILATES STUDIO", panelW / 2, 158);
  ctx.letterSpacing = "0px";

  // Línea separadora
  ctx.fillStyle = "#3d7a62";
  ctx.fillRect(40, 176, panelW - 80, 1);

  // "CREDENCIAL DE ACCESO"
  ctx.fillStyle = "#6bab90";
  ctx.font = "10px 'Arial', sans-serif";
  ctx.fillText("CREDENCIAL DE ACCESO", panelW / 2, 198);

  // sarui.com.mx
  ctx.fillStyle = "#5a8f78";
  ctx.font = "12px 'Arial', sans-serif";
  ctx.fillText("sarui.com.mx", panelW / 2, RH - 28);

  // ── QR code ──────────────────────────────────────────────────────────────────
  const qrSize = 230;
  const qrX = panelW + 50;
  const qrY = (RH - qrSize) / 2;

  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.10)";
  ctx.shadowBlur = 18;
  ctx.beginPath();
  roundRect(ctx, qrX - 14, qrY - 14, qrSize + 28, qrSize + 28, 14);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";

  const img = new Image();
  img.src = qrImage;
  await new Promise<void>((res) => { img.onload = () => res(); });
  ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

  // ── Sección derecha ───────────────────────────────────────────────────────
  const rightX = qrX + qrSize + 44;
  const rightW = RW - rightX - 28;
  const cx = rightX + rightW / 2;

  // Badge "● SOCIO ACTIVO"
  const badgeW = 148, badgeH = 30, badgeY = qrY;
  ctx.fillStyle = "#254F40";
  ctx.beginPath();
  roundRect(ctx, rightX, badgeY, badgeW, badgeH, 15);
  ctx.fill();
  ctx.fillStyle = "#F6FFB5";
  ctx.font = "bold 11px 'Arial', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("● SOCIO ACTIVO", rightX + 16, badgeY + 20);

  // Nombre
  ctx.fillStyle = "#1a3d30";
  ctx.textAlign = "center";
  const nameParts = name.trim().split(/\s+/);
  if (nameParts.length >= 2 && name.length > 16) {
    const mid = Math.ceil(nameParts.length / 2);
    ctx.font = "bold 24px 'Arial', sans-serif";
    ctx.fillText(nameParts.slice(0, mid).join(" "), cx, qrY + 76);
    ctx.fillText(nameParts.slice(mid).join(" "), cx, qrY + 104);
  } else {
    ctx.font = "bold 26px 'Arial', sans-serif";
    ctx.fillText(name, cx, qrY + 84);
  }

  // Línea decorativa
  ctx.fillStyle = "#d1e8de";
  ctx.fillRect(rightX, qrY + 122, rightW, 1);

  // Instrucción
  ctx.fillStyle = "#4a7a65";
  ctx.font = "13px 'Arial', sans-serif";
  ctx.fillText("Presenta al ingresar", cx, qrY + 150);
  ctx.fillText("al estudio", cx, qrY + 168);

  // Ícono decorativo
  ctx.fillStyle = "#c5dfd5";
  ctx.font = "26px 'Arial', sans-serif";
  ctx.fillText("▦", cx, qrY + 216);

  // ── Franja inferior ───────────────────────────────────────────────────────
  ctx.fillStyle = "#254F40";
  ctx.fillRect(0, RH - 12, RW, 12);

  return canvas;
}

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
