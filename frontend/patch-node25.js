const fs = require('fs');

const origReadlinkSync = fs.readlinkSync;
fs.readlinkSync = function (path, options) {
  try {
    return origReadlinkSync.call(fs, path, options);
  } catch (err) {
    if (err && typeof err === 'object' && (err.code === 'EISDIR' || err.code === 'UNKNOWN')) {
      const newErr = new Error(`EINVAL: invalid argument, readlink '${path}'`);
      newErr.code = 'EINVAL';
      throw newErr;
    }
    throw err;
  }
};

const origReadlink = fs.readlink;
fs.readlink = function (path, options, callback) {
  const cb = typeof options === 'function' ? options : callback;
  const opts = typeof options === 'function' ? {} : options;
  return origReadlink.call(fs, path, opts, (err, target) => {
    if (err && typeof err === 'object' && (err.code === 'EISDIR' || err.code === 'UNKNOWN')) {
      const newErr = new Error(`EINVAL: invalid argument, readlink '${path}'`);
      newErr.code = 'EINVAL';
      return cb(newErr);
    }
    return cb(err, target);
  });
};

if (fs.promises && fs.promises.readlink) {
  const origPromisesReadlink = fs.promises.readlink;
  fs.promises.readlink = async function (path, options) {
    try {
      return await origPromisesReadlink.call(fs.promises, path, options);
    } catch (err) {
      if (err && typeof err === 'object' && (err.code === 'EISDIR' || err.code === 'UNKNOWN')) {
        const newErr = new Error(`EINVAL: invalid argument, readlink '${path}'`);
        newErr.code = 'EINVAL';
        throw newErr;
      }
      throw err;
    }
  };
}
