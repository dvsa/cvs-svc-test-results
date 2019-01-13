export interface ICloneTypes {
    object?: boolean;
    array?: boolean;
}
export declare class Clone {
    depth: number;
    types: ICloneTypes;
    private usingDefaultDepth;
    constructor(options?: {
        /** Limit by which cloning ends and references are maintained */
        depth?: number;
        /**
         * Determines clone behaviour for traversable types:
         * - When `true`, value is cloned and traversed
         * - When `false`, references are kept
         */
        types?: ICloneTypes;
    });
    /**
     * Clones an object by traversing over object-like values.
     * - Cloned: **Array**, **Object**
     * - Referenced: **Function**, **{}.\_\_proto\_\_**
     */
    clone: <S>(source: S) => S;
    private traverse(subject, source, depth);
    private skeletonize(value, type?);
    private depthWarning();
}
export declare const clone: <S>(source: S) => S;
