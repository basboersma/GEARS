import type { Member } from "./types";

export function MembersReadOnlyPage({ members }: { members: Member[] }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <div className="flex shrink-0 items-end justify-between gap-3">
        <div>
          <h2 className="font-semibold text-[#FFEDD1] text-lg">
            Organization members
          </h2>
          <p className="mt-1 text-[#7A6555] text-xs">
            {members.length} members
          </p>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-[#3D3330] bg-[#232120]">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_7rem] gap-3 border-[#3D3330] border-b px-4 py-2.5 font-mono text-[#7A6555] text-[8px] uppercase tracking-widest">
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
        </div>
        <div className="divide-y divide-[#3D3330]/50">
          {members.map((member) => (
            <div
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_7rem] items-center gap-3 px-4 py-3"
              key={member.id}
            >
              <span className="truncate text-[#FFEDD1] text-xs">
                {member.name}
              </span>
              <span className="truncate text-[#9C8272] text-[11px]">
                {member.email}
              </span>
              <span className="truncate text-[#C4A882] text-[11px] capitalize">
                {member.role.replaceAll("_", " ")}
              </span>
            </div>
          ))}
          {members.length === 0 && (
            <div className="px-4 py-12 text-center text-[#7A6555] text-sm">
              No members found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
