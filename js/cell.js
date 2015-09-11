/**
 * Created by YvesYao on 2015/9/10.
 * 细胞类
 */
KISSY.add(function(S, require) {
   var Base = require('base'),
       PI = Math.PI,
       startAngle = 0,
       endAngle = 2 * PI,
       index = Base.extend({
           initializer:function() {
               var that = this;
           },
           /**
            * 绘制细胞
            * @param ctx canvas上下文
            */
           paint: function(ctx) {
               var pos = this.get('pos'),
                   radius = this.get('radius');
               /**
                * clear死亡细胞
                */
               if(this.get('dead')) {
                   ctx.clearRect(pos.x, pos.y, radius, radius);
                   return;
               }
               /**
                * 绘制存活细胞
                */
               ctx.fillStyle = this.get('color');
               ctx.beginPath();
               console.log(pos);
               ctx.arc(pos.x + radius/2, pos.y + radius/2, radius/2, startAngle, endAngle, true);
               ctx.fill();
               ctx.closePath();
           },
           alive: function() {
               this.fire('alive', {
                   cell: this
               });
               if(this.get('dead')) {
                   this.set('dead', false);
                   this.fire('changed', {
                       cell: this
                   });
               }
           },
           notChange: function() {
               //debugger
               this.fire(this.get('dead') ? 'dead' : 'alive', {
                   cell: this
               });
           },
           die: function() {
               this.fire('dead', {
                   cell: this
               });
               if(!this.get('dead')) {
                   this.set('dead', true);
                   this.fire('changed', {
                       cell: this
                   });
               }
           },
           /**
            * 检查存活的邻居细胞的数量
            * @param isNeighbor {Boolean} 是否是邻居细胞
            */
           _getNeighbors: function () {
               /**
                * 无需检查邻居细胞的邻居细胞
                */
               var pos = this.get('pos'),
                   x = pos.x,
                   y = pos.y,
                   radius = this.get('radius'),
                   left = x - radius,
                   right = x + radius,
                   top = y - radius,
                   bottom = y + radius;
                return [{
                    x: left,
                    y: top
                }, {
                    x: left,
                    y: y
                }, {
                    x: left,
                    y: bottom
                }, {
                    x: x,
                    y: top
                }, {
                    x: x,
                    y: bottom
                }, {
                    x: right,
                    y: top
                }, {
                    x: right,
                    y: y
                }, {
                    x: right,
                    y: bottom
                }];
           },
           calState: function (neighborNum) {
                if(neighborNum === 3) {
                    this.alive();
                } else if(neighborNum === 2) {
                    this.notChange();
                } else {
                    this.die();
                }
           }
       },{
           ATTRS: {
               //id: {
               //    value: (new Date().getTime() + '' + Math.random() * 100).substr(0, 12)
               //},
               pos:{
                   value: {
                       x: Math.floor(Math.random()*100),
                       y: Math.floor(Math.random()*100)
                   },
                   setter: function(pos) {
                       var radius = this.get('radius'),
                           format = function (num) {
                               return (Math.floor(num / radius)) * radius;
                           },
                           newPos = {
                               x: format(pos.x),
                               y: format(pos.y)
                           };
                       /**
                        * 从顶部中点开始绘制
                        */
                       return newPos;
                   }
               },
               radius: {
               },
               dead: {
                   value: false
               },
               color: {
                   value: '#f40'
               }
           }
       });
    return index;
});