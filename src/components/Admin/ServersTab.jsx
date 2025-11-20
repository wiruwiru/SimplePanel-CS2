"use client"

import { useState, useEffect } from "react"
import { Server, Settings, Shield } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent } from "@/components/UI/card"
import { Button } from "@/components/UI/button"
import { Input } from "@/components/UI/input"
import { Label } from "@/components/UI/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/UI/dialog"
import { Spinner } from "@/components/UI/spinner"
import { addToast } from "@heroui/react"

const Switch = ({ checked, onChange }) => (
  <button type="button" onClick={() => onChange(!checked)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "" : "bg-zinc-700"}`} style={checked ? { backgroundColor: 'var(--theme-primary)' } : {}} >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
  </button>
);

export function ServersTab() {
  const { hasFlag } = useAuth();
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedServer, setSelectedServer] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    ip: "",
    rconPassword: "",
    visible: true,
  });

  const canManage = hasFlag("@web/root");

  useEffect(() => {
    if (canManage) {
      fetchServers();
    }
  }, [canManage]);

  const fetchServers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/servers", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Error al obtener servidores");
      }

      const data = await response.json();
      setServers(data);
    } catch (error) {
      console.error("Error fetching servers:", error);
      addToast({
        title: "Error al cargar servidores",
        color: "danger",
        variant: "solid",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (server) => {
    if (!canManage) return;
    setSelectedServer(server);
    setFormData({
      name: server.name,
      ip: server.address,
      rconPassword: "",
      visible: server.visible === 1,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedServer) return;
    try {
      setSubmitting(true);

      const response = await fetch("/api/admin/servers", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serverId: selectedServer.id,
          name:
            formData.name !== selectedServer.name ? formData.name : undefined,
          ip: formData.ip !== selectedServer.address ? formData.ip : undefined,
          rconPassword: formData.rconPassword || undefined,
          visible: formData.visible,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar servidor");
      }

      addToast({
        title: "Servidor actualizado correctamente",
        color: "success",
        variant: "solid",
      });

      setDialogOpen(false);
      fetchServers();
    } catch (error) {
      console.error("Error updating server:", error);
      addToast({
        title: "Error al actualizar servidor",
        color: "danger",
        variant: "solid",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!canManage) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent>
          <div className="text-center py-8 text-zinc-400">
            <Shield className="size-12 mx-auto mb-4 text-zinc-600" />
            <p>No tienes permisos para gestionar servidores.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Spinner className="size-8" style={{ color: 'var(--theme-primary)' }} />
            <span className="ml-3 text-zinc-400">Cargando servidores...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {servers.map((server) => (
          <Card key={server.id} className="bg-zinc-900 border-zinc-800 relative overflow-hidden">
            <CardContent>
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-yellow-600/10 rounded-lg shrink-0">
                  <Server className="size-5 text-[#FFB800]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-zinc-100 mb-1 truncate">{server.name}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-zinc-500 text-sm font-mono">{server.address}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${server.visible === 1 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-zinc-700/50 text-zinc-400 border border-zinc-600"}`} >
                      {server.visible === 1 ? (
                        <>
                          <span className="size-1.5 rounded-full bg-emerald-400" />Visible
                        </>
                      ) : (
                        <>
                          <span className="size-1.5 rounded-full bg-red-800" />Oculto
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700" onClick={() => handleOpenDialog(server)} >
                <Settings className="size-4 mr-2" />
                Configurar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Configurar servidor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="server-name" className="text-zinc-300">Nombre del servidor</Label>
              <Input id="server-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-zinc-800 border-zinc-700 text-zinc-100" required disabled={submitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="server-ip" className="text-zinc-300">IP:Puerto</Label>
              <Input id="server-ip" placeholder="192.168.1.1:27015" value={formData.ip} onChange={(e) => setFormData({ ...formData, ip: e.target.value })} className="bg-zinc-800 border-zinc-700 text-zinc-100" required disabled={submitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rcon-password" className="text-zinc-300">Contraseña RCON</Label>
              <Input id="rcon-password" type="password" placeholder="Dejar vacío para no cambiar" value={formData.rconPassword} onChange={(e) => setFormData({ ...formData, rconPassword: e.target.value })} className="bg-zinc-800 border-zinc-700 text-zinc-100" disabled={submitting} />
              <p className="text-xs text-zinc-500">Solo completa si deseas cambiar la contraseña</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg border border-zinc-700">
              <div>
                <Label htmlFor="visibility" className="text-zinc-300">Servidor visible</Label>
                <p className="text-xs text-zinc-500 mt-1">Mostrar en la lista pública</p>
              </div>
              <Switch checked={formData.visible} onChange={(checked) => setFormData({ ...formData, visible: checked })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800" disabled={submitting} >Cancelar</Button>
              <Button type="submit" className="text-white" style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-foreground)' }} onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = 'var(--theme-primary-hover)'; }} onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = 'var(--theme-primary)'; }} disabled={submitting} >
                {submitting ? (
                  <>
                    <Spinner className="size-4 mr-2" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}