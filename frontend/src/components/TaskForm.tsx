import { useState } from 'react';
import type { Category, TaskPriority } from '../api/types';

type Props = {
  categories: Category[];
  onSubmit: (
    title: string,
    description: string,
    priority: TaskPriority,
    dueDate: string | null,
    categoryId: number | null,
  ) => Promise<void>;
};

export default function TaskForm({ categories, onSubmit }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const selectedCategoryId = categories.some((category) => category.id === categoryId)
    ? categoryId
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(
        title.trim(),
        description.trim(),
        priority,
        dueDate || null,
        selectedCategoryId,
      );
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setDueDate('');
      setCategoryId(null);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'タスクの追加に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="タスク名(必須・100文字まで)"
        maxLength={100}
        aria-label="タスク名"
      />
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="説明(任意)"
        maxLength={500}
        aria-label="説明"
      />
      <label className="task-form-due-date">
        期限（任意）
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          aria-label="期限（任意）"
        />
      </label>
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value as TaskPriority)}
        aria-label="優先度"
      >
        <option value="HIGH">高</option>
        <option value="MEDIUM">中</option>
        <option value="LOW">低</option>
      </select>
      <label className="task-form-category">
        カテゴリ（任意）
        <select
          aria-label="カテゴリ（任意）"
          value={selectedCategoryId ?? ''}
          onChange={(event) =>
            setCategoryId(event.target.value ? Number(event.target.value) : null)
          }
          disabled={submitting}
        >
          <option value="">未設定</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={!title.trim() || submitting}>
        追加する
      </button>
      {error && (
        <p className="error task-form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
