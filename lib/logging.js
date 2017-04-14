const flatten = require('flat');
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));

// Generate a track logger. Returns a function that when passed a track, logs it to stdout.
function generateBlockLogger() {
  // Where should output go?
  const output = argv.output || argv.o || argv._[0];
  if (output && output !== '-') {
    stream = fs.createWriteStream(output);
  } else {
    stream = process.stdout;
  }

  let index = 0;
  return function logThing(thing, type='track') {

    // A seperator:
    stream.write('%%\n');

    let flattened;
    if (type === 'track') {
      // Format tracks a special way.
      flattened = flatten({
        index: ++index,
        name: thing.name,
        album: thing.release_name,
        artist: thing.performer,
        artist_bio: thing.artist_details ? Buffer.from(thing.artist_details.bio_intro).toString('base64') : "",
        url: thing.url,
        source: thing.track_file_stream_url,
      });
    } else {
      // Raw things get no formatting.
      flattened = thing;
    }

    // Add block type to the block.
    flattened.is = type;

    for (let key in flattened) {
      stream.write(`${key}: ${flattened[key]}\n`);
    }
  }
}

function verbose(...args) {
  process.stderr.write(args.join(' '));
}

module.exports = {generateBlockLogger, verbose};
