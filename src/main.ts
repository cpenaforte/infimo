import { InfimoObject } from "./types";
import Component from "./subclasses/Component";

import VirtualDOM from "./subclasses/VirtualDOM";
import EventBus from "./subclasses/EventBus";

class InfimoFactory {
    private static EVENT_BUS: EventBus = new EventBus();
    private appId: string | undefined;
    private infimoObject : InfimoObject;

    constructor(infimoObject: InfimoObject) {
        this.infimoObject = infimoObject;
    }

    async build(appThis: {[key: string] : any}, appId: string): Promise<void> {
        this.appId = appId;

        const virtualDOM = new VirtualDOM(this.infimoObject, InfimoFactory.EVENT_BUS);
        await virtualDOM.createMainNode();

        const mainNode = virtualDOM.getMainNode();

        const app = document.querySelector(this.appId);
        if (app) {
            app.parentElement?.replaceChild(mainNode, app);
        }

        Object.assign(appThis, this);
    }

    public static defineComponent(infimoObject: InfimoObject): Component {
        return new Component(infimoObject, InfimoFactory.EVENT_BUS);
    }
}

export default InfimoFactory;