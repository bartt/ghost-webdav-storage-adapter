# WebDAV storage adapter for Ghost [![Build Status](https://travis-ci.org/bartt/ghost-webdav-storage-adapter.svg?branch=master)](https://travis-ci.org/bartt/ghost-webdav-storage-adapter)

A WebDAV storage adapter for the [Ghost](https://ghost.org/) publishing platform 1.x

## Installation

```shell
npm install ghost-webdav-storage-adapter
mkdir -p ./content/adapters/storage
cp -r ./node_modules/ghost-webdav-storage-adapter/dist ./content/adapters/storage/webdav

`````` 

## Configuration

```json
{
  "storage": {
    "active": "webdav",
    "webdav": {
      "url": "URL_TO_YOUR_WEBDAV_SERVER",
      "username": "YOUR_WEBDAV_USERNAME",
      "password": "YOUR_WEBDAV_PASSWORD",
      "pathPrefix": "YOUR_PATH_PREFIX"
    }
  }
}
```

### Via environment variables

```
WEBDAV_SERVER_URL
WEBDAV_USERNAME // optional 
WEBDAV_PASSWORD // optional
WEBDAV_PATH_PREFIX // optional
```

## License

[ISC](./LICENSE.md)
