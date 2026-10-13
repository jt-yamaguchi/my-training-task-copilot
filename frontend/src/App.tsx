import { useCallback, useEffect, useRef, useState } from 'react';
import { createCategory, deleteCategory, fetchCategories } from './api/categories';
import { createTask, deleteTask, fetchTasks, updateTask } from './api/tasks';
import type { Category, Task, TaskPriority, TaskSort } from './api/types';
import CategoryManager from './components/CategoryManager';
import TaskForm from './components/TaskForm';
import TaskItem from './components/TaskItem';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sort, setSort] = useState<TaskSort>('created');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchTasks(sort, categoryId);
      if (currentRequest === requestId.current) {
        setTasks(result);
      }
    } catch (e) {
      if (currentRequest === requestId.current) {
        setError(e instanceof Error ? e.message : 'タスクの取得に失敗しました');
      }
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
      }
    }
  }, [sort, categoryId]);

  useEffect(() => {
    void load();
    return () => {
      requestId.current += 1;
    };
  }, [load]);

  useEffect(() => {
    let active = true;
    void fetchCategories()
      .then((result) => {
        if (active) {
          setCategories(result);
        }
      })
      .catch((exception: unknown) => {
        if (active) {
          setError(exception instanceof Error ? exception.message : 'カテゴリの取得に失敗しました');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCreate = async (
    title: string,
    description: string,
    priority: TaskPriority,
    dueDate: string | null,
    selectedCategoryId: number | null,
  ) => {
    await createTask({
      title,
      description: description || null,
      priority,
      dueDate,
      categoryId: selectedCategoryId,
    });
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

  const handleCategoryCreate = async (name: string) => {
    await createCategory({ name });
    setCategories(await fetchCategories());
  };

  const handleCategoryDelete = async (id: number) => {
    await deleteCategory(id);
    setCategories(await fetchCategories());
    if (categoryId === id) {
      setCategoryId(null);
    } else {
      await load();
    }
  };

  const remaining = tasks.filter((t) => !t.done).length;

  return (
    <main className="container">
      <header className="header">
        <h1>タスク管理</h1>
        <p className="header-note">残り {remaining} 件</p>
      </header>

      <TaskForm categories={categories} onSubmit={handleCreate} />

      <CategoryManager
        categories={categories}
        onCreate={handleCategoryCreate}
        onDelete={handleCategoryDelete}
      />

      <div className="task-toolbar">
        <label>
          カテゴリ
          <select
            aria-label="カテゴリで絞り込み"
            value={categoryId ?? ''}
            onChange={(event) =>
              setCategoryId(event.target.value ? Number(event.target.value) : null)
            }
          >
            <option value="">すべて</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          並び順
          <select
            aria-label="並び順"
            value={sort}
            onChange={(event) => setSort(event.target.value as TaskSort)}
          >
            <option value="created">登録順</option>
            <option value="priority">優先度順（高→中→低）</option>
          </select>
        </label>
      </div>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <p className="empty">読み込み中...</p>
      ) : tasks.length === 0 ? (
        <p className="empty">タスクはありません。</p>
      ) : (
        <>
          <ul className="task-list">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                categoryName={categories.find((category) => category.id === task.categoryId)?.name}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
