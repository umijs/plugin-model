
module.exports = {
  collectCoverageFrom: [
    `src/**/*.{js,jsx,ts,tsx}`,
    '!**/fixtures/**',
  ],
  coveragePathIgnorePatterns: [
    '/test',
  ],
}
