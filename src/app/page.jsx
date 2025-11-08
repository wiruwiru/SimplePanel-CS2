import { SanctionsStats } from "@/components/Home/SanctionsStats"
import { ServersList } from "@/components/Home/ServersList"
import { RecentBans } from "@/components/Home/RecentBans"
import { RecentMutes } from "@/components/Home/RecentMutes"

export const metadata = {
  title: "Inicio | SimplePanel"
}

export default function Home() {
  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto mt-6">

      <SanctionsStats />
      <ServersList />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <RecentBans />
        <RecentMutes />
      </div>
    </div>
  )
}