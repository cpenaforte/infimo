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
    async mounted() {
        console.log("Button mounted"+this.message);
    },
    async updated() {
        console.log("Button updated"+this.message);
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
    async mounted() {
        this.btnList = ['ab','asd', 'sdadas', 'asdasd', 'sdasd'];
    },
    data: {
        message: "Hello World!",
        inputValue: "",
        pOpacity: 1,
        btnList: ['ab','asd','asdc']
    },
    watch: {
        inputValue(newValue, oldValue) {
            console.log("Input value changed from", oldValue, "to", newValue);
        }
    },
    methods: {
        logText(text) {
            return text;
        },
        blink(text) {
            console.log("called", text);
            this.pOpacity = 0;

            setTimeout(() => {
                this.pOpacity = 1;
            }, 1000);
        },
        clickedButton(arg) {
            console.log("Button clicked! "+arg);
            this.btnList.push("new");
            this.btnList = [...this.btnList];
            console.log(this.btnList);
        }
    },
    template: `
        <div>
            <h1>{{ inputValue ? inputValue : message  }}</h1>
            <label for="input">Type something</label>
            <input id="input" type="text" i-model="inputValue" />
            <p :style="(inputValue === 'green' ? 'color: green;' : 'color: red;') + \`opacity:\${pOpacity};\`">{{ logText(inputValue) }}</p>
            <button i-if="inputValue" type="button" @click="() =>blink('ok')">Blink</button>
            <button i-else type="button" @click="()=>blink('ok')" disabled>Disabled</button>
            <ul>
                <li>
                    <Button i-for="button in btnList" :btn-text="\`\${button + inputValue}\`" :btn-type="undefined" @showClick="clickedButton"></Button>
                </li>
            </ul>
            <ul>
                <li i-for="number in ['aba2','a23sd','as22dc']">{{ number + inputValue }}</li>
            </ul>
            <Button i-if="inputValue.length > 0" :btn-text="inputValue" :btn-type="inputValue" @showClick="clickedButton"></Button>
        </div>
    `
}).build(this || {}, "#app");