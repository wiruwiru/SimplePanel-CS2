import { MuteList } from "@/components/Home/SanctionsList/MuteList"

export async function generateMetadata() {
  const panelName = process.env.PANEL_NAME || "SimplePanel"

  return {
    title: `Mutes | ${panelName}`
  }
}

export default function MutesPage() {
  return <MuteList />
}