type StatsGridProps = {
  isLoading: boolean;
  totalDocuments: number;
  totalFolders: number;
  totalConversations: number;
  totalChunks: number;
};

type StatItem = {
  label: string;
  value: string;
  helper: string;
};

export default function StatsGrid({
  isLoading,
  totalDocuments,
  totalFolders,
  totalConversations,
  totalChunks,
}: StatsGridProps) {
  const stats: StatItem[] = [
    {
      label: "Documents",
      value: isLoading ? "..." : String(totalDocuments),
      helper: "Business files indexed",
    },
    {
      label: "Folders",
      value: isLoading ? "..." : String(totalFolders),
      helper: "Organized workspaces",
    },
    {
      label: "AI Sessions",
      value: isLoading ? "..." : String(totalConversations),
      helper: "Document conversations",
    },
    {
      label: "Searchable Sections",
      value: isLoading ? "..." : String(totalChunks),
      helper: "Grounded knowledge units",
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
        >
          <p className="text-sm font-medium text-slate-500">{stat.label}</p>

          <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            {stat.value}
          </p>

          <p className="mt-2 text-xs font-medium text-slate-400">
            {stat.helper}
          </p>
        </div>
      ))}
    </section>
  );
}
