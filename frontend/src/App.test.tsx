import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import TaskItem from './components/TaskItem';
import type { Category, CategoryCreateRequest, Task, TaskCreateRequest } from './api/types';

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
    completedAt: null,
    categoryId: null,
  },
  {
    id: 2,
    title: 'CLAUDE.md を読む',
    description: '開発ルールの理解',
    priority: 'MEDIUM',
    done: false,
    dueDate: null,
    createdAt: '2026-01-01T00:00:00+09:00',
    completedAt: null,
    categoryId: null,
  },
];

const seedCategories: Category[] = [
  { id: 1, name: '仕事' },
  { id: 2, name: '私用' },
  { id: 3, name: '勉強' },
];

function mockTaskFetch() {
  const taskFetch = vi.fn<typeof fetch>();
  vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
    if (input === '/api/categories') {
      return Promise.resolve(jsonResponse(seedCategories));
    }
    return init === undefined ? taskFetch(input) : taskFetch(input, init);
  });
  return taskFetch;
}

function mockCategoryApi() {
  let categories = [...seedCategories];
  let tasks: Task[] = [
    { ...seedTasks[0], categoryId: 1 },
    { ...seedTasks[1], categoryId: 2 },
    { ...seedTasks[1], id: 3, title: 'カテゴリなしのタスク', categoryId: null },
  ];
  let nextCategoryId = 4;
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const [path, query = ''] = String(input).split('?');
    const method = init?.method ?? 'GET';
    if (path === '/api/categories' && method === 'GET') {
      return jsonResponse(categories);
    }
    if (path === '/api/categories' && method === 'POST') {
      const request = JSON.parse(String(init?.body)) as CategoryCreateRequest;
      if (categories.some((category) => category.name === request.name)) {
        return jsonResponse({ message: '同名のカテゴリが存在します' }, 400);
      }
      const category = { id: nextCategoryId++, name: request.name };
      categories = [...categories, category];
      return jsonResponse(category, 201);
    }
    if (path.startsWith('/api/categories/') && method === 'DELETE') {
      const id = Number(path.substring('/api/categories/'.length));
      categories = categories.filter((category) => category.id !== id);
      tasks = tasks.map((task) => (task.categoryId === id ? { ...task, categoryId: null } : task));
      return new Response(null, { status: 204 });
    }
    if (path === '/api/tasks' && method === 'POST') {
      const request = JSON.parse(String(init?.body)) as TaskCreateRequest;
      const task: Task = {
        ...seedTasks[1],
        ...request,
        id: 4,
        categoryId: request.categoryId ?? null,
      };
      tasks = [...tasks, task];
      return jsonResponse(task, 201);
    }
    if (path === '/api/tasks' && method === 'GET') {
      const params = new URLSearchParams(query);
      const categoryId = params.get('categoryId');
      return jsonResponse(
        categoryId === null
          ? tasks
          : tasks.filter((task) => task.categoryId === Number(categoryId)),
      );
    }
    throw new Error(`想定外のAPI: ${method} ${String(input)}`);
  });
}

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
  it('追加フォームでカテゴリを選択して作成できる', async () => {
    const fetchMock = mockCategoryApi();
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText(seedTasks[0].title);
    expect(screen.getByLabelText('カテゴリ（任意）')).toHaveValue('');
    await user.type(screen.getByLabelText('タスク名'), '仕事の新規タスク');
    await user.selectOptions(screen.getByLabelText('カテゴリ（任意）'), '1');
    await user.click(screen.getByRole('button', { name: '追加する' }));
    expect(await screen.findByText('仕事の新規タスク')).toBeInTheDocument();
    expect(screen.getByText('仕事の新規タスク').closest('li')).toHaveTextContent('カテゴリ: 仕事');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/tasks',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          title: '仕事の新規タスク',
          description: null,
          priority: 'MEDIUM',
          dueDate: null,
          categoryId: 1,
        }),
      }),
    );
    await waitFor(() => expect(screen.getByLabelText('カテゴリ（任意）')).toHaveValue(''));
  });

  it('各カテゴリで絞り込めて0件からすべてに戻すと未設定も表示される', async () => {
    const fetchMock = mockCategoryApi();
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('カテゴリなしのタスク');
    const filter = screen.getByLabelText('カテゴリで絞り込み');
    expect(filter).toHaveTextContent('すべて仕事私用勉強');
    await user.selectOptions(filter, '1');
    await waitFor(() => expect(screen.queryByText(seedTasks[1].title)).not.toBeInTheDocument());
    expect(screen.getByText(seedTasks[0].title)).toBeInTheDocument();
    expect(screen.queryByText('カテゴリなしのタスク')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/tasks?categoryId=1');
    await user.selectOptions(filter, '2');
    expect(await screen.findByText(seedTasks[1].title)).toBeInTheDocument();
    expect(screen.queryByText(seedTasks[0].title)).not.toBeInTheDocument();
    await user.selectOptions(filter, '3');
    expect(await screen.findByText('タスクはありません。')).toBeInTheDocument();
    await user.selectOptions(filter, '');
    expect(await screen.findByText('カテゴリなしのタスク')).toBeInTheDocument();
    expect(screen.getByText(seedTasks[0].title)).toBeInTheDocument();
    expect(screen.getByText(seedTasks[1].title)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith('/api/tasks');
  });

  it('カテゴリ絞り込みと優先度順を併用できる', async () => {
    const fetchMock = mockCategoryApi();
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText(seedTasks[0].title);
    await user.selectOptions(screen.getByLabelText('カテゴリで絞り込み'), '1');
    await user.selectOptions(screen.getByLabelText('並び順'), 'priority');
    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith('/api/tasks?sort=priority&categoryId=1');
    });
    expect(await screen.findByText(seedTasks[0].title)).toBeInTheDocument();
    expect(screen.queryByText(seedTasks[1].title)).not.toBeInTheDocument();
  });

  it('追加したカテゴリがフォームとフィルタの選択肢に反映される', async () => {
    const fetchMock = mockCategoryApi();
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText(seedTasks[0].title);
    await user.click(screen.getByText('カテゴリ管理'));
    await user.type(screen.getByLabelText('カテゴリ名'), '趣味');
    await user.click(screen.getByRole('button', { name: 'カテゴリを追加' }));
    expect(await screen.findByRole('button', { name: '趣味を削除' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/categories',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: '趣味' }),
      }),
    );
    await user.selectOptions(screen.getByLabelText('カテゴリ（任意）'), '4');
    expect(screen.getByLabelText('カテゴリ（任意）')).toHaveValue('4');
    await user.selectOptions(screen.getByLabelText('カテゴリで絞り込み'), '4');
    expect(await screen.findByText('タスクはありません。')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('カテゴリ名')).toHaveValue(''));
  });

  it('使用中カテゴリを削除するとタスクを残しフォームとフィルタを解除する', async () => {
    const fetchMock = mockCategoryApi();
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText(seedTasks[0].title);
    await user.selectOptions(screen.getByLabelText('カテゴリ（任意）'), '1');
    await user.selectOptions(screen.getByLabelText('カテゴリで絞り込み'), '1');
    await screen.findByText('カテゴリ: 仕事');
    await user.click(screen.getByText('カテゴリ管理'));
    await user.click(screen.getByRole('button', { name: '仕事を削除' }));
    expect(await screen.findByText('カテゴリなしのタスク')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/categories/1', { method: 'DELETE' });
    expect(screen.getByLabelText('カテゴリ（任意）')).toHaveValue('');
    expect(screen.getByLabelText('カテゴリで絞り込み')).toHaveValue('');
    expect(screen.getByLabelText('カテゴリ（任意）')).not.toHaveTextContent('仕事');
    expect(screen.getByLabelText('カテゴリで絞り込み')).not.toHaveTextContent('仕事');
    expect(screen.getByText(seedTasks[0].title)).toBeInTheDocument();
    expect(screen.queryByText('カテゴリ: 仕事')).not.toBeInTheDocument();
    expect(screen.getByText('カテゴリ: 私用')).toBeInTheDocument();
  });

  it('カテゴリの重複登録エラーを表示する', async () => {
    mockCategoryApi();
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText(seedTasks[0].title);
    await user.click(screen.getByText('カテゴリ管理'));
    await user.type(screen.getByLabelText('カテゴリ名'), '仕事');
    await user.click(screen.getByRole('button', { name: 'カテゴリを追加' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('同名のカテゴリが存在します');
    expect(screen.getByLabelText('カテゴリ名')).toHaveValue('仕事');
  });

  it('タスク一覧が表示される', async () => {
    mockTaskFetch().mockResolvedValue(jsonResponse(seedTasks));

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
      completedAt: null,
      categoryId: null,
    };
    const fetchMock = mockTaskFetch()
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
            categoryId: null,
          }),
        }),
      );
    });
  });

  it('優先度順を選ぶと優先度順の一覧を取得する', async () => {
    const fetchMock = mockTaskFetch()
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

  it('完了タスクの行に日本時間の完了日時が表示される', async () => {
    const completed: Task = {
      ...seedTasks[0],
      completedAt: '2026-10-12T15:30:45Z',
    };
    mockTaskFetch().mockResolvedValue(jsonResponse([completed]));

    render(<App />);

    const completedAt = await screen.findByText('2026/10/13 00:30:45');
    expect(completedAt).toHaveAttribute('datetime', completed.completedAt);
    expect(completedAt.closest('li')).toHaveTextContent('環境構築を完了する');
    expect(completedAt.closest('li')).toHaveTextContent('完了日時: 2026/10/13 00:30:45');
  });

  it.each([
    { done: true, completedAt: null },
    { done: false, completedAt: null },
    { done: false, completedAt: '2026-10-12T15:30:45Z' },
  ])('未完了または日時なしでは完了日時を表示しない: %j', (state) => {
    render(
      <TaskItem
        task={{ ...seedTasks[0], ...state }}
        onToggle={vi.fn(async () => {})}
        onDelete={vi.fn(async () => {})}
      />,
    );

    expect(screen.queryByText(/完了日時:/)).not.toBeInTheDocument();
  });

  it('完了すると日時が表示され、取り消すと表示が消える', async () => {
    const task = seedTasks[1];
    const completed: Task = { ...task, done: true, completedAt: '2026-10-12T15:30:45Z' };
    const fetchMock = mockTaskFetch()
      .mockResolvedValueOnce(jsonResponse([task]))
      .mockResolvedValueOnce(jsonResponse(completed))
      .mockResolvedValueOnce(jsonResponse([completed]))
      .mockResolvedValueOnce(jsonResponse(task))
      .mockResolvedValueOnce(jsonResponse([task]));

    const user = userEvent.setup();
    render(<App />);
    await screen.findByText(task.title);
    expect(screen.queryByText(/完了日時:/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('checkbox'));
    expect(await screen.findByText('2026/10/13 00:30:45')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/tasks/2',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ title: task.title, description: task.description, done: true }),
      }),
    );

    await user.click(screen.getByRole('checkbox'));
    await waitFor(() => {
      expect(screen.queryByText(/完了日時:/)).not.toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/tasks/2',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ title: task.title, description: task.description, done: false }),
      }),
    );
  });

  it('API失敗時にエラーメッセージが表示される', async () => {
    mockTaskFetch().mockResolvedValue(jsonResponse({ message: 'サーバーエラー' }, 500));

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
        completedAt: null,
        categoryId: null,
      },
      {
        id: 11,
        title: '今日が期限',
        description: null,
        priority: 'MEDIUM',
        done: false,
        dueDate: '2026-10-02',
        createdAt: '2026-01-01T00:00:00+09:00',
        completedAt: null,
        categoryId: null,
      },
      {
        id: 12,
        title: '未来が期限',
        description: null,
        priority: 'MEDIUM',
        done: false,
        dueDate: '2026-10-03',
        createdAt: '2026-01-01T00:00:00+09:00',
        completedAt: null,
        categoryId: null,
      },
      {
        id: 13,
        title: '過去だが完了済み',
        description: null,
        priority: 'MEDIUM',
        done: true,
        dueDate: '2026-10-01',
        createdAt: '2026-01-01T00:00:00+09:00',
        completedAt: null,
        categoryId: null,
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
