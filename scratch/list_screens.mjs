import { stitch } from '@google/stitch-sdk';
import fs from 'fs/promises';
import path from 'path';

async function loadEnv() {
  try {
    const envPath = path.resolve('.env');
    const content = await fs.readFile(envPath, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || '';
        if (val.length > 0 && val.charAt(0) === '"' && val.charAt(val.length - 1) === '"') {
          val = val.substring(1, val.length - 1);
        } else if (val.length > 0 && val.charAt(0) === "'" && val.charAt(val.length - 1) === "'") {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val.trim();
      }
    }
  } catch (e) {
    console.warn('Could not load .env file manually:', e.message);
  }
}

const projectId = '13734855967587627231';

async function main() {
  await loadEnv();
  
  const proj = stitch.project(projectId);
  
  // Let's print out all properties/methods of proj
  console.log('Project properties:', Object.getOwnPropertyNames(Object.getPrototypeOf(proj)));
  
  try {
    // Try standard listScreens or screens method
    if (typeof proj.screens === 'function') {
      const screens = await proj.screens();
      console.log('Screens (via screens()):', screens);
    } else if (typeof proj.listScreens === 'function') {
      const screens = await proj.listScreens();
      console.log('Screens (via listScreens()):', screens);
    } else if (typeof proj.getScreens === 'function') {
      const screens = await proj.getScreens();
      console.log('Screens (via getScreens()):', screens);
    } else {
      console.log('No direct screens listing method found on project object.');
    }
  } catch (e) {
    console.error('Error listing screens:', e);
  }
}

main().catch(console.error);
