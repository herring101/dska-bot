// src/core/tasks/taskService.ts

export interface Task {
  id: string;
  title: string;
  deadline?: Date;
  status: "pending" | "in_progress" | "completed";
  progress: number;
  // 重要度や補足情報など、必要に応じて追加
}

export class TaskService {
  private tasks: Task[] = [];

  constructor() {
    // とりあえずメモリに保存するだけ
    // 将来的にDB接続やORMに差し替え予定
  }

  createTask(title: string, deadline?: Date): Task {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      deadline,
      status: "pending",
      progress: 0,
    };
    this.tasks.push(newTask);
    return newTask;
  }

  listTasks(): Task[] {
    return this.tasks;
  }

  // 進捗更新、削除などもここに追加
}
