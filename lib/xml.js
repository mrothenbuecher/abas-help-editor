const Libxml = require('node-libxml');


class XmlHandler {
  constructor(config) {
    this.config = config;
    this.libxml = new Libxml();
  }

  validate(xml) {
    if (xml) {
      console.log("geht", xml);
      return true;
    } else
      return false;
  }

}

module.exports = XmlHandler;
