export declare const routeRegex: RegExp;
export declare const validateRoute: (route: string) => false | "Route is required" | "Route should be at least two characters long" | "Route should not end in a forward slash" | "Route should start with a letter" | "Route should contain only letters, numbers, dashes, underscores, and forward slashes";
export declare const filterObject: (obj: any, arr: any[]) => any;
export declare const cloneDeep: (value: any) => any;
