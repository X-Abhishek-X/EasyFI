// Deterministic sample data for tests and local demos. Shapes structurally match the types in
// @easyfi/core (this package must not import it). Market data is "as of" 2026-09-30.
export const PACKAGE_NAME = '@easyfi/test-fixtures';
export const FIXTURE_TODAY = '2026-10-22';

export * from './securities';
export * from './fund-holdings';
export * from './prng';
export * from './prices';
export * from './dividends';
export * from './cpi';
export * from './portfolios';
