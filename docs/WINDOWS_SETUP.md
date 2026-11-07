# Run this repository on your Windows laptop

## 1. Use your existing repository folder

If you already cloned `Saumya170501/History-of-India`, open PowerShell in that folder. Do not create a second clone over it. Confirm its identity and check for local work:

```powershell
git remote -v
git status
```

The origin should point to `Saumya170501/History-of-India`. If you have uncommitted changes, preserve them before switching branches. Do not use `reset --hard` or overwrite your work.

Once the prototype branch has been pushed:

```powershell
git fetch origin
git switch codex/historical-atlas-prototype
git pull --ff-only
```

If the branch is not yet local, Git normally creates a tracking branch automatically. If it does not:

```powershell
git switch --track origin/codex/historical-atlas-prototype
```

## 2. Or clone for the first time

Install [Git for Windows](https://git-scm.com/download/win), then run these commands from the parent folder where you want to keep projects:

```powershell
git clone https://github.com/Saumya170501/History-of-India.git
Set-Location History-of-India
git switch codex/historical-atlas-prototype
```

## 3. Install Node.js and start the app

Install [Node.js](https://nodejs.org/en/download), version 22.12 or newer, with npm. Reopen PowerShell after installation.

```powershell
node --version
npm.cmd --version
npm.cmd ci
npm.cmd run dev
```

Open the Local address printed in the terminal, normally `http://127.0.0.1:5173`. Vite may choose another port if 5173 is busy. The app binds to this computer only. Stop it with `Ctrl+C`.

Use `npm.cmd` rather than changing your system's PowerShell execution policy. No database, `.env`, API key, Python, WSL or global Vite install is required. Initial dependency installation requires internet; later use of the bundled app and map does not. External evidence links need internet.

## 4. Open the same folder in Codex / Work

Open the desktop app and create or choose a local project. In the project's menu, choose **Edit project**, then **Add folder**, and select your existing `History-of-India` folder. Make that repository folder **primary** if the project has multiple folders. Start a Codex chat in that project so its default working directory and Git operations use this repository.

Official guidance: [Projects and chats](https://learn.chatgpt.com/docs/projects). Labels can vary by desktop release. The essential step is attaching the actual local repository folder, not just pasting the GitHub URL or opening a conversation reference. A synced chat does not automatically transfer local project files between computers; Git keeps the repository in sync.

Before further changes, ask Codex to check `git status` and the current branch, read `README.md` and `docs/DATA_MODEL.md`, and continue the 1 CE pilot. The prototype is on `codex/historical-atlas-prototype`; `main` changes only after the pull request is merged.

## 5. Verify or build

```powershell
npm.cmd run validate:data
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

`build` validates the historical records and creates `dist/`. `preview` prints the local production-preview URL (usually port 4173). Opening files directly from Explorer will not load JavaScript modules reliably; use the server.

## Troubleshooting

- **Node/npm not found:** reopen the terminal after installing Node.js, then check `node --version`.
- **PowerShell says scripts are disabled:** use the documented `npm.cmd` commands.
- **Branch not found:** run `git fetch origin` and `git branch -r`; use the branch shown in the handoff. A local-only commit is not available to a different clone until pushed.
- **No records for a year:** expected for most of the timeline. Use 1, 500, 1500, 1565 or 1632 CE, or browse all records.
- **Background failed to load:** check that `public/data/land.geojson` exists and that the app is served over HTTP. Records remain readable even when the background fails.
- **Changes on another computer are missing:** commit and push there, then fetch/pull here. Conversation synchronization and Git synchronization are separate.
