// Pass-through: Portal.jsx now provides the sidebar + layout shell.
// Pages that still import DashboardLayout get transparent wrapping.
export default function DashboardLayout({ children }) {
  return <>{children}</>
}
