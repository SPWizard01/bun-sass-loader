
const importRegistry = new Map<string, string>();
export function registerStyleImport(key: string, bunurl: string) {
    importRegistry.set(key, bunurl);
};
export function getStyleImportRegistry() {
    return Array.from(importRegistry, ([key, value]) => ({ key, value }));
}
export function getImportFromStyleRegistry(key: string) {
    return importRegistry.get(key) ?? key;
}