new Infimo.default({
    data: {
        message: "Hello World!",
        inputValue: "",
        opacity: 1
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
            this.opacity = 0;

            setTimeout(() => {
                this.opacity = 1;
            }, 1000);
        }
    },
    template: `
        <div>
            <h1>{{ message }}</h1>
            <label for="input">Type something</label>
            <input id="input" type="text" i-model="inputValue" />
            <p :style="(inputValue === 'green' ? 'color: green;' : 'color: red;') + \`opacity:\${opacity};\`">{{ logText(inputValue) }}</p>
            <button i-if="inputValue" type="button" @click="blink">Blink</button>
            <button i-else type="button" @click="blink" disabled>Disabled</button>
            <ul>
                <li i-for="number in [1,2,3]">{{ number + this.inputValue }}</li>
            </ul>
        </div>
    `
}).build(this || {}, "#app");