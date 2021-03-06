// Generated by CoffeeScript 1.6.2
(function() {
  var BlobResponse, Channel, DATA_FOLDER, JSONResponse, Message, USER_HOME_FOLDER, app, discoverChannels, express, fs, http, index_file_content, mime, path, raise404,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __slice = [].slice;

  index_file_content = "<!DOCTYPE html>\n<html>\n<head>\n    <title>Missive</title>\n    <meta http-equiv=\"content-type\" content=\"text/html; charset=utf-8\" />\n    <link href=\"/ui/doodad-0.0.0-dev.css\" type=\"text/css\" rel=\"stylesheet\">\n    <link href=\"/ui/main.css\" type=\"text/css\" rel=\"stylesheet\">\n</head>\n<body>\n    <div id=\"app\">Loading&hellip;</div>\n    <script src=\"/ui/zepto-1.0.js\"></script>\n    <script src=\"/ui/underscore-1.5.1.js\"></script>\n    <script src=\"/ui/backbone-1.0.0.js\"></script>\n    <script src=\"/ui/doodad-0.0.0-dev.js\"></script>\n    <script src=\"/ui/markdown.js\"></script>\n    <script src=\"/ui/date.extensions.js\"></script>\n    <script src=\"/ui/main.js\"></script>\n</body>\n</html>";

  express = require('express');

  http = require('http');

  fs = require('fs');

  path = require('path');

  mime = require('mime');

  app = express();

  app.set('port', process.env.PORT || 3000);

  app.use(express.logger('dev'));

  app.use(express.bodyParser());

  app.use(express.methodOverride());

  app.use(app.router);

  app.use('/ui', express["static"](path.join(__dirname, '../ui')));

  if (app.get('env') === 'development') {
    app.use(express.errorHandler());
  }

  JSONResponse = function(res, data) {
    if (data == null) {
      raise404(res);
    }
    res.write(JSON.stringify(data));
    return res.end();
  };

  BlobResponse = function(res, file_info) {
    var file_content, file_path;

    if (file_info == null) {
      raise404(res);
    }
    file_path = file_info[0], file_content = file_info[1];
    res.write(file_content);
    return res.end();
  };

  raise404 = function(res) {
    res.status(404);
    res.write('404 NOT FOUND');
    return res.end();
  };

  app.get('/', function(req, res) {
    res.write(index_file_content);
    return res.end();
  });

  USER_HOME_FOLDER = process.env.HOME || process.env.USERPROFILE;

  DATA_FOLDER = path.join(USER_HOME_FOLDER, 'missive_data');

  Channel = (function() {
    function Channel(name) {
      this.name = name;
      this.loadMessages = __bind(this.loadMessages, this);
      this.toJSON = __bind(this.toJSON, this);
      this.boxURL = __bind(this.boxURL, this);
      this.inbox_folder = path.join(DATA_FOLDER, this.name, 'inbox');
      this.outbox_folder = path.join(DATA_FOLDER, this.name, 'outbox');
      this.inbox_count = this._countBox(this.inbox_folder);
      this.outbox_count = this._countBox(this.outbox_folder);
      this.url = "/channels/" + this.name;
      this.messages_url = "/channels/" + this.name + "/messages";
    }

    Channel.prototype.boxURL = function(box) {
      return "/channels/" + this.name + "/" + box;
    };

    Channel.prototype.toJSON = function() {
      var data;

      data = {
        url: this.url,
        messages_url: this.messages_url,
        name: this.name
      };
      if (this.inbox_count != null) {
        data.inbox_count = this.inbox_count;
        data.inbox_url = this.boxURL('inbox');
      }
      if (this.outbox_count != null) {
        data.outbox_count = this.outbox_count;
        data.outbox_url = this.boxURL('outbox');
      }
      return data;
    };

    Channel.prototype.loadMessage = function(box, message_id) {
      var box_folder, message_file, message_path;

      box_folder = this["" + box + "_folder"];
      message_file = message_id + '.txt';
      message_path = path.join(box_folder, message_file);
      if (fs.existsSync(message_path)) {
        return new Message(this, box_folder, message_file);
      }
      return null;
    };

    Channel.prototype.loadMessages = function(box) {
      var inbox_files, messages, outbox_files,
        _this = this;

      if (box == null) {
        box = null;
      }
      if ((this.inbox_count == null) && box === 'inbox') {
        return null;
      }
      if ((this.outbox_count == null) && box === 'outbox') {
        return null;
      }
      messages = [];
      if ((this.inbox_count != null) && box !== 'outbox') {
        inbox_files = fs.readdirSync(this.inbox_folder);
        console.log(inbox_files);
        inbox_files.forEach(function(f) {
          if ((f != null ? f[0] : void 0) !== '.') {
            console.log('f', f.split('.'));
            if (f.split('.').length !== 1) {
              return messages.push(new Message(_this, _this.inbox_folder, f));
            }
          }
        });
      }
      if ((this.outbox_count != null) && box !== 'inbox') {
        outbox_files = fs.readdirSync(this.outbox_folder);
        console.log(outbox_files);
        outbox_files.forEach(function(f) {
          if ((f != null ? f[0] : void 0) !== '.') {
            console.log('f', f.split('.'));
            if (f.split('.').length !== 1) {
              return messages.push(new Message(_this, _this.outbox_folder, f));
            }
          }
        });
      }
      messages.sort(function(a, b) {
        return b.date - a.date;
      });
      return messages;
    };

    Channel.prototype._countBox = function(box_folder) {
      var box_files;

      if (!fs.existsSync(box_folder)) {
        return null;
      }
      box_files = fs.readdirSync(box_folder);
      box_files = box_files.filter(function(f, i) {
        return (f != null ? f[0] : void 0) !== '.' && f.split('.').length > 1;
      });
      return box_files.length;
    };

    Channel.prototype.sendMessage = function(body) {
      var day, hour, message, minute, month, name, now, second, year, _pad;

      _pad = function(n) {
        if (n < 10) {
          return "0" + n;
        }
        return "" + n;
      };
      now = new Date();
      year = now.getUTCFullYear();
      month = _pad(now.getUTCMonth() + 1);
      day = _pad(now.getUTCDate());
      hour = _pad(now.getUTCHours());
      minute = _pad(now.getUTCMinutes());
      second = _pad(now.getUTCSeconds());
      name = "" + year + "-" + month + "-" + day + "T" + hour + "-" + minute + "-" + second + "Z.txt";
      message = new Message(this, this.outbox_folder, name);
      message.body = body;
      message.write();
      return message;
    };

    return Channel;

  })();

  Message = (function() {
    function Message(channel, box_folder, name) {
      var day, hour, minute, month, orig, rest, second, year, _ref;

      this.channel = channel;
      this.box_folder = box_folder;
      this.name = name;
      this.toJSON = __bind(this.toJSON, this);
      console.log(this.channel, this.box_folder, this.name);
      this._path = path.join(this.box_folder, this.name);
      this.id = this.name.split('.')[0];
      this._box = this.box_folder.split(path.sep).pop();
      this._url = "" + (this.channel.boxURL(this._box)) + "/" + this.id;
      this._attachments_url = this._url + '/attachments';
      this._attachment_path = path.join(this.box_folder, this.id);
      _ref = this.name.match(/(\d+)-(\d+)-(\d+)T(\d+)-(\d+)-(\d+)Z.txt/), orig = _ref[0], year = _ref[1], month = _ref[2], day = _ref[3], hour = _ref[4], minute = _ref[5], second = _ref[6], rest = 8 <= _ref.length ? __slice.call(_ref, 7) : [];
      this.date = new Date("" + year + "-" + month + "-" + day + "T" + hour + ":" + minute + ":" + second + "Z");
    }

    Message.prototype.read = function() {
      if (fs.existsSync(this._path)) {
        this.body = fs.readFileSync(this._path, {
          encoding: 'utf-8'
        });
        this._has_attachments = fs.existsSync(this._attachment_path);
      }
      return this.body;
    };

    Message.prototype.write = function() {
      if (this.body != null) {
        fs.writeFileSync(this._path, this.body, {
          encoding: 'utf-8'
        });
      }
    };

    Message.prototype.toJSON = function() {
      var data;

      if (this.body == null) {
        this.read();
      }
      this._box;
      data = {
        box: this._box,
        date: this.date.toISOString(),
        body: this.body,
        url: this._url,
        attachments_url: this._attachments_url,
        has_attachments: this._has_attachments
      };
      return data;
    };

    Message.prototype.loadAttachments = function() {
      var attachments, files,
        _this = this;

      attachments = [];
      if (!fs.existsSync(this._attachment_path)) {
        return [];
      }
      files = fs.readdirSync(this._attachment_path).filter(function(f) {
        return (f != null ? f[0] : void 0) !== '.';
      });
      return files.map(function(f) {
        return {
          'name': f,
          'type': mime.lookup(f),
          'url': _this._attachments_url + '/' + f
        };
      });
    };

    Message.prototype.loadAttachmentData = function(file_path) {
      var target_file;

      target_file = path.join(this._attachment_path, file_path);
      if (!fs.existsSync(target_file)) {
        return null;
      }
      return [file_path, fs.readFileSync(target_file)];
    };

    Message.prototype.saveAttachment = function(file_info) {
      var target_path;

      if (!fs.existsSync(this._attachment_path)) {
        fs.mkdirSync(this._attachment_path);
      }
      target_path = path.join(this._attachment_path, file_info.name);
      return fs.renameSync(file_info.path, target_path);
    };

    return Message;

  })();

  discoverChannels = function() {
    var channels, files, name, _i, _len;

    files = fs.readdirSync(DATA_FOLDER);
    channels = [];
    for (_i = 0, _len = files.length; _i < _len; _i++) {
      name = files[_i];
      if (name[0] !== '.') {
        channels.push(new Channel(name));
      }
    }
    return channels;
  };

  app.get('/channels', function(req, res) {
    var channels;

    channels = discoverChannels();
    return JSONResponse(res, channels.map(function(c) {
      return c.toJSON();
    }));
  });

  app.get('/channels/:channel_name', function(req, res) {
    var channel;

    channel = new Channel(req.params.channel_name);
    return JSONResponse(res, channel.toJSON());
  });

  app.get('/channels/:channel_name/:box', function(req, res) {
    var box, channel, messages;

    channel = new Channel(req.params.channel_name);
    if (req.params.box === 'messages') {
      box = null;
    } else {
      box = req.params.box;
    }
    messages = channel.loadMessages(box);
    return JSONResponse(res, messages != null ? messages.map(function(m) {
      return m.toJSON();
    }) : void 0);
  });

  app.get('/channels/:channel_name/:box/:message_id', function(req, res) {
    var channel, message;

    channel = new Channel(req.params.channel_name);
    message = channel.loadMessage(req.params.box, req.params.message_id);
    return JSONResponse(res, message != null ? message.toJSON() : void 0);
  });

  app.get('/channels/:channel_name/:box/:message_id/attachments', function(req, res) {
    var channel, message;

    channel = new Channel(req.params.channel_name);
    message = channel.loadMessage(req.params.box, req.params.message_id);
    return JSONResponse(res, message != null ? message.loadAttachments() : void 0);
  });

  app.get('/channels/:channel_name/:box/:message_id/attachments/:attachment_path', function(req, res) {
    var channel, message;

    channel = new Channel(req.params.channel_name);
    message = channel.loadMessage(req.params.box, req.params.message_id);
    return BlobResponse(res, message != null ? message.loadAttachmentData(req.params.attachment_path) : void 0);
  });

  app.post('/channels/:channel_name/messages', function(req, res) {
    var channel, message;

    channel = new Channel(req.params.channel_name);
    message = channel.sendMessage(req.body.body);
    return JSONResponse(res, message != null ? message.toJSON() : void 0);
  });

  app.post('/channels/:channel_name/:box/:message_id/attachments', function(req, res) {
    var channel, incoming_file, message;

    channel = new Channel(req.params.channel_name);
    message = channel.loadMessage(req.params.box, req.params.message_id);
    incoming_file = req.files.file;
    message.saveAttachment(incoming_file);
    return JSONResponse(res, {});
  });

  http.createServer(app).listen(app.get('port'), function() {
    return console.log('Express server listening on port ' + app.get('port'));
  });

}).call(this);
