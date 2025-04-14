import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as exec from '@actions/exec';
import { HttpClient } from '@actions/http-client';

import fs from 'fs';
import path from 'path';

import {JavaBase} from '../base-installer';
import {
  JavaDownloadRelease,
  JavaInstallerOptions,
  JavaInstallerResults
} from '../base-models';
import {
  extractJdkFile,
  getDownloadArchiveExtension,
  renameWinArchive
} from '../../util';
import {HttpCodes} from '@actions/http-client';

const ORACLE_DL_BASE = 'https://download.oracle.com/java';

export class OracleDistribution extends JavaBase {
  constructor(installerOptions: JavaInstallerOptions) {
    super('Oracle', installerOptions);
  }

  protected async downloadTool(
    javaRelease: JavaDownloadRelease
  ): Promise<JavaInstallerResults> {
    core.info(
      `Downloading Java ${javaRelease.version} (${this.distribution}) from ${javaRelease.url} ...`
    );
    let javaArchivePath = await tc.downloadTool(javaRelease.url);

    core.info(`Extracting Java archive...`);
    const extension = getDownloadArchiveExtension();
    if (process.platform === 'win32') {
      javaArchivePath = renameWinArchive(javaArchivePath);
    }
    const extractedJavaPath = await extractJdkFile(javaArchivePath, extension);

    const archiveName = fs.readdirSync(extractedJavaPath)[0];
    const archivePath = path.join(extractedJavaPath, archiveName);
    const version = this.getToolcacheVersionName(javaRelease.version);

    const javaPath = await tc.cacheDir(
      archivePath,
      this.toolcacheFolderName,
      version,
      this.architecture
    );

    return {version: javaRelease.version, path: javaPath};
  }

  protected async findPackageForDownload(
    range: string
  ): Promise<JavaDownloadRelease> {
    const arch = this.distributionArchitecture();
    if (arch !== 'x64' && arch !== 'aarch64') {
      throw new Error(`Unsupported architecture: ${this.architecture}`);
    }

    if (!this.stable) {
      throw new Error('Early access versions are not supported');
    }

    if (this.packageType !== 'jdk') {
      throw new Error('Oracle JDK provides only the `jdk` package type');
    }

    const platform = this.getPlatform();
    const extension = getDownloadArchiveExtension();

    const isOnlyMajorProvided = !range.includes('.');
    const major = isOnlyMajorProvided ? range : range.split('.')[0];

    const possibleUrls: string[] = [];

    let fullVer = range;
    if (isOnlyMajorProvided) {
      fullVer = await this.getLatestVer(major);
    }
    core.debug(`range:${range} major:${major} fullVer:${fullVer}`);

    /**
     * NOTE
     * If only major version was provided we will check it under /latest first
     * in order to retrieve the latest possible version if possible,
     * otherwise we will fall back to /archive where we are guaranteed to
     * find any version if it exists
     */
    /*
    if (isOnlyMajorProvided) {
      const fullVer = await getLatestVer(major);
      possibleUrls.push(
        `${ORACLE_DL_BASE}/${major}/latest/jdk-${major}_${platform}-${arch}_bin.${extension}`
      );
    }

    possibleUrls.push(
      `${ORACLE_DL_BASE}/${major}/archive/jdk-${range}_${platform}-${arch}_bin.${extension}`
    );
    */
    possibleUrls.push(
      `${ORACLE_DL_BASE}/${major}/archive/jdk-${fullVer}_${platform}-${arch}_bin.${extension}`
    );

    if (parseInt(major) < 17) {
      throw new Error('Oracle JDK is only supported for JDK 17 and later');
    }

    for (const url of possibleUrls) {
      const response = await this.http.head(url);

      if (response.message.statusCode === HttpCodes.OK) {
        return {url, version: fullVer};
        //return {url, version: range};
      }

      if (response.message.statusCode !== HttpCodes.NotFound) {
        throw new Error(
          `Http request for Oracle JDK failed with status code: ${response.message.statusCode}`
        );
      }
    }

    //throw new Error(`Could not find Oracle JDK for SemVer ${range}`);
    core.warning(`Could not find Oracle JDK for SemVer ${fullVer}`);
    return {version:'',url:''};
  }

  /*
   * Get the latest ver string from oracle security baseline URL.
   * Returns the ver string.
   */
  protected async getLatestVer(
    majorVer: string
  ): Promise<string> {
    core.debug(`getLatestVer for ${majorVer}`);
    const url = 'https://javadl-esd-secure.oracle.com/update/baseline.version';
    const http = new HttpClient('ver');
    const resp = await http.get(url);
    const status = resp.message.statusCode;
    let fullVer = '';
    const body = await resp.readBody();
    const regex = new RegExp(`^(?<ver>${majorVer}\\.\\d+\\.\\d+)$`, 'gm');
    const matchedResult = regex.exec(body);
    if (matchedResult) {
      // found it
      fullVer = matchedResult.groups!.ver;
      core.debug(`full ver for ${majorVer}: ${fullVer}`);
    } else {
      core.warning(`Failed to extract java version from baseline url`);
    }
    return fullVer;
  }

  public getPlatform(platform: NodeJS.Platform = process.platform): OsVersions {
    switch (platform) {
      case 'darwin':
        return 'macos';
      case 'win32':
        return 'windows';
      case 'linux':
        return 'linux';
      default:
        throw new Error(
          `Platform '${platform}' is not supported. Supported platforms: 'linux', 'macos', 'windows'`
        );
    }
  }
}
