import Link from 'next/link'
import { completeTask, cancelTask } from '@/lib/tasks/actions'
import type { Task } from '@/lib/types/database'
import { TASK_TYPE_ICONS, TASK_PRIORITY_CLASSES, formatTaskDueDate, isTaskOverdue } from './constants'

export function TaskCard({
    task,
    clientName,
}: {
    task: Pick<Task, 'id' | 'title' | 'description' | 'type' | 'priority' | 'due_date' | 'client_id'>
    clientName?: string | null
}) {
    const overdue = isTaskOverdue(task.due_date)

    return (
        <div className="flex items-start gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-lg">
                {TASK_TYPE_ICONS[task.type] ?? TASK_TYPE_ICONS.other}
            </div>

            <div className="flex-1">
                <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold text-white">{task.title}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${TASK_PRIORITY_CLASSES[task.priority]}`}>
                        {task.priority}
                    </span>
                </div>

                {task.description && <p className="mt-1 text-sm text-neutral-400">{task.description}</p>}

                <div className="mt-2 flex items-center gap-3 text-sm">
                    {clientName && task.client_id && (
                        <Link href={`/clients/${task.client_id}`} className="text-neutral-400 hover:underline">
                            {clientName}
                        </Link>
                    )}

                    {task.due_date && (
                        <span className={overdue ? 'text-red-400' : 'text-neutral-500'}>
                            {formatTaskDueDate(task.due_date)}
                        </span>
                    )}
                </div>

                <div className="mt-3 flex gap-2">
                    <form action={completeTask}>
                        <input type="hidden" name="task_id" value={task.id} />
                        {task.client_id && <input type="hidden" name="client_id" value={task.client_id} />}
                        <button className="rounded bg-white px-3 py-1.5 text-xs font-semibold text-black">
                            Completar
                        </button>
                    </form>

                    <form action={cancelTask}>
                        <input type="hidden" name="task_id" value={task.id} />
                        <button className="rounded border border-neutral-700 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-800">
                            Cancelar
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
