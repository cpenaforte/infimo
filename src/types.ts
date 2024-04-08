import Component from "./subclasses/Component";

export const ArrayConstructor = (...items: any) => Array.of(...items);
export const ObjectConstructor = (value: any) => Object(value);
export const FunctionConstructor = (value: any) => Function(value);
export const StringConstructor = (value: any) => String(value);
export const NumberConstructor = (value: any) => Number(value);
export const BooleanConstructor = (value: any) => Boolean(value);
export const SymbolConstructor = (value: any) => Symbol(value);

export type TypeConstructor = (args: any) => StringConstructor | NumberConstructor | BooleanConstructor | FunctionConstructor | ObjectConstructor | ArrayConstructor;

export type TypeForProp = TypeConstructor | TypeConstructor[] | null;

export type Prop<T> = {
    type: TypeForProp,
    default?: T,
    required?: boolean,
    validator?: (value: T) => boolean,
    validatorMessage?: string
} | TypeForProp;

export type PropsProp = { [key: string]: Prop<any> };
export type DataProp = { [key: string]: any };
export type WatchProp = { [key: string]: (newValue?: any, oldValue?: any) => void };
export type MethodsProp = { [key: string]: Function };

export type InfimoObject = {
    name: string,
    components?: Component[],
    props?: PropsProp,
    data?: DataProp,
    watch?: WatchProp,
    methods?: MethodsProp,
    template: string,
};

export const enum PropType {
    PROPS = "props",
    DATA = "data",
    WATCH = "watch",
    METHODS = "methods"
};

export type RegisteredName = {name: string, type: PropType};

export type RegisteredNames = RegisteredName[];

export type Listeners = { [key: string]: ((newValue?: any, oldValue?: any) => void)[] };

export type AssociatedElement = {
    uuid: string,
    inTextContent: boolean,
    inAttrNames: string[],
};

export type RemovedElement = {
    el: Element,
    parent: Element | null,
    nextSibling: Element | null
};