import yargs from 'yargs';
import type { Options } from 'yargs';
import { hideBin } from 'yargs/helpers';
import prng from './prng/index.js';
import cipher from './cipher/index.js';
import decipher from './decipher/index.js';
import hash from './hash/index.js';
import hmac from './hmac/index.js';

// Opciones de entrada/salida compartidas por cipher, decipher y hash
const ioOptions = {
    input: {
        alias: 'i',
        type: 'string',
        description: 'Input file path',
        demandOption: true,
    },
    output: {
        alias: 'o',
        type: 'string',
        description: 'Output file path',
        demandOption: true,
    },
} as const satisfies Record<string, Options>;

yargs(hideBin(process.argv))
    .command({
        command: 'prng',
        describe: 'Generate a pseudo-random number',
        builder: (y) =>
            y.options({
                type: {
                    choices: ['bytes', 'int', 'uuid'] as const,
                    description: 'Type of output',
                    demandOption: true,
                },
                size: {
                    alias: 's',
                    type: 'number',
                    description: 'Size of the output',
                    default: 16,
                },
                max: { type: 'number', default: 100, description: 'Max value (int)' },
                min: { type: 'number', default: 0, description: 'Min value (int)' },
                encoding: {
                    choices: ['hex', 'base64', 'utf8'] as const,
                    description: 'Encoding of the output (bytes)',
                    default: 'hex' as const,
                },
            }),
        handler: ({type, size, min, max, encoding}) => {
            console.log(prng(type, size, min, max, encoding));
        },
    })
    .command({
        command: 'cipher',
        describe: 'Encrypt a file with AES-CBC',
        builder: (y) =>
            y.options({
                password: {
                    alias: 'p',
                    type: 'string',
                    description: 'Password used to derive the key',
                    demandOption: true,
                },
                salt: {
                    type: 'string',
                    description: 'Salt used to derive the key',
                    demandOption: true,
                },
                size: {
                    alias: 's',
                    choices: [128, 192, 256] as const,
                    description: 'AES key size in bits',
                    default: 256 as const,
                },
                ...ioOptions,
            }),
        handler: async ({ password, salt, size, input, output }) => {
            await cipher(password, salt, size, input, output);
            console.log(`File encrypted: ${output}`);
        },
    })
    .command({
        command: 'decipher',
        describe: 'Decrypt a file encrypted with cipher',
        builder: (y) =>
            y.options({
                password: {
                    alias: 'p',
                    type: 'string',
                    description: 'Password used to derive the key',
                    demandOption: true,
                },
                salt: {
                    type: 'string',
                    description: 'Salt used to derive the key',
                    demandOption: true,
                },
                size: {
                    alias: 's',
                    choices: [128, 192, 256] as const,
                    description: 'AES key size in bits',
                    default: 256 as const,
                },
                ...ioOptions,
            }),
        handler: async ({ password, salt, size, input, output }) => {
            await decipher(password, salt, size, input, output);
            console.log(`File decrypted: ${output}`);
        },
    })
    .command({
        command: 'hash',
        describe: 'Generate a hash of a file',
        builder: (y) =>
            y.options({
                algorithm: {
                    alias: 'a',
                    type: 'string',
                    description: 'Hash algorithm to use',
                    demandOption: true,
                    default: 'sha256',
                },
                encoding: {
                    choices: ['hex', 'base64', 'base64url'] as const,
                    description: 'Encoding of the hash',
                    default: 'hex' as const,
                },
                input: ioOptions.input,
            }),
        handler: ({ algorithm, encoding, input }) => {
            console.log(hash(algorithm, encoding, input));
        },
    })

    .command({
        command: 'hmac',
        describe: 'Generate a HMAC of a file',
        builder: (y) =>
            y.options({
                algorithm: {
                    alias: 'a',
                    type: 'string',
                    description: 'Hash algorithm to use',
                    demandOption: true,
                    default: 'sha256',
                },
                key: {
                    alias: 'k',
                    type: 'string',
                    description: 'Secret key for the HMAC',
                    demandOption: true,
                },
                input: ioOptions.input,
                encoding: {
                    choices: ['hex', 'base64', 'base64url'] as const,
                    description: 'Encoding of the HMAC',
                    default: 'hex' as const,
                },
            }),
        handler: ({ algorithm, key, input, encoding }) => {
            console.log(hmac(algorithm, key, input, encoding));
        },
    })
    .demandCommand(1, 'You need at least one command before moving on')
    .help()
    .parseAsync();
