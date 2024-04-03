new Infimo.default({
    data: {
        message: "Hello World!",
        inputValue: ""
    },
    watch: {
        inputValue: function(newValue, oldValue) {
            console.log("Input value changed from", oldValue, "to", newValue);
        }
    },
    methods: {
        logText: function(text) {
            console.log(text);

            return text;
        }
    },
    template: `
        <div>
            <h1>{{ message }}</h1>
            <input type="text" i-model="inputValue" />
            <p #style="inputValue === 'green' ? 'color: green;' : 'color: red;'">{{ logText(inputValue) }}</p>
        </div>
    `
}).build(this || {}, "#app");