export const WORKSPACE_COOKIE = "shiftmind-workspace-id";
export const WORKSPACE_HEADER = "x-workspace-id";

export function getClientWorkspaceId(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${WORKSPACE_COOKIE}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}
