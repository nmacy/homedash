import { readConfig } from "@/lib/config";
import { Dashboard } from "@/components/dashboard/Dashboard";

export const dynamic = "force-dynamic";

export default function Home() {
  const initialConfig = readConfig();
  return <Dashboard initialConfig={initialConfig} />;
}
