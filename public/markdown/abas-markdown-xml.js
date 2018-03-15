/**
 *
 * snarkdown 1.2.2
 * based on https://github.com/developit/snarkdown
 */

var markdownxml = {
  TAGS:function () {
    return {
      '': ['<REF>', '</REF>'],
      _: ['<B>', '</B>'],
      '\n': ['<BR />\n'],
      ' ': ['<BR />\n'],
      '-': ['<HR />\n']
    };
  },

  /** Outdent a string based on the first indented line's leading whitespace
   *	@private
   */
  outdent : function (str) {
    return str.replace(RegExp('^' + (str.match(/^(\t| )+/) || '')[0], 'gm'), '');
  },

  /** Encode special attribute characters to HTML entities in a String.
   *	@private
   */
  encodeAttr:function (str) {
    return (str + '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  },

  /** Parse Markdown into an HTML String. */
  parse:function (md) {
    var tokenizer = /((?:^|\n+)(?:\n---+|\* \*(?: \*)+)\n)|(?:^```(\w*)\n([\s\S]*?)\n```$)|((?:(?:^|\n+)(?:\t|  {2,}).+)+\n*)|((?:(?:^|\n)([>*+-]|\d+\.)\s+.*)+)|(?:\!\[([^\]]*?)\]\(([^\)]+?)\))|(\[)|(\](?:\(([^\)]+?)\))?)|(?:(?:^|\n+)([^\s].*)\n(\-{3,}|={3,})(?:\n+|$))|(?:(?:^|\n+)(#{1,6}))\s*(?:\{(?:(.*?))\})?(.+)(?:\n+|$)|(?:`\n([\s\S]*?)\n`)|(  \n\n*|\n{2,}|__|\*{2,})|(?:\*(?:\{(\w*)\})?\s*(.*)?\*)/gm,
      context = [],
      out = '',
      last = 0,
      links = {},
      chunk, prev, token, inner, t;

    function tag(token) {
      var desc = markdownxml.TAGS()[token.replace(/\*/g, '_')[1] || ''],
        end = context[context.length - 1] == token;
      if (!desc) {
        return token;
      }
      if (!desc[1]) {
        return desc[0];
      }
      context[end ? 'pop' : 'push'](token);
      return desc[end | 0];
    }

    function flush() {
      var str = '';
      while (context.length) {
        str += tag(context[context.length - 1]);
      }
      return str;
    }

    md = md.replace(/^\[(.+?)\]:\s*(.+)$/gm, function(s, name, url) {
      links[name.toLowerCase()] = url;
      return '';
    }).replace(/^\n+|\n+$/g, '');

    while ((token = tokenizer.exec(md))) {
      prev = md.substring(last, token.index);
      last = tokenizer.lastIndex;
      chunk = token[0];
      if (prev.match(/[^\\](\\\\)*\\$/)) {
        // escaped
      }
      // PRE:
      else if (token[3] || token[4]) {
        chunk = '<PRE><![CDATA[<(Text)>\n' + markdownxml.outdent(markdownxml.encodeAttr(token[3] || token[4]).replace(/^\n+|\n+$/g, '')) + '\n]]></PRE>\n';
      }
      // > Quotes, -* lists:
      else if (token[6]) {
        t = token[6];
        if (t.match(/\./)) {
          token[5] = token[5].replace(/^\d+/gm, '');
        }
        inner = markdownxml.parse(markdownxml.outdent(token[5].replace(/^\s*[>*+.-]/gm, '')));
        if (t === '>') {
          t = 'blockquote';
        } else {
          t = t.match(/\./) ? 'OL' : 'UL';
          inner = inner.replace(/^(.*)(\n|$)/gm, '\t<LI>$1</LI>\n');
        }
        chunk = '<' + t + '>\n' + inner + '</' + t + '>\n';
      }
      // Images:
      else if (token[8]) {
        chunk = "<IMG SRC=\"" + (markdownxml.encodeAttr(token[8])) + "\" ALT=\"" + (markdownxml.encodeAttr(token[7])) + "\" />\n";
      }
      // Links:
      else if (token[10]) {
        out = out.replace('<A>', ("<A HREF=\"" + (markdownxml.encodeAttr(token[11] || links[prev.toLowerCase()])) + "\">"));
        chunk = flush() + '</A>\n';
      } else if (token[9]) {
        chunk = '<A>';
      }
      // Headings:
      else if (token[12] || token[14]) {
        t = 'H' + (token[14] ? token[14].length : (token[13][0] === '=' ? 1 : 2));

        var id = token[15];
        var split = null;
        if(id && (foo = id.split(",")).length){
          id = foo[0];
          split=foo[1];
        }

        chunk = '<' + t +(id?' ID="'+id+'" ':"")+(split?' SPLIT="'+split+'" ':"")+ '>' + markdownxml.parse(token[12] || token[16]) + '</' + t + '>\n';
      }
      // `PROGRAM`:
      else if (token[17]) {
        chunk = '<PROGRAM><![CDATA[<(Text)>\n' + markdownxml.outdent(markdownxml.encodeAttr(token[17]).replace(/^\n+|\n+$/g, '')) + '\n]]></PROGRAM>\n';
      }

      // Inline formatting: **strong** & hr & br
      else if (token[18] || token[1]) {
        chunk = tag(token[18] || '--');
      }
      // REF
      else if(token[19] && token[20]){
        chunk = '<REF ID="'+token[19]+'">'+token[20]+'</REF>'
      }
      out += prev;
      out += chunk;
    }
    return (out + md.substring(last) + flush()).trim();
  },
  getPlainXml:function (md) {
    return '<?xml version="1.0" encoding="UTF-8"?>\n'+"<CHAPTER>\n"+markdownxml.parse(md)+"\n</CHAPTER>";
  }

};
