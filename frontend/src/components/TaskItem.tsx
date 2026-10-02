import type { Task, TaskPriority } from '../api/types';

const priorityLabels: Record<TaskPriority, string> = {
  HIGH: '高',
  MEDIUM: '中',
  LOW: '低',
};

type Props = {
  task: Task;
  onToggle: (task: Task) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
};

export default function TaskItem({ task, onToggle, onDelete }: Props) {
  return (
    <li className={task.done ? 'task-item done' : 'task-item'}>
      <label className="task-check">
        <input type="checkbox" checked={task.done} onChange={() => void onToggle(task)} />
        <span className="task-title">{task.title}</span>
        <span
          className={`priority-badge priority-${task.priority.toLowerCase()}`}
          aria-label={`優先度: ${priorityLabels[task.priority]}`}
        >
          {priorityLabels[task.priority]}
        </span>
      </label>
      {task.description && <p className="task-desc">{task.description}</p>}
      <button type="button" className="task-delete" onClick={() => void onDelete(task.id)}>
        削除
      </button>
    </li>
  );
}
