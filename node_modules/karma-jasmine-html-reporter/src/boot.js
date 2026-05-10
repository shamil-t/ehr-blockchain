// This file is heavily based on jasmine-core\lib\jasmine-core\boot1.js
(function () {
    var env = jasmine.getEnv();

    /**
     * ## Runner Parameters
     *
     * More browser specific code - wrap the query string in an object and to allow for getting/setting parameters from the runner user interface.
     */

    var queryString = new jasmine.QueryString({
        getWindowLocation: function () {
            return window.location;
        }
    });

    var specQueryParam = queryString.getParam('spec')
    var filterSpecs = !!specQueryParam;

    var config = {
        stopOnSpecFailure: queryString.getParam('stopOnSpecFailure'),
        stopSpecOnExpectationFailure: queryString.getParam(
            'stopSpecOnExpectationFailure'
        ),
        hideDisabled: queryString.getParam('hideDisabled')
    };

    var random = queryString.getParam('random');

    if (random !== undefined && random !== '') {
        config.random = random;
    }

    var seed = queryString.getParam('seed');
    if (seed) {
        config.seed = seed;
    }

    /**
     * ## Reporters
     * The `HtmlReporter` builds all of the HTML UI for the runner page. This reporter paints the dots, stars, and x's for specs, as well as all spec names and all failures (if any).
     */
    var htmlReporter = new jasmine.HtmlReporter({
        env: env,
        navigateWithNewParam: function (key, value) {
            return queryString.navigateWithNewParam(key, value);
        },
        addToExistingQueryString: function (key, value) {
            return queryString.fullStringWithNewParam(key, value);
        },
        getContainer: function () {
            return document.body;
        },
        createElement: function () {
            return document.createElement.apply(document, arguments);
        },
        createTextNode: function () {
            return document.createTextNode.apply(document, arguments);
        },
        timer: new jasmine.Timer(),
        filterSpecs: filterSpecs
    });

    /**
     * The `jsApiReporter` also receives spec results, and is used by any environment that needs to extract the results  from JavaScript.
     */
    env.addReporter(jsApiReporter);
    env.addReporter(htmlReporter);

    /**
     * Filter which specs will be run by matching the start of the full name against the `spec` query param.
     * Don't override the specFilter unless the query param exists since it may be provided by external config.
     */
    var specQueryParam = queryString.getParam("spec")
    if (specQueryParam) {
        var specFilter = new jasmine.HtmlSpecFilter({
            filterString: function () {
                return specQueryParam;
            }
        });

        config.specFilter = function (spec) {
            return specFilter.matches(spec.getFullName());
        };
    }

    env.configure(config);

    /**
     * ## Execution
     *
     * Replace the browser window's `onload`, ensure it's called, and then run all of the loaded specs. This includes initializing the `HtmlReporter` instance and then executing the loaded Jasmine environment. All of this will happen after all of the specs are loaded.
     */
    htmlReporter.initialize();
})();
