import * as crypto from 'crypto';
import { type PathLike, createReadStream, createWriteStream } from 'fs';
import { rm } from 'fs/promises';
import { pipeline } from 'stream/promises';

type KeySize = 128 | 192 | 256;

const IV_LENGTH = 16;

/**
 * Descifra un archivo creado por `cipher` (AES-CBC).
 * Formato de entrada: [IV (16 bytes)] [datos cifrados]
 */
const decipher = async (
    password: string,
    salt: string,
    size: KeySize,
    input: PathLike,
    output: PathLike,
): Promise<void> => {
    // Leer el IV: primeros 16 bytes del archivo
    const chunks: Buffer[] = [];
    for await (const chunk of createReadStream(input, {
        start: 0,
        end: IV_LENGTH - 1,
    })) {
        chunks.push(chunk as Buffer);
    }
    const iv = Buffer.concat(chunks);
    if (iv.length !== IV_LENGTH) {
        throw new Error('Archivo inválido: falta el IV');
    }

    const key = crypto.scryptSync(password, salt, size / 8);
    const decryptor = crypto.createDecipheriv(`aes-${size}-cbc`, key, iv);

    // El resto del archivo (después del IV) son los datos cifrados
    try {
        await pipeline(
            createReadStream(input, { start: IV_LENGTH }),
            decryptor,
            createWriteStream(output),
        );
    } catch (error) {
        await rm(output, { force: true });
        throw error;
    }
};

export default decipher;
