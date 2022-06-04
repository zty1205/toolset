const fs = require('fs');

function fsResource(path) {
  return new Promise((resolve) => {
    fs.readFile(path, 'utf-8', (err, data) => {
      if (err) {
        resolve(undefined);
      } else {
        resolve(data);
      }
    });
  });
}

function fsResourceList(pathList = []) {
  return Promise.all(pathList.map(fsResource));
}

module.exports = {
  fsResource,
  fsResourceList
};
