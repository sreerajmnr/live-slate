import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "../../lib/auth";
import Workspace from "../../components/Workspace";

export const metadata = { title: "Dashboard · Live Slate" };

export default async function DashboardPage() {
  const store = await cookies();
  const session = await verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!session) redirect("/login");
  return <Workspace username={session.username} />;
}
