export declare const routeRegex: RegExp;
export declare const systemRouteRegex: RegExp;
export declare const idGenerator: (length?: number) => string;
export declare const validateRoute: (route: string, system?: boolean) => false | "Route is required" | "System route should be at least three characters long" | "System route should start with an underscore" | "System route should end with a letter or a number" | "System route should contain only letters, numbers, dashes, underscores, and forward slashes" | "Route should be at least two characters long" | "Route should start with a letter" | "Route should end with a letter or a number" | "Route should contain only letters, numbers, dashes, underscores, and forward slashes" | "Sub-routes should start with a letter" | "Sub-routes should end with a letter or a number" | "Sub-routes should be at least two characters long";
export declare const filterObject: (obj: any, arr: any[]) => any;
