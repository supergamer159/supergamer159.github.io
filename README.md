# Ashen Reliquary

This repo contains a playable HTML roguelite prototype for `Ashen Reliquary`.

## Repo Layout

- `docs/`
  - GitHub Pages-ready copy of the game
  - This is the easiest folder to publish
- `index.html`, `styles.css`
  - Main site shell and UI styling
- `game/`
  - Game code and content data
- `2D Pixel Dungeon Asset Pack/`
  - Provided dungeon art pack
- `Enemy_Animations_Set/`
  - Provided enemy animation pack
- `sync-docs.ps1`
  - Copies the playable build and asset folders into `docs/`

## Quick GitHub Setup

1. Create a new GitHub repository.
2. Upload or push this whole folder.
3. In GitHub, open `Settings > Pages`.
4. Under `Build and deployment`, choose:
   - `Source`: `Deploy from a branch`
   - `Branch`: your default branch
   - `Folder`: `/docs`
5. Save.

GitHub Pages will publish the game from the `docs/` folder.

## Updating The Game Later

If you edit the root `index.html`, `styles.css`, or anything in `game/`, run:

```powershell
.\sync-docs.ps1
```

That refreshes the `docs/` copy so GitHub Pages stays up to date.

## Local Preview

You can open `docs/index.html` directly in a browser, or run any simple static file server from the repo root.

## Notes

- The game uses only relative paths, so it works from a normal GitHub Pages project URL.
- The asset folders and `game/` code are included in `docs/`, so the published version is self-contained.
