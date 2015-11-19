var geom = require('./geometry');

module.exports.map = new geom.Rectangle(0, 0, 350, 350);
module.exports.bounds = module.exports.map.shrink(10, 10, 10, 10);
