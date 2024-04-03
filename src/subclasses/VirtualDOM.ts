import {
    updateAttributesAndChildren,
    parseAll,
    replaceBracesCode,
    putUuid
} from './../utils';
import { InfimoObject } from './../../lib/types.d';
import { DataProp, Listeners, PropType } from "../types";
import NameRegister from "./NameRegister";
import Ref from "./Ref";
import VirtualMachine from './VirtualMachine';

export default class VirtualDOM {
    private template: string;
    private unparsedMainNode: Element;
    private mainNode: Element;
    private listeners: Listeners;
    private refs: Ref<any>[];
    private namesRegister: NameRegister;

    constructor(infimoObject: InfimoObject) {
        this.unparsedMainNode = document.createElement("div");
        this.mainNode = document.createElement("div");
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

        const refThis = this;

        this.listeners[name].push((...args) => value.call(refThis, ...args));
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

    private async parseTemplate(templateStr: string): Promise<Element> {
        const step = document.createElement("div");
        step.innerHTML = templateStr;
        const element = step.firstElementChild;

        if (element) {
            const vm = new VirtualMachine();
            vm.initThis(this);

            await putUuid(element, this.refs);

            this.unparsedMainNode = element.cloneNode(true) as Element;

            await parseAll(element, this.refs, this, vm);

            return element;
        }

        throw new Error("Invalid template");
    }

    private hydrate(dataRef: Ref<any>): void {
        const vm = new VirtualMachine();
        vm.initThis(this);

        // Use dataRef.getAssociatedElementsUuid() to get all elements associated with the dataRef and update them
        dataRef.getAssociatedElements().forEach(associatedElement => {
            const virtualUnparsedElement = this.unparsedMainNode.querySelector(`[data-uuid="${associatedElement.uuid}"]`);
            const virtualElement = this.mainNode.querySelector(`[data-uuid="${associatedElement.uuid}"]`);

            if (!virtualUnparsedElement || !virtualElement) return;

            for (let attr of associatedElement.inAttrNames) {
                const computed = virtualUnparsedElement.getAttribute(attr);
                if (computed) {
                    const computedValue = vm.runScriptSync(computed);
                    virtualElement.setAttribute(attr.replace(/#/, "").replace("@", "on"), `${computedValue}`);
                }
            }

            if (associatedElement.inTextContent) {
                const computed = virtualUnparsedElement.textContent;
                if (computed) {
                    const computedValue = replaceBracesCode(computed, vm);

                    virtualElement.textContent = computedValue;
                }
            }

            
            const docElement = document.querySelector(`[data-uuid="${associatedElement.uuid}"]`);
            docElement && updateAttributesAndChildren(virtualElement, docElement);

        });
    }

    public async createMainNode(): Promise<void> {
        this.mainNode = await this.parseTemplate(this.template);
    }

    public getMainNode(): Element {
        return this.mainNode;
    }
    

}