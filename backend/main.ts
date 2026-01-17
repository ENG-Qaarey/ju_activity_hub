// Compatibility entrypoint.
// Some tooling expects the compiled entry to exist at dist/main(.js).
// The real NestJS bootstrap lives in src/main.ts.
import './src/main';
