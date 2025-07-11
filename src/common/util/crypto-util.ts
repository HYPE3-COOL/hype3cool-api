import {
    createHash,
    randomBytes,
    generateKeyPairSync,
    KeyPairSyncResult,
    createCipheriv,
    createDecipheriv,
    scrypt,
} from 'crypto';

import { promisify } from 'util';

export enum CodeChallengeMethod {
    S256 = 'S256',
    PLAIN = 'PLAIN',
}

export const algorithm = 'aes-256-ecb'; // Change to ECB mode
export const keyLength = 32; // AES-256 requires a 32-byte key

export const generateRandomString = (length: number): string => {
    const characters =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
};

export const generatePublicPrivateKeyPair = (): KeyPairSyncResult<
    string,
    string
> => {
    return generateKeyPairSync('ec', {
        namedCurve: 'prime256v1', // Use the P-256 curve
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem',
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
        },
    });
};

// create function to verify code verifier
export const verifyProofKey = (
    codeVerifier: string,
    codeChallenge: string,
    codeChallengeMethod: string,
): boolean => {
    let hashedVerifier = '';
    if (codeChallengeMethod === CodeChallengeMethod.S256) {
        hashedVerifier = createHash('sha256')
            .update(codeVerifier)
            .digest('base64url');
    } else if (codeChallengeMethod === CodeChallengeMethod.PLAIN) {
        hashedVerifier = codeVerifier;
    }

    return hashedVerifier === codeChallenge;
};

export const parseBase64Credentials = (
    base64Credentials: string,
): [string, string] => {
    const credentials = Buffer.from(base64Credentials, 'base64').toString(
        'utf8',
    );
    const [clientId, clientSecret] = credentials.split(':');
    if (!clientId || !clientSecret) {
        throw new Error('Invalid Authorization header format');
    }
    return [clientId, clientSecret];
};

export const trimPublicKey = (pemKey: string): string => {
    // Split the PEM key into lines
    const lines = pemKey.split('\n');

    // Filter out the header and footer lines
    const filteredLines = lines.filter(
        (line) =>
            line.trim() !== '-----BEGIN PUBLIC KEY-----' &&
            line.trim() !== '-----END PUBLIC KEY-----',
    );

    // Join the remaining lines to form the purified public key
    return filteredLines.join('').trim();
};

export const generateKey = async (password: string): Promise<Buffer> => {
    return (await promisify(scrypt)(password, 'salt', keyLength)) as Buffer;
};

export const encrypt = async (
    text: string,
    password: string,
): Promise<string> => {
    const key = await generateKey(password);
    const cipher = createCipheriv(algorithm, key, null); // No IV needed for ECB
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
};

export const decrypt = async (
    encryptedText: string,
    password: string,
): Promise<string> => {
    const key = await generateKey(password);
    const decipher = createDecipheriv(algorithm, key, null); // No IV needed for ECB
    let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};