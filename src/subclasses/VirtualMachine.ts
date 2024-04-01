import vm from "vm";

export default class VirtualMachine {
    private context: { [key: string]: any };

    constructor() {
        this.context = {};
    }

    initThis(thisObj: { [key: string]: any }): void {
        const descriptors = Object.getOwnPropertyDescriptors(thisObj);
        const parseDescriptors = Object.entries(descriptors).map(([key, value]) => {
            const newValue = value.get ? value.get() : value.value;
            return [key, newValue];
        });

        this.context = Object.fromEntries(parseDescriptors);
    }

    runScriptSync(script: string): any {
        let result = null;

        try {
            result = new vm.Script(script).runInNewContext(this.context);
        } catch (e) {
            console.error(e);
        } finally {
            return result;
        }
    }
}