import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function POST(request: Request) {
  try {
    const { email, password, mfa } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    const projectRoot = path.resolve(process.cwd(), '..');
    const pythonScript = path.join(projectRoot, 'auth_garmin.py');
    const venvPython = path.join(projectRoot, '.venv', 'bin', 'python3');

    let command = `"${venvPython}" "${pythonScript}" --email "${email}" --password "${password}"`;
    if (mfa) {
      command += ` --mfa "${mfa}"`;
    }

    console.log(`Executing Garmin auth script: ${command}`);

    try {
      const { stdout, stderr } = await execPromise(command, {
        cwd: projectRoot,
      });

      console.log('Auth script output:', stdout);
      const result = JSON.parse(stdout);
      return NextResponse.json(result);

    } catch (error: any) {
      // Check for MFA required exit code (10)
      if (error.code === 10) {
        try {
            const result = JSON.parse(error.stdout);
            return NextResponse.json(result);
        } catch (e) {
            return NextResponse.json({ success: false, mfa_required: true, error: 'MFA required' });
        }
      }

      console.error('Auth script error:', error.stderr || error.message);
      try {
          const result = JSON.parse(error.stdout);
          return NextResponse.json(result, { status: 500 });
      } catch (e) {
          return NextResponse.json({ success: false, error: error.stderr || error.message }, { status: 500 });
      }
    }
  } catch (error: any) {
    console.error('Failed to trigger login:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
