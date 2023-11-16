module.exports = function override(config, env) {
  config.optimization.minimize = false;
  const gifRule = config.module.rules[1].oneOf.find((r) => {
    return r.test.some((t) => t.test('.gif'));
  });
  if (gifRule) {
    gifRule.parser.dataUrlCondition.maxSize = 100000;
  }
  return config;
};
