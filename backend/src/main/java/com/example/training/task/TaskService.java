package com.example.training.task;

import com.example.training.common.NotFoundException;
import com.example.training.task.dto.TaskCreateRequest;
import com.example.training.task.dto.TaskRequest;
import com.example.training.task.dto.TaskResponse;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
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

    public List<TaskResponse> findAllByPriority() {
        return taskRepository.findAllByPriorityAsc().stream()
                .map(TaskResponse::from)
                .toList();
    }

    public TaskResponse findById(Long id) {
        return TaskResponse.from(getTask(id));
    }

    @Transactional
    public TaskResponse create(TaskCreateRequest request) {
        Task task = new Task(request.title(), request.description(), request.priority(), request.dueDate());
        return TaskResponse.from(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse update(Long id, TaskRequest request) {
        Task task = getTask(id);
        OffsetDateTime completedAt = null;
        if (request.done()) {
            completedAt = task.isDone() ? task.getCompletedAt() : OffsetDateTime.now(ZoneOffset.UTC);
        }
        task.update(request.title(), request.description(), request.done(), completedAt);
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
