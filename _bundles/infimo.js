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
/******/ 	var __webpack_modules__ = ({

/***/ "./src/main.ts":
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const NameRegister_1 = __importDefault(__webpack_require__(/*! ./subclasses/NameRegister */ "./src/subclasses/NameRegister.ts"));
const Ref_1 = __importDefault(__webpack_require__(/*! ./subclasses/Ref */ "./src/subclasses/Ref.ts"));
const VirtualMachine_1 = __importDefault(__webpack_require__(/*! ./subclasses/VirtualMachine */ "./src/subclasses/VirtualMachine.ts"));
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
        const refThis = this;
        const parsedFunction = (...args) => value.call(refThis, ...args);
        const registeredName = this.namesRegister.registerName(name, "methods");
        const methodRef = new Ref_1.default(registeredName, parsedFunction);
        this.refs.push(methodRef);
        Object.defineProperty(this, name, {
            get: () => methodRef.getValue()
        });
    }
    methods(methodsProp) {
        Object.entries(methodsProp).forEach(method => this.methodsParse(method));
    }
    parseTemplate() {
        const intermediate = `${this.template}`;
        const vm = new VirtualMachine_1.default();
        vm.initThis(this);
        return intermediate.replace(/{{(.*?)}}/g, (match) => {
            const evalutated = vm.runScriptSync(match);
            return `${evalutated}`;
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


/***/ }),

/***/ "./src/subclasses/NameRegister.ts":
/*!****************************************!*\
  !*** ./src/subclasses/NameRegister.ts ***!
  \****************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

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

"use strict";

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

/***/ "./src/subclasses/VirtualMachine.ts":
/*!******************************************!*\
  !*** ./src/subclasses/VirtualMachine.ts ***!
  \******************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const vm_1 = __importDefault(__webpack_require__(/*! vm */ "./node_modules/vm-browserify/index.js"));
class VirtualMachine {
    context;
    constructor() {
        this.context = {};
    }
    initThis(thisObj) {
        const descriptors = Object.getOwnPropertyDescriptors(thisObj);
        const parseDescriptors = Object.entries(descriptors).map(([key, value]) => {
            const newValue = value.get ? value.get() : value.value;
            console.log(newValue);
            return [key, newValue];
        });
        this.context = Object.fromEntries(parseDescriptors);
    }
    runScriptSync(script) {
        let result = null;
        try {
            result = new vm_1.default.Script(script).runInNewContext(this.context);
        }
        catch (e) {
            console.error(e);
        }
        finally {
            return result;
        }
    }
}
exports["default"] = VirtualMachine;


/***/ }),

/***/ "./node_modules/vm-browserify/index.js":
/*!*********************************************!*\
  !*** ./node_modules/vm-browserify/index.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, exports) => {

var indexOf = function (xs, item) {
    if (xs.indexOf) return xs.indexOf(item);
    else for (var i = 0; i < xs.length; i++) {
        if (xs[i] === item) return i;
    }
    return -1;
};
var Object_keys = function (obj) {
    if (Object.keys) return Object.keys(obj)
    else {
        var res = [];
        for (var key in obj) res.push(key)
        return res;
    }
};

var forEach = function (xs, fn) {
    if (xs.forEach) return xs.forEach(fn)
    else for (var i = 0; i < xs.length; i++) {
        fn(xs[i], i, xs);
    }
};

var defineProp = (function() {
    try {
        Object.defineProperty({}, '_', {});
        return function(obj, name, value) {
            Object.defineProperty(obj, name, {
                writable: true,
                enumerable: false,
                configurable: true,
                value: value
            })
        };
    } catch(e) {
        return function(obj, name, value) {
            obj[name] = value;
        };
    }
}());

var globals = ['Array', 'Boolean', 'Date', 'Error', 'EvalError', 'Function',
'Infinity', 'JSON', 'Math', 'NaN', 'Number', 'Object', 'RangeError',
'ReferenceError', 'RegExp', 'String', 'SyntaxError', 'TypeError', 'URIError',
'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent', 'escape',
'eval', 'isFinite', 'isNaN', 'parseFloat', 'parseInt', 'undefined', 'unescape'];

function Context() {}
Context.prototype = {};

var Script = exports.Script = function NodeScript (code) {
    if (!(this instanceof Script)) return new Script(code);
    this.code = code;
};

Script.prototype.runInContext = function (context) {
    if (!(context instanceof Context)) {
        throw new TypeError("needs a 'context' argument.");
    }
    
    var iframe = document.createElement('iframe');
    if (!iframe.style) iframe.style = {};
    iframe.style.display = 'none';
    
    document.body.appendChild(iframe);
    
    var win = iframe.contentWindow;
    var wEval = win.eval, wExecScript = win.execScript;

    if (!wEval && wExecScript) {
        // win.eval() magically appears when this is called in IE:
        wExecScript.call(win, 'null');
        wEval = win.eval;
    }
    
    forEach(Object_keys(context), function (key) {
        win[key] = context[key];
    });
    forEach(globals, function (key) {
        if (context[key]) {
            win[key] = context[key];
        }
    });
    
    var winKeys = Object_keys(win);

    var res = wEval.call(win, this.code);
    
    forEach(Object_keys(win), function (key) {
        // Avoid copying circular objects like `top` and `window` by only
        // updating existing context properties or new properties in the `win`
        // that was only introduced after the eval.
        if (key in context || indexOf(winKeys, key) === -1) {
            context[key] = win[key];
        }
    });

    forEach(globals, function (key) {
        if (!(key in context)) {
            defineProp(context, key, win[key]);
        }
    });
    
    document.body.removeChild(iframe);
    
    return res;
};

Script.prototype.runInThisContext = function () {
    return eval(this.code); // maybe...
};

Script.prototype.runInNewContext = function (context) {
    var ctx = Script.createContext(context);
    var res = this.runInContext(ctx);

    if (context) {
        forEach(Object_keys(ctx), function (key) {
            context[key] = ctx[key];
        });
    }

    return res;
};

forEach(Object_keys(Script.prototype), function (name) {
    exports[name] = Script[name] = function (code) {
        var s = Script(code);
        return s[name].apply(s, [].slice.call(arguments, 1));
    };
});

exports.isContext = function (context) {
    return context instanceof Context;
};

exports.createScript = function (code) {
    return exports.Script(code);
};

exports.createContext = Script.createContext = function (context) {
    var copy = new Context();
    if(typeof context === 'object') {
        forEach(Object_keys(context), function (key) {
            copy[key] = context[key];
        });
    }
    return copy;
};


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
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/main.ts");
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=infimo.js.map