import { InfimoObject } from '../types';
import Component from './Component';

export default class VirtualDOM {
    private mainComponent : Component;

    constructor(infimoObject: InfimoObject) {
        this.mainComponent = new Component(infimoObject);
    }

    public async createMainNode(): Promise<void> {
        await this.mainComponent.createMainNode();
    }

    public getMainNode(): Element {
        return this.mainComponent.getMainNode();
    }
}