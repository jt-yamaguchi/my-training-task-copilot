import type { Task } from '../api/types';

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
      </label>
      {task.description && <p className="task-desc">{task.description}</p>}
      <button type="button" className="task-delete" onClick={() => void onDelete(task.id)}>
        削除
      </button>
    </li>
  );
}
