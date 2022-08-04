import { DragTarget } from "../models/drag-and-drop.js";
import { Task } from "../models/task.js";
import { TaskItem } from "../components/task-item.js";
import { tasksState } from "../state/task-state.js";

export class TasksList implements DragTarget {
  templateElement: HTMLTemplateElement;
  hostElement: HTMLDivElement;
  element: HTMLElement;
  displayTasks: Task[];

  constructor(private status: "finished" | "active") {
    this.templateElement = document.getElementById(
      "task-list"
    )! as HTMLTemplateElement;
    this.hostElement = document.getElementById("app")! as HTMLDivElement;

    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );
    this.element = importedNode.firstElementChild as HTMLElement;
    this.element.id = `${this.status}-tasks`;
    this.displayTasks = [];

    tasksState.addListener((tasks: Task[]) => {
      const targetTasks = tasks.filter((task) => {
        //this.status === task.status  動かない
        if (this.status === "finished") {
          return task.status === "finished";
        } else {
          return task.status === "active";
        }
      });
      this.displayTasks = targetTasks;
      this.renderTasks();
    });

    this.attach();
    this.configure();
    this.renderContent();
  }

  dragOverHandler(event: DragEvent) {
    if (event.dataTransfer && event.dataTransfer.types[0] === "text/plain") {
      event.preventDefault();
      const listElement = this.element.querySelector("ul");
      listElement?.classList.add("droppable");
    }
  }

  dropHandler(event: DragEvent) {
    const taskId = event.dataTransfer!.getData("text/plain");
    tasksState.changeTaskStatus(taskId, this.status);
    const listEl = this.element.querySelector("ul")!;
    listEl.classList.remove("droppable");
  }

  dragLeaveHandler(_: DragEvent) {
    const listElement = this.element.querySelector("ul");
    listElement?.classList.remove("droppable");
  }

  private configure() {
    this.element.addEventListener("dragover", this.dragOverHandler.bind(this));
    this.element.addEventListener("drop", this.dropHandler.bind(this));
    this.element.addEventListener(
      "dragleave",
      this.dragLeaveHandler.bind(this)
    );
  }

  private renderTasks() {
    const listElement = document.getElementById(
      `${this.status}-list`
    )! as HTMLUListElement;
    listElement.innerHTML = "";
    for (const taskItem of this.displayTasks) {
      new TaskItem(listElement.id, taskItem.id, taskItem);
    }
  }

  private attach() {
    this.hostElement.insertAdjacentElement("beforeend", this.element);
  }

  private renderContent() {
    this.element.querySelector("ul")!.id = `${this.status}-list`;
    this.element.querySelector("h2")!.textContent =
      this.status === "active" ? "進行中" : "完了済み";
  }
}
