import { DataProp, InfimoObject, Listeners, MethodsProp, PropType, WatchProp } from "../types";
import { parseAll, parseComponents, putUuid, updateAttributesAndChildren } from "../utils";
import NameRegister from "./NameRegister";
import Ref from "./Ref";
import VirtualMachine from "./VirtualMachine";

export default class Component {
    private name: string;
    private template: string;
    private unparsedMainNode: Element;
    private mainNode: Element;
    private listeners: Listeners;
    private refs: Ref<any>[];
    private namesRegister: NameRegister;
    private components: Component[];

    constructor(infimoObject: InfimoObject) {
        this.name = infimoObject.name;
        this.unparsedMainNode = document.createElement("div");
        this.mainNode = document.createElement("div");
        this.template = infimoObject.template;
        this.components = infimoObject.components || [];
        this.listeners = {};
        this.refs = [];
        this.namesRegister = new NameRegister();

        this.data(infimoObject.data || {});
        this.watch(infimoObject.watch || {});
        this.methods(infimoObject.methods || {});
    }

    private async notifyListeners<T>(dataRef: Ref<T>, newValue: T, oldValue?: T): Promise<void> {
        if (this.listeners[dataRef.getName().name]) {
            this.listeners[dataRef.getName().name].forEach(listener => listener(newValue, oldValue));
        }

        if(newValue !== oldValue) await this.hydrate(dataRef);
    }

    private dataParse<T>(data: [string, T]): void {
        const [name, value] = data;

        const registeredName = this.namesRegister.registerName(name, PropType.DATA);

        const dataRef = new Ref(registeredName, value);
        this.refs.push(dataRef);
        
        Object.defineProperties(this, {
            [registeredName.name]: {
                get: () => dataRef.getValue(),
                set: async (newValue: T) => {
                    const oldValue = dataRef.getValue();
                    dataRef.setValue(newValue);
                    await this.notifyListeners(dataRef, newValue, oldValue);
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

    private watch(watchProp: WatchProp): void {
        Object.entries(watchProp).forEach(watch => this.watchParse(watch));
    }

    private methodsParse(method: [string, Function]): void {
        const [name, value] = method;
        
        const registeredName = this.namesRegister.registerName(name, PropType.METHODS);

        const refThis = this;

        const parsedFunction = (...args: any) => value.call(refThis, ...args);

        const methodRef = new Ref(registeredName, parsedFunction);
        this.refs.push(methodRef);
        
        Object.assign(window, { [registeredName.name]: methodRef.getValue() });
        
        Object.defineProperty(this, registeredName.name, {
            get: () => methodRef.getValue()
        });
    }

    private methods(methodsProp: MethodsProp): void {
        Object.entries(methodsProp).forEach(method => this.methodsParse(method));
    }

    private async parseTemplate(templateStr: string): Promise<Element> {
        let parsedTemplate = `${templateStr}`;
        this.components.forEach(component => {
            parsedTemplate = parsedTemplate.replace(new RegExp(`<${component.getName()}`, "g"), `<${component.getName().toLocaleLowerCase()}-component`);
        });

        const step = document.createElement("div");
        step.innerHTML = parsedTemplate;
        const element = step.firstElementChild;

        if (element) {
            const vm = new VirtualMachine();
            vm.initThis(this);

            await putUuid(element, this);

            this.unparsedMainNode = element.cloneNode(true) as Element;

            await parseAll(element, this, vm);
            await parseComponents(element, this, vm);

            return element;
        }

        throw new Error("Invalid template");
    }

    appendElementToVirtualUnparsedMainNode(element: Element, parentUuid: string, referenceNodeAfterUuid: string): void {
        const parent = this.unparsedMainNode.querySelector(`[data-uuid="${parentUuid}"]`);
        const referenceNodeAfter = this.unparsedMainNode.querySelector(`[data-uuid="${referenceNodeAfterUuid}"]`);
        if (parent && referenceNodeAfter) {
            parent.insertBefore(element, referenceNodeAfter);
            this.unparsedMainNode = this.unparsedMainNode.cloneNode(true) as Element;
            
            return;
        }
        
        if (parent) {
            parent.appendChild(element);
            this.unparsedMainNode = this.unparsedMainNode.cloneNode(true) as Element;

            return;
        }
    }

    removeElementFromVirtualUnparsedMainNode(uuid: string): void {
        const element = this.unparsedMainNode.querySelector(`[data-uuid="${uuid}"]`);

        if (element) {
            element.remove();
            this.unparsedMainNode = this.unparsedMainNode.cloneNode(true) as Element;
        }
    }

    private async hydrate(dataRef: Ref<any>): Promise<void> {
        const vm = new VirtualMachine();
        vm.initThis(this);

        const refThis = this;

        let counter = 0;

        let associatedElementsLength = dataRef.getAssociatedElements().length;

        while (true) {
            const updatedDataRef = this.refs.find(ref => ref.getName().name === dataRef.getName().name);
            if (!updatedDataRef) break;
            
            associatedElementsLength = updatedDataRef.getAssociatedElements().length;
            const associatedElement = updatedDataRef.getAssociatedElements()[counter];

            let virtualUnparsedElement = this.unparsedMainNode.querySelector(`[data-uuid="${associatedElement.uuid}"]`);
            let virtualElement = this.mainNode.querySelector(`[data-uuid="${associatedElement.uuid}"]`);
            
            if (!virtualUnparsedElement || !virtualElement) {
                if ((this.unparsedMainNode as HTMLElement).dataset.uuid === associatedElement.uuid) {
                    virtualUnparsedElement = this.unparsedMainNode;
                }

                if ((this.mainNode as HTMLElement).dataset.uuid === associatedElement.uuid) {
                    virtualElement = this.mainNode;
                }

                if (!virtualUnparsedElement || !virtualElement) {
                    counter++;
                    if (counter === associatedElementsLength) break;
                    continue;
                }
            };

            for (let attr of associatedElement.inAttrNames) {
                const computed = virtualUnparsedElement.getAttribute(attr);
                if (computed) {
                    virtualElement.setAttribute(attr, computed);
                }
                

                //update unparsed element if attr is missing
                if (!virtualUnparsedElement.hasAttribute(attr)
                    && virtualElement.hasAttribute(attr)
                ) {
                    const newComputed = virtualElement.getAttribute(attr);
                    if(newComputed) {
                        virtualUnparsedElement.setAttribute(attr, newComputed);
                    } 
                }
            }
            
            if (associatedElement.inTextContent) {
                const computed = virtualUnparsedElement.textContent;
                if (computed) {
                    virtualElement.textContent = computed;
                }
            }


            await parseAll(virtualElement, refThis, vm);
            await parseComponents(virtualElement, refThis, vm);

            virtualElement = virtualElement.cloneNode(true) as Element;

            const docElement = document.querySelector(`[data-uuid="${associatedElement.uuid}"]`);
            docElement && updateAttributesAndChildren(virtualElement, docElement);

            counter++;
            if (counter === associatedElementsLength) break;
        }
    }

    public async createMainNode(): Promise<void> {
        this.mainNode = await this.parseTemplate(this.template);
    }

    public getMainNode(): Element {
        return this.mainNode;
    }

    public getName(): string {
        return this.name;
    }

    public getComponents(): Component[] {
        return this.components;
    }
}