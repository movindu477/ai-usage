pub mod plan_queries;
pub mod queries;
pub mod schema;
pub mod settings_queries;
pub mod types;
pub mod usage_queries;

#[cfg(test)]
mod tests;

use rusqlite::Connection;
use std::path::PathBuf;
use std::sync::Mutex;

pub struct DbState {
    pub conn: Mutex<Connection>,
}

pub fn open_db(app_data: Option<PathBuf>) -> Result<Connection, rusqlite::Error> {
    let db_path = if let Some(dir) = app_data {
        std::fs::create_dir_all(&dir).ok();
        dir.join("usage.db")
    } else {
        PathBuf::from("usage.db")
    };

    let conn = Connection::open(db_path)?;
    schema::init_tables(&conn)?;
    Ok(conn)
}
