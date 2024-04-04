import Ref from "./subclasses/Ref";
import VirtualMachine from "./subclasses/VirtualMachine";
import { AssociatedElement } from "./types";

export const getPropertyValue = (property: string, refThis: {[key:string]: any}): any => {
    const descriptor = Object.getOwnPropertyDescriptor(refThis, property);
    if (descriptor) {
        return descriptor.get? descriptor.get() : descriptor.value;
    }
}

export const updateRef = (refName: string, refs: Ref<any>[], refThis: {[key:string]: any}, value: any): void => {
    refThis[refName] = value;

    refs.find(ref => ref.getName().name === refName)?.setValue(value);
}

export const putUuid = async (element: Element, refs: Ref<any>[]): Promise<void> => {
    const uuid = Math.random().toString(36).substring(7);
    element.setAttribute("data-uuid", uuid);

    for (let ref of refs) {
        // verify if ref is contained in the match and put uuid into associatedElementsUuid
        const associatedElement: AssociatedElement = {
            uuid,
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

    for (let child of element.childNodes) {
        if (child.nodeType === 1) {
            await putUuid(child as Element, refs);
        }
    };
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

const emitValue = (event: Event, modelName: string, modelValue: string, refs: Ref<any>[], refThis: { [key: string] : any }): void => {
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
        updateRef(modelValue, refs, refThis, value);
    }
}

export const parseModelAttributes = async (element: Element, refs: Ref<any>[], refThis: { [key: string] : any }, virtualMachine?: VirtualMachine): Promise<void> => {
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
                emitValue(e, modelAttr, modelValue, refs, refThis);
            });

            element.addEventListener("change", (e) => {
                emitValue(e, modelAttr, modelValue, refs, refThis);
            });
        }
    }
}

export const parseComputedAttributes = async (element: Element, refThis: { [key: string] : any }, virtualMachine?: VirtualMachine): Promise<void> => {
    const computedAttrs = element.getAttributeNames().filter(attr => attr.startsWith("#"));

    const vm = virtualMachine || new VirtualMachine();
    vm.initThis(refThis);

    for (let attr of computedAttrs) {
        const computed = element.getAttribute(attr);
        if (computed) {
            const computedValue = vm.runScriptSync(computed);
            element.setAttribute(attr.replace("#", ""), `${computedValue}`);
        }
        
        element.removeAttribute(attr);
    };
}

export const parseComputedEvents = async (element: Element, refThis: { [key: string] : any }, virtualMachine?: VirtualMachine): Promise<void> => {
    const computedEvents = element.getAttributeNames().filter(attr => attr.startsWith("@"));

    const vm = virtualMachine || new VirtualMachine();;
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

export const parseAll = async (element: Element, refs: Ref<any>[], refThis: { [key: string] : any }, virtualMachine?: VirtualMachine): Promise<void> => {
    await parseCustomAttributes(element, refThis, virtualMachine);

    await parseComputedAttributes(element, refThis, virtualMachine);

    await parseModelAttributes(element, refs, refThis, virtualMachine);

    await parseComputedEvents(element, refThis, virtualMachine);

    await parseBracesCode(element, refThis, virtualMachine);

    for (let child of element.childNodes) {
        if (child.nodeType === 1) {
            await parseAll(child as Element, refs, refThis, virtualMachine);
        }
    };
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
            const docChild = docElement.querySelector(`[data-uuid="${(child as Element).getAttribute("data-uuid")}"]`);
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