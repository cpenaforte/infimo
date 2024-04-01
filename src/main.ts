import { DataProp, PropType, Listeners, InfimoObject } from "./types";
import NameRegister from "./subclasses/NameRegister";
import Ref from "./subclasses/Ref";
import { basicParamParse } from "./utils";

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

    private notifyListeners<T>(name: string, newValue: T, oldValue: T): void {
        if (this.listeners[name]) {
            this.listeners[name].forEach(listener => listener(newValue, oldValue));
        }

        this.appId && this.build(this.appId);
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
                    dataRef.updateValue(newValue);
                    this.notifyListeners(name, newValue, oldValue);
                }
            }
        });
    }

    data(dataProp: DataProp): void {
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

    watch(watchProp: { [key: string]: (newValue?: any, oldValue?: any) => void }): void {
        Object.entries(watchProp).forEach(watch => this.watchParse(watch));
    }

    private methodsParse(method: [string, Function]): void {
        const [name, value] = method;

        const registeredName = this.namesRegister.registerName(name, PropType.METHODS);

        const methodRef = new Ref(registeredName, value);
        this.refs.push(methodRef);

        Object.defineProperty(this, name, methodRef.getValue());
    }

    methods(methodsProp: { [key: string]: Function }): void {
        Object.entries(methodsProp).forEach(method => this.methodsParse(method));
    }

    private parseTemplate(): string {
        const intermediate = `${this.template}`;

        return intermediate.replace(/{{(.*?)}}/g, (match) => {
            let rebuiltString = match;

            this.refs.forEach(ref => {
                if (rebuiltString.includes(ref.getName().name)) {
                    if (typeof ref.getValue() === "function") {
                        // use ref.getName().name to create a regex to find the function params then replace it with the function call
                        const regex = new RegExp(`${ref.getName().name}\\((.*?)\\)`, "g");
                        const matched = rebuiltString.match(regex) || [];
                        
                        const functionParams = matched.map((match: string) => {
                            const paramsNamesList = match.replace(`${ref.getName().name}(`, "").replace(")", "").split(",").map((p: string) => p.trim());
                            return paramsNamesList.map((p: string) => {
                                return basicParamParse(p, this.refs);
                            });
                        });

                        rebuiltString = rebuiltString.replace(regex, ref.getValue()(...functionParams));
                    } else {
                        rebuiltString = rebuiltString.replace(`${ref.getName().name}`, ref.getValue());
                    }
                }
            });

            return rebuiltString;
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
}

export default InfimoFactory;