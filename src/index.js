'use strict';

const Buffer = require('buffer').Buffer;
const BaseAdapter = require('ghost-storage-base');
const Promise = require('bluebird');
const createClient = require('webdav');
const debug = require('debug')('webdav');
const fs = require('fs');
const path = require('path');
const process = require('process');

/**
 * @typedef {Object} Config Ghost storage adapter configuration object.
 * @property {string} url The remote address of the WebDAV server
 * @property {string=} username Optional username for authentication
 * @property {string=} password Optional password for authentication
 * @property {string=} pathPrefix Optional path to the root of WebDAV storage
 * @property {string=} storagePathPrefix Optional URL path that routes request to this storage adapter
 */

/**
 * @typedef {Object} Image
 * @property {string} name
 * @property {string} path
 */

/**
 * @typedef {Object} ReadOptions
 * @property {string} path
 */

class WebDavAdapter extends BaseAdapter {
  /**
   * Create a WebDAV adapter
   * @param {Config} config
   */
  constructor (config = {}) {
    super(config);
    if (!config.url && !process.env.WEBDAV_SERVER_URL) {
      throw new Error('A URL to the WebDAV server is required.');
    }
    this.client = createClient(
      process.env.WEBDAV_SERVER_URL || config.url,
      process.env.WEBDAV_USERNAME || config.username,
      process.env.WEBDAV_PASSWORD || config.password
    );
    this.pathPrefix = process.env.WEBDAV_PATH_PREFIX || config.pathPrefix || '';
    this.storagePathPrefix = process.env.WEBDAV_STORAGE_PATH_PREFIX || config.storagePathPrefix || '/content/images';
  }

  /**
   * NOTE: the base implementation of `getTargetDir` returns the format this.pathPrefix/YYYY/MM
   * @param {string} filename
   * @param {string=} targetDir
   * @returns {Promise.<boolean>}
   */
  exists (filename, targetDir = this.pathPrefix) {
    return new Promise((resolve, reject) => {
      const filePath = path.join(targetDir, filename);
      debug(`exists - ${filePath}`);
      if (!filePath.startsWith(this.pathPrefix)) {
        reject(new Error(`Can not check files outside of ${this.pathPrefix}: ${filePath}`));
        return;
      }
      this.client
        .stat(filePath)
        .then(() => {
          debug(`exists - ${filePath}: true`);
          resolve(true)
        })
        .catch(() => {
          debug(`exists - ${filePath}: false`);
          resolve(false)
        });
    });
  }

  /**
   *
   * @param {string} targetPath
   * @private
   */
  ensureDir_ (targetPath) {
    const targetDir = path.dirname(targetPath);
    const directories = path.relative(this.pathPrefix, targetDir).split(path.sep);
    const self = this;
    let dirPath = this.pathPrefix;
    debug(`ensureDir_ - ${targetDir} - ${directories}`);
    return new Promise((resolve, reject) => {
      if (!targetDir.startsWith(this.pathPrefix)) {
        reject(new Error(`Can not create directories outside of ${this.pathPrefix}: ${targetDir}`));
        return;
      }
      (function loop () {
        if (directories.length) {
          dirPath = path.join(dirPath, directories.shift());
          self.exists(dirPath, '/')
            .then((exists) => exists || self.client.createDirectory(dirPath))
            .then(loop)
            .catch((error) => {
              debug(`ensureDir_ - ${dirPath}: ${error}`);
              reject(error)
            });
        } else {
          resolve();
        }
      })();
    });
  }

  /**
   * NOTE: the base implementation of `getTargetDir` returns the format YYYY/MM
   * @param {Image} image
   * @param {string=} targetDir
   * @returns {Promise.<*>}
   */
  save(image, targetDir = this.getTargetDir()) {
    const dirPath = path.join(this.pathPrefix, targetDir);
    debug(`save - ${dirPath} - ${JSON.stringify(image)}`);
    return new Promise((resolve, reject) => {
      Promise.all([
        readFileAsync(image.path),
        this.getUniqueFileName(image, dirPath)
      ])
      .then(([data, filename]) => this.saveRaw(data, filename))
      .then((uri) => {
        debug(`save - ${dirPath} - ${JSON.stringify(image)}: ${uri}`);
        resolve(uri)
      })
      .catch((error) => {
        debug(`save - ${dirPath} - ${JSON.stringify(image)}: ${error}`);
        reject(error)
      })
    });
  }

  /**
   * Write the image to storage, ensuring that the path to the image stats with the
   * prefix and that the target directory exists. The existance of `saveRaw` enables
   *  Ghost's automatic responsive images.
   *
   * @param {*} data
   * @param {string} targetPath
   * @returns {Promise.<string>}
   * @memberof WebDavAdapter
   */
  saveRaw(data, targetPath) {
    debug(`saveRaw - ${JSON.stringify(this)} - ${targetPath}`);
    if (!targetPath.startsWith(this.pathPrefix)) {
      // eslint-disable-next-line no-param-reassign
      targetPath = path.join(this.pathPrefix, targetPath);
    }
    return new Promise((resolve, reject) => {
      this.ensureDir_(targetPath)
      .then(() => this.client.putFileContents(targetPath, data))
      .then(() => {
        const uri = path.join(this.storagePathPrefix, path.relative(this.pathPrefix, targetPath));
        debug(`saveRaw - ${targetPath}: ${uri}`);
        resolve(uri)
      })
      .error((error) => {
        debug(`saveRaw - ${targetPath}: ${error}`);
        reject(error)
      })
    })
  }

  /**
   *
   * @returns {function(*, *, *)}
   */
  serve () {
    return (req, res, next) => {
      const filename = path.join(this.pathPrefix, req.path);
      debug(`serve - ${filename}`);
      this.client
        .createReadStream(filename)
        .on('error', (error) => {
          debug(`serve - ${filename}: ${error}`);
          res.status(404);
          next(error);
        })
        .pipe(res);
    };
  }

  /**
   * NOTE: the base implementation of `getTargetDir` returns the format YYYY/MM
   * @param {string} filename
   * @param {string=} targetDir
   * @returns {Promise.<boolean>}
   */
  delete (filename, targetDir = this.getTargetDir()) {
    return new Promise((resolve) => {
      const filePath = path.join(this.pathPrefix, targetDir, filename);
      debug(`delete - ${filePath}`);
      this.client
        .deleteFile(filePath)
        .then(() => {
          debug(`delete - ${filePath}: true`);
          resolve(true)
        })
        .catch(() => {
          debug(`delete - ${filePath}: false`);
          resolve(false)
        });
    });
  }

  /**
   *
   * @param {ReadOptions} options
   * @returns {Promise.<*>}
   */
  read (options = {}) {
    options.path = stripTrailingSlash(options.path || '');
    options.path = path.join(this.pathPrefix, options.path);
    return new Promise((resolve, reject) => {
      debug(`read - ${JSON.stringify(options)}`);
      this.client
        .getFileContents(options.path, options)
        .then((arrayBuffer) => {
          const buffer = Buffer.from(arrayBuffer);
          if (debug.enabled) {
            const tmpPath = `/tmp/${path.basename(options.path)}`;
            fs.writeFile(`${tmpPath}`, buffer, () => {
              // Do nothing
            });
            debug(`read - ${JSON.stringify(options)}: ${tmpPath} - ${buffer.byteLength} bytes`);
          }
          resolve(buffer)
        })
        .catch((error) => {
          debug(`read - ${JSON.stringify(options)}: ${error}`);
          reject(error)
        });
    });
  }
}

const stripTrailingSlash = s => s.replace(/\/$|\\$/, '');
const readFileAsync = Promise.promisify(fs.readFile);

module.exports = WebDavAdapter;
