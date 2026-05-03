"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail, Phone, Trash2, Edit2, MoreHorizontal, QrCode, RefreshCw, Copy, MessageCircle, CreditCard, Download } from "lucide-react";
import { useClientes, useDeleteCliente } from "@/hooks/useClientes";
import { MembresiaForm } from "@/components/membresias/MembresiaForm";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ClientesTableProps {
  onEdit: (clienteId: string) => void;
  searchTerm?: string;
  currentPage?: number;
}

interface QrData {
  clientId: string;
  name: string;
  phone?: string | null;
  qrCode: string;
  qrImage: string;
}

// ─── Genera canvas con branding Sarui ────────────────────────────────────────
async function buildBrandedCanvas(qrImage: string, name: string): Promise<HTMLCanvasElement> {
  const W = 600, H = 720;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Fondo blanco
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // Barra superior verde
  ctx.fillStyle = "#254F40";
  ctx.fillRect(0, 0, W, 110);

  // Nombre del estudio
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 26px 'Arial', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SARUI PILATES STUDIO", W / 2, 52);
  ctx.font = "15px 'Arial', sans-serif";
  ctx.fillStyle = "#a7c4b5";
  ctx.fillText("Acceso con código QR", W / 2, 82);

  // Imagen QR
  const img = new Image();
  img.src = qrImage;
  await new Promise<void>((res) => { img.onload = () => res(); });
  const qrSize = 370;
  const qrX = (W - qrSize) / 2;
  ctx.drawImage(img, qrX, 140, qrSize, qrSize);

  // Nombre del cliente
  ctx.fillStyle = "#254F40";
  ctx.font = "bold 22px 'Arial', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(name, W / 2, 560);

  // Separador
  ctx.fillStyle = "#e5e7eb";
  ctx.fillRect(60, 582, W - 120, 1);

  // Instrucción
  ctx.fillStyle = "#6b7280";
  ctx.font = "13px 'Arial', sans-serif";
  ctx.fillText("Presenta este código en el kiosk de acceso", W / 2, 610);
  ctx.fillStyle = "#9ca3af";
  ctx.font = "12px 'Arial', sans-serif";
  ctx.fillText("sarui.com.mx", W / 2, 632);

  // Barra inferior
  ctx.fillStyle = "#254F40";
  ctx.fillRect(0, H - 18, W, 18);

  return canvas;
}

// ─── Diálogo QR ───────────────────────────────────────────────────────────────
function QrDialog({ clienteId, onClose }: { clienteId: string; onClose: () => void }) {
  const { data, isLoading, refetch } = useQuery<QrData>({
    queryKey: ["cliente-qr", clienteId],
    queryFn: async () => {
      const r = await apiClient.get<{ success: boolean; data: QrData }>(`/clientes/${clienteId}/qr`);
      return r.data.data;
    },
    staleTime: 0,
  });

  const regenerarMutation = useMutation({
    mutationFn: async () => {
      const r = await apiClient.post<{ success: boolean; data: QrData }>(`/clientes/${clienteId}/qr/regenerar`);
      return r.data.data;
    },
    onSuccess: () => refetch(),
  });

  const copiar = () => {
    if (data?.qrCode) navigator.clipboard.writeText(data.qrCode);
  };

  const descargar = async () => {
    if (!data) return;
    const canvas = await buildBrandedCanvas(data.qrImage, data.name);
    const link = document.createElement("a");
    link.download = `qr-sarui-${data.name.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const compartirWhatsapp = async () => {
    if (!data) return;
    const canvas = await buildBrandedCanvas(data.qrImage, data.name);

    // Intentar Web Share API con imagen (funciona en móvil)
    if (typeof navigator.share === "function") {
      canvas.toBlob(async (blob) => {
        if (!blob) return fallbackWa();
        const file = new File([blob], `qr-sarui-${data.name}.png`, { type: "image/png" });
        try {
          await navigator.share({
            title: "Código QR – Sarui Pilates Studio",
            text: `¡Hola ${data.name}! 🌿 Este es tu código QR de acceso a Sarui Pilates Studio.`,
            files: [file],
          });
        } catch {
          fallbackWa();
        }
      });
      return;
    }
    fallbackWa();

    function fallbackWa() {
      if (!data?.phone) return;
      const phone = data.phone.replace(/\D/g, "");
      const num = phone.startsWith("52") ? phone : `52${phone}`;
      const msg = encodeURIComponent(
        `¡Hola ${data.name}! 🌿 Este es tu código QR de acceso al kiosk de Sarui Pilates Studio:\n\n${data.qrCode}\n\nGuárdalo para hacer tu check-in fácil y rápido.`
      );
      window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[#254F40]" />
            Código QR de acceso
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-[#254F40] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data ? (
          <div className="space-y-4">
            <p className="text-sm text-center font-medium text-[#254F40]">{data.name}</p>

            {/* Imagen QR */}
            <div className="flex justify-center">
              <img
                src={data.qrImage}
                alt="Código QR"
                className="w-48 h-48 rounded-xl border border-border shadow-sm"
              />
            </div>

            {/* Código texto */}
            <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
              <code className="text-xs text-muted-foreground flex-1 truncate">{data.qrCode}</code>
              <button onClick={copiar} title="Copiar código" className="text-muted-foreground hover:text-foreground transition-colors">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Acciones */}
            <div className="flex flex-col gap-2">
              <Button
                className="w-full bg-[#254F40] hover:bg-[#1d3d30] text-white gap-2"
                onClick={descargar}
              >
                <Download className="w-4 h-4" />
                Descargar tarjeta QR
              </Button>
              {data.phone && (
                <Button
                  className="w-full bg-[#25d366] hover:bg-[#1fb055] text-white gap-2"
                  onClick={compartirWhatsapp}
                >
                  <MessageCircle className="w-4 h-4" />
                  Compartir por WhatsApp
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => regenerarMutation.mutate()}
                disabled={regenerarMutation.isPending}
              >
                <RefreshCw className={`w-4 h-4 ${regenerarMutation.isPending ? "animate-spin" : ""}`} />
                {regenerarMutation.isPending ? "Regenerando..." : "Regenerar QR"}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Al regenerar se invalida el QR anterior
            </p>
          </div>
        ) : (
          <p className="text-center text-sm text-destructive py-6">Error al cargar el QR</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Tabla principal ──────────────────────────────────────────────────────────
export function ClientesTable({ onEdit, searchTerm, currentPage = 1 }: ClientesTableProps) {
  const { data, isLoading, error } = useClientes({ search: searchTerm, page: currentPage });
  const deleteMutation = useDeleteCliente();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [qrClienteId, setQrClienteId] = useState<string | null>(null);
  const [membresiaClienteId, setMembresiaClienteId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      setConfirmDelete(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  if (error) return <div className="text-center py-8"><p className="text-destructive">Error al cargar los clientes</p></div>;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-slate-200 animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (!data?.clientes || data.clientes.length === 0) {
    return <div className="text-center py-12"><p className="text-muted-foreground">No se encontraron clientes</p></div>;
  }

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-sm">Nombre</th>
              <th className="text-left px-4 py-3 font-semibold text-sm">Correo</th>
              <th className="text-left px-4 py-3 font-semibold text-sm">Teléfono</th>
              <th className="text-left px-4 py-3 font-semibold text-sm">Estado</th>
              <th className="text-center px-4 py-3 font-semibold text-sm">QR</th>
              <th className="text-center px-4 py-3 font-semibold text-sm">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.clientes.map((cliente) => (
              <tr key={cliente.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#254F40]/10 flex items-center justify-center text-xs font-semibold text-[#254F40]">
                      {cliente.firstName.charAt(0)}{cliente.lastName.charAt(0)}
                    </div>
                    <span>{cliente.firstName} {cliente.lastName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    {cliente.user.email}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  {cliente.phone ? (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      {cliente.phone}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <Badge variant={cliente.user.isActive ? "success" : "destructive"}>
                    {cliente.user.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => setQrClienteId(cliente.id)}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#254F40]/8 hover:bg-[#254F40]/15 text-[#254F40] transition-colors"
                    title="Ver QR de acceso"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(cliente.id)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setMembresiaClienteId(cliente.id)}>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Nueva Membresía
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setConfirmDelete(cliente.id)} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data.pagination.pages > 1 && (
          <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
            Página {data.pagination.page} de {data.pagination.pages} · Total: {data.pagination.total}
          </div>
        )}
      </div>

      {/* Diálogo de confirmación de eliminación */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Confirmar eliminación</h3>
            <p className="text-muted-foreground mb-6">¿Estás segura de que deseas eliminar este cliente?</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={() => handleDelete(confirmDelete)} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo QR */}
      {qrClienteId && (
        <QrDialog clienteId={qrClienteId} onClose={() => setQrClienteId(null)} />
      )}

      {/* Form nueva membresía */}
      <MembresiaForm
        isOpen={!!membresiaClienteId}
        onClose={() => setMembresiaClienteId(null)}
        defaultClientId={membresiaClienteId ?? undefined}
      />
    </>
  );
}
