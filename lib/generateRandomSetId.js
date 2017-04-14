module.exports.default = function generateRandomSetId() {
  return (Math.floor(Math.random() * 300000) + 100000).toString();
}
