// API の型定義はこのファイルに集約する

export type Task = {
  id: number;
  title: string;
  description: string | null;
  done: boolean;
  createdAt: string;
};

export type TaskRequest = {
  title: string;
  description: string | null;
  done: boolean;
};
