'use strict';

const BaseAdapter = require('ghost-storage-base');
const Promise = require('bluebird');
const createClient = require('webdav');
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
      config.url || process.env.WEBDAV_SERVER_URL,
      config.username || process.env.WEBDAV_USERNAME,
      config.password || process.env.WEBDAV_PASSWORD
    );
    this.pathPrefix = config.pathPrefix || process.env.WEBDAV_PATH_PREFIX || '';
    this.storagePathPrefix = config.storagePathPrefix || process.env.WEBDAV_STORAGE_PATH_PREFIX || '/content/images';
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
      if (!filePath.startsWith(this.pathPrefix)) {
        reject(new Error(`Can not check files outside of ${this.pathPrefix}: ${filePath}`));
        return;
      }
      this.client
        .stat(filePath)
        .then(() => resolve(true))
        .catch(() => resolve(false));
    });
  }

  /**
   *
   * @param {string} targetDir
   * @private
   */
  ensureDir_ (targetDir) {
    const directories = path.relative(this.pathPrefix, targetDir).split(path.sep);
    const self = this;
    let dirPath = this.pathPrefix;
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
            .catch((error) => reject(error));
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
  save (image, targetDir = this.getTargetDir()) {
    const dirPath = path.join(this.pathPrefix, targetDir);
    return new Promise((resolve, reject) => {
      Promise.all([
        this.getUniqueFileName(image, dirPath),
        readFileAsync(image.path),
        this.ensureDir_(dirPath)
      ]).then(([filename, data]) => {
        this.client.putFileContents(filename, data) &&
          resolve(path.join(this.storagePathPrefix, path.relative(this.pathPrefix, filename)))
      }).catch((error) => reject(error))
    });
  }

  /**
   *
   * @returns {function(*, *, *)}
   */
  serve () {
    return (req, res, next) => {
      this.client
        .createReadStream(path.join(this.pathPrefix, req.path))
        .on('error', (error) => {
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
      this.client
        .deleteFile(path.join(this.pathPrefix, targetDir, filename))
        .then(() => resolve(true))
        .catch(() => resolve(false));
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
      this.client
        .getFileContents(options.path, options)
        .then((buffer) => resolve(buffer))
        .catch((error) => reject(error));
    });
  }
}

const stripTrailingSlash = s => s.replace(/\/$|\\$/, '');
const readFileAsync = Promise.promisify(fs.readFile);

module.exports = WebDavAdapter;
