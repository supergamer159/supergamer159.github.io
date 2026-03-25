# Ashen Reliquary Site

This repo contains a static site for the `Ashen Reliquary` game design presentation.

## Repo Layout

- `docs/`
  - GitHub Pages-ready site
  - This is the easiest folder to publish
- `index.html`, `styles.css`, `script.js`
  - Working source files at the repo root
- `2D Pixel Dungeon Asset Pack/`
  - Provided dungeon art pack
- `Enemy_Animations_Set/`
  - Provided enemy animation pack
- `sync-docs.ps1`
  - Copies the root site files and asset folders into `docs/`

## Quick GitHub Setup

1. Create a new GitHub repository.
2. Upload or push this whole folder.
3. In GitHub, open `Settings > Pages`.
4. Under `Build and deployment`, choose:
   - `Source`: `Deploy from a branch`
   - `Branch`: your default branch
   - `Folder`: `/docs`
5. Save.

GitHub Pages will publish the site from the `docs/` folder.

## Updating The Site Later

If you edit the root `index.html`, `styles.css`, or `script.js`, run:

```powershell
.\sync-docs.ps1
```

That refreshes the `docs/` copy so GitHub Pages stays up to date.

## Local Preview

You can open `docs/index.html` directly in a browser, or run any simple static file server from the repo root.

## Notes

- The site uses relative paths, so it works from a normal GitHub Pages project URL.
- The asset folders are already included in `docs/`, so the published version is self-contained.
