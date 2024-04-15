import { DataProp, InfimoObject, Listeners, MethodsProp, Prop, PropType, PropsProp, TypeConstructor, WatchProp } from "../types";
import { parseDataInsertion, parseStructures, parseComponents, putUuid, updateAttributesAndChildren, putUnparsedInPlaceOfRemoved, parseRemovedElements } from "../utils";
import EventBus from "./EventBus";
import NameRegister from "./NameRegister";
import Ref from "./Ref";
import RemovedElements from "./RemovedElements";
import VirtualMachine from "./VirtualMachine";

export default class Component {
    private name: string;
    private template: string;
    private unparsedMainNode: Element;
    private mainNode: Element;
    private eventBus: EventBus;
    private components: Component[];
    private listeners: Listeners;
    private refs: Ref<any>[];
    private componentProps : PropsProp;
    private namesRegister: NameRegister;
    private removedElements: RemovedElements;

    constructor(infimoObject: InfimoObject, eventBus: EventBus) {
        this.name = infimoObject.name;
        this.unparsedMainNode = document.createElement("div");
        this.mainNode = document.createElement("div");
        this.template = infimoObject.template;
        this.components = infimoObject.components || [];
        this.listeners = {};
        this.refs = [];
        this.componentProps = {};
        this.namesRegister = new NameRegister();
        this.eventBus = eventBus;
        this.removedElements = new RemovedElements();

        this.props(infimoObject.props || {});
        this.data(infimoObject.data || {});
        this.watch(infimoObject.watch || {});
        this.methods(infimoObject.methods || {});
    }

    emit(event: string, ...args: any[]): void {
        const uuid = (this.mainNode as HTMLElement).dataset.uuid || this.mainNode.getAttribute("data-uuid") || this.name;
        
        this.eventBus.emit(event, uuid, ...args);
    }

    private propsParse<T>(prop: [string, Prop<T>]): void {
        const [name, value] = prop;

        const registeredName = this.namesRegister.registerName(name, PropType.PROPS);

        this.componentProps[registeredName.name] = value;

        //if prop has default value, set it
        if (typeof value === "object" && !Array.isArray(value) && value?.default) {
            let propRef = this.refs.find(ref => ref.getName().name === registeredName.name);

            if (!propRef) {
                propRef = new Ref(registeredName, value.default);
                this.refs.push(propRef);
            }

            Object.defineProperty(this, registeredName.name, {
                get: () => propRef.getValue()
            });
        }
    }

    private props(propsProp: PropsProp): void {
        Object.entries(propsProp).forEach(prop => this.propsParse(prop));
    }

    setProps(propsToSet: { [key: string]: any}): void {
        const refThis = this;

        const checkType = (value: any, type: TypeConstructor) => {
            if (value === null) return false;

            return type(value) === value;
        }

        Object.entries(propsToSet).forEach(([name, value]) => {
            // get prop definition in componentProps, validate the type and, if is valid, use defineProperty to set the value
            // parse name, substituting kebab-case for camelCase
            const parsedName = name.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            const propDefinition: Prop<any> = refThis.componentProps[parsedName];

            if (!propDefinition) {
                throw new Error(`Prop ${parsedName} does not exist`);
            }

            if (Array.isArray(propDefinition)) {
                if (!propDefinition.some((type: TypeConstructor) => (checkType(value, type)) )) {
                    throw new Error(`Prop ${parsedName} must be one of ${propDefinition}`);
                }
            } else if (typeof propDefinition === "object") {
                if (propDefinition.required && !value) {
                    throw new Error(`Prop ${parsedName} is required`);
                }
                if (value === undefined || value === null) {
                    value = propDefinition.default;
                }
                if (Array.isArray(propDefinition.type)) {
                    if (!propDefinition.type.some((type: TypeConstructor) => checkType(value, type))) {
                        throw new Error(`Prop ${parsedName} must be one of ${propDefinition.type}`);
                    }
                } else {
                    if (!(
                        (propDefinition.type === null && value === null)
                            || (
                                propDefinition.type !== null
                                    && (checkType(value, propDefinition.type))
                            )
                    )) {
                        throw new Error(`Prop ${parsedName} must be ${propDefinition.type}`);
                    }
                }
                if (propDefinition.validator) {
                    if (!propDefinition.validator(value)) {
                        throw new Error(propDefinition.validatorMessage || `Prop ${parsedName} is invalid`);
                    }
                }
            } else {
                if (!(checkType(value, propDefinition))) {
                    throw new Error(`Prop ${parsedName} must be ${propDefinition}`);
                }
            }

            // get registered name, create a new Ref and push it to refs. Also, create a getter for the prop
            const registeredName = refThis.namesRegister.getNames().find(registeredName => registeredName.name === parsedName && registeredName.type === PropType.PROPS);
            if (!registeredName) {
                throw new Error(`Prop ${parsedName} does not exist`);
            }

            // check if ref exist, if it does, update the value
            const ref = refThis.refs.find(ref => ref.getName().name === registeredName.name);
            if (ref) {
                ref.setValue(value);

                return;
            }

            let propRef = refThis.refs.find(ref => ref.getName().name === registeredName.name);

            if (!propRef) {
                propRef = new Ref(registeredName, value);
                refThis.refs.push(propRef);
            }

            Object.defineProperty(refThis, registeredName.name, {
                get: () => propRef.getValue()
            });
        });
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

        let dataRef = this.refs.find(ref => ref.getName().name === registeredName.name);

        if (!dataRef) {
            dataRef = new Ref(registeredName, value);
            this.refs.push(dataRef);
        }

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

        if (typeof value === "function") {
            const parsedFunction = (...args: any) => value.call(refThis, ...args);

            if (this.listeners[name].some(listener => listener === parsedFunction)) {
                return;
            }

            this.listeners[name].push(parsedFunction);
        }
    }

    private watch(watchProp: WatchProp): void {
        Object.entries(watchProp).forEach(watch => this.watchParse(watch));
    }

    private methodsParse(method: [string, Function]): void {
        const [name, value] = method;
        
        const registeredName = this.namesRegister.registerName(name, PropType.METHODS);

        const refThis = this;

        const parsedFunction = (...args: any) => value.call(refThis, ...args);

        let methodRef = this.refs.find(ref => ref.getName().name === registeredName.name);

        if (!methodRef) {
            methodRef = new Ref(registeredName, parsedFunction);
            this.refs.push(methodRef);
        }
        
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
            parsedTemplate = parsedTemplate.replace(new RegExp(`</${component.getName()}`, "g"), `</${component.getName().toLocaleLowerCase()}-component`);
        });
        
        const step = document.createElement("div");
        step.innerHTML = parsedTemplate;
        let element = step.firstElementChild;

        if (element) {
            const vm = new VirtualMachine();
            vm.initThis(this);

            await putUuid(element, this);

            this.unparsedMainNode = element.cloneNode(true) as Element;

            element = await parseStructures(element, this, vm);
            element = await parseComponents(element, this, vm);
            element = await parseDataInsertion(element, this, vm);

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

        // loop through all associated elements and update them
        while (true) {
            const updatedDataRef = refThis.refs.find(ref => ref.getName().name === dataRef.getName().name);
            if (!updatedDataRef) break;
            
            associatedElementsLength = updatedDataRef.getAssociatedElements().length;
            const associatedElement = updatedDataRef.getAssociatedElements()[counter];

            let virtualUnparsedElement = refThis.unparsedMainNode.querySelector(`[data-uuid="${associatedElement.uuid}"]`);
            let virtualElement = refThis.mainNode.querySelector(`[data-uuid="${associatedElement.uuid}"]`);

            // Put unparsed element in place of removed i-if element
            if (virtualUnparsedElement && (!virtualElement || virtualUnparsedElement?.hasAttribute("i-if"))) {
                putUnparsedInPlaceOfRemoved(virtualUnparsedElement, associatedElement, refThis);

                virtualElement = refThis.mainNode.querySelector(`[data-uuid="${associatedElement.uuid}"]`);
            }

            // if virtualUnparsedElement or virtualElement is missing, vreify if the corresponding main node is the missing element
            if (!virtualUnparsedElement || !virtualElement) {
                if ((refThis.unparsedMainNode as HTMLElement).dataset.uuid === associatedElement.uuid) {
                    virtualUnparsedElement = refThis.unparsedMainNode;
                }

                if ((refThis.mainNode as HTMLElement).dataset.uuid === associatedElement.uuid) {
                    virtualElement = refThis.mainNode;
                }

                if (!virtualUnparsedElement || !virtualElement) {
                    counter++;
                    if (counter === associatedElementsLength) break;
                    continue;
                }
            };

            // if virtualUnparsedElement is a component, replace it with the component
            if (virtualUnparsedElement?.tagName !== virtualElement?.tagName
                && virtualUnparsedElement?.tagName.toLowerCase().includes("-component")
            ) {
                // set virtualElement equal to virtualUnparsedElement
                virtualElement.replaceWith(virtualUnparsedElement.cloneNode(true) as Element);
                virtualElement = refThis.mainNode.querySelector(`[data-uuid="${associatedElement.uuid}"]`);

                if ((refThis.mainNode as HTMLElement).dataset.uuid === associatedElement.uuid) {
                    virtualElement = refThis.mainNode;
                }

                if (!virtualElement) {
                    counter++;
                    if (counter === associatedElementsLength) break;
                    continue;
                }
            } else {
                // update attributes and textContent
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
            }

            // parse elements
            virtualElement = await parseStructures(virtualElement, refThis, vm);
            virtualElement = await parseComponents(virtualElement, refThis, vm);
            virtualElement = await parseDataInsertion(virtualElement, refThis, vm);

            virtualElement = virtualElement.cloneNode(true) as Element;
            
            // update attributes and children in the DOM
            const docElement = document.querySelector(`[data-uuid="${associatedElement.uuid}"]`);
            docElement && updateAttributesAndChildren(virtualElement, docElement);
            
            counter++;
            if (counter === associatedElementsLength) break;
        }

        // remove i-if elements from the tree that are set to be removed
        await parseRemovedElements(refThis);
    }

    public async createMainNode(): Promise<void> {
        this.mainNode = await this.parseTemplate(this.template);
    }
    
    public async initialConditionalRemoves(): Promise<void> {
        await parseRemovedElements(this);
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

    public getRemovedElements(): RemovedElements {
        return this.removedElements;
    }
}