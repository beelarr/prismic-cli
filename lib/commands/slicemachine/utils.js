import fs from 'fs';
import path from 'path';
import deepEqual from 'deep-equal';
import Helpers from '../../helpers';
import Sentry from '../../services/sentry';

export const Files = {
  ERROR_CODES: {
    ENOENT: 'ENOENT',
  },

  _format: 'utf8',
  writeJson(pathToFile, jsValue) {
    fs.writeFileSync(pathToFile, JSON.stringify(jsValue, null, 2), this._format);
  },
  readJson(pathToFile) {
    return JSON.parse(fs.readFileSync(pathToFile, this._format));
  },
  isDirectory: source => fs.lstatSync(source).isDirectory(),
  exists(pathToFile) {
    try {
      return Boolean(fs.lstatSync(pathToFile));
    } catch (e) {
      if (e.code === this.ERROR_CODES.ENOENT) return false;
      throw e;
    }
  },
  append(filePath, data) {
    fs.appendFileSync(filePath, data);
  },
};

export const Folders = {
  lsPaths(source) {
    return fs.readdirSync(source)
      .map(name => path.join(source, name));
  },
  mkdir(pathToFolder) {
    fs.mkdirSync(pathToFolder, { recursive: true });
  },
};

export function matchObjIn(toMatchObj, dataset) {
  if (!toMatchObj) return [];

  return Object.entries(toMatchObj).reduce(([miss, diff, equals], [key, value]) => {
    const item = dataset[key];
    if (item) {
      if (deepEqual(item, value)) return [miss, diff, { ...equals, [key]: value }];
      return [miss, { ...diff, [key]: { before: item, after: value } }, equals];
    }
    return [{ ...miss, [key]: value }, diff, equals];
  }, []);
}

export const ZipUtils = {
  filterZipEntries(filePaths, zipFile) {
    return zipFile.getEntries().filter(e => (
      filePaths.reduce((acc, filePath) => acc || e.entryName === filePath, false)
    ));
  },

  extractTo(entries, destinationPath, zipFile) {
    entries.forEach((entry) => {
      try {
        zipFile.extractEntryTo(entry.entryName, destinationPath, /* maintainEntryPath */ true);
      } catch (e) {
        Sentry.report(e);
        Helpers.UI.displayErrors(`Failed to insert this file: ${entry.entryName} ${e}`);
      }
    });
  },
  mergeInto(entries, destinationPath, zipFile) {
    entries.forEach((entry) => {
      try {
        zipFile.extractEntryTo(entry.entryName, destinationPath, /* maintainEntryPath */ true, /* overwrite */ true);
      } catch (e) {
        Sentry.report(e);
        Helpers.UI.displayErrors(`Failed to insert this file: ${entry.entryName}`);
      }
    });
  },
};

