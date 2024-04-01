import { DataProp, InfimoObject } from "./types";
declare class InfimoFactory {
    private appId;
    private template;
    private listeners;
    private refs;
    private namesRegister;
    constructor(infimoObject: InfimoObject);
    private notifyListeners;
    private dataParse;
    data(dataProp: DataProp): void;
    private watchParse;
    watch(watchProp: {
        [key: string]: (newValue?: any, oldValue?: any) => void;
    }): void;
    private methodsParse;
    methods(methodsProp: {
        [key: string]: Function;
    }): void;
    private parseTemplate;
    build(appId: string): void;
}
export default InfimoFactory;
