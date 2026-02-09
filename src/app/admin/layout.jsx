export async function generateMetadata() {
  const panelName = process.env.PANEL_NAME || "SimplePanel"

  return {
    title: `Administration | ${panelName}`
  }
}

export default function AdminLayout({ children }) {
  return children
}