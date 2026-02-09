import { BanList } from "@/components/Home/SanctionsList/BanList"

export async function generateMetadata() {
  const panelName = process.env.PANEL_NAME || "SimplePanel"

  return {
    title: `Bans | ${panelName}`
  }
}

export default function BansPage() {
  return <BanList />
}