import { bound } from "./decorator/bindThis.js";

interface Task {
    title: string;
    description: string;
}

interface ClickableElement {
    element: HTMLElement;
    clickHandler(): void;
    bindEvents(): void;
}

const TASK_STATUS = ["todo", "working", "done"] as const;
type TaskStatus = (typeof TASK_STATUS)[number];

class TaskForm {
    element: HTMLFormElement;
    titleInputEl: HTMLInputElement;
    descriptionInputEl: HTMLTextAreaElement;

    constructor() {
        this.element = document.querySelector("#task-form")!;
        this.titleInputEl = document.querySelector("#form-title")!;
        this.descriptionInputEl = document.querySelector("#form-description")!;

        this.bindEvents();
    }

    private clearInputs(): void {
        this.titleInputEl.value = "";
        this.descriptionInputEl.value = "";
    }

    @bound
    private submitHandler(event: Event): void {
        event.preventDefault();
        const task: Task = this.makeNewTask();
        const item: TaskItem = new TaskItem(task);
        item.mount("#todo");

        this.clearInputs();
    }

    private bindEvents(): void {
        this.element.addEventListener("submit", this.submitHandler);
    }

    private makeNewTask(): Task {
        return {
            title: this.titleInputEl.value,
            description: this.descriptionInputEl.value,
        }
    }
}

abstract class UIComponent<T extends HTMLElement> {
    templateEl: HTMLTemplateElement;
    element: T;

    constructor(templateId: string) {
        this.templateEl = document.querySelector(templateId)!;
        const clone: DocumentFragment = this.templateEl.content.cloneNode(true) as DocumentFragment;
        this.element = clone.firstElementChild as T;
    }

    mount(selector: string): void {
        const targetEl: Element = document.querySelector(selector)!;
        targetEl.insertAdjacentElement("beforeend", this.element);
    }

    abstract setup(): void;
}

class TaskList extends UIComponent<HTMLDivElement> {
    private taskStatus: TaskStatus;

    constructor(_taskStatus: TaskStatus) {
        super("#task-list-template");
        this.taskStatus = _taskStatus;
        this.setup();
    }

    setup(): void {
        this.element.querySelector("h2")!.textContent = `${this.taskStatus}`;
        this.element.querySelector("ul")!.id = `${this.taskStatus}`;
    }
}

class TaskItem extends UIComponent<HTMLLIElement> implements ClickableElement {
    task: Task;

    constructor(_task: Task) {
        super("#task-item-template");

        this.task = _task;
        this.setup();
        this.bindEvents();
    }

    setup(): void {
        this.element.querySelector("h2")!.textContent = `${this.task.title}`;
        this.element.querySelector("p")!.textContent = `${this.task.description}`;
    }

    @bound
    clickHandler(): void {
        if (!this.element.parentElement) return;

        const currentListId: TaskStatus = this.element.parentElement.id as TaskStatus;
        const taskStatusIdx: number = TASK_STATUS.indexOf(currentListId);

        if (taskStatusIdx === -1) {
            throw new Error("タスクステータスが不正です。");
        }

        const nextListId: TaskStatus = TASK_STATUS[taskStatusIdx + 1];

        if (nextListId) {
            const nextListEl: HTMLUListElement = document.getElementById(
                nextListId
            ) as HTMLUListElement;
            nextListEl.appendChild(this.element);
            return;
        }
        this.element.remove();
    }

    bindEvents(): void {
        this.element.addEventListener("click", this.clickHandler);
    }
}

new TaskForm();
TASK_STATUS.forEach((status) => {
    const list: TaskList = new TaskList(status);
    list.mount("#container");
});