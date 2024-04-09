import { RemovedElement } from "../types";

export default class RemovedElements {
    private removedElements: RemovedElement[];

    constructor() {
        this.removedElements = [];
    }

    add(element: Element): void {
        if (this.removedElements.some(removedElement => removedElement.el.getAttribute("data-uuid") === element.getAttribute("data-uuid"))) {
            return;
        }

        this.removedElements.push({
            el: element,
            parent: element.parentElement,
            nextSibling: element.nextElementSibling
        });
    }

    pop(uuid: string): void {
        this.removedElements = this.removedElements.filter(removedElement => removedElement.el.getAttribute("data-uuid") !== uuid);
    }

    getRemovedElements(): RemovedElement[] {
        return this.removedElements;
    }

    getRemovedElement(uuid: string): RemovedElement | undefined {
        return this.removedElements.find(removedElement => removedElement.el.getAttribute("data-uuid") === uuid);
    }
}