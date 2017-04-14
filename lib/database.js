const fs = require('fs');
const DATABASE = process.env.HOME + "/tracks.dsv";
const db = fs.createWriteStream(DATABASE, {flags: 'a'});

function serialize({name, release_name, performer, url, track_file_stream_url}) {
  return [
    name,
    release_name,
    performer,
    url,
    track_file_stream_url,
  ].join('|');
}

module.exports.default = function addToMusicDB(track) {
  db.write(serialize(track));
  db.write('\n');
}
