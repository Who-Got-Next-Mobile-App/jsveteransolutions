export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="card max-w-xl text-sm text-slate-600">
      <div className="font-semibold text-[var(--navy-900)]">{title}</div>
      <p className="mt-2">{description}</p>
    </div>
  );
}
