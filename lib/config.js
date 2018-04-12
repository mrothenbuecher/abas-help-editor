var local_config = require('../config.json');
var fs = require('fs');

class Config {
  constructor(){
    this.defaultConfig = {
      port: 8000,
      dtd_path:[""],
      output_dir_md:"md",
      output_dir_xml:"xml",
      imgupload_dir:"img",
      fileupload_dir:"files",
      session_secret: "",
      auth: [],
      public: false
    };

    this.currentConfig = {};
    this.currentConfig = Object.assign(this.currentConfig, this.defaultConfig, local_config);
  }

  getDtd(){
    return this.currentConfig.dtd_path;
  }

  getMd(){
    var files = fs.readdirSync(process.cwd()+"/"+this.currentConfig.output_dir_md);
    return files;
  }

  getConfig(){
    return this.currentConfig;
  }

}

module.exports = new Config();
