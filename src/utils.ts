import Component from "./subclasses/Component";
import Ref from "./subclasses/Ref";
import VirtualMachine from "./subclasses/VirtualMachine";
import { AssociatedElement } from "./types";

export const getPropertyValue = (property: string, refThis: {[key:string]: any}): any => {
    const descriptor = Object.getOwnPropertyDescriptor(refThis, property);
    if (descriptor) {
        return descriptor.get? descriptor.get() : descriptor.value;
    }
}

export const fullClone = (obj: object): object => {
    return Object.getPrototypeOf(Object.create(obj));
}

export const updateRef = (refName: string, refThis: {[key:string]: any}, value: any): void => {
    refThis[refName] = value;

    refThis.refs.find((ref: Ref<any>) => ref.getName().name === refName)?.setValue(value);
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
    if (!element.hasAttribute("data-uuid")) {
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

export const parseListRendering = async (element: Element, refThis: { [key: string] : any }, virtualMachine?: VirtualMachine): Promise<void> => {
    const list = element.getAttribute("i-for");
    if (!list) {
        const key = element.getAttribute("key");
        if (key) {
            const item = key.split("-")[0];
            const value = key.split("-")[1];

            element.innerHTML = element.innerHTML.replace(new RegExp(item, "g"), `${value}`);
        }

        return;
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

        clone.innerHTML = clone.innerHTML.replace(new RegExp(item, "g"), `${value}`);

        clone.setAttribute("key", `${item}-${value}`);
        clone.removeAttribute("data-uuid");

        await putUuid(clone, refThis);

        refThis.appendElementToVirtualUnparsedMainNode(
            clone,
            (parent as HTMLElement).dataset.uuid,
            (sibling as HTMLElement | null)?.dataset.uuid
        );
        
        parent?.insertBefore(clone, sibling);
    };

    refThis.removeElementFromVirtualUnparsedMainNode(element.getAttribute("data-uuid") as string, refThis);

    //remove element from refs associated elements
    const elementUuid = (element as HTMLElement).dataset.uuid;

    refThis.refs = refThis.refs.map((ref: Ref<any>) => {
        elementUuid && ref.removeAssociatedElement(elementUuid);
        return ref;
    });

    element.remove();

}

export const toggleHide = (condition: boolean, element: Element): void => {
    if (condition) {
        (element as HTMLElement).style.display = "none";
    } else {
        (element as HTMLElement).style.display = "";
    }
}

export const parseConditionalRendering = async (element: Element, refThis: { [key: string] : any }, virtualMachine?: VirtualMachine): Promise<void> => {
    const condition = element.getAttribute("i-if");
    if (!condition) return;
    
    const vm = virtualMachine || new VirtualMachine();
    vm.initThis(refThis);
    
    const sibling = element.nextElementSibling;
    
    if (!vm.runScriptSync(condition)) {
        toggleHide(true, element);

        if (sibling && sibling.hasAttribute("i-else")) {
            toggleHide(false, sibling);
        }

        element.removeAttribute("i-if");

        return;
    }

    toggleHide(false, element);

    if (sibling?.hasAttribute("i-else")) {
        toggleHide(true, sibling);
    }

    element.removeAttribute("i-if");
}

export const replaceBracesCode = (text: string, vm: VirtualMachine): string => {
    return text.replace(/{{(.*?)}}/g, (match) => {
        const evalutated = vm.runScriptSync(match);
        return `${evalutated}`;
    }).replace(/{{/g, "").replace(/}}/g, "");
}

export const parseBracesCode = async (element: Element, refThis: { [key: string] : any }, virtualMachine?: VirtualMachine): Promise<void> => {
    const vm = virtualMachine || new VirtualMachine();
    vm.initThis(refThis);
    
    for( let child of element.childNodes) {
        if (child.nodeType === 3) {
            const text = (child as Element).textContent;
            if (text?.includes("{{")) {
                (child as Element).textContent = replaceBracesCode(text, vm)
            }
        }
    };
}

export const parseCustomAttributes = async (element: Element, refThis: { [key: string] : any }, virtualMachine?: VirtualMachine): Promise<void> => {
    const custom = element.getAttribute("custom-attr");
    if (custom) {
        element.removeAttribute("custom-attr");

        const vm = virtualMachine || new VirtualMachine();
        vm.initThis(refThis);

        const evalutated = vm.runScriptSync(custom);

        if (typeof evalutated !== "string") throw new Error("Custom attribute must return a string");

        const attrName = evalutated.split("=")[0];
        let attrValue = "";

        if (attrName.length < evalutated.length) {
            attrValue = evalutated.split("=")[1].replace(/"/g, "");
        }

        element.setAttribute(attrName, attrValue);
    }
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

export const parseModelAttributes = async (element: Element, refThis: { [key: string] : any }, virtualMachine?: VirtualMachine): Promise<void> => {
    const modelAttr = element.getAttributeNames().find(attr => attr === "i-model");
    if (modelAttr) {
        const modelValue = element.getAttribute(modelAttr);
        element.removeAttribute(modelAttr);

        if (modelValue) {
            const vm = virtualMachine || new VirtualMachine();
            vm.initThis(refThis);
    
            const evalutated = vm.runScriptSync(modelValue);
    
            element.setAttribute("value", `${evalutated}`);

            element.addEventListener("input", (e) => {
                emitValue(e, modelAttr, modelValue, refThis);
            });

            element.addEventListener("change", (e) => {
                emitValue(e, modelAttr, modelValue, refThis);
            });
        }
    }
}

export const parseComputedAttributes = async (element: Element, refThis: { [key: string] : any }, virtualMachine?: VirtualMachine): Promise<void> => {
    const computedAttrs = element.getAttributeNames().filter(attr => attr.startsWith(":"));

    const vm = virtualMachine || new VirtualMachine();
    vm.initThis(refThis);

    for (let attr of computedAttrs) {
        const computed = element.getAttribute(attr);
        if (computed) {
            const computedValue = vm.runScriptSync(computed);
            element.setAttribute(attr.replace(":", ""), `${computedValue}`);
        }
        
        element.removeAttribute(attr);
    };
}

export const parseComputedEvents = async (element: Element, refThis: { [key: string] : any }, virtualMachine?: VirtualMachine): Promise<void> => {
    const computedEvents = element.getAttributeNames().filter(attr => attr.startsWith("@"));

    const vm = virtualMachine || new VirtualMachine();
    vm.initThis(refThis);

    for (let attr of computedEvents) {
        const computed = element.getAttribute(attr);
        if (computed) {
            const computedValue = vm.runScriptSync(computed);
            element.addEventListener(attr.replace("@", ""), computedValue);
        }

        element.removeAttribute(attr);
    };
}

export const parseAll = async (element: Element, refThis: { [key: string] : any }, virtualMachine?: VirtualMachine): Promise<void> => {
    await parseConditionalRendering(element, refThis, virtualMachine);

    await parseListRendering(element, refThis, virtualMachine);

    await parseCustomAttributes(element, refThis, virtualMachine);

    await parseComputedAttributes(element, refThis, virtualMachine);

    await parseModelAttributes(element, refThis, virtualMachine);

    await parseComputedEvents(element, refThis, virtualMachine);

    await parseBracesCode(element, refThis, virtualMachine);

    for (let child of element.childNodes) {
        if (child.nodeType === 1) {
            await parseAll(child as Element, refThis, virtualMachine);
        }
    };
}

export const parseComponents = async (element: Element, refThis: { [key: string] : any }, virtualMachine?: VirtualMachine): Promise<void> => {
    const components = refThis.components as Component[];

    for (let component of components) {
        const componentName = component.getName();
        const templateTagName = `${componentName.toLocaleLowerCase()}-component`;

        const componentElements = element.querySelectorAll(templateTagName);

        const vm = virtualMachine || new VirtualMachine();
        vm.initThis(refThis);

        // find props, validate them and pass them to the component
        for (let componentElement of componentElements) {
            const props = componentElement.getAttributeNames().filter(attr => !attr.startsWith("@") && !attr.startsWith("i-") && (attr !== "data-uuid"));

            let parsedProps: { [key: string]: any } = {};

            for (let prop of props) {
                const propValue = componentElement.getAttribute(prop);

                if (prop.startsWith(":")) {
                    const propName = prop.replace(":", "");
                    const propValueEvaluated = vm.runScriptSync(propValue || "true");
                    parsedProps[propName] = propValueEvaluated;
                } else {
                    parsedProps[prop] = propValue || true;
                }

                componentElement.removeAttribute(prop);
            }

            component.setProps(parsedProps);
            await component.createMainNode();

            const componentNode = component.getMainNode();
            console.log("componentNode", componentNode);

            componentElement.replaceWith(componentNode);
        }
    }
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