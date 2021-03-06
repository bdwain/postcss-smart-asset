import path from "path"
import postcss from "postcss"
import { declProcessor } from "./lib/decl-processor"

/**
 *
 * @type {Plugin}
 */
export default postcss.plugin("postcss-smart-asset", (options = {}) => {
  return (root, result) => {
    const opts = result.opts
    const from = opts.from ? path.dirname(opts.from) : "."
    const to = opts.to ? path.dirname(opts.to) : from

    const promises = []

    root.walkDecls((decl) => {
      const waiter = declProcessor(from, to, options, result, decl)
      if (waiter && waiter.then) {
        promises.push(waiter)
      }
    })

    return Promise.all(promises)
  }
})

/**
 * @callback PostcssUrl~UrlProcessor
 * @param {String} from from
 * @param {String} dirname to dirname
 * @param {String} oldUrl url
 * @param {String} to destination
 * @param {Object} options plugin options
 * @param {Object} decl postcss declaration
 * @return {String|undefined} new url or undefined if url is old
 */

/**
 * @typedef {Object} PostcssUrl~HashOptions
 * @property {Function|String} [method=^xxhash32|xxhash64] - hash name or custom function, accepting file content
 * @see https://github.com/pierrec/js-xxhash
 * @property {Number} [shrink=8] - shrink hash string
 */

/**
 * @typedef {Object} Decl - postcss decl
 * @see http://api.postcss.org/Declaration.html
 */

/**
 * @typedef {Object} Result - postcss result
 * @see http://api.postcss.org/Result.html
 */
