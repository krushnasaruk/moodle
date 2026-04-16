const fs = require('fs-extra');
const archiver = require('archiver');
const path = require('path');

async function packStandalone() {
  const rootDir = __dirname;
  const standaloneDir = path.join(rootDir, '.next', 'standalone');
  const deployZipPath = path.join(rootDir, '..', 'standalone-deploy.zip');

  if (!fs.existsSync(standaloneDir)) {
    console.error("Standalone directory doesn't exist. Did you run 'npm run build' with output: 'standalone'?");
    return;
  }

  console.log("Preparing standalone build...");
  
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

  console.log("Zipping standalone directory...");
  
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

  // Add all files from standaloneDir into the root of the zip
  archive.directory(standaloneDir, false);

  archive.finalize();
}

packStandalone().catch(console.error);
