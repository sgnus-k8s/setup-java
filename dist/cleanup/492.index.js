export const id = 492;
export const ids = [492];
export const modules = {

/***/ 8492:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  Io: () => (/* binding */ cache_saveCache)
});

// UNUSED EXPORTS: CacheFileSizeLimit, ValidationError, isFeatureAvailable, restoreCache

// EXTERNAL MODULE: ./node_modules/@actions/core/lib/core.js + 7 modules
var lib_core = __webpack_require__(3838);
// EXTERNAL MODULE: external "path"
var external_path_ = __webpack_require__(6928);
// EXTERNAL MODULE: ./node_modules/@actions/exec/lib/exec.js + 2 modules
var exec = __webpack_require__(5260);
// EXTERNAL MODULE: ./node_modules/@actions/io/lib/io.js
var lib_io = __webpack_require__(8701);
// EXTERNAL MODULE: ./node_modules/@actions/glob/lib/glob.js + 17 modules
var glob = __webpack_require__(2377);
// EXTERNAL MODULE: external "fs"
var external_fs_ = __webpack_require__(9896);
// EXTERNAL MODULE: ./node_modules/semver/index.js
var semver = __webpack_require__(2088);
// EXTERNAL MODULE: external "util"
var external_util_ = __webpack_require__(9023);
;// CONCATENATED MODULE: ./src/custom/utils.ts








// from https://github.com/actions/toolkit/blob/main/packages/cache/src/internal/constants.ts
const ManifestFilename = 'manifest.txt';
const TarFilename = 'cache.tar';
// The default path of GNUtar on hosted Windows runners
const GnuTarPathOnWindows = `${process.env['PROGRAMFILES']}\\Git\\usr\\bin\\tar.exe`;
// The default path of BSDtar on hosted Windows runners
const SystemTarPathOnWindows = `${process.env['SYSTEMDRIVE']}\\Windows\\System32\\tar.exe`;
var CacheFilename;
(function (CacheFilename) {
    CacheFilename["Gzip"] = "cache.tgz";
    CacheFilename["Zstd"] = "cache.tzst";
})(CacheFilename || (CacheFilename = {}));
var CompressionMethod;
(function (CompressionMethod) {
    CompressionMethod["Gzip"] = "gzip";
    // Long range mode was added to zstd in v1.3.2.
    // This enum is for earlier version of zstd that does not have --long support
    CompressionMethod["ZstdWithoutLong"] = "zstd-without-long";
    CompressionMethod["Zstd"] = "zstd";
})(CompressionMethod || (CompressionMethod = {}));
var ArchiveToolType;
(function (ArchiveToolType) {
    ArchiveToolType["GNU"] = "gnu";
    ArchiveToolType["BSD"] = "bsd";
})(ArchiveToolType || (ArchiveToolType = {}));
// from https://github.com/actions/toolkit/blob/main/packages/cache/src/internal/cacheUtils.ts
function getArchiveFileSizeInBytes(filePath) {
    return external_fs_.statSync(filePath).size;
}
async function unlinkFile(filePath) {
    return (0,external_util_.promisify)(external_fs_.unlink)(filePath);
}
async function getVersion(app, additionalArgs = []) {
    let versionOutput = '';
    additionalArgs.push('--version');
    lib_core/* debug */.Yz(`Checking ${app} ${additionalArgs.join(' ')}`);
    try {
        await (0,exec/* exec */.m)(`${app}`, additionalArgs, {
            ignoreReturnCode: true,
            silent: true,
            listeners: {
                stdout: (data) => (versionOutput += data.toString()),
                stderr: (data) => (versionOutput += data.toString())
            }
        });
    }
    catch (err) {
        lib_core/* debug */.Yz(err.message);
    }
    versionOutput = versionOutput.trim();
    lib_core/* debug */.Yz(versionOutput);
    return versionOutput;
}
async function resolvePaths(patterns) {
    const paths = [];
    const workspace = process.env['GITHUB_WORKSPACE'] ?? process.cwd();
    const globber = await glob/* create */.v(patterns.join('\n'), {
        implicitDescendants: false
    });
    for await (const file of globber.globGenerator()) {
        const relativeFile = external_path_.relative(workspace, file)
            .replace(new RegExp(`\\${external_path_.sep}`, 'g'), '/');
        lib_core/* debug */.Yz(`Matched: ${relativeFile}`);
        // Paths are made relative so the tar entries are all relative to the root of the workspace.
        if (relativeFile === '') {
            // path.relative returns empty string if workspace and file are equal
            paths.push('.');
        }
        else {
            paths.push(`${relativeFile}`);
        }
    }
    return paths;
}
async function createTempDirectory() {
    const IS_WINDOWS = process.platform === 'win32';
    let tempDirectory = process.env['RUNNER_TEMP'] || '';
    if (!tempDirectory) {
        let baseLocation;
        if (IS_WINDOWS) {
            // On Windows use the USERPROFILE env variable
            baseLocation = process.env['USERPROFILE'] || 'C:\\';
        }
        else {
            if (process.platform === 'darwin') {
                baseLocation = '/Users';
            }
            else {
                baseLocation = '/home';
            }
        }
        tempDirectory = external_path_.join(baseLocation, 'actions', 'temp');
    }
    const dest = external_path_.join(tempDirectory, crypto.randomUUID());
    await lib_io/* mkdirP */.U$(dest);
    return dest;
}
// Use zstandard if possible to maximize cache performance
async function getCompressionMethod() {
    const versionOutput = await getVersion('zstd', ['--quiet']);
    const version = semver.clean(versionOutput);
    lib_core/* debug */.Yz(`zstd version: ${version}`);
    if (versionOutput === '') {
        return CompressionMethod.Gzip;
    }
    else {
        return CompressionMethod.ZstdWithoutLong;
    }
}
function getCacheFileName(compressionMethod) {
    return compressionMethod === CompressionMethod.Gzip
        ? CacheFilename.Gzip
        : CacheFilename.Zstd;
}
async function getGnuTarPathOnWindows() {
    if (external_fs_.existsSync(GnuTarPathOnWindows)) {
        return GnuTarPathOnWindows;
    }
    const versionOutput = await getVersion('tar');
    return versionOutput.toLowerCase().includes('gnu tar') ? lib_io/* which */.K7('tar') : '';
}
// from https://github.com/actions/toolkit/blob/main/packages/cache/src/internal/tar.ts
const IS_WINDOWS = process.platform === 'win32';
function getWorkingDirectory() {
    return process.env['GITHUB_WORKSPACE'] ?? process.cwd();
}
// Returns tar path and type: BSD or GNU
async function getTarPath() {
    switch (process.platform) {
        case 'win32': {
            const gnuTar = await getGnuTarPathOnWindows();
            const systemTar = SystemTarPathOnWindows;
            if (gnuTar) {
                // Use GNUtar as default on windows
                return { path: gnuTar, type: ArchiveToolType.GNU };
            }
            else if (external_fs_.existsSync(systemTar)) {
                return { path: systemTar, type: ArchiveToolType.BSD };
            }
            break;
        }
        case 'darwin': {
            const gnuTar = await lib_io/* which */.K7('gtar', false);
            if (gnuTar) {
                // fix permission denied errors when extracting BSD tar archive with GNU tar - https://github.com/actions/cache/issues/527
                return { path: gnuTar, type: ArchiveToolType.GNU };
            }
            else {
                return {
                    path: await lib_io/* which */.K7('tar', true),
                    type: ArchiveToolType.BSD
                };
            }
        }
        default:
            break;
    }
    // Default assumption is GNU tar is present in path
    return {
        path: await lib_io/* which */.K7('tar', true),
        type: ArchiveToolType.GNU
    };
}
// Common function for extractTar and listTar to get the compression method
async function getDecompressionProgram(tarPath, compressionMethod, archivePath) {
    // -d: Decompress.
    // unzstd is equivalent to 'zstd -d'
    // --long=#: Enables long distance matching with # bits. Maximum is 30 (1GB) on 32-bit OS and 31 (2GB) on 64-bit.
    // Using 30 here because we also support 32-bit self-hosted runners.
    const BSD_TAR_ZSTD = tarPath.type === ArchiveToolType.BSD &&
        compressionMethod !== CompressionMethod.Gzip &&
        IS_WINDOWS;
    switch (compressionMethod) {
        case CompressionMethod.Zstd:
            return BSD_TAR_ZSTD
                ? [
                    'zstd -d --long=30 --force -o',
                    TarFilename,
                    archivePath.replace(new RegExp(`\\${external_path_.sep}`, 'g'), '/')
                ]
                : [
                    '--use-compress-program',
                    IS_WINDOWS ? '"zstd -d --long=30"' : 'unzstd --long=30'
                ];
        case CompressionMethod.ZstdWithoutLong:
            return BSD_TAR_ZSTD
                ? [
                    'zstd -d --force -o',
                    TarFilename,
                    archivePath.replace(new RegExp(`\\${external_path_.sep}`, 'g'), '/')
                ]
                : ['--use-compress-program', IS_WINDOWS ? '"zstd -d"' : 'unzstd'];
        default:
            return ['-z'];
    }
}
// Used for creating the archive
// -T#: Compress using # working thread. If # is 0, attempt to detect and use the number of physical CPU cores.
// zstdmt is equivalent to 'zstd -T0'
// --long=#: Enables long distance matching with # bits. Maximum is 30 (1GB) on 32-bit OS and 31 (2GB) on 64-bit.
// Using 30 here because we also support 32-bit self-hosted runners.
// Long range mode is added to zstd in v1.3.2 release, so we will not use --long in older version of zstd.
async function getCompressionProgram(tarPath, compressionMethod) {
    const cacheFileName = getCacheFileName(compressionMethod);
    const BSD_TAR_ZSTD = tarPath.type === ArchiveToolType.BSD &&
        compressionMethod !== CompressionMethod.Gzip &&
        IS_WINDOWS;
    switch (compressionMethod) {
        case CompressionMethod.Zstd:
            return BSD_TAR_ZSTD
                ? [
                    'zstd -T0 --long=30 --force -o',
                    cacheFileName.replace(new RegExp(`\\${external_path_.sep}`, 'g'), '/'),
                    TarFilename
                ]
                : [
                    '--use-compress-program',
                    IS_WINDOWS ? '"zstd -T0 --long=30"' : 'zstdmt --long=30'
                ];
        case CompressionMethod.ZstdWithoutLong:
            return BSD_TAR_ZSTD
                ? [
                    'zstd -T0 --force -o',
                    cacheFileName.replace(new RegExp(`\\${external_path_.sep}`, 'g'), '/'),
                    TarFilename
                ]
                : ['--use-compress-program', IS_WINDOWS ? '"zstd -T0"' : 'zstdmt'];
        default:
            return ['-z'];
    }
}
// Return arguments for tar as per tarPath, compressionMethod, method type and os
async function getTarArgs(tarPath, compressionMethod, type, archivePath = '') {
    const args = [`"${tarPath.path}"`];
    //const cacheFileName = utils.getCacheFileName(compressionMethod)
    const cacheFileName = getCacheFileName(compressionMethod);
    const tarFile = 'cache.tar';
    const workingDirectory = getWorkingDirectory();
    // Speficic args for BSD tar on windows for workaround
    const BSD_TAR_ZSTD = tarPath.type === ArchiveToolType.BSD &&
        compressionMethod !== CompressionMethod.Gzip &&
        IS_WINDOWS;
    // Method specific args
    switch (type) {
        case 'create':
            args.push('--posix', '-cf', BSD_TAR_ZSTD
                ? tarFile
                : cacheFileName.replace(new RegExp(`\\${external_path_.sep}`, 'g'), '/'), '--exclude', BSD_TAR_ZSTD
                ? tarFile
                : cacheFileName.replace(new RegExp(`\\${external_path_.sep}`, 'g'), '/'), '-P', '-C', workingDirectory.replace(new RegExp(`\\${external_path_.sep}`, 'g'), '/'), '--files-from', ManifestFilename);
            break;
        case 'extract':
            args.push('-xf', BSD_TAR_ZSTD
                ? tarFile
                : archivePath.replace(new RegExp(`\\${external_path_.sep}`, 'g'), '/'), '-P', '-C', workingDirectory.replace(new RegExp(`\\${external_path_.sep}`, 'g'), '/'));
            break;
        case 'list':
            args.push('-tf', BSD_TAR_ZSTD
                ? tarFile
                : archivePath.replace(new RegExp(`\\${external_path_.sep}`, 'g'), '/'), '-P');
            break;
    }
    // Platform specific args
    if (tarPath.type === ArchiveToolType.GNU) {
        switch (process.platform) {
            case 'win32':
                args.push('--force-local');
                break;
            case 'darwin':
                args.push('--delay-directory-restore');
                break;
        }
    }
    return args;
}
// Returns commands to run tar and compression program
async function getCommands(compressionMethod, type, archivePath = '') {
    let args;
    const tarPath = await getTarPath();
    const tarArgs = await getTarArgs(tarPath, compressionMethod, type, archivePath);
    const compressionArgs = type !== 'create'
        ? await getDecompressionProgram(tarPath, compressionMethod, archivePath)
        : await getCompressionProgram(tarPath, compressionMethod);
    const BSD_TAR_ZSTD = tarPath.type === ArchiveToolType.BSD &&
        compressionMethod !== CompressionMethod.Gzip &&
        IS_WINDOWS;
    if (BSD_TAR_ZSTD && type !== 'create') {
        args = [[...compressionArgs].join(' '), [...tarArgs].join(' ')];
    }
    else {
        args = [[...tarArgs].join(' '), [...compressionArgs].join(' ')];
    }
    if (BSD_TAR_ZSTD) {
        return args;
    }
    return [args.join(' ')];
}
// Executes all commands as separate processes
async function execCommands(commands, cwd) {
    for (const command of commands) {
        try {
            await (0,exec/* exec */.m)(command, undefined, {
                cwd,
                env: { ...process.env, MSYS: 'winsymlinks:nativestrict' }
            });
        }
        catch (error) {
            throw new Error(`${command.split(' ')[0]} failed with error: ${error?.message}`);
        }
    }
}
// List the contents of a tar
async function listTar(archivePath, compressionMethod) {
    const commands = await getCommands(compressionMethod, 'list', archivePath);
    await execCommands(commands);
}
// Extract a tar
async function extractTar(archivePath, compressionMethod) {
    // Create directory to extract tar into
    const workingDirectory = getWorkingDirectory();
    await io.mkdirP(workingDirectory);
    const commands = await getCommands(compressionMethod, 'extract', archivePath);
    await execCommands(commands);
}
// Create a tar
async function createTar(archiveFolder, sourceDirectories, compressionMethod) {
    // Write source directories to manifest.txt to avoid command length limits
    external_fs_.writeFileSync(external_path_.join(archiveFolder, ManifestFilename), sourceDirectories.join('\n'));
    const commands = await getCommands(compressionMethod, 'create');
    await execCommands(commands, archiveFolder);
}

;// CONCATENATED MODULE: ./src/custom/backend.ts



async function getArchiveLocation() {
    const cacheTopDir = process.env["GHRUNNER_CACHE"];
    if (!cacheTopDir) {
        lib_core/* warning */.$e('getArchiveLocation: cache not available');
        return undefined;
    }
    const repo = process.env["GITHUB_REPOSITORY"];
    const ref = process.env["GITHUB_REF_NAME"];
    const cacheDir = external_path_.join(cacheTopDir, repo, ref);
    lib_core/* debug */.Yz(`getArchiveLocation: ${cacheDir}`);
    return cacheDir;
}
async function getCacheFile(key) {
    const archiveLocation = await getArchiveLocation();
    //core.info(`getCacheFile: archiveLocation = ${archiveLocation}`);
    if (!archiveLocation) {
        return undefined;
    }
    const cacheFile = path.join(archiveLocation, key);
    try {
        const fileStat = await fs.stat(cacheFile);
        if (fileStat.isFile() && fileStat.size > 0) {
            core.debug(`getCacheFile: found ${cacheFile}`);
            return cacheFile;
        }
        else {
            core.debug(`getCacheFile: ${cacheFile} not found`);
            return undefined;
        }
    }
    catch (error) {
        core.debug(`getCacheFile: ${error}`);
        core.debug(`getCacheFile: ${cacheFile} not found`);
        return undefined;
    }
}
async function downloadCache(cacheFile, archivePath) {
    await fs.copyFile(cacheFile, archivePath);
}
async function saveCache(key, archivePath) {
    const archiveLocation = await getArchiveLocation();
    //core.info(`saveCache: archiveLocation = ${archiveLocation}`);
    if (archiveLocation) {
        const cacheFile = external_path_.join(archiveLocation, key);
        try {
            const dir = await external_fs_.promises.mkdir(external_path_.dirname(cacheFile), { recursive: true, mode: '0775' });
            lib_core/* debug */.Yz(`saveCache: dir created: ${dir}`);
            await external_fs_.promises.copyFile(archivePath, cacheFile);
            lib_core/* debug */.Yz(`saveCache: saved ${archivePath} to ${cacheFile}`);
        }
        catch (error) {
            lib_core/* warning */.$e(`saveCache: failed to save archive: ${error}`);
        }
    }
}

;// CONCATENATED MODULE: ./src/custom/cache.ts
// https://github.com/actions/toolkit/blob/main/packages/cache/src/cache.ts




const CacheFileSizeLimit = 10 * Math.pow(1024, 3); // 10GiB
/**
 * isFeatureAvailable to check the presence of Actions cache service
 *
 * @returns boolean return true if Actions cache service feature is available, otherwise false
 */
function isFeatureAvailable() {
    return !!process.env['GHRUNNER_CACHE'];
}
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}
function checkPaths(paths) {
    if (!paths || paths.length === 0) {
        throw new ValidationError(`Path Validation Error: At least one directory or file path is required`);
    }
}
function checkKey(key) {
    if (key.length > 512) {
        throw new ValidationError(`Key Validation Error: ${key} cannot be larger than 512 characters.`);
    }
    const regex = /^[^,]*$/;
    if (!regex.test(key)) {
        throw new ValidationError(`Key Validation Error: ${key} cannot contain commas.`);
    }
}
/**
 * Restores cache from keys
 *
 * @param paths a list of file paths to restore from the cache
 * @param primaryKey an explicit key for restoring the cache
 * @param restoreKeys an optional ordered list of keys to use for restoring the cache if no cache hit occurred for key
 * @param downloadOptions cache download options
 * @param enableCrossOsArchive an optional boolean enabled to restore on windows any cache created on any platform
 * @returns string returns the key for the cache hit, otherwise returns undefined
 */
async function restoreCache(paths, primaryKey, restoreKeys, options, enableCrossOsArchive = false) {
    checkPaths(paths);
    restoreKeys = restoreKeys || [];
    const keys = [primaryKey, ...restoreKeys];
    core.debug('Resolved Keys:');
    core.debug(JSON.stringify(keys));
    if (keys.length > 10) {
        throw new ValidationError(`Key Validation Error: Keys are limited to a maximum of 10.`);
    }
    for (const key of keys) {
        checkKey(key);
    }
    let archivePath = '';
    const cacheFile = await backend.getCacheFile(primaryKey);
    if (!cacheFile) {
        core.debug(`Cache not found for key: ${primaryKey}`);
        return undefined;
    }
    core.info(`Cache hit for: ${primaryKey}`);
    if (options?.lookupOnly) {
        core.info('Lookup only - skipping download');
        return primaryKey;
    }
    const compressionMethod = await utils.getCompressionMethod();
    archivePath = path.join(await utils.createTempDirectory(), utils.getCacheFileName(compressionMethod));
    core.debug(`Archive Path: ${archivePath}`);
    // Download the cache from the cache entry
    try {
        await backend.downloadCache(cacheFile, archivePath);
        const archiveFileSize = utils.getArchiveFileSizeInBytes(archivePath);
        core.info(`Cache Size: ~${Math.round(archiveFileSize / (1024 * 1024))} MB (${archiveFileSize} B)`);
        if (core.isDebug()) {
            await utils.listTar(archivePath, compressionMethod);
        }
        await utils.extractTar(archivePath, compressionMethod);
        core.info('Cache restored successfully');
        return primaryKey;
    }
    catch (error) {
        core.warning(`Failed to restore: ${error.message}`);
        return undefined;
    }
    finally {
        // Try to delete the archive to save space
        try {
            await utils.unlinkFile(archivePath);
        }
        catch (error) {
            core.debug(`Failed to delete archive: ${error}`);
        }
    }
    return undefined;
}
/**
 * Saves a list of files with the specified key
 *
 * @param paths a list of file paths to be cached
 * @param key an explicit key for restoring the cache
 * @param options cache upload options
 * @param enableCrossOsArchive an optional boolean enabled to save cache on windows which could be restored on any platform
 * @returns number returns cacheId if the cache was saved successfully and throws an error if save fails
 */
async function cache_saveCache(paths, key, options, enableCrossOsArchive = false) {
    checkPaths(paths);
    checkKey(key);
    const compressionMethod = await getCompressionMethod();
    let cacheId = -1;
    const cachePaths = await resolvePaths(paths);
    lib_core/* debug */.Yz('Cache Paths:');
    lib_core/* debug */.Yz(`${JSON.stringify(cachePaths)}`);
    if (cachePaths.length === 0) {
        throw new Error(`Path Validation Error: Path(s) specified in the action for caching do(es) not exist, hence no cache is being saved.`);
    }
    const archiveFolder = await createTempDirectory();
    const archivePath = external_path_.join(archiveFolder, getCacheFileName(compressionMethod));
    lib_core/* debug */.Yz(`Archive Path: ${archivePath}`);
    try {
        await createTar(archiveFolder, cachePaths, compressionMethod);
        if (lib_core/* isDebug */._o()) {
            await listTar(archivePath, compressionMethod);
        }
        // check file size
        const archiveFileSize = getArchiveFileSizeInBytes(archivePath);
        lib_core/* debug */.Yz(`File Size: ${archiveFileSize}`);
        if (archiveFileSize > CacheFileSizeLimit) {
            throw new Error(`Cache size of ~${Math.round(archiveFileSize / (1024 * 1024))} MB (${archiveFileSize} B) is over the ${Math.round(CacheFileSizeLimit / (1024 * 1024))} MB (${CacheFileSizeLimit} B) limit, not saving cache.`);
        }
        await saveCache(key, archivePath);
        // dummy cacheId, if we get there without raising, it means the cache has been saved
        cacheId = 1;
    }
    catch (error) {
        const typedError = error;
        if (typedError.name === ValidationError.name) {
            throw error;
        }
        else {
            lib_core/* warning */.$e(`Failed to save: ${typedError.message}`);
        }
    }
    finally {
        // Try to delete the archive to save space
        try {
            await unlinkFile(archivePath);
        }
        catch (error) {
            lib_core/* debug */.Yz(`Failed to delete archive: ${error}`);
        }
    }
    return cacheId;
}


/***/ })

};
