import { Ban, VolumeX } from "lucide-react"
import { Card, CardContent } from "@/components/UI/card"
import { getActiveBansCount, getActiveMutesCount } from "@/data/sanctions"

export function SanctionsStats() {
  const activeBansCount = getActiveBansCount()
  const activeMutesCount = getActiveMutesCount()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-red-600/10 rounded-lg">
                <Ban className="size-5 md:size-6 text-red-500" />
              </div>
              <div>
                <p className="text-zinc-400 text-sm md:text-base">Baneos Activos</p>
                <p className="text-zinc-100 text-xl md:text-2xl">{activeBansCount}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-yellow-600/10 rounded-lg">
                <VolumeX className="size-5 md:size-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-zinc-400 text-sm md:text-base">Muteos Activos</p>
                <p className="text-zinc-100 text-xl md:text-2xl">{activeMutesCount}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}