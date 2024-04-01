import { RegisteredName } from "../types";
export default class Ref<T> {
    private name;
    private value;
    constructor(name: RegisteredName, value: T);
    updateValue(value: T): void;
    getName(): RegisteredName;
    getValue(): T;
}
