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

        this.appId && this.hydrate(this.appId, dataRef);
    }

    private dataParse<T>(data: [string, T]): void {
        const [name, value] = data;

        const registeredName = this.namesRegister.registerName(name, PropType.DATA);

        const dataRef = new Ref(registeredName, value);
        this.refs.push(dataRef);

        Object.assign(this, {
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
            throw new Error(`Name ${name} does not exist`);
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

        Object.assign(this, name, {
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
        const intermediate2 = intermediate.replace(/<.*?>/g, (match) => {
            const uuid = uuidv4();

            return match.replace(" ", ` data-uuid="el-${uuid}" `);
        });

        // Parsing {{}}
        return intermediate2.replace(/{{(.*?)}}/g, (match) => {
            const evalutated = vm.runScriptSync(match);

            return `${evalutated}`;
        }).replace(/{{/g, "").replace(/}}/g, "");

    }

    build(appId: string): void {
        this.appId = appId;

        const parsedTemplate = this.parseTemplate();

        const step = document.createElement("div");
        step.innerHTML = parsedTemplate;
        const element = step.firstElementChild;

        if (element) {
            document.querySelector(this.appId)?.appendChild(element);
        }
    }

    private hydrate(appId: string, dataRef: Ref<any>): void {
        const vm = new VirtualMachine();
        vm.initThis(this);

        // Use dataRef.getAssociatedElementsUuid() to get all elements associated with the dataRef and update them
        dataRef.getAssociatedElementsUuid().forEach(uuid => {
            // pick element using this.template and use parseTemplate to update it
            const templateElement = this.template.replace(new RegExp(`<.*?data-uuid="el-${uuid}".*?>`), (match) => {
                const evalutated = vm.runScriptSync(match);

                return `${evalutated}`;
            });

            const element = document.querySelector(`[data-uuid="el-${uuid}"]`);

            // replaces the element with the new one from templateElement
            if (element) {
                element.outerHTML = templateElement;
            }
        });
    }
}

export default InfimoFactory;