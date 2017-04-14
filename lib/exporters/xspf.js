const parseHeaders = require('parse-headers');
const unflatten = require('flat').unflatten;
const escape = require('escape-html');

function convertToXSPF(blocks) {
  // Format all track blocks.
  const playlistChildren = blocks.filter(i => i.is === 'track').map(track => {
    return `<track>
      <location>${escape(track.source)}</location>
      <creator>${escape(track.artist)}</creator>
      <title>${escape(track.name)}</title>
      <trackNum>${escape(track.index)}</trackNum>
    </track>`;
  }).join('\n');

  // Format playlist description block
  const playlist = blocks.find(i => i.is === 'playlist') || {};

  return `<playlist version="1" xmlns="http://xspf.org/ns/0/">
    <title>${playlist.name && escape(playlist.name)}</title>
    <image>${playlist.image}</image>
    <annotation>${playlist.description && Buffer.from(playlist.description, 'base64')}</annotation>
    <info>${playlist.link}</info>
    <trackList>
      ${playlistChildren};
    </trackList>
  </playlist>`;
}

module.exports.default = convertToXSPF;
