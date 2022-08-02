// Drag and Drop
interface Draggable {
  dragStartHandler(event: DragEvent): void;
}

interface DragTarget {
  dragOverHandler(event: DragEvent): void;
  dropHandler(event: DragEvent): void;
}

// validation
interface Validatable {
  value: string | number;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  startDate?: boolean;
}

class Task {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public deadline: string,
    public status: "active" | "finished"
  ) {}
}

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

const tasksState = TasksState.getInstance();

function validate(validatableInput: Validatable) {
  let isValid = true;
  if (validatableInput.required) {
    isValid = isValid && validatableInput.value.toString().trim().length !== 0;
  }
  if (
    validatableInput.minLength != null &&
    typeof validatableInput.value === "string"
  ) {
    isValid =
      isValid && validatableInput.value.length >= validatableInput.minLength;
  }
  if (
    validatableInput.maxLength != null &&
    typeof validatableInput.value === "string"
  ) {
    isValid =
      isValid && validatableInput.value.length <= validatableInput.maxLength;
  }
  if (
    validatableInput.startDate != null &&
    typeof validatableInput.value === "string"
  ) {
    isValid = isValid && new Date(validatableInput.value) >= new Date()
  }
  return isValid;
}

class TaskItem implements Draggable {
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

// tasksList
class TasksList implements DragTarget {
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
      const listElement = this.element.querySelector('ul');
      listElement?.classList.add('droppable');
    }
  }

  dropHandler(event: DragEvent) {
    const taskId = event.dataTransfer!.getData("text/plain");
    tasksState.changeTaskStatus(taskId, this.status);
    const listEl = this.element.querySelector('ul')!;
    listEl.classList.remove('droppable');
  }

  dragLeaveHandler(_: DragEvent) {
    const listElement = this.element.querySelector('ul');
    listElement?.classList.remove('droppable');
  }

  private configure() {
    this.element.addEventListener("dragover", this.dragOverHandler.bind(this));
    this.element.addEventListener("drop", this.dropHandler.bind(this));
    this.element.addEventListener("dragleave", this.dragLeaveHandler.bind(this));
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

// taskInput Class
class taskInput {
  templateElement: HTMLTemplateElement;
  hostElement: HTMLDivElement;
  element: HTMLFormElement;
  titleInputElement: HTMLInputElement;
  descriptionInputElement: HTMLInputElement;
  deadlineInputElement: HTMLInputElement;

  constructor() {
    this.templateElement = document.getElementById(
      "task-input"
    )! as HTMLTemplateElement;
    this.hostElement = document.getElementById("app")! as HTMLDivElement;

    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );
    this.element = importedNode.firstElementChild as HTMLFormElement;
    this.element.id = "user-input";

    this.titleInputElement = this.element.querySelector(
      "#title"
    ) as HTMLInputElement;
    this.descriptionInputElement = this.element.querySelector(
      "#description"
    ) as HTMLInputElement;
    this.deadlineInputElement = this.element.querySelector(
      "#deadline"
    ) as HTMLInputElement;

    this.configure();
    this.attach();
  }

  private gatherUserInput(): [string, string, string] | void {
    const enteredTitle = this.titleInputElement.value;
    const enteredDescription = this.descriptionInputElement.value;
    const enteredDeadline = this.deadlineInputElement.value;

    const titleValidatable: Validatable = {
      value: enteredTitle,
      required: true,
    };
    const descriptionValidatable: Validatable = {
      value: enteredDescription,
      required: true,
      minLength: 5,
    };
    const deadlineValidatable: Validatable = {
      value: enteredDeadline,
      required: true,
      startDate: true,
    };
    if (
      !validate(titleValidatable) ||
      !validate(descriptionValidatable) ||
      !validate(deadlineValidatable)
    ) {
      alert("入力値が不正です");
      return;
    } else {
      return [enteredTitle, enteredDescription, enteredDeadline];
    }
  }

  private clearInputs() {
    this.titleInputElement.value = "";
    this.descriptionInputElement.value = "";
    this.deadlineInputElement.value = "";
  }

  private submitHandler(event: Event) {
    event.preventDefault();
    const userInput = this.gatherUserInput();
    if (Array.isArray(userInput)) {
      const [title, desc, deadline] = userInput;
      console.log(title, desc, deadline);
      tasksState.addTasks(
        Math.random().toString(32).substring(2),
        title,
        desc,
        deadline
      );
      this.clearInputs();
    }
  }

  private configure() {
    this.element.addEventListener("submit", this.submitHandler.bind(this));
  }

  private attach() {
    this.hostElement.insertAdjacentElement("afterbegin", this.element);
  }
}

const tskInput = new taskInput();
const finishedTskList = new TasksList("finished");
const activeTskList = new TasksList("active");
