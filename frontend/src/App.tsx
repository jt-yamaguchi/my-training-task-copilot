import { useCallback, useEffect, useState } from 'react';
import { createTask, deleteTask, fetchTasks, updateTask } from './api/tasks';
import type { Task, TaskPriority, TaskSort } from './api/types';
import TaskForm from './components/TaskForm';
import TaskItem from './components/TaskItem';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sort, setSort] = useState<TaskSort>('created');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setTasks(await fetchTasks(sort));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'タスクの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (title: string, description: string, priority: TaskPriority) => {
    await createTask({ title, description: description || null, priority });
    await load();
  };

  const handleToggle = async (task: Task) => {
    await updateTask(task.id, {
      title: task.title,
      description: task.description,
      done: !task.done,
    });
    await load();
  };

  const handleDelete = async (id: number) => {
    await deleteTask(id);
    await load();
  };

  const remaining = tasks.filter((t) => !t.done).length;

  return (
    <main className="container">
      <header className="header">
        <h1>タスク管理</h1>
        <p className="header-note">残り {remaining} 件</p>
      </header>

      <TaskForm onSubmit={handleCreate} />

      {error && <p className="error">{error}</p>}
      {loading ? (
        <p className="empty">読み込み中...</p>
      ) : tasks.length === 0 ? (
        <p className="empty">タスクはありません。上のフォームから追加してください。</p>
      ) : (
        <>
          <div className="task-toolbar">
            <label>
              並び順
              <select
                aria-label="並び順"
                value={sort}
                onChange={(e) => setSort(e.target.value as TaskSort)}
              >
                <option value="created">登録順</option>
                <option value="priority">優先度順（高→中→低）</option>
              </select>
            </label>
          </div>
          <ul className="task-list">
            {tasks.map((task) => (
              <TaskItem key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
