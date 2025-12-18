import { SanctionsStats } from "@/components/Home/SanctionsStats"
import { ServersList } from "@/components/Home/ServersList"

export async function generateMetadata() {
  const panelName = process.env.PANEL_NAME || "SimplePanel"

  return {
    title: `Home | ${panelName}`
  }
}

export default function Home() {
  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto mt-6">
      <SanctionsStats />
      <ServersList />
    </div>
  )
}