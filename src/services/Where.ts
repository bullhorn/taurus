/**
 * A base class for making where clauses
 */
// tslint:disable-next-line:no-stateless-class
// tslint:disable-next-line:no-unnecessary-class
export class Where {
    constructor() {
        throw new TypeError('Cannot invoke the constructor function of a static class.');
    }

    /**
     * convert an Object to Lucene Query Syntax
     * @param   data the object that contains query string name value pairs
     * @return  resulting querystring
     */
    static toSearchSyntax(data: any) {
        const queries: string[] = [];
        for (const key of Object.keys(data)) {
            const value = data[key];
            if (key === 'or') {
                queries.push(`(${Where.toSearchSyntax(value).replace(' AND ', ' OR ')})`);
            } else {
                queries.push(Where.parseSearchValue(key, value));
            }
        }

        return queries.join(' AND ');
    }

    /**
     * parses part of the query value recursively into Lucene query syntax
     * @param   key         name of the field
     * @param   value       value of the field
     * @return              part of the querystring to be returned
     */
    static parseSearchValue(key: string, value: any) {
        const clauses: string[] = [];
        if (Array.isArray(value)) {
            clauses.push(`${key}:${Where.writeLuceneValues(value)}`);
        } else if (value instanceof Object) {
            if (value.min || value.max) {
                clauses.push(`${key}:[${Where.writeLuceneValue(value.min || '*')} TO ${Where.writeLuceneValue(value.max || '*')}]`);
            }
            if (value.any && Array.isArray(value.any)) {
                const terms = value.any.map(t => ~(`${t}`).trim().indexOf(' ') ? `"${t}"` : t);
                clauses.push(`${key}:(${terms.join(' ')})`);
            }
            if (value.all && Array.isArray(value.all)) {
                const terms = value.all.map(t => ~(`${t}`).trim().indexOf(' ') ? `"${t}"` : t);
                clauses.push(`${key}:(${terms.join(' AND ')})`);
            }
            if (value.not) {
                clauses.push(`NOT (${Where.parseSearchValue(key, value.not)})`);
            }
            if (value.like) {
                clauses.push(`${key}:(${value.like}*)`);
            }
            if (value.lookup) {
                clauses.push(`${key}:"^(${Where.toQuerySyntax(value.lookup)})"`);
            }
            if (value.with) {
                clauses.push(`${key}.id:"[0 TO *]"`);
            }
            if (value.without) {
                clauses.push(`-${key}.id:"[0 TO *]"`);
            }
            if (value.or) {
                const obj = {};
                obj[key] = value.or;
                clauses.push(`(${Where.toSearchSyntax(obj)})`.replace(' AND ', ' OR '));
            }
            for (const subkey of Object.keys(value)) {
                if (['min', 'max', 'any', 'all', 'not', 'or', 'like', 'lookup', 'with', 'without'].indexOf(subkey) < 0) {
                    const subvalue = value[subkey];
                    clauses.push(Where.parseSearchValue(`${key}.${subkey}`, subvalue));
                }
            }
        } else if (value.indexOf && ~value.indexOf('*')) {
            clauses.push(`${key}:(${value})`);
        } else {
            clauses.push(`${key}:${Where.writeLuceneValue(value)}`);
        }

        return clauses.join(' AND ');
    }

    static writeLuceneValue(value) {
        if (value instanceof Date) {
            return value.toISOString().split('.')[0].replace(/[-:T]/gi, '');
        }
        if (typeof value === 'number' || typeof value === 'boolean') {
            return `${value}`;
        }
        if (value === '*') {
            return `${value}`;
        }

        return `"${value}"`;
    }

    static writeLuceneValues(values) {
        if (typeof values[0] === 'number' || typeof values[0] === 'boolean') {
            return `(${values.join(' ')})`;
        }

        return `("${values.join('" "')}")`;
    }

    /**
     * convert an Object to Database Query Syntax
     * @param  data the object that contains query string name value pairs
     * @return      resulting querystring
     */
    static toQuerySyntax(data: any) {
        const queries: string[] = [];
        for (const key of Object.keys(data)) {
            const value = data[key];
            if (key === 'or') {
                queries.push(`(${Where.toQuerySyntax(value).replace(' AND ', ' OR ')})`);
            } else {
                queries.push(Where.parseQueryValue(key, value));
            }
        }

        return queries.join(' AND ');
    }

    /**
     * parses a query value recursively into a Database query
     * @param key         name of the field
     * @param value       value of the field
     * @param isNot       defaults to false, the reverses the logic to be parsed
     * @return            part of the querystring to be returned
     */
    static parseQueryValue(key: string, value: any, isNot: boolean = false) {
        const clauses: string[] = [];
        const IN = isNot ? ' NOT IN ' : ' IN ';
        const EQ = isNot ? '<>' : '=';
        const GT = isNot ? '<' : '>=';
        const LT = isNot ? '>=' : '<';
        if (Array.isArray(value)) {
            clauses.push(`${key}${IN}(${Where.writeQueryValues(value)})`);
        } else if (value instanceof Object) {
            if (value.min) {
                clauses.push(`${key}${GT}${Where.writeQueryValue(value.min)}`);
            }
            if (value.max) {
                clauses.push(`${key}${LT}${Where.writeQueryValue(value.max)}`);
            }
            if (value.any && Array.isArray(value.any)) {
                // TODO: THIS COULD BE MEMBEROF
                clauses.push(`${key}${IN}(${Where.writeQueryValues(value.any)})`);
            }
            if (value.all && Array.isArray(value.all)) {
                // TODO: THIS COULD BE MEMBEROF
                clauses.push(`${key}${IN}(${Where.writeQueryValues(value.all)})`);
            }
            if (value.not) {
                clauses.push(Where.parseQueryValue(key, value.not, true));
            }
            if (value.like) {
                clauses.push(`${key} like '%${value.like}%'`);
            }
            if (value.lookup) {
                const obj = {};
                obj[key] = value.lookup;
                clauses.push(Where.toQuerySyntax(obj));
            }
            if (value.with) {
                clauses.push(`${key} IS NOT EMPTY`);
            }
            if (value.without) {
                clauses.push(`${key} IS EMPTY`);
            }
            if (value.or) {
                const obj = {};
                obj[key] = value.or;
                clauses.push(Where.toQuerySyntax(obj).replace('AND', 'OR'));
            }
            for (const subkey of Object.keys(value)) {
                if (['min', 'max', 'any', 'all', 'not', 'or', 'like', 'lookup', 'with', 'without'].indexOf(subkey) < 0) {
                    const subvalue = value[subkey];
                    clauses.push(Where.parseQueryValue(`${key}.${subkey}`, subvalue));
                }
            }
        } else {
            // TODO: Fuzzy Logic
            clauses.push(`${key}${EQ}${Where.writeQueryValue(value)}`);
        }

        return clauses.join(' AND ');
    }

    static writeQueryValue(value) {
        if (value instanceof Date) {
            return value.getTime();
        }
        if (typeof value === 'number' || typeof value === 'boolean') {
            return `${value}`;
        }

        return `'${value.replace(/\*/g, '')}'`;
    }
    static writeQueryValues(values) {
        if (typeof values[0] === 'number' || typeof values[0] === 'boolean') {
            return `${values.join(',')}`;
        }

        return `'${values.join('\',\'')}'`;
    }
}
