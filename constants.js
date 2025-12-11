// constants.js

// This hash includes the salt and complexity rounds.
// You must generate this once using bcrypt.hash('YOUR_PASSWORD', 10)

const SECURE_PASSWORD_HASH = '$2b$10$WC9glVXE5.uy/xxxsj5a0.Y/TspsILQUF2Zcblmm.Q6ptMzxf1eVS'; 
const TARGET_PDF_FILENAME = 'encrypted_doc.pdf';
const LOCK_TIMEOUT_SECONDS = 20; // Time in seconds of inactivity before locking
const DELETE_TIME_SECONDS = 240; // Time in seconds after which the file is deleted
// Export the hash to be used by main.js
module.exports = {
    TARGET_PDF_FILENAME,
    LOCK_TIMEOUT_SECONDS,
    DELETE_TIME_SECONDS,

    SECURE_PASSWORD_HASH
};