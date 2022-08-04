import { Task } from "../models/task.js";

// タスクの状態管理
class TasksState {
  private listeners: any[] = [];
  private tasks: Task[] = [];
  private static instance: TasksState;

  private constructor() {}

  // singleton
  static getInstance() {
    if (this.instance) return this.instance;
    this.instance = new TasksState();
    return this.instance;
  }

  addListener(ListenerFunction: any) {
    this.listeners.push(ListenerFunction);
  }

  addTasks(id: string, title: string, desc: string, deadline: string) {
    const newTask = new Task(id, title, desc, deadline, "active");

    this.tasks.push(newTask);
    for (const ListenerFunction of this.listeners) {
      ListenerFunction(this.tasks);
    }
  }

  changeTaskStatus(taskID: string, newStatus: "active" | "finished") {
    const task = this.tasks.find((tsk) => tsk.id === taskID);
    if (task && task.status !== newStatus) {
      task.status = newStatus;
      for (const ListenerFunction of this.listeners) {
        ListenerFunction(this.tasks);
      }
    }
  }
}

export const tasksState = TasksState.getInstance();
