export default class EventBus {
    private listeners: { [key: string]: Function[] } = {};

    on(event: string, callback: Function, uuid: string) {
        const lowerCaseEvent = event.toLowerCase();
        const parsedEventName = uuid ? `${uuid}:${lowerCaseEvent}` : lowerCaseEvent;

        if (!this.listeners[parsedEventName]) {
            this.listeners[parsedEventName] = [];
        }

        if (this.listeners[parsedEventName].includes(callback)) {
            return;
        }

        this.listeners[parsedEventName].push(callback);
    }

    off(event: string, callback: Function, uuid: string) {
        const lowerCaseEvent = event.toLowerCase();
        const parsedEventName = uuid ? `${uuid}:${lowerCaseEvent}` : lowerCaseEvent;

        if (!this.listeners[parsedEventName]) {
            return;
        }

        this.listeners[parsedEventName] = this.listeners[parsedEventName].filter(listener => listener !== callback);
    }

    emit(event: string, uuid: string, ...args: any[]) {
        const lowerCaseEvent = event.toLowerCase();
        const parsedEventName = uuid ? `${uuid}:${lowerCaseEvent}` : lowerCaseEvent;

        if (!this.listeners[parsedEventName]) {
            return;
        }

        this.listeners[parsedEventName].forEach(listener => listener(...args));
    }

    offAll(uuid: string) {
        for (const key in this.listeners) {
            if (key.startsWith(`${uuid}:`)) {
                delete this.listeners[key];
            }
        }
    }
}