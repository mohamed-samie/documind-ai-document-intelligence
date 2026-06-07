type ToastMessageProps = {
  type: "error" | "success";
  message: string;
  topClassName: string;
  onClose: () => void;
};

export default function ToastMessage({
  type,
  message,
  topClassName,
  onClose,
}: ToastMessageProps) {
  const colorClass =
    type === "error"
      ? "border-red-200 bg-red-600 text-white"
      : "border-emerald-200 bg-emerald-600 text-white";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed left-1/2 z-50 flex max-w-xl -translate-x-1/2 items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-xl ${colorClass} ${topClassName}`}
    >
      <span className="leading-6">{message}</span>

      <button
        type="button"
        onClick={onClose}
        className="rounded-lg bg-white/20 px-2 py-1 text-xs font-semibold transition hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/70"
      >
        Close
      </button>
    </div>
  );
}
