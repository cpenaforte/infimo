(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("Infimo", [], factory);
	else if(typeof exports === 'object')
		exports["Infimo"] = factory();
	else
		root["Infimo"] = factory();
})(self, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/subclasses/NameRegister.ts":
/*!****************************************!*\
  !*** ./src/subclasses/NameRegister.ts ***!
  \****************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
class NameRegister {
    names;
    constructor() {
        this.names = [];
    }
    registerName(name, type) {
        if (this.nameExist(name)) {
            throw new Error(`Name ${name} already exists`);
        }
        const nameObj = { name, type };
        this.names.push(nameObj);
        return nameObj;
    }
    registerNames(names) {
        let nameExist = names.find(n => this.nameExist(n.name))?.name;
        if (nameExist) {
            throw new Error(`Name ${nameExist} already exists`);
        }
        this.names.push(...names);
    }
    nameExist(name) {
        return this.names.some(n => n.name === name);
    }
    getNames() {
        return this.names;
    }
}
exports["default"] = NameRegister;


/***/ }),

/***/ "./src/subclasses/Ref.ts":
/*!*******************************!*\
  !*** ./src/subclasses/Ref.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
class Ref {
    name;
    value;
    constructor(name, value) {
        this.name = name;
        this.value = value;
    }
    updateValue(value) {
        this.value = value;
    }
    getName() {
        return this.name;
    }
    getValue() {
        return this.value;
    }
}
exports["default"] = Ref;


/***/ }),

/***/ "./src/utils.ts":
/*!**********************!*\
  !*** ./src/utils.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.basicParamParse = void 0;
const basicParamParse = (p, refs) => {
    const ref = refs.find(r => r.getName().name === p);
    if (ref) {
        return ref.getValue();
    }
    if (!Number.isNaN(Number(p))) {
        return Number(p);
    }
    if (p === "true" || p === "false") {
        return p === "true";
    }
    if (p.startsWith("'") && p.endsWith("'")) {
        return p.replace(/'/g, "");
    }
    if (p.startsWith('"') && p.endsWith('"')) {
        return p.replace(/"/g, "");
    }
    if (p === "undefined") {
        return undefined;
    }
    if (p === "null") {
        return null;
    }
    if (p === "NaN") {
        return NaN;
    }
    if (p.includes("[") && p.includes("]")) {
        const array = p.replace("[", "").replace("]", "").split(",").map(a => {
            const trimmed = a.trim();
            return (0, exports.basicParamParse)(trimmed, refs);
        });
        return array;
    }
    if (p.includes("{") && p.includes("}")) {
        const obj = p.replace("{", "").replace("}", "").split(",").map(o => {
            const [key, value] = o.split(":").map(p => p.trim());
            return { [key]: (0, exports.basicParamParse)(value, refs) };
        });
        return obj;
    }
    return p;
};
exports.basicParamParse = basicParamParse;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
const NameRegister_1 = __webpack_require__(/*! ./subclasses/NameRegister */ "./src/subclasses/NameRegister.ts");
const Ref_1 = __webpack_require__(/*! ./subclasses/Ref */ "./src/subclasses/Ref.ts");
const utils_1 = __webpack_require__(/*! ./utils */ "./src/utils.ts");
class InfimoFactory {
    appId;
    template;
    listeners;
    refs;
    namesRegister;
    constructor(infimoObject) {
        this.template = infimoObject.template;
        this.listeners = {};
        this.refs = [];
        this.namesRegister = new NameRegister_1.default();
        this.data(infimoObject.data || {});
        this.watch(infimoObject.watch || {});
        this.methods(infimoObject.methods || {});
    }
    notifyListeners(name, newValue, oldValue) {
        if (this.listeners[name]) {
            this.listeners[name].forEach(listener => listener(newValue, oldValue));
        }
        this.appId && this.build(this.appId);
    }
    dataParse(data) {
        const [name, value] = data;
        const registeredName = this.namesRegister.registerName(name, "data");
        const dataRef = new Ref_1.default(registeredName, value);
        this.refs.push(dataRef);
        Object.defineProperties(this, {
            [name]: {
                get: () => dataRef.getValue(),
                set: (newValue) => {
                    const oldValue = dataRef.getValue();
                    dataRef.updateValue(newValue);
                    this.notifyListeners(name, newValue, oldValue);
                }
            }
        });
    }
    data(dataProp) {
        Object.entries(dataProp).forEach(data => this.dataParse(data));
    }
    watchParse(watch) {
        const [name, value] = watch;
        if (!this.namesRegister.nameExist(name)) {
            throw new Error(`Name ${name} does not exist`);
        }
        if (!this.listeners[name]) {
            this.listeners[name] = [];
        }
        this.listeners[name].push(value);
    }
    watch(watchProp) {
        Object.entries(watchProp).forEach(watch => this.watchParse(watch));
    }
    methodsParse(method) {
        const [name, value] = method;
        const registeredName = this.namesRegister.registerName(name, "methods");
        const methodRef = new Ref_1.default(registeredName, value);
        this.refs.push(methodRef);
        Object.defineProperty(this, name, methodRef.getValue());
    }
    methods(methodsProp) {
        Object.entries(methodsProp).forEach(method => this.methodsParse(method));
    }
    parseTemplate() {
        const intermediate = `${this.template}`;
        return intermediate.replace(/{{(.*?)}}/g, (match) => {
            let rebuiltString = match;
            this.refs.forEach(ref => {
                if (rebuiltString.includes(ref.getName().name)) {
                    if (typeof ref.getValue() === "function") {
                        const regex = new RegExp(`${ref.getName().name}\\((.*?)\\)`, "g");
                        const matched = rebuiltString.match(regex) || [];
                        const functionParams = matched.map((match) => {
                            const paramsNamesList = match.replace(`${ref.getName().name}(`, "").replace(")", "").split(",").map((p) => p.trim());
                            return paramsNamesList.map((p) => {
                                return (0, utils_1.basicParamParse)(p, this.refs);
                            });
                        });
                        rebuiltString = rebuiltString.replace(regex, ref.getValue()(...functionParams));
                    }
                    else {
                        rebuiltString = rebuiltString.replace(`${ref.getName().name}`, ref.getValue());
                    }
                }
            });
            return rebuiltString;
        }).replace(/{{/g, "").replace(/}}/g, "");
    }
    build(appId) {
        this.appId = appId;
        const parsedTemplate = this.parseTemplate();
        const step = document.createElement("div");
        step.innerHTML = parsedTemplate;
        const element = step.firstElementChild;
        if (element) {
            document.querySelector(this.appId)?.appendChild(element);
        }
    }
}
exports["default"] = InfimoFactory;

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=infimo.js.map