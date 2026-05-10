var jasmineCore = require('jasmine-core');

var JASMINE_CORE_PATTERN = /([\\/]karma-jasmine[\\/])/i;
var createPattern = function (path) {
  return { pattern: path, included: true, served: true, watched: false };
};

var initReporter = function (karmaConfig, baseReporterDecorator) {
  var jasmineCoreIndex = 0;

  const files = karmaConfig.files;

  baseReporterDecorator(this);

  if (karmaConfig.jasmineHtmlReporter) {
    const config = karmaConfig.jasmineHtmlReporter;
    if (config.suppressAll) {
      this.onSpecComplete = () => void 0;
      this.onRunComplete = () => void 0;
    }
    if (config.suppressFailed) {
      this.specFailure = () => void 0;
    }
  }

  files.forEach(function (file, index) {
    if (JASMINE_CORE_PATTERN.test(file.pattern)) {
      jasmineCoreIndex = index;
    }
  });

  jasmineCore.files.cssFiles.forEach(function (file) {
    files.splice(++jasmineCoreIndex, 0, createPattern(jasmineCore.files.path + '/' + file));
  });

  jasmineCore.files.jsFiles.forEach(function (file) {
    // Avoid jasmine.js as it's already included by karma-jasmine
    if (file == "jasmine.js") {
      return;
    }

    files.splice(++jasmineCoreIndex, 0, createPattern(jasmineCore.files.path + '/' + file));
  });

  files.splice(++jasmineCoreIndex, 0, createPattern(jasmineCore.files.bootDir + '/boot0.js'));
  files.splice(++jasmineCoreIndex, 0, createPattern(__dirname + '/boot.js'));
};

initReporter.$inject = ['config', 'baseReporterDecorator'];

module.exports = {
  'reporter:kjhtml': ['type', initReporter]
};
