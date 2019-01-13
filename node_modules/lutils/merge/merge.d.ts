export interface IObject {
    [key: string]: any;
}
export declare type IMergeTest = (params: {
    merge: Merge;
    obj1: object;
    obj2: object;
    isTraversal: boolean;
    key: string;
}) => boolean;
export interface IMerge {
    <T, S1, S2, S3, S4>(t: T, s1: S1, s2: S2, s3: S3, s4: S4): S4 & S3 & S2 & S1 & T;
    <T, S1, S2, S3>(t: T, s1: S1, s2: S2, s3: S3): S3 & S2 & S1 & T;
    <T, S1, S2>(t: T, s1: S1, s2: S2): S2 & S1 & T;
    <T, S1>(t: T, s1: S1): S1 & T;
}
export interface IMergeFn extends IMerge {
    black?: IMerge;
    white?: IMerge;
}
export interface IMergeTypes {
    object?: boolean;
    array?: boolean;
    function?: boolean;
    date?: boolean;
}
export declare class Merge {
    static White: typeof MergeWhite;
    static Black: typeof MergeBlack;
    depth: number;
    types: IMergeTypes;
    test: IMergeTest;
    traverseTargetKeys: boolean;
    private alwaysPass;
    private usingDefaultDepth;
    constructor(options?: {
        depth?: number;
        types?: {
            object: boolean;
            array: boolean;
            function: boolean;
        };
        test?: IMergeTest;
        traverseTargetKeys?: boolean;
    });
    /** Recursively merges `sources` objects into `subject` */
    merge: IMerge;
    private traverse(obj1, obj2, depth);
    private depthWarning();
}
export declare class MergeWhite extends Merge {
    test: IMergeTest;
    traverseTargetKeys: boolean;
    merge: <T>(target: T, ...s: object[]) => T;
}
export declare class MergeBlack extends Merge {
    test: IMergeTest;
}
export declare const merge: IMergeFn;
