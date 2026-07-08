import { PortalNav } from "@/components/PortalShell";
import { mockTasks } from "@/lib/mock-data";

export default function PortalTasksPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <PortalNav />
      <main className="flex-1 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-[var(--navy-900)]">My Tasks</h1>
        <div className="mt-6 space-y-3">
          {mockTasks.map((task) => (
            <div key={task.id} className="card flex items-center justify-between">
              <div>
                <div className="font-medium">{task.title}</div>
                <div className="text-sm text-slate-500">Due {task.due}</div>
              </div>
              <span className={task.status === "done" ? "text-emerald-600" : "text-amber-600"}>
                {task.status === "done" ? "Done" : "Open"}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
