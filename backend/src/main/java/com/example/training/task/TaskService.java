package com.example.training.task;

import com.example.training.common.NotFoundException;
import com.example.training.task.dto.TaskRequest;
import com.example.training.task.dto.TaskResponse;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * タスクのビジネスロジック。トランザクション境界はこのレイヤーに置く。
 */
@Service
@Transactional(readOnly = true)
public class TaskService {

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public List<TaskResponse> findAll() {
        return taskRepository.findAllByOrderByIdAsc().stream()
                .map(TaskResponse::from)
                .toList();
    }

    public TaskResponse findById(Long id) {
        return TaskResponse.from(getTask(id));
    }

    @Transactional
    public TaskResponse create(TaskRequest request) {
        Task task = new Task(request.title(), request.description());
        return TaskResponse.from(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse update(Long id, TaskRequest request) {
        Task task = getTask(id);
        task.update(request.title(), request.description(), request.done());
        return TaskResponse.from(task);
    }

    @Transactional
    public void delete(Long id) {
        Task task = getTask(id);
        taskRepository.delete(task);
    }

    private Task getTask(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("タスクが見つかりません: id=" + id));
    }
}
