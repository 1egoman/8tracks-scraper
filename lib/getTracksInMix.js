const {EventEmitter} = require('events'),
  {
    fetchTrack,
    getLengthOfTrack,
    playMix,
  } = require('./api');

// Given a mix is and set id, traverse through a mix one track at a time and "crawl" a mix.
// Returns an array of tracks that are returned from 8tracks
module.exports = function getTracksInMix(mixId, setId, {delayLengthOfTrack}) {
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
