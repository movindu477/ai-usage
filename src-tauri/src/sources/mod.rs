pub mod antigravity;
pub mod claude_credentials;
pub mod claude_jsonl;
pub mod claude_usage;
pub mod media;
pub mod network;

use rusqlite::Connection;
use std::sync::{Arc, Mutex};
use std::time::Duration;

pub fn start_polling_tasks(conn: Arc<Mutex<Connection>>, client: reqwest::Client) {
    // 1. Claude Quota Poller (remote usage every 60s, local jsonl every 30s)
    let c1 = Arc::clone(&conn);
    let cl1 = client.clone();
    tauri::async_runtime::spawn(async move {
        let _ = claude_usage::fetch_and_save_claude_usage(&cl1, &c1).await;
        let _ = claude_jsonl::import_claude_jsonl_files(&c1);

        let mut counter = 0u32;
        loop {
            tokio::time::sleep(Duration::from_secs(30)).await;
            counter += 30;
            let _ = claude_jsonl::import_claude_jsonl_files(&c1);
            if counter >= 60 {
                counter = 0;
                let _ = claude_usage::fetch_and_save_claude_usage(&cl1, &c1).await;
            }
        }
    });

    // 2. Antigravity Quota Poller (local Connect-RPC every 60s)
    let c2 = Arc::clone(&conn);
    let cl2 = client.clone();
    tauri::async_runtime::spawn(async move {
        let _ = antigravity::fetch_and_save_antigravity_status(&cl2, &c2).await;

        loop {
            tokio::time::sleep(Duration::from_secs(60)).await;
            let _ = antigravity::fetch_and_save_antigravity_status(&cl2, &c2).await;
        }
    });
}
