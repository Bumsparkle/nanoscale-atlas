use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    // updates come from the latest GitHub Release (signed; see README "Releases")
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_process::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      // The window follows the system light/dark appearance. ATLAS_FORCE_THEME=light|dark
      // overrides it for this window only (used to screenshot both without touching
      // System Settings).
      if let (Some(win), Ok(theme)) = (app.get_webview_window("main"), std::env::var("ATLAS_FORCE_THEME")) {
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
