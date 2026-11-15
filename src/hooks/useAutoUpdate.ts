import { useEffect, useState } from 'react';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export function useAutoUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState<Update | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [updateProgress, setUpdateProgress] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const runCheck = async () => {
      try {
        const update = await check();
        if (update && isMounted) {
          setUpdateAvailable(update);
          setIsUpdating(true);
          setUpdateProgress(`Updating to v${update.version}...`);
          await update.downloadAndInstall((event) => {
            if (event.event === 'Finished') {
              setUpdateProgress('Restarting...');
            }
          });
          await relaunch();
        }
      } catch (err) {
        console.warn('Updater check error:', err);
      }
    };

    const timer = setTimeout(runCheck, 5000);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  return { updateAvailable, isUpdating, updateProgress };
}
