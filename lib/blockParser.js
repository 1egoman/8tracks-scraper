const parseHeaders = require('parse-headers');
const unflatten = require('flat').unflatten;

const DELIMETER = '%%';

function parseBlockFromString(total) {
  const blocks = [];
  while (total.indexOf(DELIMETER) >= 0) {
    // Find the next track block to parse.
    const firstDelimeterIndex = total.indexOf(DELIMETER);
    const slicedByteCount = firstDelimeterIndex + DELIMETER.length; // Get bytes to remove to cut out the first delimeter
    let secondDelimeterIndex = total.slice(slicedByteCount).indexOf(DELIMETER) + slicedByteCount;
    secondDelimeterIndex = secondDelimeterIndex === slicedByteCount - 1 ? total.length : secondDelimeterIndex;

    // Get the block raw data.
    const rawBlock = total.slice(firstDelimeterIndex + DELIMETER.length, secondDelimeterIndex);

    // Parse the block info
    let block = unflatten(parseHeaders(rawBlock));
    blocks.push(block);

    // Remove the block from the total
    total = total.slice(secondDelimeterIndex);
  }

  return {blocks, rest: total};
}

module.exports.default = parseBlockFromString;
