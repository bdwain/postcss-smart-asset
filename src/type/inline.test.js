import { processedCss, compareFixtures, read } from "../../test/setup"
const path = require('path');
import postcss from "postcss"
import postcssUrl from "../"

describe('inline', () => {
    const opts = { url: 'inline' };
    const postcssOpts = { from: 'test/fixtures/here' };

    compareFixtures(
        'cant-inline',
        'shouldn\'t inline url if not info available',
        opts
    );

    compareFixtures(
        'can-inline-hash',
        'should inline url if it has a hash in it',
        { url: 'inline', encodeType: 'encodeURIComponent' },
        postcssOpts
    );

    test('should inline url from dirname(from)', () => {
        const css = processedCss('fixtures/inline-from', opts, postcssOpts);

        expect(css.match(/;base64/)).toBeTruthy();
    });

    test('should not inline big files from dirname(from)', () => {
        const css = processedCss(
            'fixtures/inline-from',
            { url: 'inline', maxSize: 0.0001 },
            { from: 'test/fixtures/here' }
        );

        expect(css.match(/;base64/)).toBeFalsy();
    });

    test('SVGs shouldn\'t be encoded in base64', () => {
        const css = processedCss(
            'fixtures/inline-svg',
            { url: 'inline' },
            postcssOpts
        );

        expect(css.match(/;base64/)).toBeFalsy();
    });

    test('should inline url of imported files', () => {
        const css = postcss()
            .use(require('postcss-import')())
            .use(postcssUrl(opts))
            .process(read('fixtures/inline-imported'), { from: 'test/fixtures/here' })
            .css;

        expect(css.match(/;base64/)).toBeTruthy();
    });

    test('should inline files matching the minimatch pattern', () => {
        const css = processedCss(
            'fixtures/inline-by-type',
            { url: 'inline', filter: '**/*.svg' },
            postcssOpts
        );

        expect(css.match(/data\:image\/svg\+xml/)).toBeTruthy();
        // shouldn\'t inline files not matching the minimatch pattern
        expect(css.match(/data:image\/gif/)).toBeFalsy();
    });

    test('should inline files matching the regular expression', () => {
        const css = processedCss(
            'fixtures/inline-by-type',
            { url: 'inline', filter: /\.svg$/ },
            postcssOpts
        );

        expect(css.match(/data\:image\/svg\+xml/)).toBeTruthy();
        // shouldn\'t inline files not matching the regular expression
        expect(css.match(/data:image\/gif/)).toBeFalsy();
    });

    test('should inline files matching by custom function', () => {
        const customFilterFunction = function(asset) {
            return /\.svg$/.test(asset.absolutePath);
        };
        const css = processedCss(
            'fixtures/inline-by-type',
            { url: 'inline', filter: customFilterFunction },
            postcssOpts
        );

        expect(css.match(/data\:image\/svg\+xml/)).toBeTruthy();
        // shouldn\'t inline files not matching the regular expression
        expect(css.match(/data:image\/gif/)).toBeFalsy();
    });

    test('function when inline fallback', () => {
        const optsWithFallback = {
            url: 'inline',
            maxSize: 0.0001,
            fallback() {
                return 'one';
            }
        };

        compareFixtures(
            'inline-fallback-function',
            'should respect the fallback function',
            optsWithFallback,
            { from: 'test/fixtures/index.css' }
        );
    });

    test('should find files in basePaths', () => {
        const css = processedCss(
            'fixtures/inline-by-base-paths',
            {
                url: 'inline',
                filter: /\.png$/,
                basePath: [path.resolve('test/fixtures/baseDir1'), 'baseDir2']
            },
            postcssOpts
        );

        expect(css.match(/data:image\/png/g).length).toBe(2);
    });
});
