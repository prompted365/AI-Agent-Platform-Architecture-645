import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const buildDir = 'dist-server';

if (!existsSync(buildDir)) {
  mkdirSync(buildDir, { recursive: true });
}

// Create a simple build script for server
const packageJson = {
  name: 'claude-code-server',
  version: '1.0.0',
  type: 'module',
  main: 'index.js',
  scripts: {
    start: 'node index.js'
  },
  dependencies: {
    express: '^4.18.2',
    'socket.io': '^4.7.4',
    cors: '^2.8.5',
    helmet: '^7.1.0',
    'express-rate-limit': '^7.1.5',
    dotenv: '^16.3.1',
    axios: '^1.6.2',
    uuid: '^9.0.1',
    ws: '^8.14.2'
  }
};

writeFileSync(join(buildDir, 'package.json'), JSON.stringify(packageJson, null, 2));

console.log('Server build configuration created');