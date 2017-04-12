#!/usr/bin/env node
/* vim: set syntax=javascript ft=javascript : */
const Promise = require('bluebird'),
      request = require('request-promise'),
      flatten = require('flat'),
      {EventEmitter} = require('events'),
      fs = require('fs');

function generateRandomSetId() {
  return (Math.floor(Math.random() * 300000) + 100000).toString();
}

let index = 0;
function logTrack(currentSong) {
  // A seperator:
  console.log('%%');

  let flattened = flatten({
    is: 'track',
    index: ++index,
    name: currentSong.name,
    album: currentSong.release_name,
    artist: currentSong.performer,
    artist_bio: currentSong.artist_details ? Buffer.from(currentSong.artist_details.bio_intro).toString('base64') : "",
    url: currentSong.url,
    source: currentSong.track_file_stream_url,
  });

  for (let key in flattened) {
    console.log(`${key}: ${flattened[key]}`);
  }
}




// Given a track, estimate about how long the track will be in seconds.
// The
const SECONDS_PER_BYTE = 2/10000; // 2 ten-thousandths of a second per byte "roughly".
function getLengthOfTrack({track_file_stream_url}) {
  return request({method: 'HEAD', url: track_file_stream_url, resolveWithFullResponse: true})
  .then(resp => {
    return resp.headers['content-length'] * SECONDS_PER_BYTE;
  });
}

// Given a mix url, resolve the corresponding mix id
function convertMixUrlToMixId(url) {
  return request({method: 'GET', url}).then(body => {
    // Throw an error if the id is missing.
    let id = body.match(/eighttracks:\/\/mix\/([0-9]+)/);
    if (id && id.length >= 2) {
      id = id[1];
    } else {
      throw new Error(`Cannot get 8tracks mix id from url - the mix wasn't on the page!`);
    };

    // Extract the name
    let name = body.match(/"og:title"[ ]+content="(.+)"/); // the playlist name
    if (name && name.length >= 2) {
      name = name[1];
    }

    // Extract the description
    let desc = body.match(/"og:description"[ ]+content="([^"]+)"/); // the playlist name
    if (desc && desc.length >= 2) {
      desc = Buffer.from(desc[1]).toString('base64');
    }

    // Extract the image
    let image = body.match(/"og:image"[ ]+content="([^"]+)"/); // the playlist image
    if (image && image.length >= 2) {
      image = image[1];
    }

    // Extract the tags
    // First, get the container that has all the tags in it. Then, loop through and pull out all the
    // tags from the container body and stick them into an array.
    let contents = body.match(/<div id="mix_tags_display" itemprop="keywords">([^]+)<\/div>/), tags;
    if (contents && contents.length >= 2) {
      tags = contents[1].match(/<a[^>]+ href=\"\/explore[^>]+>([^<]+)<\/a>/g).map(match => {
        return match.match(/<a[^>]+>([^<]+)<\/a>/)[1].trim();
      });
    } else {
      tags = [];
    }

    return {id, name, desc, image, tags, link: url};
  });
}

// Given a mix and set, initiate "playing" the mix.
function playMix(mixId, setId) {
  return request({
    method: 'GET',
    url: `http://8tracks.com/sets/${setId}/play`,
    qs: {
      player: 'sm',
      include: 'track[faved+annotation+artist_details]',
      mix_id: mixId,
      format: 'jsonh',
    },
  }).then(a => JSON.parse(a));
}

// Given a mix and set, fetch the given track (the next one in the sequence) from the playlist.
function fetchTrack(mixId, setId, trackId) {
  return request({
    method: 'GET',
    url: `http://8tracks.com/sets/${setId}/next`,
    qs: {
      player: 'sm',
      include: 'track[faved+annotation+artist_details]',
      mix_id: mixId,
      track_id: trackId,
      format: 'jsonh',
    },
  }).then(a => JSON.parse(a));
}

// Given a mix is and set id, traverse through a mix one track at a time and "crawl" a mix.
// Returns an array of tracks that are returned from 8tracks
function getTracksInMix(mixId, setId, {delayLengthOfTrack}) {
  const emitter = new EventEmitter();

  // A recursive function used to traverse through a mix
  function walkThroughMix(lastTrackId) {
    // Fetch the current song in the mix.
    return fetchTrack(mixId, setId, lastTrackId).then(track => {
      // Log the song
      let currentSong = track.set.track;
      mixContents.push(currentSong);
      emitter.emit('track', currentSong);

      if (track.set.at_last_track) {
        // At end!
        return true;
      } else {
        // fetch next track
        if (delayLengthOfTrack) {
          // Calculate the length of the track
          return getLengthOfTrack(currentSong).then(lengthInSeconds => {
            // console.log('* Approximate Track length:', lengthInSeconds, 'seconds');
            // console.log('* Waiting as if playing...');
            return Promise.delay(lengthInSeconds * 1000);
          }).then(() => {
            return walkThroughMix(track.set.track.id);
          });
        } else {
          // User doesn't want to delay!
          return walkThroughMix(track.set.track.id);
        }
      }
    });
  }

  let mixContents = [];

  // Start by playing the mix. That responds with the first track in the mix.
  const complete = playMix(mixId, setId).then(mix => {
    // log the first song.
    let currentSong = mix.set.track;
    mixContents.push(currentSong);
    emitter.emit('track', currentSong);

    // Start at the 2nd song, since we just fetched the 1st
    return walkThroughMix(mix.set.id, 2);
  }).then(() => {
    return mixContents;
  });

  return {emitter, complete};
}

module.exports = {
  generateRandomSetId,
  logTrack,
  getLengthOfTrack,
  convertMixUrlToMixId,
  playMix,
  fetchTrack,
  getTracksInMix,
};
