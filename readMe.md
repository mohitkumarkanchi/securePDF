# 📄 Secure PDF Viewer & Self-Destruct Utility

This is an Electron application designed for the secure, temporary viewing and printing of a single, sensitive PDF file. After the access purpose is served, the source PDF file is automatically and permanently deleted from the local system. 

## 🌟 Key Features

* **Password Protected Access:** Requires a hardcoded password (`secure123`) for initial access via the main HTML interface.
* **Secure Viewing & Printing:** Loads PDF content using the external **PDF.js** library in a dedicated window, configured for minimal toolbar options to encourage print-only usage.
* **Anti-Capture Measures:** Implements native operating system features (`setContentProtection`) and global key handlers (`PrintScreen`) to deter unauthorized screenshots while the viewer is active.
* **Idle Timeout Security:** Utilizes the Electron `powerMonitor` to detect inactivity. If the system is idle for **30 seconds**, the viewer window automatically closes to secure the content.
* **Self-Destruct Logic:** The source PDF file (`encrypted_doc.pdf`) is **permanently deleted** from the project root using Node.js's `fs.unlink()` after **10 seconds** of successful access.

## 🛠️ Installation and Setup

### Dependencies

This project requires **Node.js** and **npm** (Node Package Manager).

| Dependency | Purpose |
| :--- | :--- |
| `electron` | The core framework for building the desktop application. |
| `pdf.js` (External) | Third-party library required for secure PDF rendering. |
| `electron-packager` | Tool used to package the Electron application into distributable executables (EXE, DMG, etc.). |

### Project Structure

Your final directory structure **must** look like this for the application to function:

add your pdf document encrypted_doc.pdf in root that needs to be displayed and deleted

electron-pdf-tool/ <br>
├── encrypted_doc.pdf    <-- CRITICAL: Your target file to be deleted <br>
├── main.js              <-- Main Process (Logic, Timer, Deletion)    <br>
├── preload.js           <-- Secure IPC Bridge  <br>
├── index.html           <-- Main Application UI (Password input)  <br>
├── package.json         <-- Project metadata and scripts   <br>
├── web/                 <-- PDF.js Viewer files (Contains viewer.html)  <br>
└── build/               <-- PDF.js core rendering files  <br>


### Step-by-Step Setup

1.  **Initialize Project:**
    ```bash
    mkdir electron-pdf-tool
    cd electron-pdf-tool
    npm init -y
    ```
2.  **Install Electron and Packager:**
    ```bash
    npm install electron electron-packager --save-dev
    ```
3.  **Download PDF.js:**
    * Manually download the latest **pre-built** version of PDF.js.
    * Extract and copy the **`web`** and **`build`** folders into your `electron-pdf-tool` directory.
4.  **Add Source File:**
    * Place your target PDF file into the root folder and ensure it is named **`encrypted_doc.pdf`**.
5.  **Populate Files:**
    * Ensure `main.js`, `preload.js`, and `index.html` contain the final, correct code (including the file deletion logic and the "close on idle" feature).
    * **Note:** `web/viewer.html` should be cleaned of all custom lock-screen code.

### Commands to Run

1.  **Start the Application (Development Mode):**
    ```bash
    npm start
    ```
    (Requires: `"start": "electron ."` in `package.json`).

---

## 📦 Bundling into an Executable (EXE)

### Step 1: Add Package Script

Open your `package.json` file and add the packaging command under `"scripts"`:

```json
"scripts": {
    "start": "electron .",
    "package-win": "electron-packager . 'SecurePDF' --platform=win32 --arch=x64 --overwrite --out=dist --ignore=node_modules/electron/",
    "package-mac": "electron-packager . 'SecurePDF' --platform=darwin --arch=x64 --overwrite --out=dist --icon=./icon.icns"
},
```


### Step 2: Run the Package Command
Execute the script to build your EXE (Windows example):

```bash
npm run package-win
```

This command creates a distributable folder inside a new directory named dist. The final executable (SecurePDF.exe) will be located inside the platform-specific subfolder (e.g., dist/SecurePDF-win32-x64/).


```bash
npm run package-mac
```
This command creates a distributable folder inside a new directory named dist. The final executable (SecurePDF.exe) will be located inside the platform-specific subfolder (e.g., dist/SecurePDF-darwin-x64/SecurePDF.app
).


## Screenshot

<img src="./assets/ss1.png" alt="Screen Shot">

<img src="./assets/ss2.png" alt="Screen Shot">


<img src="./assets/ss3.png" alt="Screen Shot">



