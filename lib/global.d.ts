interface CallableFunction extends Function {
    // eslint-disable-next-line spellcheck/spell-checker
    call<T, A0, A extends any[], R>(this: (this: T, arg0: A0, ...args: A) => R, thisArg: T, arg0: A0, ...args: A): R;
}