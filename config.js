var local_config = require('./config.json');

class Config {
  constructor(){
    this.defaultConfig = {
      port: 8000,
      dtd_dir:"dtd",
      output_dir_md:"md",
      output_dir_xml:"xml",
      public: false
    };

    this.currentConfig = {};
    this.currentConfig = Object.assign(this.currentConfig, this.defaultConfig, local_config);
  }

  getConfig(){
    return this.currentConfig;
  }

}

module.exports = new Config();
