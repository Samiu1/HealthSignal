import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function POST() {
  try {
    // The project root is one level up from the 'web' directory where 'npm run dev' is usually run,
    // or relative to the current file path.
    // Dashboard is in web/src/app/api/sync/garmin/route.ts
    // Project root (where fetch_live.py is) is ../../../../../../ relative to this file
    // But since we are running via 'npm run dev' from the 'web' directory, 
    // the working directory is likely the 'web' folder.
    const projectRoot = path.resolve(process.cwd(), '..');
    const pythonScript = path.join(projectRoot, 'fetch_live.py');

    // We use the virtual environment's python to ensure all dependencies like langgraph are available
    const venvPython = path.join(projectRoot, '.venv', 'bin', 'python3');
    console.log(`Executing Garmin sync script: ${venvPython} ${pythonScript}`);

    const { stdout, stderr } = await execPromise(`"${venvPython}" "${pythonScript}"`, {
      cwd: projectRoot,
      env: { ...process.env } // Pass environment variables (GARMIN_EMAIL, etc.)
    });

    if (stderr && !stdout) {
      console.error('Sync script error:', stderr);
      return NextResponse.json({ success: false, error: stderr }, { status: 500 });
    }

    console.log('Sync script output:', stdout);
    return NextResponse.json({ success: true, message: 'Sync completed successfully', output: stdout });
  } catch (error: any) {
    console.error('Failed to trigger sync:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
