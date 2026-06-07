type TopbarProps = {
  onNewChat?: () => void;
};

export default function Topbar({ onNewChat }: TopbarProps) {
  return (
    <div className="bg-[#F8FAFC] px-6 pt-5">
      <header className="rounded-[28px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center justify-between gap-5">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-extrabold tracking-tight text-slate-950">
              Demo Workspace
            </p>

            <p className="mt-1 truncate text-xs font-semibold text-slate-500">
              AI document intelligence for business files
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden rounded-2xl bg-slate-100 px-4 py-2 text-xs font-extrabold text-slate-600 lg:inline-flex">
              Grounded citations
            </span>

            <button
              type="button"
              onClick={onNewChat}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              New Chat
            </button>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-sm font-extrabold text-white shadow-sm">
              M
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}