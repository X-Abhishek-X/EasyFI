// Vite `?raw` imports of CSV test fixtures.
declare module '*.csv?raw' {
  const content: string;
  export default content;
}
