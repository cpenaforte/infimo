const Button = new Infimo.Component({
    name: "Button",
    data: {
        message: "Click me!"
    },
    methods: {
        onClick() {
            console.log("Button clicked!");
        }
    },
    template: `
        <button type="button" @click="onClick">{{ message }}</button>
    `,
});


new Infimo.default({
    name: "HelloWorld",
    components: [
        Button
    ],
    data: {
        message: "Hello World!",
        inputValue: "",
        pOpacity: 1
    },
    watch: {
        inputValue(newValue, oldValue) {
            console.log("Input value changed from", oldValue, "to", newValue);
        }
    },
    methods: {
        logText(text) {
            console.log(text);

            return text;
        },
        blink() {
            console.log("called");
            this.pOpacity = 0;

            setTimeout(() => {
                this.pOpacity = 1;
            }, 1000);
        }
    },
    template: `
        <div>
            <h1>{{ inputValue ? inputValue : message  }}</h1>
            <label for="input">Type something</label>
            <input id="input" type="text" i-model="inputValue" />
            <p :style="(inputValue === 'green' ? 'color: green;' : 'color: red;') + \`opacity:\${pOpacity};\`">{{ logText(inputValue) }}</p>
            <button i-if="inputValue" type="button" @click="blink">Blink</button>
            <button i-else type="button" @click="blink" disabled>Disabled</button>
            <ul>
                <li i-for="number in [1,2,3]">{{ number + inputValue }}</li>
            </ul>
            <Button></Button>
        </div>
    `
}).build(this || {}, "#app");