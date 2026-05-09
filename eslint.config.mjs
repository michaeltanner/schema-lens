// eslint.config.mjs
import nextVitals from 'eslint-config-next/core-web-vitals';
import { globalIgnores } from 'eslint/config';

const config = [
    ...nextVitals,
    globalIgnores([
        '.next/**',
        'out/**',
        'build/**',
    ]),
];

export default config;