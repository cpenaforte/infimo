import Component from "./subclasses/Component";
import EventBus from "./subclasses/EventBus";
import Ref from "./subclasses/Ref";
import RemovedElements from "./subclasses/RemovedElements";
import VirtualMachine from "./subclasses/VirtualMachine";
import { AssociatedElement } from "./types";

export const getPropertyValue = (property: string, refThis: {[key:string]: any}): any => {
    const descriptor = Object.getOwnPropertyDescriptor(refThis, property);
    if (descriptor) {
        return descriptor.get? descriptor.get() : descriptor.value;
    }
}

export const updateRef = (refName: string, refThis: {[key:string]: any}, value: any): void => {
    refThis[refName] = value;

    refThis.refs.find((ref: Ref<any>) => ref.getName().name === refName)?.setValue(value);
}

export const putUnparsedInPlaceOfRemoved = (unparsedElement: Element, associatedElement: AssociatedElement, refThis: {[key:string]: any}): void => {
    // Put unparsed element in place of removed element in virtual dom
    const parsedParent: Element | null = refThis.mainNode.getAttribute("data-uuid") === unparsedElement.parentElement?.getAttribute("data-uuid")
        ? refThis.mainNode
        : refThis.mainNode.querySelector(`[data-uuid="${unparsedElement.parentElement?.getAttribute("data-uuid")}"]`);
    let parsedSibling: Element | null  = refThis.mainNode.querySelector(`[data-uuid="${unparsedElement.nextElementSibling?.getAttribute("data-uuid")}"]`);
    const parsedElement: Element | null = refThis.mainNode.querySelector(`[data-uuid="${associatedElement.uuid}"]`);

    if (parsedElement && parsedParent) {
        if (!parsedSibling && unparsedElement.nextElementSibling) {
            parsedSibling = unparsedElement.nextElementSibling;
    
            const nextSibling = parsedParent.querySelector(`[data-uuid="${parsedSibling.nextElementSibling?.getAttribute("data-uuid")}"]`);
            parsedParent.insertBefore(parsedSibling.cloneNode(true), nextSibling);
        } else if (parsedSibling && unparsedElement.nextElementSibling && parsedSibling?.getAttribute("data-uuid") !== unparsedElement.nextElementSibling?.getAttribute("data-uuid")) {
            parsedParent.replaceChild(unparsedElement.nextElementSibling, parsedSibling);

            parsedSibling = unparsedElement.nextElementSibling;
        }
    }

    if (parsedParent && !parsedElement) {
        parsedParent.insertBefore(unparsedElement.cloneNode(true), parsedSibling);
    } else if (parsedElement) {
        parsedElement.replaceWith(unparsedElement.cloneNode(true));
    }

    if (parsedSibling?.hasAttribute("i-else")) {
        const newUnparsedElement = refThis.unparsedMainNode
            .querySelector(`[data-uuid="${(parsedSibling as HTMLElement).dataset.uuid || parsedSibling.getAttribute("data-uuid")}"]`);

        if (newUnparsedElement) {
            const newAssociatedElement: AssociatedElement = {
                uuid: newUnparsedElement.getAttribute("data-uuid") || (newUnparsedElement as HTMLElement).dataset.uuid,
                inTextContent: false,
                inAttrNames: ["i-else"]
            };

            putUnparsedInPlaceOfRemoved(newUnparsedElement, newAssociatedElement, refThis);
        }
    }
}

export const associateElement = (element: Element, refThis: {[key:string]: any}): void => {
    for (let ref of refThis.refs) {
        // verify if ref is contained in the match and put uuid into associatedElementsUuid
        const associatedElement: AssociatedElement = {
            uuid: element.getAttribute("data-uuid") as string,
            inTextContent: false,
            inAttrNames: []
        };

        for(let attrName of element.getAttributeNames()) {
            if (element.getAttribute(attrName)?.includes(ref.getName().name)) {
                associatedElement.inAttrNames.push(attrName);
            }
        }

        for (let child of element.childNodes) {
            if (child.nodeType === 3) {
                if ((child as Element).textContent?.includes(ref.getName().name)) {
                    associatedElement.inTextContent = true;
                }
            }
        }

        if(associatedElement.inTextContent || associatedElement.inAttrNames.length > 0) {
            ref.addAssociatedElement(associatedElement);
        }
    }
}

export const putUuid = async (element: Element, refThis: { [key: string] : any }): Promise<void> => {
    if (!element.hasAttribute("data-uuid")
        || (element.getRootNode() as Element).querySelectorAll(`[data-uuid="${element.getAttribute("data-uuid")}"]`).length > 1
    ) {
        const uuid = Math.random().toString(36).substring(7);
        element.setAttribute("data-uuid", uuid);
    
        associateElement(element, refThis);
    }

    for (let child of element.childNodes) {
        if (child.nodeType === 1) {
            await putUuid(child as Element, refThis);
        }
    };
}

export const removeUuid = (element: Element): void => {
    element.removeAttribute("data-uuid");

    // remove children data-uuid
    for (let child of element.childNodes) {
        if (child.nodeType === 1) {
            removeUuid(child as Element);
        }
    }
}

export const parseListRendering = async (element: Element, refThis: { [key: string] : any }, virtualMachine?: VirtualMachine): Promise<Element> => {
    const list = element.getAttribute("i-for");
    if (!list) {
        return element;
    };

    const vm = virtualMachine || new VirtualMachine();
    vm.initThis(refThis);

    const sibling = element.nextElementSibling;
    const parent = element.parentElement;

    const [item, listName] = list.split(" in ");
    const listValue = vm.runScriptSync(listName);

    if (!Array.isArray(listValue)) throw new Error("i-for must have an array");

    for (const value of listValue) {
        const clone = element.cloneNode(true) as Element;

        clone.removeAttribute("i-for");
        removeUuid(clone);
        
        await putUuid(clone, refThis);
        const cloneUuid = (clone as HTMLElement).dataset.uuid as string;
        
        Object.assign(refThis, {
            forVariables: {
                ...((refThis as any)?.forVariables || {}),
                [cloneUuid]: {
                    ...(((refThis as any)?.forVariables || {})[cloneUuid] || {}),
                    [item]: value
                }
            } 
        });

        // Append list elements to unparsed dom
        refThis.appendElementToVirtualUnparsedMainNode(
            clone,
            (parent as HTMLElement).dataset.uuid,
            (sibling as HTMLElement | null)?.dataset.uuid
        );
        
        parent?.insertBefore(clone, sibling);
    };

    // Remove original element
    refThis.removeElementFromVirtualUnparsedMainNode(element.getAttribute("data-uuid") as string, refThis);

    // Remove element from refs associated elements
    const elementUuid = (element as HTMLElement).dataset.uuid;

    refThis.refs = refThis.refs.map((ref: Ref<any>) => {
        elementUuid && ref.removeAssociatedElement(elementUuid);
        return ref;
    });

    element.remove();

    return element;
}

export const parseForVariables = (element: Element, refThis: { [key: string] : any }): { [key: string] : any } => {
    // If element don't have a uuid as key of refThis.forVariables, repeat with the parent node
    const variables = ((refThis?.forVariables || {})[(element as HTMLElement).dataset.uuid as string] || {});

    if (!Object.keys(variables).length && element.parentElement && (element.parentElement as HTMLElement).dataset.uuid) {
        return parseForVariables(element.parentElement, refThis);
    }

    return Object.assign(refThis, variables);
}

export const removeElement = (condition: boolean, element: Element, refThis: {[key: string]: any}): void => {
    if (condition) {
        refThis.removedElements?.add(element);
        return;
    }

    (refThis.removedElements as RemovedElements).pop((element as HTMLElement).dataset.uuid as string);
}

export const parseConditionalRendering = async (element: Element, refThis: { [key: string] : any }, virtualMachine?: VirtualMachine): Promise<Element> => {
    const condition = element.getAttribute("i-if");
    if (!condition?.length) return element;

    const parsedThis = parseForVariables(element, refThis);
    
    const vm = virtualMachine || new VirtualMachine();
    vm.initThis(parsedThis);

    const sibling = element.nextElementSibling;

    if (!vm.runScriptSync(condition)) {
        removeElement(true, element, refThis);

        if (sibling && sibling.hasAttribute("i-else")) {
            removeElement(false, sibling, refThis);
        }

        return element;
    }

    removeElement(false, element, refThis);

    if (sibling?.hasAttribute("i-else")) {
        removeElement(true, sibling, refThis);
    }

    return element;
}

export const replaceBracesCode = (text: string, vm: VirtualMachine): string => {
    return text.replace(/{{(.*?)}}/g, (match) => {
        const evalutated = vm.runScriptSync(match);
        return `${evalutated}`;
    }).replace(/{{/g, "").replace(/}}/g, "");
}

export const parseBracesCode = async (element: Element, refThis: { [key: string] : any }, virtualMachine?: VirtualMachine): Promise<Element> => {
    let clonedElement = element;

    const parsedThis = parseForVariables(clonedElement, refThis);
    const vm = virtualMachine || new VirtualMachine();
    vm.initThis(parsedThis);
    
    for( let child of clonedElement.childNodes) {
        if (child.nodeType === 3) {
            const text = (child as Element).textContent;
            if (text?.includes("{{")) {
                (child as Element).textContent = replaceBracesCode(text, vm)
            }
        }
    };

    return clonedElement;
}

export const parseCustomAttributes = async (element: Element, refThis: { [key: string] : any }, virtualMachine?: VirtualMachine): Promise<Element> => {
    const custom = element.getAttribute("custom-attr");
    if (custom) {
        element.removeAttribute("custom-attr");

        const parsedThis = parseForVariables(element, refThis);

        const vm = virtualMachine || new VirtualMachine();
        vm.initThis(parsedThis);

        const evalutated = vm.runScriptSync(custom);

        if (typeof evalutated !== "string") throw new Error("Custom attribute must return a string");

        const attrName = evalutated.split("=")[0];
        let attrValue = "";

        if (attrName.length < evalutated.length) {
            attrValue = evalutated.split("=")[1].replace(/"/g, "");
        }

        element.setAttribute(attrName, attrValue);
    }

    return element;
}

const emitValue = (event: Event, modelName: string, modelValue: string, refThis: { [key: string] : any }): void => {
    const element = event.target as HTMLInputElement;

    let inputValue: string | boolean = element.value;

    if(element.type === "checkbox") {
        inputValue = element.checked;
    }

    let value: string | number | boolean = inputValue;
    
    if (modelName.includes(".number")) {
        const maybeNaN = (typeof value === "boolean")
            ? +value
            : parseFloat(value);

        value = isNaN(maybeNaN) ? 0 : maybeNaN;
    }

    if (modelName.includes(".boolean")) {
        value = (typeof value === "boolean")
            ? value
            : (value === "true");
    }


    if (Object.getOwnPropertyDescriptor(refThis, modelValue)) {
        updateRef(modelValue, refThis, value);
    }
}

export const parseModelAttributes = async (element: Element, refThis: { [key: string] : any }, virtualMachine?: VirtualMachine): Promise<Element> => {
    const modelAttr = element.getAttributeNames().find(attr => attr === "i-model");
    if (modelAttr) {
        const modelValue = element.getAttribute(modelAttr);
        element.removeAttribute(modelAttr);

        if (modelValue) {
            const parsedThis = parseForVariables(element, refThis);

            const vm = virtualMachine || new VirtualMachine();
            vm.initThis(parsedThis);
    
            const evalutated = vm.runScriptSync(modelValue);
    
            element.setAttribute("value", `${evalutated}`);

            if (element instanceof HTMLInputElement) {
                if (["radio", "checkbox"].includes(element.getAttribute("type") || "")){
                    (element as HTMLInputElement).onchange = (e) => {
                        emitValue(e, modelAttr, modelValue, refThis);
                    };
                } else {
                    (element as HTMLInputElement).oninput = (e) => {
                        emitValue(e, modelAttr, modelValue, refThis);
                    };
                }
            }
        }
    }

    return element;
}

export const parseComputedAttributes = async (element: Element, refThis: { [key: string] : any }, virtualMachine?: VirtualMachine): Promise<Element> => {
    const parsedThis = parseForVariables(element, refThis);
    
    const vm = virtualMachine || new VirtualMachine();
    vm.initThis(parsedThis);
    
    const computedAttrs = element.getAttributeNames().filter(attr => attr.startsWith(":"));

    for (let attr of computedAttrs) {
        const computed = element.getAttribute(attr);
        if (computed) {
            const computedValue = vm.runScriptSync(computed);
            element.setAttribute(attr.replace(":", ""), `${computedValue}`);
        }
        
        element.removeAttribute(attr);
    };

    return element;
}

export const parseComputedEvents = async (element: Element, refThis: { [key: string] : any }, virtualMachine?: VirtualMachine): Promise<Element> => {
    const parsedThis = parseForVariables(element, refThis);
    
    const vm = virtualMachine || new VirtualMachine();
    vm.initThis(parsedThis);
    
    const computedEvents = element.getAttributeNames().filter(attr => attr.startsWith("@"));

    for (let attr of computedEvents) {
        const computed = element.getAttribute(attr);
        if (computed) {
            const computedValue = vm.runScriptSync(computed);
            if (typeof computedValue === "function"){
                (element as any)[attr.replace("@", "on")] = () => computedValue();
            }
        }

        element.removeAttribute(attr);
    };

    return element;
}

export const parseStructures = async (element: Element, refThis: { [key: string] : any }, virtualMachine?: VirtualMachine): Promise<Element> => {
    element = await parseConditionalRendering(element, refThis, virtualMachine);
    element = await parseListRendering(element, refThis, virtualMachine);

    for (let child of element.childNodes) {
        if (child.nodeType === 1) {
            child = await parseStructures(child as Element, refThis, virtualMachine);
        }
    };

    return element;
}

export const parseDataInsertion = async (element: Element, refThis: { [key: string] : any }, virtualMachine?: VirtualMachine): Promise<Element> => {
    element = await parseCustomAttributes(element, refThis, virtualMachine);

    element = await parseComputedAttributes(element, refThis, virtualMachine);

    element = await parseModelAttributes(element, refThis, virtualMachine);

    element = await parseComputedEvents(element, refThis, virtualMachine);

    element = await parseBracesCode(element, refThis, virtualMachine);

    for (let child of element.childNodes) {
        if (child.nodeType === 1) {
            child = await parseDataInsertion(child as Element, refThis, virtualMachine);
        }
    };

    return element;
}

export const parseSingleComponent = async (component: Component, componentElement: Element, refThis: { [key: string] : any }, virtualMachine?: VirtualMachine): Promise<Element> => {
    // parse i-for variables
    const parsedThis: typeof refThis = parseForVariables(componentElement, refThis);

    const vm = virtualMachine || new VirtualMachine();
    vm.initThis(parsedThis);

    const clonedElement = componentElement.cloneNode(true) as Element;

    // Parse component props
    const props = clonedElement.getAttributeNames().filter(attr => !attr.startsWith("@") && !attr.startsWith("i-") && (attr !== "data-uuid"));

    let parsedProps: { [key: string]: any } = {};

    for (let prop of props) {
        const propValue = clonedElement.getAttribute(prop);

        if (prop.startsWith(":")) {
            const propName = prop.replace(":", "");
            const propValueEvaluated = vm.runScriptSync(propValue || "true");
            parsedProps[propName] = propValueEvaluated;
        } else {
            parsedProps[prop] = propValue || true;
        }

        clonedElement.removeAttribute(prop);
    }

    component.setProps(parsedProps);

    // Parse component events

    const events = clonedElement.getAttributeNames().filter(attr => attr.startsWith("@"));

    for (let event of events) {
        const eventValue = clonedElement.getAttribute(event);
        if (!eventValue) continue;

        const eventName = event.replace("@", "");
        const eventFunction = vm.runScriptSync(eventValue);

        const uuid = (clonedElement as HTMLElement).dataset.uuid || (clonedElement.getAttribute("data-uuid")) || component.getName();

        (parsedThis.eventBus as EventBus).on(eventName, eventFunction, uuid);

        clonedElement.removeAttribute(event);
    }

    await component.createMainNode();

    const removedElements = component.getRemovedElements().getRemovedElements();
    for (let removedElement of removedElements) {
        refThis.removedElements?.add(removedElement.el);
    }

    const componentNode = component.getMainNode();
    componentNode.setAttribute("data-uuid", (clonedElement as HTMLElement).dataset.uuid || (clonedElement.getAttribute("data-uuid") as string));
    componentNode.setAttribute("data-component", component.getName());

    return componentNode;
}


export const parseComponents = async (element: Element, refThis: { [key: string] : any }, virtualMachine?: VirtualMachine): Promise<Element> => {
    const components = refThis.components as Component[];
    for (let component of components) {
        const componentName = component.getName();
        const templateTagName = `${componentName.toLocaleLowerCase()}-component`;

        const componentElements = element.querySelectorAll(templateTagName);

        const vm = virtualMachine || new VirtualMachine();
        vm.initThis(refThis);

        // find props, validate them and pass them to the component
        for (let componentElement of componentElements) {
            const newElement = await parseSingleComponent(component, componentElement as Element, refThis, vm);
            componentElement.replaceWith(newElement);
        }

        if (element.tagName.toLocaleLowerCase() === templateTagName) {
            const newElement = await parseSingleComponent(component, element, refThis, vm);
            element.replaceWith(newElement);
            element = newElement;
        }
    }

    return element;
}

export const parseRemovedElements = async (refThis: { [key: string] : any }): Promise<void> => {
    (refThis.removedElements as RemovedElements).getRemovedElements().forEach(removedElement => {
        const parsedElement = refThis.mainNode.querySelector(`[data-uuid="${removedElement.el?.getAttribute("data-uuid")}"]`);
        const parsedDocElement = document.querySelector(`[data-uuid="${removedElement.el?.getAttribute("data-uuid")}"]`);

        if (parsedElement && parsedDocElement) {
            parsedElement.remove();
            parsedDocElement.remove();
        }
    });
}


export const updateAttributes = (element: Element, docElement: Element): void => {
    element.getAttributeNames().forEach(attr => {
        const docAttrValue = docElement.getAttribute(attr);
        const virtualAttrValue = element.getAttribute(attr);

        if (virtualAttrValue && (virtualAttrValue === docAttrValue)) return;

        virtualAttrValue && docElement.setAttribute(attr, virtualAttrValue);
    });

    docElement.getAttributeNames().forEach(attr => {
        const virtualAttrValue = element.getAttribute(attr);
        if (!virtualAttrValue) {
            docElement.removeAttribute(attr);
        }
    });
}

export const updateAttributesAndChildren = (element: Element, docElement: Element): void => {
    updateAttributes(element, docElement);

    element.childNodes.forEach(child => {
        if (child.nodeType === 1) {
            const docChild = docElement.querySelector(`[data-uuid="${(child as HTMLElement).dataset.uuid}"]`);
            if (docChild) {
                updateAttributesAndChildren(child as Element, docChild);
            }
        }

        if (child.nodeType === 3) {
            docElement.childNodes.forEach(docChild => {
                if (docChild.nodeType === 3) {
                    docChild.textContent = child.textContent;
                }
            });
        }
    });
}