import * as crypto from 'crypto';
type PRNG = 'bytes' | 'int' | 'uuid';
const prng = (type: PRNG, size : number, min:number, max:number, encoding: BufferEncoding) => {
    switch (type) {
        case 'bytes':
            return crypto.randomBytes(size).toString(encoding);
        case 'int':
            return crypto.randomInt(min, max).toString();
        case 'uuid':
            return crypto.randomUUID();
        default:
            throw new Error(`Unsupported PRNG type: ${type}`);
    }

}

export default prng;