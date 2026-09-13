import { createJiti } from 'jiti';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jiti = createJiti(process.cwd());

jiti(path.resolve(__dirname, 'text-normalizer.test.ts'));

