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
             * ��ǰ����ϸ���б�
             */
            aliveCells: [],
            /**
             * ��ǰ����ϸ��λ����������ʽ��һ������'x1:{y1: 1, y2: 0...}'
             */
            aliveCellsPos: {},
            /**
             * ��ǰ������ϸ��λ����������ʽ��һ������'x1:{y1: 1, y2: 0...}'
             */
            checkedCellsPos: {},
            /**
             * ��ǰ����������״̬�����˵�ϸ���б��Լ����ػ����
             */
            changedCells: [],
            /**
             * �����ĵĻ�ϸ��
             */
            newAlive: [],
            /**
             * ��ʼ������
             * @param radius {[Number]} ϸ��ֱ����Ĭ��5����
             * @param interval {[Number]} ����ʱ�䣬Ĭ��1000����
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
                     * ֻ�ܵ����ϸ��
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
             * �жϸ���λ�õ�ϸ���Ƿ���
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
             * �жϸ���λ���Ƿ��Ѿ��жϹ�
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
             * �ж�ϸ���Ƿ�Խ��
             * @param pos
             * @private
             */
            _outOfBound: function (pos) {
                return (pos.x > maxX || pos.x < 0 || pos.y > maxY || pos.y < 0);
            },
            /**
             * ��ȡ����ϸ��
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
             * ������һ��״̬���ػ�
             * @private
             */
            _render: function () {
                var that = this,
                    nextAlive = [];
                that.newAlive = [];
                /**
                 * ������һ��ϸ����״̬
                 */
                S.each(that.aliveCells, function (elem) {
                    /**
                     * ���㵱ǰϸ����״̬
                     */
                    var deadArr = that._getDeadCells(elem._getNeighbors());
                    elem.calState(8 - deadArr.length);
                    /**
                     * �����ھ�����ϸ��״̬
                     */
                    S.each(deadArr, function (elem) {
                        /**
                         * �����ظ����㣬�����߽�Ĳ�����
                         */
                        if (!that._isChecked(elem) && !that._outOfBound(elem)) {
                            that._setCellChecked(elem);
                            var cell = that._addCell(elem.x, elem.y, true);
                            cell.calState(8 - that._getDeadCells(cell._getNeighbors()).length);
                        }
                    });
                });
                /**
                 * ���ö�ջ
                 */
                this.checkedCellsPos = [];
                this.aliveCellsPos = {};
                /**
                 * �����ϸ��λ��
                 */
                S.each(that.newAlive, function (elem) {
                    /**
                     * ��������ϸ��
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
                 * ���ö�ջ
                 */
                this.aliveCells = this.newAlive;
                this.newAlive = [];
                this.changedCells = [];
                this.ticker = setTimeout(this._render.bind(this), 1000);
            },
            /**
             * ��ȡ���������Ӧ��Բ������Ķ����е�
             * @param pos ��������
             * @returns {{x: number}}
             * @private
             */
            _getFormattedPos: function (pos) {
                var radius = this.radius,
                    format = function (num) {
                        return (Math.floor(num / radius)) * radius;
                    };
                /**
                 * �Ӷ����е㿪ʼ����
                 */
                return {
                    x: format(pos.x),
                    y: format(pos.y)
                }
            },
            /**
             * ����µĻ�ϸ��
             * @param x
             * @param y
             * @param dead �Ƿ�����
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
             * ��ӻ��ϸ��
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
                 * �����Ѿ�������ϸ��������֮���ظ�����
                 */
                var x = this.checkedCellsPos[e.x];
                if (!x) {
                    x = this.checkedCellsPos[e.x] = [];
                }
                x.push(e.y);
            },
            _removeCell: function (e) {
                /**
                 * ��Ǹ�ϸ������
                 * @type {boolean}
                 */
                //this.aliveCells[e].set(true);
            }
        };
    return index;
});