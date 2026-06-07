type UseCase = {
  title: string;
  description: string;
  examples: string[];
};

const useCases: UseCase[] = [
  {
    title: "Legal Teams",
    description: "Review contracts, clauses, risks, and obligations faster.",
    examples: ["Find risky clauses", "Summarize contracts", "Compare agreements"],
  },
  {
    title: "Accounting Offices",
    description: "Ask questions across reports, invoices, and spreadsheets.",
    examples: ["Extract totals", "Find payment terms", "Compare monthly reports"],
  },
  {
    title: "Real Estate Firms",
    description: "Analyze leases, listings, offers, and property documents.",
    examples: ["Compare leases", "Find obligations", "Summarize property files"],
  },
];

export default function UseCaseCards() {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {useCases.map((item) => (
        <div
          key={item.title}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
        >
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-lg font-bold text-blue-700">
            {item.title.charAt(0)}
          </div>

          <h3 className="text-base font-bold text-slate-900">{item.title}</h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {item.description}
          </p>

          <div className="mt-4 space-y-2">
            {item.examples.map((example) => (
              <div
                key={example}
                className="flex items-center gap-2 text-xs font-medium text-slate-500"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                {example}
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
