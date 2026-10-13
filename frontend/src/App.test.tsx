import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import TaskItem from './components/TaskItem';
import type { Task } from './api/types';

// fetch をモックしてAPIなしでコンポーネントを検証する。
// 新しい画面のテストはこのファイルの書き方を模倣すること。
const seedTasks: Task[] = [
  {
    id: 1,
    title: '環境構築を完了する',
    description: null,
    priority: 'HIGH',
    done: true,
    dueDate: null,
    createdAt: '2026-01-01T00:00:00+09:00',
  },
  {
    id: 2,
    title: 'CLAUDE.md を読む',
    description: '開発ルールの理解',
    priority: 'MEDIUM',
    done: false,
    dueDate: null,
    createdAt: '2026-01-01T00:00:00+09:00',
  },
];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('App', () => {
  it('タスク一覧が表示される', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(seedTasks));

    render(<App />);

    expect(await screen.findByText('環境構築を完了する')).toBeInTheDocument();
    expect(screen.getByText('CLAUDE.md を読む')).toBeInTheDocument();
    expect(screen.getByText('残り 1 件')).toBeInTheDocument();
    expect(screen.getByLabelText('優先度: 高')).toBeInTheDocument();
    expect(screen.getByLabelText('優先度: 中')).toBeInTheDocument();
  });

  it('タスクを追加するとAPIが呼ばれ一覧が更新される', async () => {
    const created: Task = {
      id: 3,
      title: '新しいタスク',
      description: null,
      priority: 'LOW',
      done: false,
      dueDate: '2026-10-15',
      createdAt: '2026-01-02T00:00:00+09:00',
    };
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(seedTasks))
      .mockResolvedValueOnce(jsonResponse(created, 201))
      .mockResolvedValueOnce(jsonResponse([...seedTasks, created]));

    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('環境構築を完了する');

    await user.type(screen.getByLabelText('タスク名'), '新しいタスク');
    await user.selectOptions(screen.getByLabelText('優先度'), 'LOW');
    fireEvent.change(screen.getByLabelText('期限（任意）'), { target: { value: '2026-10-15' } });
    await user.click(screen.getByRole('button', { name: '追加する' }));

    expect(await screen.findByText('新しいタスク')).toBeInTheDocument();
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/tasks',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            title: '新しいタスク',
            description: null,
            priority: 'LOW',
            dueDate: '2026-10-15',
          }),
        }),
      );
    });
  });

  it('優先度順を選ぶと優先度順の一覧を取得する', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(seedTasks))
      .mockResolvedValueOnce(jsonResponse(seedTasks));

    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('環境構築を完了する');
    await user.selectOptions(screen.getByLabelText('並び順'), 'priority');

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith('/api/tasks?sort=priority');
    });
  });

  it('API失敗時にエラーメッセージが表示される', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ message: 'サーバーエラー' }, 500),
    );

    render(<App />);

    expect(await screen.findByText('サーバーエラー')).toBeInTheDocument();
  });

  it('固定した今日を基準に期限を表示し、過去の未完了だけ強調する', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 2, 12));
    const tasks: Task[] = [
      {
        id: 10,
        title: '過去の未完了',
        description: null,
        priority: 'MEDIUM',
        done: false,
        dueDate: '2026-10-01',
        createdAt: '2026-01-01T00:00:00+09:00',
      },
      {
        id: 11,
        title: '今日が期限',
        description: null,
        priority: 'MEDIUM',
        done: false,
        dueDate: '2026-10-02',
        createdAt: '2026-01-01T00:00:00+09:00',
      },
      {
        id: 12,
        title: '未来が期限',
        description: null,
        priority: 'MEDIUM',
        done: false,
        dueDate: '2026-10-03',
        createdAt: '2026-01-01T00:00:00+09:00',
      },
      {
        id: 13,
        title: '過去だが完了済み',
        description: null,
        priority: 'MEDIUM',
        done: true,
        dueDate: '2026-10-01',
        createdAt: '2026-01-01T00:00:00+09:00',
      },
    ];
    const onToggle = vi.fn(async () => {});
    const onDelete = vi.fn(async () => {});

    render(
      <ul>
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />
        ))}
      </ul>,
    );

    expect(screen.getAllByText('期限: 2026-10-01')).toHaveLength(2);
    expect(screen.getByText('期限: 2026-10-03')).toBeInTheDocument();
    expect(screen.getAllByText('期限切れ')).toHaveLength(1);
    expect(screen.getByText('過去の未完了').closest('li')).toHaveClass('overdue');
    expect(screen.getByText('今日が期限').closest('li')).not.toHaveClass('overdue');
    expect(screen.getByText('未来が期限').closest('li')).not.toHaveClass('overdue');
    expect(screen.getByText('過去だが完了済み').closest('li')).not.toHaveClass('overdue');
  });
});
