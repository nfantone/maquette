'use strict';
/**
 * @author nfantone
 */
module.exports = {
  serialize: function(obj) {
    return !(obj instanceof Buffer) ? JSON.stringify(obj) : obj;
  },
  deserialize: function(obj) {
    return JSON.parse(obj);
  }
};
