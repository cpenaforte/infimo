# Infimo
A minimalist JS lib for building reactive light-weight web apps.

## Importing
You can either import it via CDN or importing the NPM package.

### CDN
Put the following script tag inside your html file.
```
<script type="module" src="https://unpkg.com/infimo/_bundles/infimo.min.js"></script>
```

The *type="module"* is necessary for importing it in your project's main JS file.

### NPM package
Run the command `npm i infimo` in an existing npm project.

## Configuration
First, you need to create an element that will serve as an entry point in your html for building the Infimo app.
Something like `<div id="infimo"></div>` is perfect for it.

Then, in your JS file, if you are using the NPM package method, add `import Infimo from 'infimo';`.

### Building
To build Infimo in your page, follow the example below.
```
new Infimo({
    name: "Main",
    template: `
        <div>Hello world</div>
    `
}).build(this || {}, "#infimo");
```

_Note: if you are getting an error in console that says the Infimo package doesn't have a default export, try changing `Infimo` to `Infimo.default`_

## Infimo Object
That are 6 keys you may use in Infimo Object as well as 6 lifecycle hooks
### Main keys
1. **name**: The name of the component. Required and must always match the calls in the code.
2. **components**: an array of all components (utilizing the Component object) utilized in the template. Registering the components here is essential to ensure proper usage.
3. **props**: An object containing the definition of custom props that a component may receive. Much similar to Vue.js props. Types can be String, Number, Array, Object, Boolean or Function. The object associated to each key can describe if the prop is required or, if it's not the case, can describe a default value.
4. **data**: You need to set here all internal variables. The reactivity occurs when the state of one of this variables change. The value associated to this key needs to be an object. No restriction to variables values.
5. **watch**: Here functions can be set to follow data variables changes. There are two possible arguments for these functions, the first is the new value of the variable and the second is the old value of the same variable. The value associated to this key also needs to be an object and the keys inside of it need to have the same name of a data variable, no duplication allowed.
6. **methods**: This contains the main function that will define the behaviour of the app.
The keys can't have the name of an existing data variable.
7. **template**: A template string with the structure of your page. Code can be added inside tags using double brackets, computed attributes can be set using ':' at the beginning of the attribute name, conditional rendering can be set by using the attributes 'i-if' and 'i-else', list rendering can also be set by using 'i-for' and computed events can be set starting with '@' and then the name of the event.

### Lifecycle hooks
1. **beforeCreate**: Executed before parsing the *Infimo Object*. Non-render-blocking.
2. **created**: Executed before parsing the *Infimo Object*. Non-render-blocking.
3. **beforeMount**: Executed before render. May be render-blocking, depending on the function call itself.
4. **mounted**: Executed after render. May be render-blocking, depending on the function call itself.
5. **beforeUpdate** : Executed before updating the view. May be render-blocking, depending on the function call itself.
6. **updated**: Executed after updating the view. May be render-blocking, depending on the function call itself.

## Components
To create a Infimo Component, follow the example below.
```
export default Infimo.defineComponent({
    name: "Component", // you should put the same name as the imported file name
    template: `
        <div>Hello world</div>
    `
})
```

Check the _examples_ folder in this project to learn more of the features of Infimo.
