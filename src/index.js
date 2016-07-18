import query from '@f5io/jsonpath';
import { isUndefined, isMirror } from './utils';

const isRule = Symbol('rule');
const rulePath = Symbol('rulePath');

export default transform;

function transform(path) {

  function handler(strings, ...keys) {

    function rule(context, root = null) {
      /**
       * If there is no root we are at the
       * top level of our transform.
       */
      let rootCtx;
      if (path && !root) {
        root = rootCtx = context;
        context = query(path, context);
      } else if (!root) {
        root = context;
      }

      /**
       * If it is a mirror return stringified context.
       */
      if (isMirror(strings)) {
        return JSON.stringify(isUndefined(context) ? null : context);
      }

      /**
       * Create the output for this rule.
       */
      const val = keys.reduce((acc, k, i) => {
        let result;
        if (k[isRule]) {
          const path = k[rulePath];
          const ctx = path ?
            query(path, getContext(path)) :
            context;

          /**
           * If the context is an array, map over it
           * with the current rule. Otherwise just
           * pass the context into the rule.
           */
          result = Array.isArray(ctx) ?
            `[${ctx.map(x => k(x, root)).join(',')}]` :
            k(ctx, root);
        } else {
          result = JSON.stringify(query(k, getContext(k))) || null;
        }
        return acc + result + strings[i + 1];
      }, strings[0]);

      /**
       * If the path is defined we are nested and can
       * return the value as a string.
       */
      if (root !== context && root !== rootCtx) {
        return val;
      } else {
        /* wot? */
      }

      try {
        /**
         * If this is the root rule, JSON.parse the
         * value to get the true output.
         */
        return JSON.parse(val);
      } catch(e) {
        throw new Error(`Your transform is malformed, ${val}`);
      }

      /**
       * Determine from the beginning of the path
       * whether we should be scoped or not.
       */
      function getContext(s) {
        return s && s[0] === '$' ? root : context;
      }

    };

    rule[isRule] = true;
    rule[rulePath] = path;
    return rule;
  };

  if (path && path.raw) {
    const strings = path;
    path = null;
    const args = Array.prototype.slice.call(arguments, 1);
    return handler.apply(null, [ strings ].concat(args));
  }

  return handler;
};
