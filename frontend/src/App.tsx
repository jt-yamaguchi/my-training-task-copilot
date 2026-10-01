import { useCallback, useEffect, useState } from 'react';
import { createTask, deleteTask, fetchTasks, updateTask } from './api/tasks';
import type { Task } from './api/types';
import TaskForm from './components/TaskForm';
import TaskItem from './components/TaskItem';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setTasks(await fetchTasks());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'タスクの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (title: string, description: string) => {
    await createTask({ title, description: description || null, done: false });
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
        <ul className="task-list">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
          ))}
        </ul>
      )}
    </main>
  );
}
