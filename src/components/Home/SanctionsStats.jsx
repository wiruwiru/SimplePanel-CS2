"use client"

import { useState, useEffect } from "react"
import { Ban, VolumeX } from "lucide-react"
import { Card, CardContent } from "@/components/UI/card"
import { Spinner } from "@/components/UI/spinner"

export function SanctionsStats() {
  const [stats, setStats] = useState({ activeBans: 0, activeMutes: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/sanctions/stats", { cache: "no-store" })
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent>
            <div className="flex items-center justify-center py-6">
              <Spinner className="size-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent>
            <div className="flex items-center justify-center py-6">
              <Spinner className="size-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

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
                <p className="text-zinc-400 text-sm md:text-base">Baneos totales</p>
                <p className="text-zinc-100 text-xl md:text-2xl">{stats.activeBans}</p>
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
                <p className="text-zinc-400 text-sm md:text-base">Muteos totales</p>
                <p className="text-zinc-100 text-xl md:text-2xl">{stats.activeMutes}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}