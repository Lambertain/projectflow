const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Временно переименовываем папку api
const apiPath = path.join(__dirname, 'src/app/api');
const apiBackupPath = path.join(__dirname, 'src/app/api.backup');

console.log('Backing up API folder...');
if (fs.existsSync(apiPath)) {
  fs.renameSync(apiPath, apiBackupPath);
}

// Используем конфигурацию для GitHub Pages
console.log('Building static version...');
try {
  execSync('cp next.config.github.mjs next.config.mjs', { stdio: 'inherit' });
  execSync('npm run build', { stdio: 'inherit' });
} catch (error) {
  console.error('Build failed:', error);
} finally {
  // Восстанавливаем API папку
  console.log('Restoring API folder...');
  if (fs.existsSync(apiBackupPath)) {
    if (fs.existsSync(apiPath)) {
      fs.rmSync(apiPath, { recursive: true });
    }
    fs.renameSync(apiBackupPath, apiPath);
  }
  
  // Восстанавливаем оригинальную конфигурацию
  execSync('git checkout next.config.mjs', { stdio: 'inherit' });
}