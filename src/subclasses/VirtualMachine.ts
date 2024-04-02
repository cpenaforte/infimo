import vm from "vm";

export default class VirtualMachine {
    private context: { [key: string]: any };

    constructor() {
        this.context = {};
    }

    initThis(thisObj: { [key: string]: any }): void {
        this.context = thisObj;
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