# abas-help-editor
online markdown editor to create help files for the abas EPR

## benefits
- write the help files for abas ERP with markdown
- work parallel on one document (multiuser)
- add images and files with drag and drop
- see a life preview of the help page during you write

## requirements
node js 9.8.0 or higher and npm 5.8.0

## installation and start

1. download repository
2. `npm install`
3. copy the  the dtd files (s3-303.dtd, s3-help.dtd, s3-ISOlat1.xml) from `$HOMEDIR/handbuch/defs` of your abas ERP to your dtd directory
4. edit config.js accordingly (change atleast the session_secret and dtd_path property)
5. start with `npm start`

### settings

| key             | type : default  | meaning                                                                                                             |
| --------------- | --------------- | ------------------------------------------------------------------------------------------------------------------- |
| port            | int : 8000      | port on which the web interface will be reachable                                                                   |
| dtd_path        | array : empty   | absolute path to the dtd file(s) <br/> e.g. `["C:\\abas-help-editor\\dtd\\s3-help.dtd"]`                            |
| output_dir_md   | string : "md"   | name of the directory where genereted mardown files will be stored                                                  |
| output_dir_xml  | string : "xml"  | name of the directory where genereted xml files will be stored                                                      |
| imgupload_dir   | string : "img"  | name of the directory where uploaded images will be stored                                                          |
| fileupload_dir  | string : "files"| name of the directory where uploaded files will be stored                                                           |
| session_secret  | string : empty  | *need to be set before first run*                                                                                   |
| auth            | array : empty   | array of objects `{"username":"...","password":"..."},...` <br/> if emtpy only the username will be requested       |
| public          | bool : false    | false means only via localhost reachable, true means public                                                         |
