import type { Task, TaskPriority } from '../api/types';

const priorityLabels: Record<TaskPriority, string> = {
  HIGH: '高',
  MEDIUM: '中',
  LOW: '低',
};

const completedAtFormatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

type Props = {
  task: Task;
  categoryName?: string;
  onToggle: (task: Task) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
};

export default function TaskItem({ task, categoryName, onToggle, onDelete }: Props) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const overdue = !task.done && task.dueDate !== null && task.dueDate < today;

  return (
    <li className={`task-item${task.done ? ' done' : ''}${overdue ? ' overdue' : ''}`}>
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
      {categoryName && <p className="task-category">カテゴリ: {categoryName}</p>}
      {task.dueDate && (
        <p className="task-due-date">
          期限: {task.dueDate}
          {overdue && <span className="overdue-badge">期限切れ</span>}
        </p>
      )}
      {task.done && task.completedAt !== null && (
        <p className="task-completed-at">
          完了日時:{' '}
          <time dateTime={task.completedAt}>
            {completedAtFormatter.format(new Date(task.completedAt))}
          </time>
        </p>
      )}
      <button type="button" className="task-delete" onClick={() => void onDelete(task.id)}>
        削除
      </button>
    </li>
  );
}
