const MyConstants = {
    // MongoDB (prefer DB_URI for full connection string)
    DB_URI: process.env.DB_URI,
    // Keep legacy defaults for backward compatibility with old project setup
    DB_SERVER: process.env.DB_SERVER || 'shoponline523.ucubgjr.mongodb.net',
    DB_USER: process.env.DB_USER || 'lnhao4512',
    DB_PASS: process.env.DB_PASS || 'Haonho0510@',
    DB_DATABASE: process.env.DB_DATABASE || 'mocecopure',

    // Email (optional)
    EMAIL_USER: process.env.EMAIL_USER || 'lnhao4512@gmail.com',
    EMAIL_PASS: process.env.EMAIL_PASS || 'bqkgrzhlcughhehd',

    // JWT
    JWT_SECRET: process.env.JWT_SECRET || 'b88953d90316533457629e2792203f08df417f09ef6bec5aab976300d82392019a117e8aa973db5d21c389cae447ed8e66fc4f3fb2c90d4dfc3c90f20a43d8a3',
    JWT_EXPIRES: process.env.JWT_EXPIRES || '86400000', // 24 hours in milliseconds

    // VietQR / Bank info
    BANK_CODE:       process.env.BANK_CODE       || 'VCB',
    BANK_ACCOUNT_NO: process.env.BANK_ACCOUNT_NO || '1039549947',
    BANK_ACCOUNT_NAME: process.env.BANK_ACCOUNT_NAME || 'LUONG NHAT HAO',
    SHIPPING_FEE:    Number(process.env.SHIPPING_FEE) || 70000,

    // Fallback mode should be explicit to avoid confusion in authentication.
    ENABLE_INMEMORY_FALLBACK: process.env.ENABLE_INMEMORY_FALLBACK === 'true'
};

module.exports = MyConstants;