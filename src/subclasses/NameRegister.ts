import { PropType, RegisteredName, RegisteredNames } from "../types";

export default class NameRegister {
    private names: RegisteredNames;

    constructor() {
        this.names = [];
    }

    registerName(name: string, type: PropType): RegisteredName {
        // Check if name already exists
        if (this.nameExist(name)) {
            throw new Error(`Name ${name} already exists`);
        }

        const nameObj = {name, type};

        this.names.push(nameObj);

        return nameObj;
    }

    registerNames(names: RegisteredNames): void {
        // Check if names already exist
        let nameExist = names.find(n => this.nameExist(n.name))?.name;

        if (nameExist) {
            throw new Error(`Name ${nameExist} already exists`);
        }

        this.names.push(...names);
    }

    nameExist(name: string): boolean {
        return this.names.some(n => n.name === name);
    }

    getNames(): RegisteredNames {
        return this.names;
    }
}