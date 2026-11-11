import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import prng from './prng/index.js';
import cipher from './cipher/index.js';
import decipher from './decipher/index.js';

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
            }),
        handler: async ({ password, salt, size, input, output }) => {
            await decipher(password, salt, size, input, output);
            console.log(`File decrypted: ${output}`);
        },
    })
    .demandCommand(1, 'You need at least one command before moving on')
    .help()
    .parseAsync();
