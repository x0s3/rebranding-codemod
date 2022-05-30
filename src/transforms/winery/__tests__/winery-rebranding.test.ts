const defineTest = require('jscodeshift/dist/testUtils').defineTest;

const TRANSFORM_NAME = 'winery-rebranding';

const fixtures = [
  'winery-rebranding-basic',
  /* 'winery-rebranding-with-babel-plugin', */
];

fixtures.forEach((fixture) =>
  defineTest(__dirname, TRANSFORM_NAME, null, `${TRANSFORM_NAME}/${fixture}`)
);

export {};
