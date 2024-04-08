import { InfimoObject } from '../types';
import Component from './Component';
import EventBus from './EventBus';

export default class VirtualDOM {
    private mainComponent: Component;

    constructor(infimoObject: InfimoObject, eventBus: EventBus) {
        this.mainComponent = new Component(infimoObject, eventBus);
    }

    public async createMainNode(): Promise<void> {
        await this.mainComponent.createMainNode();
    }

    public getMainNode(): Element {
        return this.mainComponent.getMainNode();
    }
}