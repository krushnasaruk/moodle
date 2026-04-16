const fs = require('fs-extra');
const archiver = require('archiver');
const path = require('path');

async function packStandaloneCPanel() {
  const rootDir = __dirname;
  const standaloneDir = path.join(rootDir, '.next', 'standalone');
  const deployZipPath = path.join(rootDir, '..', 'cpanel-deploy.zip');

  if (!fs.existsSync(standaloneDir)) {
    console.error("Standalone directory doesn't exist. Did you run 'npm run build' with output: 'standalone'?");
    return;
  }

  console.log("Preparing Cloudlinux/cPanel compatible standalone build...");
  
  // Copy public folder to standalone
  if (fs.existsSync(path.join(rootDir, 'public'))) {
    await fs.copy(
      path.join(rootDir, 'public'),
      path.join(standaloneDir, 'public')
    );
  }

  // Copy .next/static folder to standalone/.next/static
  if (fs.existsSync(path.join(rootDir, '.next', 'static'))) {
    await fs.copy(
      path.join(rootDir, '.next', 'static'),
      path.join(standaloneDir, '.next', 'static')
    );
  }

  console.log("Zipping directory structured for cPanel...");
  
  const output = fs.createWriteStream(deployZipPath);
  const archive = archiver('zip', {
    zlib: { level: 9 }
  });

  output.on('close', function() {
    console.log(`\nDeployment package ready: ${deployZipPath}`);
    console.log(archive.pointer() + ' total bytes');
  });

  archive.on('error', function(err) {
    throw err;
  });

  archive.pipe(output);

  // We are going to place all standalone files into a folder called `next-app` inside the zip.
  // This bypasses the Cloudlinux restriction since `node_modules` won't be at the root.
  archive.directory(standaloneDir, 'next-app');

  // We add a root `server.js` that simply requires the standalone server
  const rootServerJs = `
// This is the root file for cPanel Cloudlinux
// It forwards the execution to the Next.js standalone application inside the next-app folder
require('./next-app/server.js');
`;
  archive.append(rootServerJs, { name: 'server.js' });

  archive.finalize();
}

packStandaloneCPanel().catch(console.error);
