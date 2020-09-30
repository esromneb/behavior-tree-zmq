// module.exports = {
//   testEnvironment: 'node',
//   testPathIgnorePatterns: [
//     '/node_modules/',
//   ],
//   preset: 'ts-jest',
// };



module.exports = {
  "transform": {
    ".(ts|tsx)": "ts-jest",
    "\\.xml$": "jest-raw-loader"
  },
  "testRegex": "(/test/.*|\\.(test|spec))\\.(ts|tsx|js)$",
  "moduleFileExtensions": [
    "ts",
    "tsx",
    "js"
  ],
  // added because I have a data/data.ts file which has no tests
  // without this I get an error
  "modulePathIgnorePatterns": ["test/data"],
  "watchPlugins": [
      "jest-watch-typeahead/filename",
      "jest-watch-typeahead/testname"
    ]
};
