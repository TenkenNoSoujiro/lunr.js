/**
 * lunr - http://lunrjs.com - A bit like Solr, but much smaller and not as bright - 2.3.5
 * Copyright (C) 2019 Oliver Nightingale
 * @license MIT
 */

/**
 * A convenience function for configuring and constructing
 * a new lunr Index.
 *
 * A lunr.Builder instance is created and the pipeline setup
 * with a trimmer, stop word filter and stemmer.
 *
 * This builder object is yielded to the configuration function
 * that is passed as a parameter, allowing the list of fields
 * and other builder parameters to be customised.
 *
 * All documents _must_ be added within the passed config function.
 *
 * @example
 * var idx = lunr(function () {
 *   this.field('title')
 *   this.field('body')
 *   this.ref('id')
 *
 *   documents.forEach(function (doc) {
 *     this.add(doc)
 *   }, this)
 * })
 *
 * @see {@link lunr.Builder}
 * @see {@link lunr.Pipeline}
 * @see {@link lunr.trimmer}
 * @see {@link lunr.stopWordFilter}
 * @see {@link lunr.stemmer}
 * @namespace {function} lunr
 * @param {function(this:lunr.Builder, lunr.Builder)} config
 */
declare function lunr(config: (this: lunr.Builder, builder: lunr.Builder) => void): lunr.Index;
declare namespace lunr {
    const version = "2.3.5";
}
/*!
 * lunr.utils
 * Copyright (C) 2019 Oliver Nightingale
 */
/**
 * A namespace containing utils for the rest of the lunr library
 * @namespace lunr.utils
 */
declare namespace lunr {
    namespace utils {
        /**
         * Print a warning message to the console.
         *
         * @alias warn
         * @memberOf lunr.utils
         * @static
         * @function
         * @param {String} message The message to be printed.
         */
        const warn: (message: string, ...unused: any[]) => void;
        /**
         * Convert an object to a string.
         *
         * In the case of `null` and `undefined` the function returns
         * the empty string, in all other cases the result of calling
         * `toString` on the passed object is returned.
         *
         * @alias asString
         * @memberOf lunr.utils
         * @static
         * @function
         * @param {*} obj The object to convert to a string.
         * @return {String} string representation of the passed object.
         */
        const asString: (obj: any) => any;
        /**
         * Clones an object.
         *
         * Will create a copy of an existing object such that any mutations
         * on the copy cannot affect the original.
         *
         * Only shallow objects are supported, passing a nested object to this
         * function will cause a TypeError.
         *
         * Objects with primitives, and arrays of primitives are supported.
         *
         * @private
         * @param {Object} obj The object to clone.
         * @return {Object} a clone of the passed object.
         * @throws {TypeError} when a nested object is passed.
         * @memberOf lunr.utils
         */
        const clone: <T extends object & Record<string, any>>(obj: T) => T;
        const identity: <T>(x: T) => T;
        const compare: <T>(a: T, b: T) => 1 | 0 | -1;
        const compareNumbers: (a: number, b: number) => number;
        const enum Bias {
            TWOS_COMPLEMENT = 0,
            LEAST_UPPER_BOUND = 1,
            GREATEST_LOWER_BOUND = 2
        }
        const binarySearch: <T>(array: T[], value: T, comparer?: (a: T, b: T) => number, step?: number | undefined, bias?: Bias | undefined) => number;
        const binarySearchKey: <T, K>(array: T[], key: K, keySelector: (v: T) => K, comparer: (a: K, b: K) => number, step?: number, bias?: Bias) => number;
    }
}
declare namespace lunr {
    class FieldRef {
        static readonly joiner = "/";
        docRef: any;
        fieldName: string;
        private _stringValue?;
        constructor(docRef: any, fieldName: string, stringValue?: string);
        toString(): string;
        /**
         * @param {string} s
         */
        static fromString(s: string): FieldRef;
    }
}
/*!
 * Set
 * Copyright (C) 2019 Oliver Nightingale
 */
declare namespace lunr {
    /**
     * A lunr set.
     *
     * @memberOf lunr
     */
    class Set {
        /**
         * A complete set that contains all elements.
         * @type {lunr.Set}
         */
        static readonly complete: Set;
        /**
         * An empty set that contains no elements.
         * @type {lunr.Set}
         */
        static readonly empty: Set;
        private elements;
        private length;
        /**
         * @param {string[]} [elements] The elements of the set.
         */
        constructor(elements?: string[]);
        /**
         * Returns true if this set contains the specified object.
         *
         * @param {string} object Object whose presence in this set is to be tested.
         * @returns {boolean} True if this set contains the specified object.
         */
        contains(object: string): boolean;
        /**
         * Returns a new set containing only the elements that are present in both
         * this set and the specified set.
         *
         * @param {lunr.Set} [other] set to intersect with this set.
         * @returns {lunr.Set} a new set that is the intersection of this and the specified set.
         */
        intersect(other: Set): Set;
        /**
         * Returns a new set combining the elements of this and the specified set.
         *
         * @param {lunr.Set} other set to union with this set.
         * @return {lunr.Set} a new set that is the union of this and the specified set.
         */
        union(other: Set): Set;
    }
}
declare namespace lunr {
    /**
     * A function to calculate the inverse document frequency for
     * a posting. This is shared between the builder and the index
     *
     * @private
     * @param {object} posting - The posting for a given term
     * @param {number} documentCount - The total number of documents.
     */
    const idf: (posting: Index.InvertedIndex.Posting, documentCount: number) => number;
}
declare namespace lunr {
    /**
     * A token wraps a string representation of a token
     * as it is passed through the text processing pipeline.
     *
     * @memberOf lunr
     * @property {string} str The string token being wrapped.
     * @property {Object<string, any>} metadata Metadata associated with this token.
     */
    class Token {
        str: string;
        metadata: Record<string, any>;
        /**
         * @param {string} [str] The string token being wrapped.
         * @param {Object<string, any>} [metadata] Metadata associated with this token.
         */
        constructor(str?: string, metadata?: Record<string, any>);
        /**
         * Returns the token string that is being wrapped by this object.
         * @returns {string}
         */
        toString(): string;
        /**
         * Applies the given function to the wrapped string token.
         *
         * @example
         * token.update(function (str, metadata) {
         *   return str.toUpperCase()
         * })
         *
         * @param {lunr.Token~updateFunction} fn A function to apply to the token string.
         * @returns {lunr.Token}
         */
        update(fn: Token.updateFunction): Token;
        /**
         * Creates a clone of this token. Optionally a function can be
         * applied to the cloned token.
         *
         * @param {lunr.Token~updateFunction} fn - An optional function to apply to the cloned token.
         * @returns {lunr.Token}
         */
        clone(fn?: Token.updateFunction): Token;
    }
    namespace Token {
        /**
         * A token update function is used when updating or optionally
         * when cloning a token.
         */
        type updateFunction = 
        /**
         * @param str The string representation of the token.
         * @param metadata All metadata associated with this token.
         */
        (str: string, metadata: Record<string, any>) => string;
    }
}
/**
 * A token update function is used when updating or optionally
 * when cloning a token.
 *
 * @callback lunr.Token~updateFunction
 * @param {string} str The string representation of the token.
 * @param {Object<string, any>} metadata All metadata associated with this token.
 * @returns {string}
 */
/*!
 * lunr.tokenizer
 * Copyright (C) 2019 Oliver Nightingale
 */
declare namespace lunr {
    /**
     * A function for splitting a string into tokens ready to be inserted into
     * the search index. Uses `lunr.tokenizer.separator` to split strings, change
     * the value of this property to change how strings are split into tokens.
     *
     * This tokenizer will convert its parameter to a string by calling `toString` and
     * then will split this string on the character in `lunr.tokenizer.separator`.
     * Arrays will have their elements converted to strings and wrapped in a lunr.Token.
     *
     * Optional metadata can be passed to the tokenizer, this metadata will be cloned and
     * added as metadata to every token that is created from the object to be tokenized.
     *
     * @param {string|object|object[]} [obj] The object to convert into tokens
     * @param {Object<string,*>} [metadata] Optional metadata to associate with every token
     * @returns {string[]}
     * @see {@link lunr.Pipeline}
     */
    const tokenizer: {
        (obj: string | object | object[] | undefined, metadata: Record<string, any>): Token[];
        /**
         * The separator used to split a string into tokens. Override this property to change the behaviour of
         * `lunr.tokenizer` behaviour when tokenizing strings. By default this splits on whitespace and hyphens.
         *
         * @see {@link lunr.tokenizer}
         */
        separator: RegExp;
    };
}
/*!
 * lunr.Pipeline
 * Copyright (C) 2019 Oliver Nightingale
 */
declare namespace lunr {
    /**
     * A pipeline function maps lunr.Token to lunr.Token. A lunr.Token contains the token
     * string as well as all known metadata. A pipeline function can mutate the token string
     * or mutate (or add) metadata for a given token.
     *
     * A pipeline function can indicate that the passed token should be discarded by returning
     * null. This token will not be passed to any downstream pipeline functions and will not be
     * added to the index.
     *
     * Multiple tokens can be returned by returning an array of tokens. Each token will be passed
     * to any downstream pipeline functions and all will returned tokens will be added to the index.
     *
     * Any number of pipeline functions may be chained together using a lunr.Pipeline.
     *
     * @interface lunr.PipelineFunction
     * @param {lunr.Token} token - A token from the document being processed.
     * @param {number} i - The index of this token in the complete list of tokens for this document/field.
     * @param {lunr.Token[]} tokens - All tokens for this document/field.
     * @returns {(?lunr.Token|lunr.Token[])}
     */
    /**
     * lunr.Pipelines maintain an ordered list of functions to be applied to all
     * tokens in documents entering the search index and queries being ran against
     * the index.
     *
     * An instance of lunr.Index created with the lunr shortcut will contain a
     * pipeline with a stop word filter and an English language stemmer. Extra
     * functions can be added before or after either of these functions or these
     * default functions can be removed.
     *
     * When run the pipeline will call each function in turn, passing a token, the
     * index of that token in the original list of all tokens and finally a list of
     * all the original tokens.
     *
     * The output of functions in the pipeline will be passed to the next function
     * in the pipeline. To exclude a token from entering the index the function
     * should return undefined, the rest of the pipeline will not be called with
     * this token.
     *
     * For serialisation of pipelines to work, all functions used in an instance of
     * a pipeline should be registered with lunr.Pipeline. Registered functions can
     * then be loaded. If trying to load a serialised pipeline that uses functions
     * that are not registered an error will be thrown.
     *
     * If not planning on serialising the pipeline then registering pipeline functions
     * is not necessary.
     *
     * @memberOf lunr
     */
    class Pipeline {
        static readonly registeredFunctions: Record<string, lunr.PipelineFunction>;
        _stack: lunr.PipelineFunction[];
        constructor();
        /**
         * Register a function with the pipeline.
         *
         * Functions that are used in the pipeline should be registered if the pipeline
         * needs to be serialised, or a serialised pipeline needs to be loaded.
         *
         * Registering a function does not add it to a pipeline, functions must still be
         * added to instances of the pipeline for them to be used when running a pipeline.
         *
         * @param {lunr.PipelineFunction} fn The function to check for.
         * @param {string} label The label to register this function with
         */
        static registerFunction(fn: lunr.PipelineFunction, label: string): void;
        /**
         * Warns if the function is not registered as a Pipeline function.
         *
         * @private
         * @param {lunr.PipelineFunction} fn The function to check for.
         */
        static warnIfFunctionNotRegistered(fn: lunr.PipelineFunction): void;
        /**
         * Loads a previously serialised pipeline.
         *
         * All functions to be loaded must already be registered with lunr.Pipeline.
         * If any function from the serialised data has not been registered then an
         * error will be thrown.
         *
         * @param {string[]} serialised - The serialised pipeline to load.
         * @returns {lunr.Pipeline}
         */
        static load(serialised: string[]): lunr.Pipeline;
        /**
         * Adds new functions to the end of the pipeline.
         *
         * Logs a warning if the function has not been registered.
         *
         * @param {...lunr.PipelineFunction} functions Any number of functions to add to the pipeline.
         */
        add(...functions: lunr.PipelineFunction[]): void;
        /**
         * Adds a single function after a function that already exists in the
         * pipeline.
         *
         * Logs a warning if the function has not been registered.
         *
         * @param {lunr.PipelineFunction} existingFn A function that already exists in the pipeline.
         * @param {lunr.PipelineFunction} newFn The new function to add to the pipeline.
         */
        after(existingFn: lunr.PipelineFunction, newFn: lunr.PipelineFunction): void;
        /**
         * Adds a single function before a function that already exists in the
         * pipeline.
         *
         * Logs a warning if the function has not been registered.
         *
         * @param {lunr.PipelineFunction} existingFn A function that already exists in the pipeline.
         * @param {lunr.PipelineFunction} newFn The new function to add to the pipeline.
         */
        before(existingFn: lunr.PipelineFunction, newFn: lunr.PipelineFunction): void;
        /**
         * Removes a function from the pipeline.
         *
         * @param {lunr.PipelineFunction} fn The function to remove from the pipeline.
         */
        remove(fn: lunr.PipelineFunction): void;
        /**
         * Runs the current list of functions that make up the pipeline against the
         * passed tokens.
         *
         * @param {lunr.Token[]} tokens The tokens to run through the pipeline.
         */
        run(tokens: lunr.Token[]): lunr.Token[];
        /**
         * Convenience method for passing a string through a pipeline and getting
         * strings out. This method takes care of wrapping the passed string in a
         * token and mapping the resulting tokens back to strings.
         *
         * @param {string} str The string to pass through the pipeline.
         * @param {Object<string, *>} metadata Optional metadata to associate with the token
         * passed to the pipeline.
         */
        runString(str: string, metadata?: Record<string, any>): string[];
        /**
         * Resets the pipeline by removing any existing processors.
         *
         */
        reset(): void;
        /**
         * Returns a representation of the pipeline ready for serialisation.
         *
         * Logs a warning if the function has not been registered.
         */
        toJSON(): string[];
    }
    /**
     * A pipeline function maps lunr.Token to lunr.Token. A lunr.Token contains the token
     * string as well as all known metadata. A pipeline function can mutate the token string
     * or mutate (or add) metadata for a given token.
     *
     * A pipeline function can indicate that the passed token should be discarded by returning
     * null. This token will not be passed to any downstream pipeline functions and will not be
     * added to the index.
     *
     * Multiple tokens can be returned by returning an array of tokens. Each token will be passed
     * to any downstream pipeline functions and all will returned tokens will be added to the index.
     *
     * Any number of pipeline functions may be chained together using a lunr.Pipeline.
     */
    interface PipelineFunction {
        /**
         * @param token A token from the document being processed.
         * @param i The index of this token in the complete list of tokens for this document/field.
         * @param tokens All tokens for this document/field.
         */
        (token: lunr.Token, i: number, tokens: lunr.Token[]): lunr.Token | lunr.Token[] | undefined;
        label?: string;
    }
}
/*!
 * lunr.Vector
 * Copyright (C) 2019 Oliver Nightingale
 */
declare namespace lunr {
    /**
     * A vector is used to construct the vector space of documents and queries. These
     * vectors support operations to determine the similarity between two documents or
     * a document and a query.
     *
     * Normally no parameters are required for initializing a vector, but in the case of
     * loading a previously dumped vector the raw elements can be provided to the constructor.
     *
     * For performance reasons vectors are implemented with a flat array, where an elements
     * index is immediately followed by its value. E.g. [index, value, index, value]. This
     * allows the underlying array to be as sparse as possible and still offer decent
     * performance when being used for vector calculations.
     *
     * @memberOf lunr
     */
    class Vector {
        elements: number[];
        private _magnitude;
        /**
         * @param {number[]} elements The flat list of element index and element value pairs.
         */
        constructor(elements?: number[]);
        /**
         * Calculates the position within the vector to insert a given index.
         *
         * This is used internally by insert and upsert. If there are duplicate indexes then
         * the position is returned as if the value for that index were to be updated, but it
         * is the callers responsibility to check whether there is a duplicate at that index
         *
         * @param {number} index The index at which the element should be inserted.
         * @returns {number}
         */
        positionForIndex(index: number): number;
        /**
         * Inserts an element at an index within the vector.
         *
         * Does not allow duplicates, will throw an error if there is already an entry
         * for this index.
         *
         * @param {number} insertIdx The index at which the element should be inserted.
         * @param {number} val The value to be inserted into the vector.
         */
        insert(insertIdx: number, val: number): void;
        /**
         * Inserts or updates an existing index within the vector.
         *
         * @param {number} insertIdx - The index at which the element should be inserted.
         * @param {number} val - The value to be inserted into the vector.
         * @param {function(number, number): number} fn - A function that is called for updates, the existing value and the
         * requested value are passed as arguments
         */
        upsert(insertIdx: number, val: number, fn: (a: number, b: number) => number): void;
        /**
         * Calculates the magnitude of this vector.
         *
         * @returns {number}
         */
        magnitude(): number;
        /**
         * Calculates the dot product of this vector and another vector.
         *
         * @param {lunr.Vector} otherVector - The vector to compute the dot product with.
         * @returns {number}
         */
        dot(otherVector: lunr.Vector): number;
        /**
         * Calculates the similarity between this vector and another vector.
         *
         * @param {lunr.Vector} otherVector - The other vector to calculate the
         * similarity with.
         * @returns {number}
         */
        similarity(otherVector: lunr.Vector): number;
        /**
         * Converts the vector to an array of the elements within the vector.
         *
         * @returns {number[]}
         */
        toArray(): any[];
        /**
         * A JSON serializable representation of the vector.
         *
         * @returns {number[]}
         */
        toJSON(): number[];
    }
}
/*!
 * lunr.stemmer
 * Copyright (C) 2019 Oliver Nightingale
 * Includes code from - http://tartarus.org/~martin/PorterStemmer/js.txt
 */
declare namespace lunr {
    /**
     * lunr.stemmer is an english language stemmer, this is a JavaScript
     * implementation of the PorterStemmer taken from http://tartarus.org/~martin
     *
     * @static
     * @implements {lunr.PipelineFunction}
     * @param {lunr.Token} token - The string to stem
     * @returns {lunr.Token}
     * @see {@link lunr.Pipeline}
     * @function
     */
    const stemmer: PipelineFunction;
}
/*!
 * lunr.stopWordFilter
 * Copyright (C) 2019 Oliver Nightingale
 */
declare namespace lunr {
    /**
     * lunr.generateStopWordFilter builds a stopWordFilter function from the provided
     * list of stop words.
     *
     * The built in lunr.stopWordFilter is built using this generator and can be used
     * to generate custom stopWordFilters for applications or non English languages.
     *
     * @param {string[]} stopWords The token to pass through the filter
     * @returns {lunr.PipelineFunction}
     * @see lunr.Pipeline
     * @see lunr.stopWordFilter
     */
    const generateStopWordFilter: (stopWords: string[]) => PipelineFunction;
    /**
     * lunr.stopWordFilter is an English language stop word list filter, any words
     * contained in the list will not be passed through the filter.
     *
     * This is intended to be used in the Pipeline. If the token does not pass the
     * filter then undefined will be returned.
     *
     * @static
     * @implements {lunr.PipelineFunction}
     * @param {lunr.Token} token - A token to check for being a stop word.
     * @returns {lunr.Token}
     * @see {@link lunr.Pipeline}
     * @function
     */
    const stopWordFilter: PipelineFunction;
}
/*!
 * lunr.trimmer
 * Copyright (C) 2019 Oliver Nightingale
 */
declare namespace lunr {
    /**
     * lunr.trimmer is a pipeline function for trimming non word
     * characters from the beginning and end of tokens before they
     * enter the index.
     *
     * This implementation may not work correctly for non latin
     * characters and should either be removed or adapted for use
     * with languages with non-latin characters.
     *
     * @static
     * @implements {lunr.PipelineFunction}
     * @param {lunr.Token} token The token to pass through the filter
     * @returns {lunr.Token}
     * @see lunr.Pipeline
     */
    const trimmer: (token: Token) => Token;
}
/*!
 * TokenSet
 * Copyright (C) 2019 Oliver Nightingale
 */
declare namespace lunr {
    /**
     * A token set is used to store the unique list of all tokens
     * within an index. Token sets are also used to represent an
     * incoming query to the index, this query token set and index
     * token set are then intersected to find which tokens to look
     * up in the inverted index.
     *
     * A token set can hold multiple tokens, as in the case of the
     * index token set, or it can hold a single token as in the
     * case of a simple query token set.
     *
     * Additionally token sets are used to perform wildcard matching.
     * Leading, contained and trailing wildcards are supported, and
     * from this edit distance matching can also be provided.
     *
     * Token sets are implemented as a minimal finite state automata,
     * where both common prefixes and suffixes are shared between tokens.
     * This helps to reduce the space used for storing the token set.
     *
     * @memberOf lunr
     */
    class TokenSet {
        /**
         * Keeps track of the next, auto increment, identifier to assign
         * to a new tokenSet.
         *
         * TokenSets require a unique identifier to be correctly minimised.
         *
         * @private
         */
        private static _nextId;
        final: boolean;
        edges: Record<string, TokenSet>;
        id: number;
        /** @internal */
        _str?: string;
        constructor();
        /**
         * Converts this TokenSet into an array of strings
         * contained within the TokenSet.
         *
         * @returns {string[]}
         */
        toArray(): string[];
        /**
         * Generates a string representation of a TokenSet.
         *
         * This is intended to allow TokenSets to be used as keys
         * in objects, largely to aid the construction and minimisation
         * of a TokenSet. As such it is not designed to be a human
         * friendly representation of the TokenSet.
         *
         * @returns {string}
         */
        toString(): string;
        /**
         * Returns a new TokenSet that is the intersection of
         * this TokenSet and the passed TokenSet.
         *
         * This intersection will take into account any wildcards
         * contained within the TokenSet.
         *
         * @param {lunr.TokenSet} b An other TokenSet to intersect with.
         * @returns {lunr.TokenSet}
         */
        intersect(b: TokenSet): TokenSet;
        /**
         * Creates a TokenSet instance from the given sorted array of words.
         *
         * @param {string[]} arr A sorted array of strings to create the set from.
         * @returns {lunr.TokenSet}
         * @throws Will throw an error if the input array is not sorted.
         */
        static fromArray(arr: string[]): TokenSet;
        /**
         * Creates a token set from a query clause.
         *
         * @private
         * @param {lunr.Query~Clause} clause A single clause from lunr.Query.
         * @returns {lunr.TokenSet}
         */
        static fromClause(clause: Query.Clause): TokenSet;
        /**
         * Creates a token set representing a single string with a specified
         * edit distance.
         *
         * Insertions, deletions, substitutions and transpositions are each
         * treated as an edit distance of 1.
         *
         * Increasing the allowed edit distance will have a dramatic impact
         * on the performance of both creating and intersecting these TokenSets.
         * It is advised to keep the edit distance less than 3.
         *
         * @param {string} str The string to create the token set from.
         * @param {number} editDistance The allowed edit distance to match.
         * @returns {lunr.TokenSet}
         */
        static fromFuzzyString(str: string, editDistance: number): TokenSet;
        /**
         * Creates a TokenSet from a string.
         *
         * The string may contain one or more wildcard characters (*)
         * that will allow wildcard matching when intersecting with
         * another TokenSet.
         *
         * @param {string} str The string to create a TokenSet from.
         * @returns {lunr.TokenSet}
         */
        static fromString(str: string): TokenSet;
    }
}
declare namespace lunr.TokenSet {
    class Builder {
        root: TokenSet;
        private previousWord;
        private uncheckedNodes;
        private minimizedNodes;
        constructor();
        insert(word: string): void;
        finish(): void;
        minimize(downTo: number): void;
    }
}
declare namespace lunr {
    /**
     * @memberOf lunr
     */
    class NumberMap {
        entries: NumberMap.Entry[];
        constructor(entries: NumberMap.Entry[]);
        matchComparator(comparator: lunr.Query.comparator, comparand: number): TokenSet;
        matchRange(start: "*" | number, end: "*" | number): TokenSet;
        private collectTokens;
        private static selectValue;
        private binarySearch;
        static fromInvertedIndex(invertedIndex: lunr.Index.InvertedIndex): NumberMap;
    }
    namespace NumberMap {
        interface Entry {
            value: number;
            tokens: string[];
        }
    }
}
declare namespace lunr.NumberMap {
    class Builder {
        private map;
        constructor();
        add(value: number, token: string): void;
        build(): NumberMap;
        private static compareEntries;
    }
}
/*!
 * lunr.Index
 * Copyright (C) 2019 Oliver Nightingale
 */
declare namespace lunr {
    /**
     * A query builder callback provides a query object to be used to express
     * the query to perform on the index.
     *
     * @callback lunr.Index~queryBuilder
     * @param {lunr.Query} query - The query object to build up.
     * @this lunr.Query
     */
    /**
     * A result contains details of a document matching a search query.
     * @typedef {object} lunr.Index~Result
     * @property {string} ref - The reference of the document this result represents.
     * @property {number} score - A number between 0 and 1 representing how similar this document is to the query.
     * @property {lunr.MatchData} matchData - Contains metadata about this match including which term(s) caused the match.
     */
    /**
     * Although lunr provides the ability to create queries using lunr.Query, it also provides a simple
     * query language which itself is parsed into an instance of lunr.Query.
     *
     * For programmatically building queries it is advised to directly use lunr.Query, the query language
     * is best used for human entered text rather than program generated text.
     *
     * At its simplest queries can just be a single term, e.g. `hello`, multiple terms are also supported
     * and will be combined with OR, e.g `hello world` will match documents that contain either 'hello'
     * or 'world', though those that contain both will rank higher in the results.
     *
     * Wildcards can be included in terms to match one or more unspecified characters, these wildcards can
     * be inserted anywhere within the term, and more than one wildcard can exist in a single term. Adding
     * wildcards will increase the number of documents that will be found but can also have a negative
     * impact on query performance, especially with wildcards at the beginning of a term.
     *
     * Terms can be restricted to specific fields, e.g. `title:hello`, only documents with the term
     * hello in the title field will match this query. Using a field not present in the index will lead
     * to an error being thrown.
     *
     * Modifiers can also be added to terms, lunr supports edit distance and boost modifiers on terms. A term
     * boost will make documents matching that term score higher, e.g. `foo^5`. Edit distance is also supported
     * to provide fuzzy matching, e.g. 'hello~2' will match documents with hello with an edit distance of 2.
     * Avoid large values for edit distance to improve query performance.
     *
     * Each term also supports a presence modifier. By default a term's presence in document is optional, however
     * this can be changed to either required or prohibited. For a term's presence to be required in a document the
     * term should be prefixed with a '+', e.g. `+foo bar` is a search for documents that must contain 'foo' and
     * optionally contain 'bar'. Conversely a leading '-' sets the terms presence to prohibited, i.e. it must not
     * appear in a document, e.g. `-foo bar` is a search for documents that do not contain 'foo' but may contain 'bar'.
     *
     * To escape special characters the backslash character '\' can be used, this allows searches to include
     * characters that would normally be considered modifiers, e.g. `foo\~2` will search for a term "foo~2" instead
     * of attempting to apply a boost of 2 to the search term "foo".
     *
     * @typedef {string} lunr.Index~QueryString
     * @example <caption>Simple single term query</caption>
     * hello
     * @example <caption>Multiple term query</caption>
     * hello world
     * @example <caption>term scoped to a field</caption>
     * title:hello
     * @example <caption>term with a boost of 10</caption>
     * hello^10
     * @example <caption>term with an edit distance of 2</caption>
     * hello~2
     * @example <caption>terms with presence modifiers</caption>
     * -foo +bar baz
     */
    /**
     * An index contains the built index of all documents and provides a query interface
     * to the index.
     *
     * Usually instances of lunr.Index will not be created using this constructor, instead
     * lunr.Builder should be used to construct new indexes, or lunr.Index.load should be
     * used to load previously built and serialized indexes.
     *
     * @memberOf lunr
     */
    class Index {
        invertedIndex: Index.InvertedIndex;
        fieldVectors: Record<string, lunr.Vector>;
        tokenSet: lunr.TokenSet;
        numberMap: lunr.NumberMap;
        fields: string[];
        fieldTypes: lunr.Builder.FieldType[];
        pipeline: lunr.Pipeline;
        /**
         * @param {object} attrs - The attributes of the built search index.
         * @param {object} attrs.invertedIndex - An index of term/field to document reference.
         * @param {object<string, lunr.Vector>} attrs.fieldVectors - Field vectors
         * @param {lunr.TokenSet} attrs.tokenSet - An set of all corpus tokens.
         * @param {lunr.NumberMap} attrs.numberMap
         * @param {string[]} attrs.fields - The names of indexed document fields.
         * @param {Array<"string" | "number">} attrs.fieldTypes
         * @param {lunr.Pipeline} attrs.pipeline - The pipeline to use for search terms.
        */
        constructor(attrs: Index.IndexAttributes);
        /**
         * Performs a search against the index using lunr query syntax.
         *
         * Results will be returned sorted by their score, the most relevant results
         * will be returned first.  For details on how the score is calculated, please see
         * the {@link https://lunrjs.com/guides/searching.html#scoring|guide}.
         *
         * For more programmatic querying use lunr.Index#query.
         *
         * @param {lunr.Index~QueryString} queryString - A string containing a lunr query.
         * @throws {lunr.QueryParseError} If the passed query string cannot be parsed.
         * @returns {lunr.Index.Result[]}
         */
        search(queryString: Index.QueryString): {
            ref: any;
            score: number;
            matchData: MatchData;
        }[];
        /**
         * Performs a query against the index using the yielded lunr.Query object.
         *
         * If performing programmatic queries against the index, this method is preferred
         * over lunr.Index#search so as to avoid the additional query parsing overhead.
         *
         * A query object is yielded to the supplied function which should be used to
         * express the query to be run against the index.
         *
         * Note that although this function takes a callback parameter it is _not_ an
         * asynchronous operation, the callback is just yielded a query object to be
         * customized.
         *
         * @param {lunr.Index~queryBuilder} fn - A function that is used to build the query.
         * @returns {lunr.Index~Result[]}
         */
        query(fn: Index.queryBuilder): {
            ref: any;
            score: number;
            matchData: MatchData;
        }[];
        /**
         * Prepares the index for JSON serialization.
         *
         * The schema for this JSON blob will be described in a
         * separate JSON schema file.
         *
         * @returns {Object}
         */
        toJSON(): any;
        /**
         * Loads a previously serialized lunr.Index
         *
         * @param {Object} serializedIndex - A previously serialized lunr.Index
         * @returns {lunr.Index}
         */
        static load(serializedIndex: any): Index;
    }
    namespace Index {
        /** The attributes of the built search index. */
        interface IndexAttributes {
            /** An index of term/field to document reference. */
            invertedIndex: Index.InvertedIndex;
            /** Field vectors */
            fieldVectors: Record<string, lunr.Vector>;
            /** An set of all corpus tokens. */
            tokenSet: lunr.TokenSet;
            numberMap: lunr.NumberMap;
            /** The names of indexed document fields. */
            fields: string[];
            /** The names of indexed document fields. */
            fieldTypes: lunr.Builder.FieldType[];
            /** The pipeline to use for search terms. */
            pipeline: lunr.Pipeline;
        }
        /**
         * A query builder callback provides a query object to be used to express
         * the query to perform on the index.
         *
         * @callback lunr.Index.queryBuilder
         * @param {lunr.Query} query - The query object to build up.
         * @this lunr.Query
         */
        type queryBuilder = (this: lunr.Query, query: lunr.Query) => void;
        /**
         * A result contains details of a document matching a search query.
         * @typedef {object} lunr.Index.Result
         * @property {string} ref - The reference of the document this result represents.
         * @property {number} score - A number between 0 and 1 representing how similar this document is to the query.
         * @property {lunr.MatchData} matchData - Contains metadata about this match including which term(s) caused the match.
         */
        interface Result {
            ref: string;
            score: number;
            matchData: lunr.MatchData;
        }
        /**
         * Although lunr provides the ability to create queries using lunr.Query, it also provides a simple
         * query language which itself is parsed into an instance of lunr.Query.
         *
         * For programmatically building queries it is advised to directly use lunr.Query, the query language
         * is best used for human entered text rather than program generated text.
         *
         * At its simplest queries can just be a single term, e.g. `hello`, multiple terms are also supported
         * and will be combined with OR, e.g `hello world` will match documents that contain either 'hello'
         * or 'world', though those that contain both will rank higher in the results.
         *
         * Wildcards can be included in terms to match one or more unspecified characters, these wildcards can
         * be inserted anywhere within the term, and more than one wildcard can exist in a single term. Adding
         * wildcards will increase the number of documents that will be found but can also have a negative
         * impact on query performance, especially with wildcards at the beginning of a term.
         *
         * Terms can be restricted to specific fields, e.g. `title:hello`, only documents with the term
         * hello in the title field will match this query. Using a field not present in the index will lead
         * to an error being thrown.
         *
         * Modifiers can also be added to terms, lunr supports edit distance and boost modifiers on terms. A term
         * boost will make documents matching that term score higher, e.g. `foo^5`. Edit distance is also supported
         * to provide fuzzy matching, e.g. 'hello~2' will match documents with hello with an edit distance of 2.
         * Avoid large values for edit distance to improve query performance.
         *
         * Each term also supports a presence modifier. By default a term's presence in document is optional, however
         * this can be changed to either required or prohibited. For a term's presence to be required in a document the
         * term should be prefixed with a '+', e.g. `+foo bar` is a search for documents that must contain 'foo' and
         * optionally contain 'bar'. Conversely a leading '-' sets the terms presence to prohibited, i.e. it must not
         * appear in a document, e.g. `-foo bar` is a search for documents that do not contain 'foo' but may contain 'bar'.
         *
         * To escape special characters the backslash character '\' can be used, this allows searches to include
         * characters that would normally be considered modifiers, e.g. `foo\~2` will search for a term "foo~2" instead
         * of attempting to apply a boost of 2 to the search term "foo".
         *
         * @typedef {string} lunr.Index.QueryString
         * @example <caption>Simple single term query</caption>
         * hello
         * @example <caption>Multiple term query</caption>
         * hello world
         * @example <caption>term scoped to a field</caption>
         * title:hello
         * @example <caption>term with a boost of 10</caption>
         * hello^10
         * @example <caption>term with an edit distance of 2</caption>
         * hello~2
         * @example <caption>terms with presence modifiers</caption>
         * -foo +bar baz
         */
        type QueryString = string;
        type InvertedIndex = Record<string, InvertedIndex.Posting>;
        namespace InvertedIndex {
            type Posting = {
                _index: number;
            } & FieldReference;
            type FieldReference = Record<string, DocumentReference>;
            type DocumentReference = Record<string, Metadata>;
            type Metadata = Record<string, any>;
        }
    }
}
/*!
 * lunr.Builder
 * Copyright (C) 2019 Oliver Nightingale
 */
declare namespace lunr {
    /**
     * lunr.Builder performs indexing on a set of documents and
     * returns instances of lunr.Index ready for querying.
     *
     * All configuration of the index is done via the builder, the
     * fields to index, the document reference, the text processing
     * pipeline and document scoring parameters are all set on the
     * builder before indexing.
     *
     * @memberOf lunr
     */
    class Builder {
        /**
         * The inverted index maps terms to document fields.
         */
        invertedIndex: Index.InvertedIndex;
        /**
         * Keeps track of document term frequencies.
         */
        fieldTermFrequencies: Record<string, Record<string, number>>;
        /**
         * Keeps track of the length of documents added to the index.
         */
        fieldLengths: Record<string, number>;
        /**
         * Function for splitting strings into tokens for indexing.
         */
        tokenizer: {
            (obj: string | object | object[] | undefined, metadata: Record<string, any>): Token[];
            separator: RegExp;
        };
        /**
         * The pipeline performs text processing on tokens before indexing.
         */
        pipeline: Pipeline;
        /**
         * A pipeline for processing search terms before querying the index.
         */
        searchPipeline: Pipeline;
        /**
         * Keeps track of the total number of documents indexed.
         */
        documentCount: number;
        /**
         * A counter incremented for each unique term, used to identify a terms position in the vector space.
         */
        termIndex: number;
        /**
         * A list of metadata keys that have been whitelisted for entry in the index.
         */
        metadataWhitelist: string[];
        /**
         * Internal reference to the document reference field.
         */
        private _ref;
        /**
         * Internal reference to the document fields to index.
         */
        private _fields;
        private _documents;
        /**
         * A parameter to control field length normalization. Setting this to `0` disables normalization,
         * while `1` fully normalizes field lengths. The default value is `0.75`.
         */
        private _b;
        /**
         * A parameter to control how quickly an increase in term frequency results in term frequency saturation.
         * The default value is `1.2`.
         */
        private _k1;
        private averageFieldLength?;
        private fieldVectors?;
        private tokenSet?;
        private numberMap?;
        constructor();
        /**
         * Sets the document field used as the document reference. Every document must have this field.
         * The type of this field in the document should be a string, if it is not a string it will be
         * coerced into a string by calling toString.
         *
         * The default ref is 'id'.
         *
         * The ref should _not_ be changed during indexing, it should be set before any documents are
         * added to the index. Changing it during indexing can lead to inconsistent results.
         *
         * @param {string} ref - The name of the reference field in the document.
         */
        ref(ref: string): void;
        /**
         * Adds a field to the list of document fields that will be indexed. Every document being
         * indexed should have this field. Null values for this field in indexed documents will
         * not cause errors but will limit the chance of that document being retrieved by searches.
         *
         * All fields should be added before adding documents to the index. Adding fields after
         * a document has been indexed will have no effect on already indexed documents.
         *
         * Fields can be boosted at build time. This allows terms within that field to have more
         * importance when ranking search results. Use a field boost to specify that matches within
         * one field are more important than other fields.
         *
         * @param {string} fieldName - The name of a field to index in all documents.
         * @param {object} attributes - Optional attributes associated with this field.
         * @param {number} [attributes.boost=1] - Boost applied to all terms within this field.
         * @param {lunr.Builder~fieldExtractor} [attributes.extractor] - Function to extract a field from a document.
         * @param {"string" | "number"} [attributes.type="string"] - The type of field.
         * @throws {RangeError} fieldName cannot contain unsupported characters '/'
         */
        field(fieldName: string, attributes?: Builder.FieldAttributes): void;
        /**
         * A parameter to tune the amount of field length normalisation that is applied when
         * calculating relevance scores. A value of 0 will completely disable any normalisation
         * and a value of 1 will fully normalise field lengths. The default is 0.75. Values of b
         * will be clamped to the range 0 - 1.
         *
         * @param {number} number - The value to set for this tuning parameter.
         */
        b(number: number): void;
        /**
         * A parameter that controls the speed at which a rise in term frequency results in term
         * frequency saturation. The default value is 1.2. Setting this to a higher value will give
         * slower saturation levels, a lower value will result in quicker saturation.
         *
         * @param {number} number - The value to set for this tuning parameter.
         */
        k1(number: number): void;
        /**
         * Adds a document to the index.
         *
         * Before adding fields to the index the index should have been fully setup, with the document
         * ref and all fields to index already having been specified.
         *
         * The document must have a field name as specified by the ref (by default this is 'id') and
         * it should have all fields defined for indexing, though null or undefined values will not
         * cause errors.
         *
         * Entire documents can be boosted at build time. Applying a boost to a document indicates that
         * this document should rank higher in search results than other documents.
         *
         * @param {object} doc - The document to add to the index.
         * @param {object} attributes - Optional attributes associated with this document.
         * @param {number} [attributes.boost=1] - Boost applied to all terms within this document.
         */
        add(doc: object, attributes?: Builder.DocumentAttributes): void;
        /**
         * Calculates the average document length for this index
         *
         * @private
         */
        private calculateAverageFieldLengths;
        /**
         * Builds a vector space model of every document using lunr.Vector
         *
         * @private
         */
        private createFieldVectors;
        /**
         * Creates a token set of all tokens in the index using lunr.TokenSet
         *
         * @private
         */
        private createTokenSet;
        /**
         * @private
         */
        private createNumberMap;
        /**
         * Builds the index, creating an instance of lunr.Index.
         *
         * This completes the indexing process and should only be called
         * once all documents have been added to the index.
         *
         * @returns {lunr.Index}
         */
        build(): Index;
        /**
         * Applies a plugin to the index builder.
         *
         * A plugin is a function that is called with the index builder as its context.
         * Plugins can be used to customise or extend the behaviour of the index
         * in some way. A plugin is just a function, that encapsulated the custom
         * behaviour that should be applied when building the index.
         *
         * The plugin function will be called with the index builder as its argument, additional
         * arguments can also be passed when calling use. The function will be called
         * with the index builder as its context.
         *
         * @param {Function} fn The plugin to apply.
         */
        use<A extends any[]>(fn: (this: Builder, builder: Builder, ...args: A) => void, ...args: A): void;
    }
    namespace Builder {
        /**
         * A function that is used to extract a field from a document.
         *
         * Lunr expects a field to be at the top level of a document, if however the field
         * is deeply nested within a document an extractor function can be used to extract
         * the right field for indexing.
         */
        type fieldExtractor = (doc: object) => string | object | object[] | undefined;
        interface FieldAttributes {
            boost?: number;
            extractor?: fieldExtractor;
            type?: FieldType;
        }
        interface DocumentAttributes {
            boost?: number;
        }
        type FieldType = "string" | "number";
    }
}
/**
 * A function that is used to extract a field from a document.
 *
 * Lunr expects a field to be at the top level of a document, if however the field
 * is deeply nested within a document an extractor function can be used to extract
 * the right field for indexing.
 *
 * @callback lunr.Builder~fieldExtractor
 * @param {object} doc - The document being added to the index.
 * @returns {?(string|object|object[])} obj - The object that will be indexed for this field.
 * @example <caption>Extracting a nested field</caption>
 * function (doc) { return doc.nested.field }
 */ 
declare namespace lunr {
    /**
     * Contains and collects metadata about a matching document.
     * A single instance of lunr.MatchData is returned as part of every
     * lunr.Index.Result.
     *
     * @memberOf lunr
     * @property {Object<string, string[]>} metadata - A cloned collection of metadata associated with this document.
     * @see {@link lunr.Index~Result}
     */
    class MatchData {
        metadata: Record<string, Record<string, Record<string, string[]>>>;
        /**
         * @param {string} [term] - The term this match data is associated with
         * @param {string} [field] - The field in which the term was found
         * @param {Object<string, string[]>} [metadata] - The metadata recorded about this term in this field
         */
        constructor(term?: string, field?: string, metadata?: Record<string, string[]>);
        /**
         * An instance of lunr.MatchData will be created for every term that matches a
         * document. However only one instance is required in a lunr.Index~Result. This
         * method combines metadata from another instance of lunr.MatchData with this
         * objects metadata.
         *
         * @param {lunr.MatchData} otherMatchData - Another instance of match data to merge with this one.
         * @see {@link lunr.Index~Result}
         */
        combine(otherMatchData: MatchData): void;
        /**
         * Add metadata for a term/field pair to this instance of match data.
         *
         * @param {string} term - The term this match data is associated with
         * @param {string} field - The field in which the term was found
         * @param {Object<string, string>} metadata - The metadata recorded about this term in this field
         */
        add(term: string, field: string, metadata: Record<string, string[]>): void;
    }
}
declare namespace lunr {
    /**
     * A lunr.Query provides a programmatic way of defining queries to be performed
     * against a {@link lunr.Index}.
     *
     * Prefer constructing a lunr.Query using the {@link lunr.Index#query} method
     * so the query object is pre-initialized with the right index fields.
     *
     * @memberOf lunr
     */
    class Query {
        /** An array of query clauses. */
        clauses: Query.Clause[];
        /** An array of all available fields in a lunr.Index */
        allFields: string[];
        /** An array of all field types in a lunr.Index */
        allFieldTypes?: Builder.FieldType[];
        numberMap?: NumberMap;
        /**
         * @param {string[]} allFields An array of all available fields in a lunr.Index
         * @param {Array<"string" | "number">} [allFieldTypes] An array of all field types in a lunr.Index
         * @param {lunr.NumberMap} [numberMap]
         */
        constructor(allFields: string[], allFieldTypes?: Builder.FieldType[], numberMap?: NumberMap);
        /**
         * Adds a {@link lunr.Query~Clause} to this query.
         *
         * Unless the clause contains the fields to be matched all fields will be matched. In addition
         * a default boost of 1 is applied to the clause.
         *
         * @param {lunr.Query~Clause} clause The clause to add to this query.
         * @see lunr.Query~Clause
         */
        clause(clause: Query.Clause): this;
        /**
         * A negated query is one in which every clause has a presence of
         * prohibited. These queries require some special processing to return
         * the expected results.
         *
         * @returns boolean
         */
        isNegated(): boolean;
        /**
         * Adds a term to the current query, under the covers this will create a {@link lunr.Query~Clause}
         * to the list of clauses that make up this query.
         *
         * The term is used as is, i.e. no tokenization will be performed by this method. Instead conversion
         * to a token or token-like string should be done before calling this method.
         *
         * The term will be converted to a string by calling `toString`. Multiple terms can be passed as an
         * array, each term in the array will share the same options.
         *
         * @param {object|object[]} term The term(s) to add to the query.
         * @param {object} [options] Any additional properties to add to the query clause.
         * @returns {lunr.Query}
         * @see lunr.Query#clause
         * @see lunr.Query~Clause
         * @example <caption>adding a single term to a query</caption>
         * query.term("foo")
         * @example <caption>adding a single term to a query and specifying search fields, term boost and automatic trailing wildcard</caption>
         * query.term("foo", {
         *   fields: ["title"],
         *   boost: 10,
         *   wildcard: lunr.Query.wildcard.TRAILING
         * })
         * @example <caption>using lunr.tokenizer to convert a string to tokens before using them as terms</caption>
         * query.term(lunr.tokenizer("foo bar"))
         */
        term(term: string | object | (string | object)[], options?: Partial<Query.Clause>): this;
        /**
         * Adds a comparator term to the current query, under the covers this will create a {@link lunr.Query~Clause}
         * to the list of clauses that make up this query.
         *
         * @param {lunr.Query.comparator} comparator The relational operator.
         * @param {number} comparand The comparand.
         * @param {object} [options] Any additional properties to add to the query clause.
         * @returns {lunr.Query}
         * @see lunr.Query#clause
         * @see lunr.Query~Clause
         * @example <caption>adding a single comparator to a query and specifying search fields</caption>
         * query.comparator(lunr.Query.comparator.GREATERTHAN, 10, {
         *   fields: ["wordCount"]
         * })
         */
        comparator(comparator: Query.comparator, comparand: number, options?: Partial<Query.Clause>): this;
        /**
         * Adds a range term to the current query, under the covers this will create a {@link lunr.Query~Clause}
         * to the list of clauses that make up this query.
         *
         * @param {"*" | number} start The starting point of the range.
         * @param {"*" | number} end The ending point of the range.
         * @param {object} [options] Any additional properties to add to the query clause.
         * @returns {lunr.Query}
         * @see lunr.Query#clause
         * @see lunr.Query~Clause
         * @example <caption>adding a single comparator to a query and specifying search fields</caption>
         * query.range(5, 10, {
         *   fields: ["wordCount"]
         * })
         */
        range(start: "*" | number, end: "*" | number, options?: Partial<Query.Clause>): this;
    }
    namespace Query {
        const wildcardChar = "*";
        /**
         * Constants for indicating what kind of automatic wildcard insertion will be used when constructing a query clause.
         *
         * This allows wildcards to be added to the beginning and end of a term without having to manually do any string
         * concatenation.
         *
         * The wildcard constants can be bitwise combined to select both leading and trailing wildcards.
         *
         * @constant
         * @static
         * @memberOf lunr.Query
         * @enum {number}
         * @property {number} wildcard.NONE - The term will have no wildcards inserted, this is the default behaviour
         * @property {number} wildcard.LEADING - Prepend the term with a wildcard, unless a leading wildcard already exists
         * @property {number} wildcard.TRAILING - Append a wildcard to the term, unless a trailing wildcard already exists
         * @see lunr.Query~Clause
         * @see lunr.Query#clause
         * @see lunr.Query#term
         * @example <caption>query term with trailing wildcard</caption>
         * query.term('foo', { wildcard: lunr.Query.wildcard.TRAILING })
         * @example <caption>query term with leading and trailing wildcard</caption>
         * query.term('foo', {
         *   wildcard: lunr.Query.wildcard.LEADING | lunr.Query.wildcard.TRAILING
         * })
         */
        enum wildcard {
            /** The term will have no wildcards inserted, this is the default behaviour */
            NONE = 0,
            /** Prepend the term with a wildcard, unless a leading wildcard already exists */
            LEADING = 1,
            /** Append a wildcard to the term, unless a trailing wildcard already exists */
            TRAILING = 2
        }
        /**
         * Constants for indicating what kind of presence a term must have in matching documents.
         *
         * @constant
         * @static
         * @memberOf lunr.Query
         * @enum {number}
         * @property {number} OPTIONAL - Term's presence in a document is optional, this is the default value.
         * @property {number} REQUIRED - Term's presence in a document is required, documents that do not contain
         * this term will not be returned.
         * @property {number} PROHIBITED - Term's presence in a document is prohibited, documents that do contain
         * this term will not be returned.
         * @see lunr.Query~Clause
         * @see lunr.Query#clause
         * @see lunr.Query#term
         * @example <caption>query term with required presence</caption>
         * query.term('foo', { presence: lunr.Query.presence.REQUIRED })
         */
        enum presence {
            /**
             * Term's presence in a document is optional, this is the default value.
             */
            OPTIONAL = 1,
            /**
             * Term's presence in a document is required, documents that do not contain
             * this term will not be returned.
             */
            REQUIRED = 2,
            /**
             * Term's presence in a document is prohibited, documents that do contain
             * this term will not be returned.
             */
            PROHIBITED = 3
        }
        /**
         * Constants for indicating a relational comparison.
         *
         * @constant
         * @static
         * @memberOf lunr.Query
         * @enum {string}
         * @property {string} GREATERTHAN - The field's value must be greater than (`>`) the comparand.
         * @property {string} GREATERTHAN_EQUALS - The field's value must be greater than or equal to (`>=`) the comparand.
         * @property {string} LESSTHAN - The field's value must be less than (`<`) the comparand.
         * @property {string} LESSTHAN_EQUALS - The field's value must be less than or equal to (`<=`) the comparand.
         * @see lunr.Query~Clause
         * @see lunr.Query#clause
         * @see lunr.Query#term
         */
        enum comparator {
            /** The field's value must be greater than (`>`) the comparand. */
            GREATERTHAN = ">",
            /** The field's value must be greater than or equal to (`>=`) the comparand. */
            GREATERTHAN_EQUALS = ">=",
            /** The field's value must be less than (`<`) the comparand. */
            LESSTHAN = "<",
            /** The field's value must be less than or equal to (`<=`) the comparand. */
            LESSTHAN_EQUALS = "<="
        }
        /**
         * A single clause in a {@link lunr.Query} contains a term and details on how to
         * match that term against a {@link lunr.Index}.
         */
        interface Clause {
            /** The fields in an index this clause should be matched against. */
            fields?: string[];
            /** The types of the fields in the index. */
            fieldTypes?: Builder.FieldType[];
            numberMap?: NumberMap;
            /** Any boost that should be applied when matching this clause. */
            boost?: number;
            /** Whether the term should have fuzzy matching applied, and how fuzzy the match should be. */
            editDistance?: number;
            /** Whether the term should be passed through the search pipeline. */
            usePipeline?: boolean;
            /** Whether the term should have wildcards appended or prepended. */
            wildcard?: wildcard;
            /** The terms presence in any matching documents. */
            presence?: presence;
            term: Term;
        }
        /** A term used to compare a number against a field using the provided operator. */
        interface ComparatorTerm {
            comparator: comparator;
            comparand: number;
        }
        /** A term used to find a number within the provided range. */
        interface RangeTerm {
            start: "*" | number;
            end: "*" | number;
        }
        type Term = string | ComparatorTerm | RangeTerm;
    }
}
/**
 * A single clause in a {@link lunr.Query} contains a term and details on how to
 * match that term against a {@link lunr.Index}.
 *
 * @typedef lunr.Query~Clause
 * @property {string[]} fields - The fields in an index this clause should be matched against.
 * @property {Array<"string" | "number">} [fieldTypes]
 * @property {lunr.NumberMap} [numberMap]
 * @property {number} [boost=1] - Any boost that should be applied when matching this clause.
 * @property {number} [editDistance] - Whether the term should have fuzzy matching applied, and how fuzzy the match should be.
 * @property {boolean} [usePipeline] - Whether the term should be passed through the search pipeline.
 * @property {number} [wildcard=lunr.Query.wildcard.NONE] - Whether the term should have wildcards appended or prepended.
 * @property {number} [presence=lunr.Query.presence.OPTIONAL] - The terms presence in any matching documents.
 * @property {lunr.Query~Term} term - The term for the clause.
 */
/**
 * A term used to compare a number against a field using the provided operator.
 *
 * @typedef lunr.Query~ComparatorTerm
 * @property {lunr.Query.comparator} comparator - The relational operator used for comparisons.
 * @property {number} comparand - The value to compare against.
 */
/**
 * A term used to find a number within the provided range.
 *
 * @typedef lunr.Query~RangeTerm
 * @property {"*" | number} start - The start of the range. A value of `"*"` indicates the start is unbounded.
 * @property {"*" | number} end - The end of the range. A value of `"*"` indicates the end is unbounded.
 */
/**
 * The term for a {@link lunr.Query~Clause}.
 *
 * @typedef {string | lunr.Query~ComparatorTerm | lunr.Query~RangeTerm} lunr.Query~Term
 */ 
declare namespace lunr {
    class QueryParseError extends Error {
        start: number;
        end: number;
        constructor(message: string, start: number, end: number);
    }
}
declare namespace lunr {
    namespace QueryLexer {
        type LexemeType = "EOS" | "FIELD" | "TERM" | "EDIT_DISTANCE" | "BOOST" | "PRESENCE" | "COMPARATOR" | "COMPARAND" | "RANGE_START" | "RANGE_END";
        interface Lexeme {
            type: LexemeType;
            str: string;
            start: number;
            end: number;
        }
    }
    class QueryLexer {
        static readonly EOS = "EOS";
        static readonly FIELD = "FIELD";
        static readonly TERM = "TERM";
        static readonly EDIT_DISTANCE = "EDIT_DISTANCE";
        static readonly BOOST = "BOOST";
        static readonly PRESENCE = "PRESENCE";
        static readonly COMPARATOR = "COMPARATOR";
        static readonly COMPARAND = "COMPARAND";
        static readonly RANGE_START = "RANGE_START";
        static readonly RANGE_END = "RANGE_END";
        static termSeparator: RegExp;
        lexemes: QueryLexer.Lexeme[];
        str: string;
        length: number;
        pos: number;
        start: number;
        escapeCharPositions: number[];
        constructor(str: string);
        run(): void;
        sliceString(): string;
        /**
         * @param {LexemeType} type
         */
        emit(type: QueryLexer.LexemeType): void;
        escapeCharacter(): void;
        next(): string;
        peek(): string;
        width(): number;
        ignore(): void;
        backup(): void;
        acceptDigitRun(): void;
        more(): boolean;
    }
}
declare namespace lunr {
    class QueryParser {
        lexer: lunr.QueryLexer;
        query: lunr.Query;
        currentClause: Partial<lunr.Query.Clause>;
        currentComparator?: Partial<lunr.Query.ComparatorTerm>;
        currentRange?: Partial<lunr.Query.RangeTerm>;
        private lexemeIdx;
        private lexemes?;
        constructor(str: string, query: lunr.Query);
        parse(): Query;
        peekLexeme(): QueryLexer.Lexeme;
        consumeLexeme(): QueryLexer.Lexeme;
        nextClause(): void;
    }
}
export = lunr;
export as namespace lunr;
