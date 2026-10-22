// Expo's web-only styles are valid imports even when TypeScript checks the native app.
declare module '*.css';
declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}
