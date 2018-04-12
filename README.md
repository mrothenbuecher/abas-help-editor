# abas-help-editor
online markdown editor to create help files for the abas EPR

## benefits
- write the help files with markdown
- work parallel on one document (multiuser)

## requirements
node js 9.8.0 or higher and npm 5.8.0

## installation

1. download repository
2. `npm install`
3. edit config.js (change atleast the session_secret property)
4. start with `npm start`

### settings

| key             | type : default  | meaning                                                                   |
| --------------- | --------------- | ------------------------------------------------------------------------- |
| port            | int : 8000      | port on which the web interface will be reachable                         |
| dtd_path        | string : empty  | absolute path to the dtd file(s)                                          |
| output_dir_md   | string : "md"   | name of the directory where genereted mardown files will be stored        |
| output_dir_xml  | string : "xml"  | name of the directory where genereted xml files will be stored            |
| imgupload_dir   | string : "img"  | name of the directory where uploaded images will be stored                |
| fileupload_dir  | string : "files"| name of the directory where uploaded files will be stored                 |
| session_secret  | string : empty  | *need to be set before first run*                                         |
| auth            | array : empty   | array of objects `{"username":"...","password":"..."},...`                |
| public          | bool : false    | false means only via localhost reachable, true means public               |
