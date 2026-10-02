// API の型定義はこのファイルに集約する

export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export type TaskSort = 'created' | 'priority';

export type Task = {
  id: number;
  title: string;
  description: string | null;
  priority: TaskPriority;
  done: boolean;
  createdAt: string;
};

export type TaskCreateRequest = {
  title: string;
  description: string | null;
  priority: TaskPriority;
};

export type TaskRequest = {
  title: string;
  description: string | null;
  done: boolean;
};
