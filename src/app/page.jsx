import { SanctionsStats } from "@/components/Home/SanctionsStats"
import { ServersList } from "@/components/Home/ServersList"

export const metadata = {
  title: "Inicio | CrisisGamer"
}

export default function Home() {
  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto mt-6">
      <SanctionsStats />
      <ServersList />
    </div>
  )
}