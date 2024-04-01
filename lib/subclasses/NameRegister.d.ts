import { PropType, RegisteredName, RegisteredNames } from "../types";
export default class NameRegister {
    private names;
    constructor();
    registerName(name: string, type: PropType): RegisteredName;
    registerNames(names: RegisteredNames): void;
    nameExist(name: string): boolean;
    getNames(): RegisteredNames;
}
