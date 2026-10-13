// API の型定義はこのファイルに集約する

export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export type TaskSort = 'created' | 'priority';

export type Task = {
  id: number;
  title: string;
  description: string | null;
  priority: TaskPriority;
  done: boolean;
  dueDate: string | null;
  createdAt: string;
  completedAt: string | null;
  categoryId: number | null;
};

export type TaskCreateRequest = {
  title: string;
  description: string | null;
  priority: TaskPriority;
  dueDate: string | null;
  categoryId?: number | null;
};

export type TaskRequest = {
  title: string;
  description: string | null;
  done: boolean;
};

export type Category = {
  id: number;
  name: string;
};

export type CategoryCreateRequest = {
  name: string;
};
