import * as crypto from 'crypto';
import { type PathLike, readFileSync } from 'fs';

const hmac = (
    algorithm: string,
    key: string,
    input: PathLike,
    encoding: crypto.BinaryToTextEncoding
) => {
    return crypto
        .createHmac(algorithm, Buffer.from(key))
        .update(readFileSync(input))
        .digest(encoding);
};

export default hmac;