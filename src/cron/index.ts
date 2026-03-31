import cron from 'node-cron';
import { config } from '../config/index.js';
import { runPipeline } from '../pipeline/index.js';

console.log(`[Cron] GelGezGor Trend Pipeline zamanlayıcısı başlatılıyor...`);
console.log(`[Cron] Schedule: ${config.CRON_SCHEDULE}`);
console.log(`[Cron] DRY_RUN: ${config.DRY_RUN}`);

let isRunning = false;

const task = cron.schedule(config.CRON_SCHEDULE, async () => {
  if (isRunning) {
    console.log('[Cron] Pipeline zaten çalışıyor, atlanıyor...');
    return;
  }

  isRunning = true;
  console.log(`\n[Cron] Pipeline tetiklendi: ${new Date().toLocaleString('tr-TR')}`);

  try {
    await runPipeline();
  } catch (error: any) {
    console.error('[Cron] Pipeline hatası:', error.message);
  } finally {
    isRunning = false;
  }
}, {
  timezone: 'Europe/Istanbul',
});

console.log('[Cron] Zamanlayıcı aktif. Çıkmak için Ctrl+C basın.');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Cron] Kapatılıyor...');
  task.stop();
  process.exit(0);
});
