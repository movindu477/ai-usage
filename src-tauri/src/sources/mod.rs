pub mod antigravity;
pub mod claude_credentials;
pub mod claude_jsonl;
pub mod claude_usage;
pub mod media;
pub mod network;

use rusqlite::Connection;
use std::sync::{Arc, Mutex};

pub fn start_polling_tasks(_conn: Arc<Mutex<Connection>>, _client: reqwest::Client) {
    // AI quota polling disabled after pivot to System Monitor widget.
}
