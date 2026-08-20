# Gangadhara Nursery Desktop Application

Electron-based desktop application wrapper for Gangadhara Nursery Business Management system, built using the React production output from `frontend/dist/`.

## Development

Run the app in desktop window during development:

```bash
cd desktop
npm start
```

*(Note: Ensure `frontend/dist` is built via `npm run build` in `frontend` directory, or Vite dev server is running on port 5173).*

## Building Executable (.exe Installer)

To generate standalone Windows `.exe` installer and portable app:

```bash
cd desktop
npm run dist
```

Generated installer will be located in: `desktop/dist-app/`
