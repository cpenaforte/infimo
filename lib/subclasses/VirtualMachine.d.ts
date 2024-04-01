export default class VirtualMachine {
    private context;
    constructor();
    initThis(thisObj: {
        [key: string]: any;
    }): void;
    runScriptSync(script: string): any;
}
