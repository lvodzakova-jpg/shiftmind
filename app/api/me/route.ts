import { getWorkspaceMembership, getAuthenticatedUser } from "@/lib/workspace-server";
import { isManagerRole } from "@/lib/roles";
import { NextResponse } from "next/server";

export async function GET() {
  const { user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const member = await getWorkspaceMembership(user.id);
  if (!member) {
    return NextResponse.json({ error: "No workspace" }, { status: 404 });
  }

  return NextResponse.json({
    userId: user.id,
    email: user.email,
    workspaceId: member.workspace_id,
    role: member.role,
    isManager: isManagerRole(member.role),
  });
}
