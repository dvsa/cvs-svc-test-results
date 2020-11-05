import "reflect-metadata";
import {Type} from "./GenericClassDecorator";

/**
 * The Injector stores services and resolves requested instances.
 */
export const Injector = new class {
    /**
     * Resolves instances by injecting required services
     * @param {Type<any>} target
     * @param {Type<any>} injections - optionally, you can override the expected injection with another one
     * @returns {T}
     */
    public resolve<T>(target: Type<any>, injections?: Array<Type<any>>): T {
        if (!injections) {
            // tokens are required dependencies, while injections are resolved tokens from the Injector
            const targetTokens = Reflect.getMetadata("design:paramtypes", target) || [];
            const targetInjections = targetTokens.map((token: any) => Injector.resolve<any>(token));

            return new target(...targetInjections);
        }

        const manualInjections: any = injections.map((token: any) => Injector.resolve<any>(token));
        return new target(...manualInjections);

    }
};
