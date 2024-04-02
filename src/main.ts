import { v4 as uuidv4 } from "uuid";

import { DataProp, PropType, Listeners, InfimoObject } from "./types";

import NameRegister from "./subclasses/NameRegister";
import Ref from "./subclasses/Ref";
import VirtualMachine from "./subclasses/VirtualMachine";

class InfimoFactory {
    private appId: string | undefined;
    private template: string;
    private listeners: Listeners;
    private refs: Ref<any>[];
    private namesRegister: NameRegister;

    constructor(infimoObject: InfimoObject) {
        this.template = infimoObject.template;
        this.listeners = {};
        this.refs = [];
        this.namesRegister = new NameRegister();

        this.data(infimoObject.data || {});
        this.watch(infimoObject.watch || {});
        this.methods(infimoObject.methods || {});
    }

    private notifyListeners<T>(dataRef: Ref<T>, newValue: T, oldValue?: T): void {
        if (this.listeners[dataRef.getName().name]) {
            this.listeners[dataRef.getName().name].forEach(listener => listener(newValue, oldValue));
        }

        if(newValue !== oldValue) this.hydrate(dataRef);
    }

    private dataParse<T>(data: [string, T]): void {
        const [name, value] = data;

        const registeredName = this.namesRegister.registerName(name, PropType.DATA);

        const dataRef = new Ref(registeredName, value);
        this.refs.push(dataRef);

        Object.defineProperties(this, {
            [name]: {
                get: () => dataRef.getValue(),
                set: (newValue: T) => {
                    const oldValue = dataRef.getValue();
                    dataRef.setValue(newValue);
                    this.notifyListeners(dataRef, newValue, oldValue);
                }
            }
        });
    }

    private data(dataProp: DataProp): void {
        Object.entries(dataProp).forEach(data => this.dataParse(data));
    }

    private watchParse<T>(watch: [string, (newValue?: T, oldValue?: T) => void]): void {
        const [name, value] = watch;

        if (!this.namesRegister.nameExist(name)) {
            throw new Error(`Data ${name} does not exist`);
        }

        if (!this.listeners[name]) {
            this.listeners[name] = [];
        }

        this.listeners[name].push(value);
    }

    private watch(watchProp: { [key: string]: (newValue?: any, oldValue?: any) => void }): void {
        Object.entries(watchProp).forEach(watch => this.watchParse(watch));
    }

    private methodsParse(method: [string, Function]): void {
        const [name, value] = method;

        const refThis = this;

        const parsedFunction = (...args: any) => value.call(refThis, ...args);

        const registeredName = this.namesRegister.registerName(name, PropType.METHODS);

        const methodRef = new Ref(registeredName, parsedFunction);
        this.refs.push(methodRef);

        Object.assign(window, { [name]: methodRef.getValue() });

        Object.defineProperty(this, name, {
            get: () => methodRef.getValue()
        });
    }

    private methods(methodsProp: { [key: string]: Function }): void {
        Object.entries(methodsProp).forEach(method => this.methodsParse(method));
    }

    private parseTemplate(specificTemplate?: string): string {
        const intermediate = `${specificTemplate || this.template}`;

        const vm = new VirtualMachine();
        vm.initThis(this);

        
        // Putting uuid in all elements
        const intermediate2 = intermediate.replace(/<\w+.*?>/g, (match) => {
            const refThis = this;

            if (match.includes("data-uuid")) return match;
            
            return match.replace(/[^=]>/, (match2) => match2.replace(">", (match3) => {
                const uuid = uuidv4();

                refThis.refs.forEach(ref => {
                    // verify if ref is contained in the match and put uuid into associatedElementsUuid
                    if (match.includes(ref.getName().name)) {
                        ref.addAssociatedElementUuid(`el-${uuid}`);
                    }
                });

                return ` data-uuid="el-${uuid}">`;
            }));
        });

        if (!specificTemplate) this.template = intermediate2;

        const intermediate3 = intermediate2.replace(/custom-attr="(.*?)"/g, (match, p1) => {
            const parsedCatchGroup = p1.replace(/{{/g, "").replace(/}}/g, "");
            const evalutated = vm.runScriptSync(parsedCatchGroup);

            return `${evalutated}`;
        });

        // Parsing {{}}
        const intermediate4 = intermediate3.replace(/{{(.*?)}}/g, (match) => {
            const evalutated = vm.runScriptSync(match);

            return `${evalutated}`;
        }).replace(/{{/g, "").replace(/}}/g, "");


        // Parsing action attributes
        return intermediate4.replace(/@.*?="(.*?)"/g, (match, p1) => {
            const newMatch = match.replace("@", "on");

            return newMatch;
        });
    }

    build(appThis: {[key: string] : any}, appId: string): void {
        this.appId = appId;

        const parsedTemplate = this.parseTemplate();

        const step = document.createElement("div");
        step.innerHTML = parsedTemplate;
        const element = step.firstElementChild;

        if (element) {
            const app = document.querySelector(this.appId);
            if (app) {
                app.parentElement?.replaceChild(element, app);
            }

            Object.assign(appThis, this);
        }
    }

    private hydrate(dataRef: Ref<any>): void {
        const vm = new VirtualMachine();
        vm.initThis(this);

        const virtualTemplate = document.createElement("div");
        virtualTemplate.innerHTML = this.template;

        // Use dataRef.getAssociatedElementsUuid() to get all elements associated with the dataRef and update them
        dataRef.getAssociatedElementsUuid().forEach(uuid => {
            const virtualElement = virtualTemplate.querySelector(`[data-uuid="${uuid}"]`);

            if (virtualElement) {
                const parsedOuterHTML = this.parseTemplate(virtualElement.outerHTML.replace(/=""/g, ""));

                const documentElement = document.querySelector(`[data-uuid="${uuid}"]`);
    
                if (documentElement) {
                    documentElement.outerHTML = parsedOuterHTML;
                }
            }

        });
    }
}

export default InfimoFactory;