# Infimo
A minimal js reactive lib for small or SEO focused websites

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
To create an Infimo object and build it to your page, follow the example below.
```
new Infimo({
    template: `
        <div>Hello world</div>
    `
}).build(this || {}, "#infimo");
```

_Note: if you are getting an error in console that says the Infimo package doesn't have a default export, try changing `new Infimo` to `new Infimo.default`_

## Infimo Object
That are 4 keys you may use in Infimo Object.
1. **name**: the name of the component. Required always
2. **components**: an array of all components (use the object Component) used in the template. It is strictly necessary to register here the components you should use.
3. **data**: you need to set here all internal variables. The reactivity occurs when the state of one of this variables change. The value associated to this key needs to be an object. No restriction to variables values.
4. **watch**: here functions can be set to follow data variables changes. There are two possible arguments for these functions, the first is the new value of the variable and the second is the old value of the same variable. The value associated to this key also needs to be an object and the keys inside of it need to have the same name of a data variable, no duplication allowed.
5. **methods**: this contains the main function that will define the behaviour of the app.
The keys can't have the name of an existing data variable.
6. **template**: an template string with the structure of your page. Code can be added inside tags using double brackets, computed attributes can be set using ':' at the beginning of the attribute name, conditional rendering can be set by using the attributes 'i-if' and 'i-else', list rendering can also be set by using 'i-for' and computed events can be set starting with '@' and then the name of the event.

Check the _examples_ folder in this project to learn more of the features of Infimo.