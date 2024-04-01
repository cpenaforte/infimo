import Ref from "./subclasses/Ref";

export const basicParamParse = (p: string, refs: Ref<any>[]): any => {
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
            return basicParamParse(trimmed, refs);
        });
        return array;
    }

    if (p.includes("{") && p.includes("}")) {
        const obj = p.replace("{", "").replace("}", "").split(",").map(o => {
            const [key, value] = o.split(":").map(p => p.trim());
            return { [key]: basicParamParse(value, refs) };
        });
        return obj;
    }

    return p;
}