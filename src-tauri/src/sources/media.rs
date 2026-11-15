use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaSessionInfo {
    pub has_session: bool,
    pub is_playing: bool,
    pub title: String,
    pub artist: String,
    pub album_title: String,
    pub album_art: Option<String>,
    pub position_secs: u64,
    pub duration_secs: u64,
    pub source_app: String,
}

impl Default for MediaSessionInfo {
    fn default() -> Self {
        Self {
            has_session: false,
            is_playing: false,
            title: String::new(),
            artist: String::new(),
            album_title: String::new(),
            album_art: None,
            position_secs: 0,
            duration_secs: 0,
            source_app: String::new(),
        }
    }
}

#[cfg(windows)]
pub fn get_current_media_session() -> MediaSessionInfo {
    use base64::Engine;
    use windows::Media::Control::{
        GlobalSystemMediaTransportControlsSessionManager,
        GlobalSystemMediaTransportControlsSessionPlaybackStatus,
    };
    use windows::Storage::Streams::DataReader;

    let manager = match GlobalSystemMediaTransportControlsSessionManager::RequestAsync()
        .and_then(|op| op.get())
    {
        Ok(m) => m,
        Err(_) => return MediaSessionInfo::default(),
    };

    let session = match manager.GetCurrentSession() {
        Ok(s) => s,
        Err(_) => return MediaSessionInfo::default(),
    };

    let source_app = session
        .SourceAppUserModelId()
        .map(|s| s.to_string_lossy())
        .unwrap_or_default();

    let is_playing = session
        .GetPlaybackInfo()
        .and_then(|info| info.PlaybackStatus())
        .map(|status| status == GlobalSystemMediaTransportControlsSessionPlaybackStatus::Playing)
        .unwrap_or(false);

    let (position_secs, duration_secs) = match session.GetTimelineProperties() {
        Ok(tl) => {
            let pos = tl
                .Position()
                .map(|t| (t.Duration as f64 / 10_000_000.0).max(0.0) as u64)
                .unwrap_or(0);
            let end = tl
                .EndTime()
                .map(|t| (t.Duration as f64 / 10_000_000.0).max(0.0) as u64)
                .unwrap_or(0);
            (pos, end)
        }
        Err(_) => (0, 0),
    };

    let props = match session.TryGetMediaPropertiesAsync().and_then(|op| op.get()) {
        Ok(p) => p,
        Err(_) => {
            return MediaSessionInfo {
                has_session: true,
                is_playing,
                position_secs,
                duration_secs,
                source_app,
                ..Default::default()
            }
        }
    };

    let title = props.Title().map(|s| s.to_string_lossy()).unwrap_or_default();
    let artist = props.Artist().map(|s| s.to_string_lossy()).unwrap_or_default();
    let album_title = props
        .AlbumTitle()
        .map(|s| s.to_string_lossy())
        .unwrap_or_default();

    let mut album_art: Option<String> = None;
    if let Ok(thumb_ref) = props.Thumbnail() {
        if let Ok(stream) = thumb_ref.OpenReadAsync().and_then(|op| op.get()) {
            let size = stream.Size().unwrap_or(0) as u32;
            if size > 0 && size < 4_000_000 {
                if let Ok(input_stream) = stream.GetInputStreamAt(0) {
                    if let Ok(reader) = DataReader::CreateDataReader(&input_stream) {
                        if reader.LoadAsync(size).and_then(|op| op.get()).is_ok() {
                            let mut buf = vec![0u8; size as usize];
                            if reader.ReadBytes(&mut buf).is_ok() {
                                let b64 =
                                    base64::engine::general_purpose::STANDARD.encode(&buf);
                                album_art = Some(format!("data:image/png;base64,{}", b64));
                            }
                        }
                    }
                }
            }
        }
    }

    MediaSessionInfo {
        has_session: !title.is_empty() || !artist.is_empty() || is_playing,
        is_playing,
        title,
        artist,
        album_title,
        album_art,
        position_secs,
        duration_secs,
        source_app,
    }
}

#[cfg(not(windows))]
pub fn get_current_media_session() -> MediaSessionInfo {
    MediaSessionInfo::default()
}

#[cfg(windows)]
pub fn execute_media_control(action: &str) -> Result<bool, String> {
    use windows::Media::Control::GlobalSystemMediaTransportControlsSessionManager;

    let manager = GlobalSystemMediaTransportControlsSessionManager::RequestAsync()
        .and_then(|op| op.get())
        .map_err(|e| e.to_string())?;

    let session = manager.GetCurrentSession().map_err(|e| e.to_string())?;

    let res = match action {
        "play" => session.TryPlayAsync().and_then(|op| op.get()),
        "pause" => session.TryPauseAsync().and_then(|op| op.get()),
        "toggle" => session.TryTogglePlayPauseAsync().and_then(|op| op.get()),
        "next" => session.TrySkipNextAsync().and_then(|op| op.get()),
        "previous" => session.TrySkipPreviousAsync().and_then(|op| op.get()),
        _ => return Err(format!("Unsupported media action: {}", action)),
    };

    res.map_err(|e| e.to_string())
}

#[cfg(not(windows))]
pub fn execute_media_control(_action: &str) -> Result<bool, String> {
    Ok(false)
}
