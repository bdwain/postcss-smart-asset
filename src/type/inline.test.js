import path from "path"
import postcss from "postcss"
import postcssUrl from "../"
import { processedCss, compareFixtures, readAsync } from "../../test/setup"

describe("inline", () => {
  const opts = { url: "inline" }
  const postcssOpts = { from: "test/fixtures/here" }

  compareFixtures("cant-inline", "shouldn't inline url if not info available", opts)

  compareFixtures(
    "can-inline-hash-include",
    "should inline url and include hash, if it has a hash in it and option is enabled",
    { url: "inline", encodeType: "encodeURIComponent", includeUriFragment: true },
    postcssOpts
  )

  compareFixtures(
    "can-inline-hash",
    "should inline url and not include hash, if it has a hash in it",
    { url: "inline", encodeType: "encodeURIComponent" },
    postcssOpts
  )

  test("should inline url from dirname(from)", () => {
    return processedCss("inline-from", opts, postcssOpts).then((css) => {
      expect(css.match(/;base64/)).toBeTruthy()
    })
  })

  test("should not inline big files from dirname(from)", () => {
    return processedCss(
      "inline-from",
      { url: "inline", maxSize: 0.0001 },
      { from: "test/fixtures/here" }
    ).then((css) => {
      expect(css.match(/;base64/)).toBeFalsy()
    })
  })

  test("SVGs shouldn't be encoded in base64", () => {
    return processedCss("inline-svg", { url: "inline" }, postcssOpts).then((css) => {
      expect(css.match(/;base64/)).toBeFalsy()
    })
  })

  compareFixtures(
    "inline-svg-optimized",
    "should inline svg optmized",
    { url: "inline", optimizeSvgEncode: true },
    postcssOpts
  )

  compareFixtures(
    "inline-svg-with-parens",
    "should inline svg wrapped by quotes",
    { url: "inline" },
    postcssOpts
  )

  test("should inline url of imported files", () => {
    return readAsync("inline-imported")
      .then((value) =>
        postcss()
          .use(require("postcss-import")())
          .use(postcssUrl(opts))
          .process(value, { from: "test/fixtures/here" })
      )
      .then((result) => {
        expect(result.css.match(/;base64/)).toBeTruthy()
      })
  })

  test("should inline files matching the minimatch pattern", () => {
    return processedCss("inline-by-type", { url: "inline", filter: "**/*.svg" }, postcssOpts).then((css) => {
      expect(css.match(/data\:image\/svg\+xml/)).toBeTruthy()
      expect(css.match(/data:image\/gif/)).toBeFalsy()
    })
  })

  test("should inline files matching the regular expression", () => {
    return processedCss("inline-by-type", { url: "inline", filter: /\.svg$/ }, postcssOpts).then((css) => {
      expect(css.match(/data\:image\/svg\+xml/)).toBeTruthy()
      expect(css.match(/data:image\/gif/)).toBeFalsy()
    })
  })

  test("should inline files matching by custom function", () => {
    const customFilterFunction = (asset) => (/\.svg$/).test(asset.absolutePath)
    return processedCss(
      "inline-by-type",
      { url: "inline", filter: customFilterFunction },
      postcssOpts
    ).then((css) => {
      expect(css.match(/data\:image\/svg\+xml/)).toBeTruthy()
      expect(css.match(/data:image\/gif/)).toBeFalsy()
    })
  })

  compareFixtures(
    "inline-fallback-function",
    "should respect the fallback function",
    {
      url: "inline",
      maxSize: 0.0001,
      fallback() {
        return "one"
      }
    },
    { from: "test/fixtures/index.css" }
  )

  compareFixtures(
    "inline-fallback-rebase",
    "should respect the fallback rebase",
    {
      url: "inline",
      maxSize: 0.0001,
      fallback: "rebase"
    },
    { from: "test/fixtures/index.css", to: "test/fixtures/build/index.css" }
  )

  test("should find files in basePaths", () => {
    return processedCss(
      "inline-by-base-paths",
      {
        url: "inline",
        filter: /\.png$/,
        basePath: [ path.resolve("test/fixtures/baseDir1"), "baseDir2" ]
      },
      postcssOpts
    ).then((css) => {
      expect(css.match(/data:image\/png/g).length).toBe(2)
    })
  })
})
