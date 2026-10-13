import type { Category, CategoryCreateRequest } from './types';

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

export async function fetchCategories(): Promise<Category[]> {
  return handleResponse<Category[]>(await fetch('/api/categories'));
}

export async function createCategory(request: CategoryCreateRequest): Promise<Category> {
  const res = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<Category>(res);
}

export async function deleteCategory(id: number): Promise<void> {
  return handleResponse<void>(await fetch(`/api/categories/${id}`, { method: 'DELETE' }));
}
