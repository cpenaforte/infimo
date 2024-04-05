import { InfimoObject } from "./types";
import Component from "./subclasses/Component";

import VirtualDOM from "./subclasses/VirtualDOM";

class InfimoFactory {
    private appId: string | undefined;
    private infimoObject : InfimoObject;

    constructor(infimoObject: InfimoObject) {
        this.infimoObject = infimoObject;
    }

    async build(appThis: {[key: string] : any}, appId: string): Promise<void> {
        this.appId = appId;

        const virtualDOM = new VirtualDOM(this.infimoObject);
        await virtualDOM.createMainNode();

        const mainNode = virtualDOM.getMainNode();

        const app = document.querySelector(this.appId);
        if (app) {
            app.parentElement?.replaceChild(mainNode, app);
        }

        Object.assign(appThis, this);
    }
}

export { Component };

export default InfimoFactory;