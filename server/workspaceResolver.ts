export type WorkspaceMembership = { workspace: { id: number }; memberRole: string };

export async function resolveWorkspaceSelection(
  requestedId: number | null,
  selectMemberWorkspace: (workspaceId: number) => Promise<WorkspaceMembership | undefined>,
  getDefaultWorkspace: () => Promise<WorkspaceMembership | undefined>,
  bootstrapWorkspace: () => Promise<WorkspaceMembership>,
) {
  if (requestedId) {
    const selected = await selectMemberWorkspace(requestedId);
    if (selected) return selected;
  }
  const fallback = await getDefaultWorkspace();
  return fallback ?? bootstrapWorkspace();
}
