// Generated by CoffeeScript 1.6.2
(function() {
  var $window, Layout, Panel, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __slice = [].slice;

  $window = $(window);

  Panel = (function(_super) {
    __extends(Panel, _super);

    function Panel() {
      _ref = Panel.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Panel.prototype.className = 'Panel';

    Panel.prototype.initialize = function(layout) {
      this.layout = layout;
    };

    Panel.prototype.render = function() {
      console.log('Panel.render');
      return this.el;
    };

    Panel.prototype.setLayout = function(layout) {
      this.layout = layout;
      return this.$el.css({
        width: this.layout.width,
        height: this.layout.height,
        position: 'absolute',
        left: this.layout.left,
        top: this.layout.top,
        background: this.layout.background,
        overflow: 'scroll',
        'transition-property': 'all',
        'transition-duration': '0.1s'
      });
    };

    Panel.prototype.setContent = function(contents) {
      var _this = this;

      this.$el.empty();
      return _.each(contents, function(item) {
        return _this.$el.append(item.render());
      });
    };

    return Panel;

  })(Backbone.View);

  Layout = (function(_super) {
    __extends(Layout, _super);

    function Layout() {
      this.setPanelSize = __bind(this.setPanelSize, this);
      this.setPanelContent = __bind(this.setPanelContent, this);
      this.getPanel = __bind(this.getPanel, this);
      this.resize = __bind(this.resize, this);      _ref1 = Layout.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Layout.prototype.className = 'Layout';

    Layout.prototype.initialize = function(_arg) {
      var _this = this;

      this.row_first = _arg.row_first, this.layout = _arg.layout;
      this.panels = [];
      this.$el.css({
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(240,240,240,0.5)'
      });
      this.layout.forEach(function(col, icol) {
        var col_list;

        col_list = [];
        _this.panels.push(col_list);
        return col[1].forEach(function(row, irow) {
          return col_list.push(new Panel());
        });
      });
      return $(window).on('resize', _.debounce(this.resize, 50));
    };

    Layout.prototype.render = function() {
      var _this = this;

      console.log('Layout.render');
      this.$el.empty();
      this.panels.forEach(function(col) {
        return col.forEach(function(panel) {
          return _this.$el.append(panel.render());
        });
      });
      return this.resize();
    };

    Layout.prototype.resize = function() {
      var fixed_row_size, h_so_far, num_flex_rows, num_panels, row_flex_size, window_height, window_width, _ref2,
        _this = this;

      window_width = $(window).width();
      window_height = $(window).height();
      if (!this.row_first) {
        _ref2 = [window_width, window_height], window_height = _ref2[0], window_width = _ref2[1];
      }
      num_flex_rows = 0;
      fixed_row_size = 0;
      _.each(this.layout, function(row) {
        if (row[0] === 'flex') {
          return num_flex_rows += 1;
        } else {
          return fixed_row_size += row[0];
        }
      });
      h_so_far = 0;
      row_flex_size = (window_height - fixed_row_size) / num_flex_rows;
      num_panels = 0;
      return _.each(this.layout, function(row, irow) {
        var col_flex_size, cols, fixed_col_size, h, num_flex_cols, row_height, w_so_far;

        row_height = row[0], cols = row[1];
        h = row_height === 'flex' ? row_flex_size : row_height;
        num_flex_cols = 0;
        fixed_col_size = 0;
        _.each(cols, function(col) {
          if (col === 'flex') {
            return num_flex_cols += 1;
          } else {
            return fixed_col_size += col;
          }
        });
        col_flex_size = (window_width - fixed_col_size) / num_flex_cols;
        w_so_far = 0;
        _.each(cols, function(col, icol) {
          var layout_to_set, w;

          w = col === 'flex' ? col_flex_size : col;
          num_panels += 1;
          if (_this.row_first) {
            layout_to_set = {
              left: w_so_far,
              width: w,
              top: h_so_far,
              height: h
            };
          } else {
            layout_to_set = {
              top: w_so_far,
              height: w,
              left: h_so_far,
              width: h
            };
          }
          layout_to_set.background = "rgba(255,0,0,0." + num_panels + ")";
          _this.panels[irow][icol].setLayout(layout_to_set);
          return w_so_far += w;
        });
        return h_so_far += h;
      });
    };

    Layout.prototype.getPanel = function(i, j) {
      return this.panels[i][j];
    };

    Layout.prototype.setPanelContent = function() {
      var contents, i, j;

      i = arguments[0], j = arguments[1], contents = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      return this.panels[i][j].setContent(contents);
    };

    Layout.prototype.setPanelSize = function(i, j, dim) {
      this.layout[i][1][j] = dim;
      return this.resize();
    };

    return Layout;

  })(Backbone.View);

  window.Layout = {
    Layout: Layout,
    Panel: Panel
  };

}).call(this);
