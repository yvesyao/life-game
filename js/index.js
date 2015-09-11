/**
 * Created by YvesYao on 2015/9/10.
 */
KISSY.add(function (S, require) {
    var $ = require('node').all,
        $canvas = $('#wrap'),
        maxX = $canvas[0].width,
        maxY = $canvas[0].height,
        ctx = $canvas[0].getContext('2d'),
        Cell = require('js/cell'),
        Uri = require('uri'),
        params = new Uri(location.href).getQuery(),
        index = {
            /**
             * 当前存活的细胞列表
             */
            aliveCells: [],
            /**
             * 当前存活的细胞位置索引，格式：一级索引'x1:{y1: 1, y2: 0...}'
             */
            aliveCellsPos: {},
            /**
             * 当前检查过的细胞位置索引，格式：一级索引'x1:{y1: 1, y2: 0...}'
             */
            checkedCellsPos: {},
            /**
             * 当前声明周期中状态更改了的细胞列表，以减少重绘面积
             */
            changedCells: [],
            /**
             * 新增的的活细胞
             */
            newAlive: [],
            /**
             * 初始化函数
             * @param radius {[Number]} 细胞直径，默认5像素
             * @param interval {[Number]} 迭代时间，默认1000毫秒
             */
            init: function (radius, interval) {
                this.radius = radius || params.get('radius') - 0 || 20;
                this.interval = interval || params.get('interval') - 0 || 100;
                this._bindEvents();
            },
            _bindEvents: function () {
                var that = this;
                $canvas.on('click', function (e) {
                    e.preventDefault();
                    var x = e.pageX,
                        y = e.pageY;
                    /**
                     * 只能点击死细胞
                     */
                    if (!that._isAlive(that._getFormattedPos({
                            x: x,
                            y: y
                        }))) {
                        clearTimeout(that.ticker);
                        $('#start').removeClass('pause').text('Start');
                        var cell = that._addCell(x, y);
                        cell.paint(ctx);
                    }
                });
                $('#start').on('click', function (e) {
                    e.preventDefault();
                    var $this = $(this);
                    if ($this.hasClass('pause')) {
                        $this.removeClass('pause').text('Start');
                        clearTimeout(that.ticker);
                    } else {
                        $this.addClass('pause').text('Pause');
                        that._render();
                    }
                });
                $('#random').on('click', function (e) {
                    e.preventDefault();
                    var time = that._getRandom(5, 2000/that.radius),
                        index = 0;
                    while (index++ < time) {
                        that._addCell(that._getRandom(0, maxX), that._getRandom(0, maxY)).paint(ctx);
                    }
                });
                $(window).on('resize', function (e) {
                    if (e.currentTarget === e.target) {
                        var canvas = $canvas[0];
                        //ctx.save();
                        canvas.width = $(window).innerWidth();
                        canvas.height = $(window).innerHeight();
                        maxX = canvas.width;
                        maxY = canvas.height;
                        //ctx.restore();
                    }
                }).fire('resize');
            },
            _getRandom: function (min, max) {
                return min + Math.random() * (max - min);
            },
            /**
             * 判断给定位置的细胞是否存活
             * @param pos
             * @returns {boolean}
             * @private
             */
            _isAlive: function (pos) {
                var x = this.aliveCellsPos[pos.x];
                if (x) {
                    return x.indexOf(pos.y) >= 0;
                }
                return false;
            },
            /**
             * 判断给定位置是否已经判断过
             * @param pos
             * @returns {*|boolean}
             * @private
             */
            _isChecked: function (pos) {
                //debugger
                var x = this.checkedCellsPos[pos.x];
                return x && x.indexOf(pos.y) >= 0;
            },
            /**
             * 判断细胞是否越界
             * @param pos
             * @private
             */
            _outOfBound: function (pos) {
                return (pos.x > maxX || pos.x < 0 || pos.y > maxY || pos.y < 0);
            },
            /**
             * 获取死亡细胞
             * @param cells
             * @private
             */
            _getDeadCells: function (cells) {
                var deadArr = [];
                for (var i = 0; i < cells.length; ++i) {
                    var cellPos = cells[i];
                    if (!this._isAlive(cellPos)) {
                        deadArr.push(cellPos);
                    }
                }
                return deadArr;
            },
            /**
             * 计算下一轮状态并重绘
             * @private
             */
            _render: function () {
                var that = this,
                    nextAlive = [];
                that.newAlive = [];
                /**
                 * 计算下一轮细胞的状态
                 */
                S.each(that.aliveCells, function (elem) {
                    /**
                     * 计算当前细胞的状态
                     */
                    var deadArr = that._getDeadCells(elem._getNeighbors());
                    elem.calState(8 - deadArr.length);
                    /**
                     * 计算邻居死亡细胞状态
                     */
                    S.each(deadArr, function (elem) {
                        /**
                         * 避免重复计算，超出边界的不计算
                         */
                        if (!that._isChecked(elem) && !that._outOfBound(elem)) {
                            that._setCellChecked(elem);
                            var cell = that._addCell(elem.x, elem.y, true);
                            cell.calState(8 - that._getDeadCells(cell._getNeighbors()).length);
                        }
                    });
                });
                /**
                 * 重置堆栈
                 */
                this.checkedCellsPos = [];
                this.aliveCellsPos = {};
                /**
                 * 缓存活细胞位置
                 */
                S.each(that.newAlive, function (elem) {
                    /**
                     * 跳过死亡细胞
                     */
                    if (elem.get('dead')) {
                        return;
                    }
                    var pos = elem.get('pos'),
                        x = that.aliveCellsPos[pos.x];
                    if (!x) {
                        that.aliveCellsPos[pos.x] = [pos.y];
                    } else {
                        x.push(pos.y);
                    }
                });
                S.each(that.changedCells, function (elem) {
                    elem.paint(ctx);
                });
                /**
                 * 重置堆栈
                 */
                this.aliveCells = this.newAlive;
                this.newAlive = [];
                this.changedCells = [];
                this.ticker = setTimeout(this._render.bind(this), 1000);
            },
            /**
             * 获取给定坐标对应的圆形区域的顶部中点
             * @param pos 给定坐标
             * @returns {{x: number}}
             * @private
             */
            _getFormattedPos: function (pos) {
                var radius = this.radius,
                    format = function (num) {
                        return (Math.floor(num / radius)) * radius;
                    };
                /**
                 * 从顶部中点开始绘制
                 */
                return {
                    x: format(pos.x),
                    y: format(pos.y)
                }
            },
            /**
             * 添加新的活细胞
             * @param x
             * @param y
             * @param dead 是否死亡
             * @return newCell
             * @private
             */
            _addCell: function (x, y, dead) {
                var newCell = new Cell({
                    radius: this.radius,
                    pos: {
                        x: x,
                        y: y
                    },
                    dead: dead || false
                }).on('alive', this._addAlive.bind(this))
                    .on('dead', this._removeCell.bind(this))
                    .on('changed', this._cellChanged.bind(this));
                if (!dead) {
                    this._addAlive({
                        cell: newCell,
                        current: true
                    });
                }
                return newCell;
            },
            /**
             * 添加活的细胞
             * @param cell
             * @private
             */
            _addAlive: function (e) {
                var newCell = e.cell;
                if (e.current) {
                    this.aliveCells.push(newCell);
                    var pos = newCell.get('pos'),
                        x = this.aliveCellsPos[pos.x];
                    if (!x) {
                        this.aliveCellsPos[pos.x] = [pos.y];
                    } else {
                        x.push(pos.y);
                    }
                } else {
                    //debugger
                    this.newAlive.push(newCell);
                }
            },
            _cellChanged: function (e) {
                this.changedCells.push(e.cell);
            },
            _setCellChecked: function (e) {
                /**
                 * 更改已经检测过的细胞，避免之后重复计算
                 */
                var x = this.checkedCellsPos[e.x];
                if (!x) {
                    x = this.checkedCellsPos[e.x] = [];
                }
                x.push(e.y);
            },
            _removeCell: function (e) {
                /**
                 * 标记该细胞死亡
                 * @type {boolean}
                 */
                //this.aliveCells[e].set(true);
            }
        };
    return index;
});