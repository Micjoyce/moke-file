import { v4 } from 'uuid';
import { exec, ExecOptions } from 'child_process';

export default {
  getRandomId() {
    return v4().replace(/-/g, '');
  },
  execCmd(cmd: string, options?: {
    encoding: 'buffer' | null;
  } & ExecOptions) {
    console.info('run cmd:', cmd);
    return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
      exec(cmd, options, (err: any, stdout, stderr) => {
        if (err) {
          err.stdout = stdout;
          err.stderr = stderr;
          console.info('stdout: ' + stdout);
          console.info('stderr: ' + stderr);
          return reject(err);
        }
        console.info('stdout: ' + stdout);
        console.info('stderr: ' + stderr);
        resolve({ stdout: String(stdout), stderr: String(stdout) });
      });
    });
  },
};
