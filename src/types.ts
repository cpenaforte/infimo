import Component from "./subclasses/Component";

export type DataProp = { [key: string]: any };
export type WatchProp = { [key: string]: (newValue?: any, oldValue?: any) => void };
export type MethodsProp = { [key: string]: Function };

export type InfimoObject = {
    name: string,
    components?: Component[],
    data?: DataProp,
    watch?: WatchProp,
    methods?: MethodsProp,
    template: string,
};

export const enum PropType {
    DATA = "data",
    WATCH = "watch",
    METHODS = "methods"
}

export type RegisteredName = {name: string, type: PropType};

export type RegisteredNames = RegisteredName[];

export type Listeners = { [key: string]: ((newValue?: any, oldValue?: any) => void)[] };

export type AssociatedElement = {
    uuid: string,
    inTextContent: boolean,
    inAttrNames: string[],
}
