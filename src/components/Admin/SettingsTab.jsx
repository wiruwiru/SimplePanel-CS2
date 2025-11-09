"use client"

import { Settings } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/card"
import { Button } from "@/components/UI/button"
import { Input } from "@/components/UI/input"
import { Label } from "@/components/UI/label"

const Switch = ({ checked, onChange, id }) => (
  <button id={id} type="button" onClick={() => onChange(!checked)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-[#FFB800]' : 'bg-zinc-700'}`} >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

const Separator = () => <div className="h-px bg-zinc-800" />;

export function SettingsTab() {
  const { hasFlag } = useAuth()
  const canManage = hasFlag('@web/root');

  if (!canManage) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent>
          <div className="text-center py-8 text-zinc-400">
            <Settings className="size-12 mx-auto mb-4 text-zinc-600" />
            <p>No tienes permisos para modificar la configuración.</p>
            <p className="text-sm mt-2">Se requiere el flag @web/root o @css/root</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* Configuración del Panel */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="size-5 text-[#FFB800]" />
            <div>
              <CardTitle className="text-zinc-100">Configuración del panel</CardTitle>
              <p className="text-zinc-400 text-sm mt-1">Personaliza el comportamiento del panel</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="panel-name" className="text-zinc-300">Nombre del panel</Label>
              <Input id="panel-name" defaultValue="CrisisGamer" className="bg-zinc-800 border-zinc-700 text-zinc-100" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="panel-url" className="text-zinc-300">URL del panel</Label>
              <Input id="panel-url" defaultValue="https://cs.crisisgamer.com" className="bg-zinc-800 border-zinc-700 text-zinc-100" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notificaciones */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="size-5 text-[#FFB800]" />
            <div>
              <CardTitle className="text-zinc-100">Notificaciones</CardTitle>
              <p className="text-zinc-400 text-sm mt-1">Configura alertas y notificaciones</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notify-bans" className="text-zinc-300">Baneos</Label>
                <p className="text-xs text-zinc-500">Notificar cuando se cree o modifique un baneo</p>
              </div>
              <Switch id="notify-bans" checked={true} onChange={() => {}} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notify-mutes" className="text-zinc-300">Muteos</Label>
                <p className="text-xs text-zinc-500">Notificar cuando se cree o modifique un mute</p>
              </div>
              <Switch id="notify-appeals" checked={true} onChange={() => {}} />
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="discord-webhook" className="text-zinc-300">Discord Webhook</Label>
            <Input id="discord-webhook" placeholder="https://discord.com/api/webhooks/..." className="bg-zinc-800 border-zinc-700 text-zinc-100" />
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent>
            <div className="flex justify-end gap-3">
              <Button variant="outline" className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">Restaurar valores</Button>
              <Button className="bg-[#FFB800] hover:bg-[#ce9300]">Guardar cambios</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}