const Libxml = require('node-libxml');


class XmlHandler {
  constructor(ConfigHandler) {
    if(!process.env.HEROKU){
      this.config = ConfigHandler.getConfig();
      this.chandler = ConfigHandler;
      this.libxml = new Libxml();
      this.libxml.loadDtds(this.chandler.getDtd());
      if (this.libxml.dtdsLoadedErrors) {
        console.error("error loading dtd: ", this.libxml.dtdsLoadedErrors);
      }
    }
  }

  validate(xml) {
    let val = {};

    val.xml = false;
    val.dtd = false;

    if(!process.env.HEROKU){
      if (this.libxml.dtdsLoadedErrors) {
        console.error("load dtd erros: ", this.libxml.dtdsLoadedErrors);
        val.dtdsLoadedErrors = this.libxml.dtdsLoadedErrors;
      } else {
        if (xml) {
          let xmlIsWellformed = this.libxml.loadXmlFromString(xml);
          val.xml = xmlIsWellformed;
          if (xmlIsWellformed) {
            let xmlIsValid = this.libxml.validateAgainstDtds();
            val.dtd = xmlIsValid;
            if (!xmlIsValid.length) {
              console.error("dtd validation errors: ", this.libxml.validationDtdErrors);
              val.validationDtdErrors = this.libxml.validationDtdErrors;
            }
          } else {
            console.error("xml wellformed errors: ", this.libxml.wellformedErrors);
            val.wellformedErrors = this.libxml.wellformedErrors;
          }
        }
      }
      this.libxml.freeXml();
    }else{
      val.dtdsLoadedErrors = "no validation on HEROKU"
    }
    return val;
  }

}

module.exports = XmlHandler;
