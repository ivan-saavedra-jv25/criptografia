import yargs from 'yargs';
import type { Options } from 'yargs';
import { hideBin } from 'yargs/helpers';
import prng from './prng/index.js';
import cipher from './cipher/index.js';
import decipher from './decipher/index.js';
import hash from './hash/index.js';
import hmac from './hmac/index.js';
import diffieHellman from './diffie-hellman/index.js';
import keypair from './keypair/index.js';
import sign from './sign/index.js';
import verify from './verify/index.js';

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

// Codificación de salida compartida por hash, hmac y diffie-hellman
const encoding = {
    choices: ['hex', 'base64', 'base64url'] as const,
    description: 'Output encoding',
    default: 'hex' as const,
} as const satisfies Options;

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
                encoding,
                input: ioOptions.input,
            }),
        handler: ({ algorithm, encoding, input }) => {
            console.log(hash(algorithm, encoding, input));
        },
    })
    .command({
        command: 'diffie-hellman',
        describe:
            'Compute keys for diffie-hellman exchange or compute secret from keys if provided',
        aliases: ['dh'],
        builder: {
            publicKey: {
                alias: 'pub',
                description: "The other's public key",
                type: 'string',
                implies: [
                    'publicKeyEncoding',
                    'privateKey',
                    'privateKeyEncoding',
                    'prime',
                    'primeEncoding',
                    'generator',
                    'generatorEncoding',
                ],
            },
            publicKeyEncoding: {
                ...encoding,
                alias: 'pube',
                description: "Other's public key encoding",
            },
            privateKey: {
                alias: 'priv',
                description: 'Own private key',
                type: 'string',
            },
            privateKeyEncoding: {
                ...encoding,
                alias: 'prive',
                description: 'Own private key encoding',
            },
            prime: {
                alias: 'p',
                description: 'The prime number',
                type: 'string',
            },
            primeEncoding: {
                ...encoding,
                alias: 'pe',
                description: 'Prime number encoding',
            },
            generator: {
                alias: 'g',
                description: 'The generator',
                type: 'string',
            },
            generatorEncoding: {
                ...encoding,
                alias: 'ge',
                description: 'Generator encoding',
            },
            encoding,
        },
        handler: ({
            publicKey,
            publicKeyEncoding,
            encoding,
            prime,
            generator,
            primeEncoding,
            generatorEncoding,
            privateKey,
            privateKeyEncoding,
        }) => {
            console.log(
                diffieHellman(
                    encoding,
                    publicKey && {
                        publicKey,
                        publicKeyEncoding,
                        prime: prime!,
                        primeEncoding,
                        generator: generator!,
                        generatorEncoding,
                        privateKey: privateKey!,
                        privateKeyEncoding,
                    },
                ),
            );
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
                encoding,
            }),
        handler: ({ algorithm, key, input, encoding }) => {
            console.log(hmac(algorithm, key, input, encoding));
        },
    })
    .command({
        command: 'keypair',
        describe: 'Generate an asymmetric key pair',
        builder: {
            type: {
                choices: ['rsa', 'rsa-pss'] as const,
                description: 'The type of key pair to generate',
                demandOption: true,
            },
            size: {
                choices: [128, 192, 256] as const,
                description: 'The size of the passphrase cipher (AES bits)',
                default: 128 as const,
            },
            passphrase: {
                alias: 'p',
                description: 'The passphrase to encrypt the private key with',
                type: 'string',
                demandOption: true,
            },
            outDir: {
                alias: 'o',
                description: 'The directory to output the keys to',
                type: 'string',
                default: './.secrets',
            },
            outFormat: {
                alias: 'f',
                description: 'The format to output the keys in',
                choices: ['pem', 'der'] as const,
                default: 'pem' as const,
            },
            modulusLength: {
                alias: 'm',
                description: 'The modulus length',
                choices: [2048, 3072, 4096] as const,
                default: 2048 as const,
            },
        },
        handler: ({ type, size, passphrase, outDir, outFormat, modulusLength }) => {
            keypair(type, size, passphrase, outDir, outFormat, modulusLength);
        },
    })
    .command({
        command: 'sign',
        describe: 'Sign a file',
        builder: {
            algorithm: {
                alias: 'a',
                description: 'The algorithm to use',
                choices: ['RSA-SHA256'] as const,
                default: 'RSA-SHA256' as const,
            },
            input: { ...ioOptions.input, description: 'The file to sign' },
            privateKey: {
                ...ioOptions.input,
                alias: 'priv',
                description: 'The private key to sign with',
            },
            encoding,
            passphrase: {
                alias: 'p',
                description: 'The passphrase to decrypt the private key',
                type: 'string',
            },
        },
        handler: ({ algorithm, input, privateKey, encoding, passphrase }) => {
            console.log(sign(algorithm, input, privateKey, encoding, passphrase));
        },
    })
    .command({
        command: 'verify',
        describe: 'Verify a signature for a given file',
        builder: {
            algorithm: {
                alias: 'a',
                description: 'The algorithm to use',
                choices: ['RSA-SHA256'] as const,
                default: 'RSA-SHA256' as const,
            },
            input: { ...ioOptions.input, description: 'The file to verify' },
            publicKey: {
                ...ioOptions.input,
                alias: 'pub',
                description: 'The public key to verify against',
            },
            signature: {
                alias: 's',
                description: 'The signature to verify',
                type: 'string',
                demandOption: true,
            },
            signatureEncoding: {
                ...encoding,
                alias: 'se',
                description: 'The signature encoding',
            },
        },
        handler: ({ algorithm, input, publicKey, signature, signatureEncoding }) => {
            console.log(
                verify(algorithm, input, publicKey, signature, signatureEncoding),
            );
        },
    })
    .demandCommand(1, 'You need at least one command before moving on')
    .help()
    .parseAsync();
