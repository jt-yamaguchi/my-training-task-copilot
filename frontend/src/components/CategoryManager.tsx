import { useState } from 'react';
import type { Category } from '../api/types';

type Props = {
  categories: Category[];
  onCreate: (name: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
};

export default function CategoryManager({ categories, onCreate, onDelete }: Props) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onCreate(name.trim());
      setName('');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'カテゴリの追加に失敗しました');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onDelete(id);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'カテゴリの削除に失敗しました');
    } finally {
      setBusy(false);
    }
  };

  return (
    <details className="category-manager">
      <summary>カテゴリ管理</summary>
      <form className="category-form" onSubmit={handleCreate}>
        <input
          aria-label="カテゴリ名"
          placeholder="カテゴリ名"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={100}
          disabled={busy}
        />
        <button type="submit" disabled={!name.trim() || busy}>
          カテゴリを追加
        </button>
      </form>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <ul className="category-list">
        {categories.map((category) => (
          <li key={category.id}>
            <span>{category.name}</span>
            <button
              type="button"
              aria-label={`${category.name}を削除`}
              disabled={busy}
              onClick={() => void handleDelete(category.id)}
            >
              削除
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
