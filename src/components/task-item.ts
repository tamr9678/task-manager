import { Draggable } from "../models/drag-and-drop.js";
import { Task } from "../models/task.js";

export class TaskItem implements Draggable {
  templateElement: HTMLTemplateElement;
  hostElement: HTMLUListElement;
  element: HTMLLIElement;

  private task: Task;

  constructor(hostId: string, elementId: string, task: Task) {
    this.templateElement = document.getElementById(
      "single-task"
    )! as HTMLTemplateElement;
    this.hostElement = document.getElementById(hostId)! as HTMLUListElement;

    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );
    this.element = importedNode.firstElementChild as HTMLLIElement;
    this.element.id = elementId;

    this.task = task;

    this.attach();
    this.configure();
    this.renderContent();
  }

  dragStartHandler(event: DragEvent) {
    event.dataTransfer!.setData("text/plain", this.task.id);
    event.dataTransfer!.effectAllowed = "move";
  }

  private configure() {
    this.element.addEventListener(
      "dragstart",
      this.dragStartHandler.bind(this)
    );
  }

  private renderContent() {
    this.element.querySelector("h2")!.textContent = this.task.title;
    this.element.querySelector("h3")!.textContent =
      this.task.deadline.toString();
    this.element.querySelector("p")!.textContent = this.task.description;
  }

  private attach() {
    this.hostElement.insertAdjacentElement("beforeend", this.element);
  }
}
