import { spawn } from 'child_process';
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export class SandboxService {
  constructor() {
    this.sandboxDir = join(process.cwd(), 'sandbox');
    this.ensureSandboxDir();
  }

  ensureSandboxDir() {
    if (!existsSync(this.sandboxDir)) {
      mkdirSync(this.sandboxDir, { recursive: true });
    }
  }

  async executeCode(code, language, environment = {}) {
    const sessionId = uuidv4();
    const sessionDir = join(this.sandboxDir, sessionId);
    
    try {
      mkdirSync(sessionDir, { recursive: true });
      
      const result = await this.runCode(code, language, sessionDir, environment);
      
      return {
        sessionId,
        success: true,
        output: result.output,
        error: result.error,
        executionTime: result.executionTime,
        exitCode: result.exitCode
      };
    } catch (error) {
      return {
        sessionId,
        success: false,
        error: error.message,
        executionTime: 0,
        exitCode: 1
      };
    } finally {
      // Cleanup
      setTimeout(() => {
        if (existsSync(sessionDir)) {
          rmSync(sessionDir, { recursive: true, force: true });
        }
      }, 5000);
    }
  }

  async runCode(code, language, sessionDir, environment) {
    const startTime = Date.now();
    
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        return this.runJavaScript(code, sessionDir, environment);
      case 'python':
      case 'py':
        return this.runPython(code, sessionDir, environment);
      case 'bash':
      case 'sh':
        return this.runBash(code, sessionDir, environment);
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  async runJavaScript(code, sessionDir, environment) {
    const filename = join(sessionDir, 'script.js');
    writeFileSync(filename, code);
    
    return new Promise((resolve, reject) => {
      const child = spawn('node', [filename], {
        cwd: sessionDir,
        env: { ...process.env, ...environment },
        timeout: 30000 // 30 second timeout
      });

      let output = '';
      let error = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        error += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          output,
          error,
          exitCode: code,
          executionTime: Date.now() - Date.now()
        });
      });

      child.on('error', (err) => {
        reject(err);
      });
    });
  }

  async runPython(code, sessionDir, environment) {
    const filename = join(sessionDir, 'script.py');
    writeFileSync(filename, code);
    
    return new Promise((resolve, reject) => {
      const child = spawn('python3', [filename], {
        cwd: sessionDir,
        env: { ...process.env, ...environment },
        timeout: 30000
      });

      let output = '';
      let error = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        error += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          output,
          error,
          exitCode: code,
          executionTime: Date.now() - Date.now()
        });
      });

      child.on('error', (err) => {
        reject(err);
      });
    });
  }

  async runBash(code, sessionDir, environment) {
    const filename = join(sessionDir, 'script.sh');
    writeFileSync(filename, code);
    
    return new Promise((resolve, reject) => {
      const child = spawn('bash', [filename], {
        cwd: sessionDir,
        env: { ...process.env, ...environment },
        timeout: 30000
      });

      let output = '';
      let error = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        error += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          output,
          error,
          exitCode: code,
          executionTime: Date.now() - Date.now()
        });
      });

      child.on('error', (err) => {
        reject(err);
      });
    });
  }

  async createEnvironment(config) {
    const envId = uuidv4();
    const envDir = join(this.sandboxDir, 'environments', envId);
    
    try {
      mkdirSync(envDir, { recursive: true });
      
      // Install dependencies based on config
      if (config.dependencies) {
        await this.installDependencies(envDir, config.dependencies, config.language);
      }
      
      return {
        id: envId,
        path: envDir,
        config
      };
    } catch (error) {
      throw new Error(`Failed to create environment: ${error.message}`);
    }
  }

  async installDependencies(envDir, dependencies, language) {
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        return this.installNpmDependencies(envDir, dependencies);
      case 'python':
      case 'py':
        return this.installPipDependencies(envDir, dependencies);
      default:
        throw new Error(`Dependency installation not supported for ${language}`);
    }
  }

  async installNpmDependencies(envDir, dependencies) {
    const packageJson = {
      name: 'sandbox-env',
      version: '1.0.0',
      dependencies
    };
    
    writeFileSync(join(envDir, 'package.json'), JSON.stringify(packageJson, null, 2));
    
    return new Promise((resolve, reject) => {
      const child = spawn('npm', ['install'], {
        cwd: envDir,
        stdio: 'inherit'
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`npm install failed with code ${code}`));
        }
      });

      child.on('error', (err) => {
        reject(err);
      });
    });
  }

  async installPipDependencies(envDir, dependencies) {
    const requirementsTxt = Object.keys(dependencies).map(dep => 
      `${dep}${dependencies[dep] ? `==${dependencies[dep]}` : ''}`
    ).join('\n');
    
    writeFileSync(join(envDir, 'requirements.txt'), requirementsTxt);
    
    return new Promise((resolve, reject) => {
      const child = spawn('pip', ['install', '-r', 'requirements.txt'], {
        cwd: envDir,
        stdio: 'inherit'
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`pip install failed with code ${code}`));
        }
      });

      child.on('error', (err) => {
        reject(err);
      });
    });
  }
}