import { createTask } from '@/lib/tasks/actions'
import { TASK_TYPES } from './constants'

export function NewTaskForm({ clientId }: { clientId?: string }) {
    return (
        <form action={createTask} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
            {clientId && <input type="hidden" name="client_id" value={clientId} />}

            <div className="grid gap-3 sm:grid-cols-2">
                <input
                    name="title"
                    placeholder="Título de la tarea"
                    required
                    className="w-full rounded bg-neutral-800 px-3 py-2 text-sm outline-none sm:col-span-2"
                />

                <select
                    name="type"
                    defaultValue="follow_up"
                    className="w-full rounded bg-neutral-800 px-3 py-2 text-sm outline-none"
                >
                    {TASK_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                            {type.label}
                        </option>
                    ))}
                </select>

                <select
                    name="priority"
                    defaultValue="Media"
                    className="w-full rounded bg-neutral-800 px-3 py-2 text-sm outline-none"
                >
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                </select>

                <input
                    type="datetime-local"
                    name="due_date"
                    className="w-full rounded bg-neutral-800 px-3 py-2 text-sm outline-none"
                />

                <textarea
                    name="description"
                    placeholder="Descripción (opcional)"
                    rows={2}
                    className="w-full rounded bg-neutral-800 px-3 py-2 text-sm outline-none sm:col-span-2"
                />
            </div>

            <button className="mt-3 rounded bg-white px-4 py-2 text-sm font-semibold text-black">
                Agregar tarea
            </button>
        </form>
    )
}
