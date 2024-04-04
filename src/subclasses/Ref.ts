import { RegisteredName, AssociatedElement } from "../types";

export default class Ref<T> {
    private name: RegisteredName;
    private associatedElements: AssociatedElement[];
    private value: T;

    constructor(name: RegisteredName, value: T) {
        this.name = name;
        this.associatedElements = [];
        this.value = value;
    }

    getName(): RegisteredName {
        return this.name;
    }

    getValue(): T {
        return this.value;
    }

    getAssociatedElements(): AssociatedElement[] {
        return this.associatedElements;
    }

    setName(name: RegisteredName): void {
        this.name = name;
    }

    setValue(value: T): void {
        this.value = value;
    }

    setAssociatedElements(associatedElements: AssociatedElement[]): void {
        this.associatedElements = associatedElements;
    }

    addAssociatedElement(associatedElement: AssociatedElement): void {
        if (!this.associatedElements.includes(associatedElement)) {
            this.associatedElements.push(associatedElement);
        }
    }

    removeAssociatedElement(uuid: string): void {
        this.associatedElements = this.associatedElements.filter(associatedElement => associatedElement.uuid !== uuid);
    }
}