import { stitch } from '@google/stitch-sdk';
import fs from 'fs/promises';
import path from 'path';

// Dependency-free manually parse .env file
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
        // Remove quotes if present
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
const screens = [
  { name: 'dashboard', id: '369668301ccd41f69c2946be5e452beb' },
  { name: 'design_system', id: 'asset-stub-assets-c411d93823d04af98446e7e9f0570ab5-1780003177223' },
  { name: 'editor', id: '1c0f37f0dabd41dea16a3bbf6821bfc4' },
  { name: 'landing', id: 'f8ccf24913f648cdb97a711bc318b8b2' }
];

async function downloadText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
  return res.text();
}

async function downloadBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
}

async function main() {
  await loadEnv();

  const outDir = './scratch/stitch';
  await fs.mkdir(outDir, { recursive: true });

  console.log(`Using API Key: ${process.env.STITCH_API_KEY ? 'Detected' : 'Not Detected'}`);
  
  // The SDK automatically uses process.env.STITCH_API_KEY
  const proj = stitch.project(projectId);

  for (const s of screens) {
    console.log(`\n--- Processing screen: ${s.name} (${s.id}) ---`);
    try {
      const screenObj = await proj.getScreen(s.id);
      
      console.log(`Getting HTML download URL for ${s.name}...`);
      const htmlUrl = await screenObj.getHtml();
      console.log(`HTML URL: ${htmlUrl}`);
      if (htmlUrl) {
        console.log(`Downloading HTML for ${s.name}...`);
        const html = await downloadText(htmlUrl);
        await fs.writeFile(path.join(outDir, `${s.name}.html`), html, 'utf-8');
      }

      console.log(`Getting image download URL for ${s.name}...`);
      const imageUrl = await screenObj.getImage();
      console.log(`Image URL: ${imageUrl}`);
      if (imageUrl) {
        console.log(`Downloading screenshot for ${s.name}...`);
        const buf = await downloadBuffer(imageUrl);
        await fs.writeFile(path.join(outDir, `${s.name}.png`), buf);
      }
      
      console.log(`Successfully completed screen: ${s.name}`);
    } catch (e) {
      console.error(`Error processing screen ${s.name}:`, e);
    }
  }
}

main().catch(console.error);
