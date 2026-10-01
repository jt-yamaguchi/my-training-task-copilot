// タスクAPIクライアント。
// コンポーネントから直接 fetch せず、必ずこのモジュールを経由する。
// URLは相対パス /api/... のみ(絶対URLの記述は禁止。CLAUDE.md参照)
import type { Task, TaskRequest } from './types';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? `APIエラー (HTTP ${res.status})`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch('/api/tasks');
  return handleResponse<Task[]>(res);
}

export async function createTask(request: TaskRequest): Promise<Task> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<Task>(res);
}

export async function updateTask(id: number, request: TaskRequest): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<Task>(res);
}

export async function deleteTask(id: number): Promise<void> {
  const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
  return handleResponse<void>(res);
}
