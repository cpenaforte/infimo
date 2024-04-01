import { RegisteredName } from "../types";

export default class Ref<T> {
    private name: RegisteredName;
    private value: T;

    constructor(name: RegisteredName, value: T) {
        this.name = name;
        this.value = value;
    }

    updateValue(value: T): void {
        this.value = value;
    }

    getName(): RegisteredName {
        return this.name;
    }

    getValue(): T {
        return this.value;
    }
}