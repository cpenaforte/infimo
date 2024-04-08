const Button = Infimo.default.defineComponent({
    name: "Button",
    props: {
        btnText: {
            type: String,
            default: "Button text"
        },
        btnType: {
            type: String,
            default: "button"
        },
    },
    data: {
        message: "Click me!"
    },
    methods: {
        onClick() {
            this.emit("showClick", this.btnText);
        }
    },
    template: `
        <button type="button" @click="onClick">button: {{ btnText }}</button>
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
        },
        clickedButton(arg) {
            console.log("Button clicked! "+arg);
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
                <li i-for="number in ['ab','asd','asdc']">{{ number + inputValue }}</li>
            </ul>
            <ul>
                <li i-for="number in ['aba2','a23sd','as22dc']">{{ number + inputValue }}</li>
            </ul>
            <Button :btn-text="inputValue" :btn-type="inputValue" @showClick="clickedButton"></Button>
        </div>
    `
}).build(this || {}, "#app");