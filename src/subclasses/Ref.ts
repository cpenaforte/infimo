import { RegisteredName } from "../types";

export default class Ref<T> {
    private name: RegisteredName;
    private associatedElementsUuid: string[];
    private value: T;

    constructor(name: RegisteredName, value: T) {
        this.name = name;
        this.associatedElementsUuid = [];
        this.value = value;
    }

    getName(): RegisteredName {
        return this.name;
    }

    getValue(): T {
        return this.value;
    }

    getAssociatedElementsUuid(): string[] {
        return this.associatedElementsUuid;
    }

    setName(name: RegisteredName): void {
        this.name = name;
    }

    setValue(value: T): void {
        this.value = value;
    }

    setAssociatedElementsUuid(associatedElementsUuid: string[]): void {
        this.associatedElementsUuid = associatedElementsUuid;
    }

    addAssociatedElementUuid(associatedElementUuid: string): void {
        if (!this.associatedElementsUuid.includes(associatedElementUuid)) {
            this.associatedElementsUuid.push(associatedElementUuid);
        }
    }
}