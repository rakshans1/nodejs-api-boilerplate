require('dotenv').config();

const npsUtils = require('nps-utils');

const {
  rimraf,
  crossEnv,
  series,
  concurrent
} = npsUtils;

module.exports = {
  scripts: {
    build: {
      description: 'Building in production environment.',
      default: `${crossEnv('NODE_ENV=production')} babel --out-dir=dist ./src`,
      withClean: series.nps('clean', 'build'),
    },
    clean: {
      description: 'Clean dist folder.',
      default: rimraf('dist'),
    },
    default: {
      description: 'Start project with pm2 on production.',
      script: `yarn build && ${crossEnv('NODE_ENV=production')} pm2 dist`,
    },
    doc: {
      description: 'Documenting the api.',
      default: 'apidoc -i src',
      deploy: {
        description: 'Deploy the docs on surge.',
        script: series('nps doc', `surge ./doc -d ${process.env.DOCS_WEBSITE}`),
      },
    },
    dev: {
      start: {
        description: 'Running on dev environment.',
        script: `${crossEnv('NODE_ENV=development')} nodemon dist`,
      },
      default: {
        script: concurrent.nps('dev.watch', 'dev.start'),
      },
      watch: {
        description: 'Babel watch for change and compile.',
        script: 'babel -w --out-dir=dist ./src',
      },
      withDebug: {
        script: `${crossEnv('NODE_ENV=development')} MONGOOSE_DEBUG=true DEBUG=express:* nodemon dist`,
      },
      debug: {
        description: 'Running on dev environment with debug on.',
        script: concurrent.nps('dev.watch', 'dev.withDebug'),
      },
    },
    lint: {
      default: 'eslint src',
      fix: 'eslint --fix src',
    },
    lintStaged: 'lint-staged',
    db: {
      seedsUser: 'bash ./scripts/seeds/user.seed.sh',
      seedsClearUser: 'bash ./scripts/seeds/clearUser.seed.sh',
      seedsClear: 'bash ./scripts/seeds/clearAll.seed.sh',
    },
    test: {
      default: `${crossEnv('NODE_ENV=test')} mocha $(find __tests__ -name *.test.js) --colors --compilers js:babel-register`,
      watch: series.nps('test -w'),
      cover: `${crossEnv('NODE_ENV=test')} istanbul cover _mocha $(find __tests__ -name *.test.js) -- --compilers js:babel-register --colors --bail --recursive '__tests__/**/*.test.js'`,
      checkCover: series('nps test.cover', 'istanbul check-coverage'),
    },
    cover: {
      description: 'Open the coverage on browser.',
      default: 'open coverage/lcov-report/*.html',
    },
    reportCoverage: {
      description: 'Send report to coveralls.',
      default: 'coveralls < ./coverage/lcov.info'
    },
    commit: {
      description: 'Commit with commitizen',
      default: 'git-cz'
    },
    release: {
      description: 'We automate releases with semantic-release. This should only be run on travis',
      script: series(
        'semantic-release pre',
        'npm publish',
        'semantic-release post'
      ),
    },
    validate: {
      description: 'Validate code by linting, type-checking.',
      default: series.nps('lint', 'test', 'doc.deploy'),
    },
  },
};