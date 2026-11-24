use tauri::Manager;

/// Keychain items the webview may use: the Supabase session and the site
/// access token. Nothing else in the Keychain is reachable from the page.
const SECRET_SERVICE: &str = "app.nanoscaleatlas.desktop";
const SECRET_KEYS: [&str; 2] = ["session", "access"];

fn entry(key: &str) -> Result<keyring::Entry, String> {
  if !SECRET_KEYS.contains(&key) {
    return Err("unknown secret".into());
  }
  keyring::Entry::new(SECRET_SERVICE, key).map_err(|e| e.to_string())
}

#[tauri::command]
fn secret_get(key: String) -> Result<Option<String>, String> {
  match entry(&key)?.get_password() {
    Ok(v) => Ok(Some(v)),
    Err(keyring::Error::NoEntry) => Ok(None),
    Err(e) => Err(e.to_string()),
  }
}

#[tauri::command]
fn secret_set(key: String, value: String) -> Result<(), String> {
  if value.len() > 64 * 1024 {
    return Err("secret too large".into());
  }
  entry(&key)?.set_password(&value).map_err(|e| e.to_string())
}

#[tauri::command]
fn secret_delete(key: String) -> Result<(), String> {
  match entry(&key)?.delete_credential() {
    Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
    Err(e) => Err(e.to_string()),
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    // updates come from the latest GitHub Release (signed; see README "Releases")
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_process::init())
    .invoke_handler(tauri::generate_handler![secret_get, secret_set, secret_delete])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      // The window follows the system light/dark appearance. NANOSCALE_FORCE_THEME=light|dark
      // overrides it for this window only (used to screenshot both without touching
      // System Settings).
      if let (Some(win), Ok(theme)) = (app.get_webview_window("main"), std::env::var("NANOSCALE_FORCE_THEME")) {
        let t = match theme.as_str() {
          "light" => Some(tauri::Theme::Light),
          "dark" => Some(tauri::Theme::Dark),
          _ => None,
        };
        win.set_theme(t)?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
