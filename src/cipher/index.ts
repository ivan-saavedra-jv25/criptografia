import * as crypto from 'crypto';
import { type PathLike, createReadStream, createWriteStream } from 'fs';
import { rm } from 'fs/promises';
import { pipeline } from 'stream/promises';

type KeySize = 128 | 192 | 256;

/**
 * Cifra un archivo con AES-CBC.
 * Formato de salida: [IV (16 bytes)] [datos cifrados]
 */
const cipher = async (
    password: string,
    salt: string,
    size: KeySize,
    input: PathLike,
    output: PathLike,
): Promise<void> => {
    const key = crypto.scryptSync(password, salt, size / 8);
    const iv = crypto.randomBytes(16); // CBC exige IV de 16 bytes
    const encryptor = crypto.createCipheriv(`aes-${size}-cbc`, key, iv);

    const out = createWriteStream(output);
    out.write(iv);

    try {
        await pipeline(createReadStream(input), encryptor, out);
    } catch (error) {
        // No dejar un archivo de salida vacío o incompleto
        await rm(output, { force: true });
        throw error;
    }
};

export default cipher;
