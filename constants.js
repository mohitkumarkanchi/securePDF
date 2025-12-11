// constants.js

// This hash includes the salt and complexity rounds.
// You must generate this once using bcrypt.hash('YOUR_PASSWORD', 10)

const SECURE_PASSWORD_HASH = '$2b$10$WC9glVXE5.uy/xxxsj5a0.Y/TspsILQUF2Zcblmm.Q6ptMzxf1eVS'; 

// Export the hash to be used by main.js
module.exports = {
    SECURE_PASSWORD_HASH
};