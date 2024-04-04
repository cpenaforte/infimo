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
            <label for="inputValue">Type something</label>
            <input id="inputValue" type="text" i-model="inputValue" />
            <p #style="(inputValue === 'green' ? 'color: green;' : 'color: red;') + \`opacity:\${opacity};\`">{{ logText(inputValue) }}</p>
            <button type="button" @click="blink">Blink</button>
        </div>
    `
}).build(this || {}, "#app");