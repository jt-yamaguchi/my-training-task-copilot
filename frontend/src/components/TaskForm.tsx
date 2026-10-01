import { useState } from 'react';

type Props = {
  onSubmit: (title: string, description: string) => Promise<void>;
};

export default function TaskForm({ onSubmit }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(title.trim(), description.trim());
      setTitle('');
      setDescription('');
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
      <button type="submit" disabled={!title.trim() || submitting}>
        追加する
      </button>
    </form>
  );
}
