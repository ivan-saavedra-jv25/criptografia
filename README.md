# criptografia

CLI en TypeScript sobre el módulo `crypto` de Node.js. Permite:

- `prng`: generar valores pseudoaleatorios (CSPRNG del sistema operativo).
- `cipher` / `decipher`: cifrar y descifrar archivos con AES-CBC.
- `hash`: calcular el hash de un archivo.
- `hmac`: calcular el HMAC de un archivo con una clave secreta.

## Requisitos

- Node.js 20+
- Dependencias instaladas: `npm install`

## Estructura

```
src/
├── index.ts        # CLI (yargs): comandos `prng`, `cipher`, `decipher`, `hash` y `hmac`
├── prng/
│   └── index.ts    # Generación (bytes, int, uuid)
├── cipher/
│   └── index.ts    # Cifrado de archivos (AES-CBC)
├── decipher/
│   └── index.ts    # Descifrado de archivos (AES-CBC)
├── hash/
│   └── index.ts    # Hash de archivos
└── hmac/
    └── index.ts    # HMAC de archivos
```

## Uso general

```bash
npm run dev -- prng --type <bytes|int|uuid> [opciones]
```

> **Importante:** el `--` después de `dev` es obligatorio. Sin él, npm consume
> las opciones (`--type`, `--size`, ...) como configuración propia y el script
> no las recibe.

### Opciones

| Opción       | Alias | Tipo   | Default | Descripción                                   |
| ------------ | ----- | ------ | ------- | --------------------------------------------- |
| `--type`     |       | choice | —       | **Requerida.** `bytes`, `int` o `uuid`        |
| `--size`     | `-s`  | number | `16`    | Cantidad de bytes aleatorios (solo `bytes`)   |
| `--min`      |       | number | `0`     | Valor mínimo, incluido (solo `int`)           |
| `--max`      |       | number | `100`   | Valor máximo, **excluido** (solo `int`)       |
| `--encoding` |       | choice | `hex`   | `hex`, `base64` o `utf8` (solo `bytes`)       |

---

## Comando 1: `prng --type bytes`

```bash
npm run dev -- prng --type bytes
```

### Cómo funciona

1. `yargs` recibe `--type bytes`; `size` toma el default `16` y `encoding` el default `hex`.
2. El handler llama a `prng('bytes', 16, 0, 100, 'hex')`.
3. Se ejecuta `crypto.randomBytes(16).toString('hex')`:
   - `randomBytes(16)` genera 16 bytes (128 bits) criptográficamente seguros.
   - `toString('hex')` los representa en hexadecimal: cada byte son 2 caracteres.

### Resultado esperado

Una cadena hexadecimal de **32 caracteres** (16 bytes × 2). Cambia en cada ejecución. Ejemplo:

```
918871e01333b95ced87b37a1f8a47ce
```

### Variantes

```bash
npm run dev -- prng --type bytes --size 32               # 64 caracteres hex
npm run dev -- prng --type bytes --encoding base64       # 16 bytes en base64 (24 caracteres, termina en ==)
```

---

## Comando 2: `prng --type int --size 32`

```bash
npm run dev -- prng --type int --size 32
```

### Cómo funciona

1. `yargs` recibe `--type int` y `--size 32`; `min` toma `0` y `max` toma `100` por default.
2. El handler llama a `prng('int', 32, 0, 100, 'hex')`.
3. Se ejecuta `crypto.randomInt(0, 100).toString()`, que devuelve un entero uniforme en el rango `[0, 100)`.

> **Nota:** para `--type int`, `--size` **no tiene efecto**. Solo se usa con
> `--type bytes`. El rango del número lo controlan `--min` y `--max`.
> Por eso `--size 32` aquí devuelve un entero entre 0 y 99, no un número de 32 dígitos ni de 32 bits.

### Resultado esperado

Un entero entre `0` y `99` (el `100` nunca sale porque `max` es exclusivo). Ejemplo:

```
57
```

### Cómo controlar el rango

```bash
npm run dev -- prng --type int --min 1 --max 7           # entero entre 1 y 6 (como un dado)
npm run dev -- prng --type int --min 0 --max 4294967296  # entero de 32 bits sin signo
```

`crypto.randomInt` exige que `max - min` sea menor que `2^48`.

---

## Otro tipo: `uuid`

```bash
npm run dev -- prng --type uuid
```

Genera un UUID v4 con `crypto.randomUUID()`. Ejemplo:

```
a5592b43-ef6c-4076-a981-0e90bd7539d8
```

## Comando 3: `cipher`

```bash
npm run dev -- cipher -p miClave --salt miSal -i test-files/secreto.txt -o test-files/secreto.bin
```

### Opciones

| Opción       | Alias | Default | Descripción                              |
| ------------ | ----- | ------- | ---------------------------------------- |
| `--password` | `-p`  | —       | **Requerida.** Contraseña                |
| `--salt`     |       | —       | **Requerida.** Sal para derivar la clave |
| `--size`     | `-s`  | `256`   | Tamaño de clave AES: `128`, `192`, `256` |
| `--input`    | `-i`  | —       | **Requerida.** Archivo a cifrar          |
| `--output`   | `-o`  | —       | **Requerida.** Archivo cifrado resultante |

### Cómo funciona

1. Deriva la clave con `crypto.scryptSync(password, salt, size / 8)`.
2. Genera un IV aleatorio de 16 bytes con `crypto.randomBytes(16)`.
3. Escribe el IV al inicio del archivo de salida y luego los datos cifrados con `aes-<size>-cbc`.

Formato del archivo cifrado: `[IV: 16 bytes][datos cifrados]`.

Si el cifrado falla (por ejemplo, el archivo de entrada no existe), se borra el archivo de salida para no dejar uno vacío.

### Resultado esperado

```
File encrypted: secreto.bin
```

`secreto.bin` pesa 16 bytes de IV más el tamaño del original redondeado al siguiente múltiplo de 16 (padding PKCS7).

---

## Comando 4: `decipher`

```bash
npm run dev -- decipher -p miClave --salt miSal -i test-files/secreto.bin -o test-files/recuperado.txt
```

Usa las mismas opciones que `cipher`. `--input` es el archivo cifrado y `--output` el archivo recuperado.

### Cómo funciona

1. Lee el IV de los primeros 16 bytes del archivo.
2. Deriva la misma clave con `scryptSync(password, salt, size / 8)`.
3. Descifra el resto del archivo con `aes-<size>-cbc`.

### Resultado esperado

```
File decrypted: recuperado.txt
```

`recuperado.txt` es idéntico al archivo original.

> **Importante:** `--password`, `--salt` y `--size` deben ser los mismos que se usaron para cifrar.

### Limitaciones

- CBC **no autentica**: no detecta si el archivo cifrado fue modificado. Con una contraseña incorrecta suele fallar con `bad decrypt`, pero a veces puede devolver basura sin error.
- `--password` en la línea de comandos queda guardado en el historial del shell.

---

## Comando 5: `hash`

```bash
npm run dev -- hash -i test-files/secreto.txt
npm run dev -- hash -a md5 --encoding base64 -i test-files/secreto.txt
```

### Opciones

| Opción        | Alias | Default  | Descripción                            |
| ------------- | ----- | -------- | -------------------------------------- |
| `--input`     | `-i`  | —        | **Requerida.** Archivo a procesar      |
| `--algorithm` | `-a`  | `sha256` | Algoritmo (`sha256`, `sha512`, `md5`…) |
| `--encoding`  |       | `hex`    | `hex`, `base64` o `base64url`          |

### Cómo funciona

Lee el archivo y calcula `crypto.createHash(algorithm).update(contenido).digest(encoding)`. Imprime el resultado en consola.

### Resultado esperado

Con SHA-256 y `hex`, 64 caracteres. Es igual al de `shasum -a 256 <archivo>`:

```
133ee989293f92736301280c6f14c89d521200c17dcdcecca30cd20705332d44
```

Un algoritmo no soportado falla con `Digest method not supported`.

---

## Comando 6: `hmac`

```bash
npm run dev -- hmac -k miClave -i test-files/secreto.txt
npm run dev -- hmac -a sha512 -k miClave --encoding base64 -i test-files/secreto.txt
```

### Opciones

| Opción        | Alias | Default  | Descripción                            |
| ------------- | ----- | -------- | -------------------------------------- |
| `--key`       | `-k`  | —        | **Requerida.** Clave secreta           |
| `--input`     | `-i`  | —        | **Requerida.** Archivo a firmar        |
| `--algorithm` | `-a`  | `sha256` | Algoritmo hash                         |
| `--encoding`  |       | `hex`    | `hex`, `base64` o `base64url`          |

### Cómo funciona

Calcula `crypto.createHmac(algorithm, key).update(contenido).digest(encoding)`. A diferencia de `hash`, el resultado depende también de la clave: sirve para verificar **integridad y autenticidad**.

### Resultado esperado

Con SHA-256 y `hex`, 64 caracteres. Es igual al de `openssl dgst -sha256 -hmac <clave> <archivo>`:

```
8cdcc9e00f824a6d31f36a186ef08d6837bf68b78ab05d1135ecf4d45b30798c
```

Cambia si cambia el contenido del archivo o la clave. `--key` en la línea de comandos queda guardada en el historial del shell.

---

## Compilar y ejecutar sin tsx

```bash
npm run build
node dist/index.js prng --type bytes
```

## Errores comunes

| Síntoma                                                | Causa                                | Solución                          |
| ------------------------------------------------------ | ------------------------------------ | --------------------------------- |
| Muestra la ayuda y `Missing required argument: type`   | Falta `--` tras `npm run dev`        | `npm run dev -- prng --type ...`  |
| `Invalid values: Argument: type`                       | `--type` fuera de `bytes/int/uuid`   | Usar un valor válido              |
| `ENOENT: no such file or directory`                    | El archivo `--input` no existe       | Revisar la ruta                   |
| `Archivo inválido: falta el IV`                        | Archivo cifrado con menos de 16 bytes | Volver a cifrar el original      |
| `Digest method not supported`                          | `--algorithm` no soportado           | Usar `sha256`, `sha512`, `md5`…   |
| `bad decrypt`                                          | Contraseña, sal o `--size` distintos | Usar los mismos que al cifrar     |
