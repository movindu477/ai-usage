use rusqlite::Connection;
use std::sync::{Arc, Mutex};

pub struct AppState {
    pub conn: Arc<Mutex<Connection>>,
    pub client: reqwest::Client,
}
