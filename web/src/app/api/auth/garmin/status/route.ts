import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function GET() {
  try {
    const projectRoot = path.resolve(process.cwd(), '..');
    const pythonScript = path.join(projectRoot, 'check_garmin_status.py');
    const venvPython = path.join(projectRoot, '.venv', 'bin', 'python3');

    console.log(`Checking Garmin session status: ${venvPython} ${pythonScript}`);

    try {
      const { stdout } = await execPromise(`"${venvPython}" "${pythonScript}"`, {
        cwd: projectRoot,
      });

      console.log('Status script output:', stdout);
      const result = JSON.parse(stdout);
      return NextResponse.json(result);

    } catch (error: unknown) {
      const err = error as { stderr?: string; message?: string };
      console.error('Status script error:', err.stderr || err.message);
      return NextResponse.json({ success: false, authenticated: false, error: 'Failed to check status' }, { status: 500 });
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Failed to trigger status check:', err);
    return NextResponse.json({ success: false, authenticated: false, error: err.message }, { status: 500 });
  }
}
