// main.js

const { app, BrowserWindow, ipcMain, globalShortcut, powerMonitor } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');
const bcrypt = require('bcrypt');

// --- Configuration Constants ---
const { SECURE_PASSWORD_HASH, TARGET_PDF_FILENAME,LOCK_TIMEOUT_SECONDS,DELETE_TIME_SECONDS} = require('./constants');
const TARGET_PDF_PATH = path.join(__dirname, TARGET_PDF_FILENAME);


// --- Global Variables ---
let mainWindow; // Reference to the main control window (index.html)
let viewerWindow = null; // Reference to the PDF viewer window
let lockCheckInterval; // Reference for the lock timer interval
let isDocumentAccessed = false; // Flag to track if the document has been accessed

/**
 * Function to create the main application window (index.html).
 */
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile('index.html');
  // Optional: Open DevTools for debugging Node.js communication issues
  // mainWindow.webContents.openDevTools(); 
}

// --- Lock Timer Management ---

// main.js - Timer Management

function startCloseTimer() {
  if (lockCheckInterval) {
      clearInterval(lockCheckInterval);
  }
  
  // Set an interval to check system idle time every 5 seconds
  lockCheckInterval = setInterval(() => {
      const idleTime = powerMonitor.getSystemIdleTime();
      
      if (idleTime >= LOCK_TIMEOUT_SECONDS) {
          console.log(`Timeout reached (${idleTime}s). Closing viewer window.`);
          
          clearInterval(lockCheckInterval);
          
          if (viewerWindow) {
              // ACTION: Instead of sending an IPC lock command, we simply close the window.
              viewerWindow.close(); 
          }
      }
  }, 5000); // Check every 5 seconds
  console.log(`Close timer started. Will close after ${LOCK_TIMEOUT_SECONDS}s of inactivity.`);
}

function stopCloseTimer() {
  if (lockCheckInterval) {
      clearInterval(lockCheckInterval);
      lockCheckInterval = null;
      console.log('Close timer stopped.');
  }
}


const performSafeDeletion = () => {
  // Only attempt deletion if the document was successfully viewed
  if (isDocumentAccessed && fs.existsSync(TARGET_PDF_PATH)) {
      console.log('EXIT HOOK: Executing critical self-destruct.');
      try {
          fs.unlinkSync(TARGET_PDF_PATH); // Use SYNCHRONOUS unlink for safety
          console.log('File successfully deleted on exit.');
      } catch (err) {
          console.error('ERROR: Failed to delete file on exit:', err.message);
      }
  }
};


// --- IPC Main Handlers (Backend Logic) ---

// Handler for the initial password attempt and file loading
ipcMain.handle('decrypt-and-print-pdf', async (event, password) => {
    
    // --- 1. HASHING CHECK ---
    // 1. Password HASH Validation
    let isPasswordValid = false;
    try {
        // Asynchronously compares the provided plaintext password against the stored hash
        isPasswordValid = await bcrypt.compare(password, SECURE_PASSWORD_HASH);
    } catch (err) {
        console.error('Bcrypt error during comparison:', err);
        return { success: false, message: 'Security check failed due to internal error.' };
    }

    if (!isPasswordValid) {
        return { success: false, message: 'Invalid password. Access denied.' };
    }

    // 2. File Existence Check
    if (!fs.existsSync(TARGET_PDF_PATH)) {
         return { success: false, message: `Error: Target PDF file (${TARGET_PDF_FILENAME}) not found in the project root.` };
    }
    
    try {
        console.log(`Processing local file: ${TARGET_PDF_PATH}`);
        
        // Close existing viewer if any, before opening a new one
        if (viewerWindow) {
            viewerWindow.close();
        }

        // 3. Create the PDF Viewer Window
        viewerWindow = new BrowserWindow({
            width: 1000, 
            height: 800, 
            title: 'Decrypted PDF Viewer (Print Only)',
            autoHideMenuBar: true,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                webSecurity: false // Required for loading local file paths
            }
        });
        
        // 4. Screenshot/Content Protection
        // Activates OS-level security features to black-out the window during screen capture
        if (process.platform === 'win32' || process.platform === 'darwin') {
            viewerWindow.setContentProtection(true);
        }


        // 5. Construct URL for PDF.js Viewer
        const viewerUrl = url.format({
            pathname: path.join(__dirname, 'web', 'viewer.html'),
            protocol: 'file:',
            slashes: true,
            query: {
                file: encodeURIComponent('file:///' + TARGET_PDF_PATH),
                toolbar: 0, // Hide most toolbar controls
                print: 1    // Ensure print button is available/functional
            }
        });
        
        viewerWindow.loadURL(viewerUrl);

        // 5. CRITICAL: Hide the password screen *after* the viewer is created.
          if (mainWindow) {
            mainWindow.close(); // <--- Hides and destroys the password window
            mainWindow = null;  // Clear the reference
        }
        
        // Start the lock timer immediately
        startCloseTimer();

        // 6. Window Close Listener
        viewerWindow.on('closed', () => {
          viewerWindow = null;
          stopCloseTimer(); // <-- Changed from stopLockTimer()
        });

        // 7. Mock Deletion Timer
        setTimeout(() => {
            console.log(`--- DELETE TIMER FINISHED for ${TARGET_PDF_FILENAME} ---`);
            
            // NOTE: Deletion code is commented out for safety.
            if (!fs.existsSync(TARGET_PDF_PATH)) {
                console.log(`File already deleted or missing: ${TARGET_PDF_FILENAME}`);
                return;
            }
            
            // Perform file deletion
            fs.unlink(TARGET_PDF_PATH, (err) => {
              let message;
              let isSuccess;

              if (err) {
                  // File not found, permission error, etc.
                  message = `Error deleting file: ${err.message}`;
                  isSuccess = false;
                  console.error(message);
              } else {
                  // Successful deletion
                  message = `${TARGET_PDF_FILENAME} successfully deleted from root.`;
                  isSuccess = true;
                  console.log(message);
              }
              
              // Send a final message to the UI (index.html)
              if (mainWindow) {
                  mainWindow.webContents.send('file-operation-result', message, isSuccess);
              }
           }); //fs unlink end
            
            // if (mainWindow) {
            //     mainWindow.webContents.send('file-operation-result', 
            //         'Operation Complete. (File deletion disabled for security.)', false);
            // }
            
        }, DELETE_TIME_SECONDS*1000); // 10 seconds = 10000 1 minute=60000

        return { success: true, message: `PDF viewer opened with print option. Deletion timer started (60s).` };

    } catch (err) {
        console.error('File operation failed:', err);
        return { success: false, message: `File processing failed: ${err.message}` };
    }
});



// --- Application Lifecycle Events ---

app.whenReady().then(() => {
    createMainWindow();

    // Register PrintScreen key to block system screenshots
    const success = globalShortcut.register('PrintScreen', () => {
        console.log('Print Screen key blocked by application.');
    });

    if (!success) {
        console.error('Failed to register PrintScreen global shortcut.');
    }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// Unregister the shortcut when the app closes
app.on('will-quit', () => {
    globalShortcut.unregisterAll();
    stopCloseTimer();
});

app.on('before-quit', (event) => {
  // This hook runs before windows close (like the viewerWindow)
  // We prevent the default quit behavior to run our logic first.
  event.preventDefault(); 
  
  // We use a try/finally block to ensure app.quit() is called regardless of deletion success/failure
  try {
      performSafeDeletion(); 
  } finally {
      // Now that the file operation is complete (or failed), we can safely quit.
      app.quit(); 
  }
});