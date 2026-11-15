import { useEffect, useState } from 'react';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export function useAutoUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState<Update | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [updateProgress, setUpdateProgress] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    async function checkForUpdates() {
      try {
        const update = await check();
        if (update && isMounted) {
          console.log(`Found update ${update.version}. Downloading...`);
          setUpdateAvailable(update);
          setIsUpdating(true);
          setUpdateProgress(`Updating to v${update.version}...`);
          await update.downloadAndInstall((event) => {
            if (event.event === 'Finished') {
              console.log('Download complete. Restarting...');
              setUpdateProgress('Restarting...');
            }
          });
          await relaunch();
        }
      } catch (error) {
        console.error('Update check failed:', error);
      }
    }

    // Check 3 seconds after the app opens (let UI load first)
    const timer = setTimeout(checkForUpdates, 3000);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  return { updateAvailable, isUpdating, updateProgress };
}
