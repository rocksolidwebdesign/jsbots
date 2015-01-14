define([
  'lib/draw'
], function(
  draw
) {
  var Target = function(imgOn, imgOff) {
    this.imgOn = imgOn;
    this.imgOff = imgOff;

    this.width = 16;
    this.height = 14;

    this.x = 50;
    this.y = 50;

    this.isActive = false;
  };

  Target.prototype.activate = function(ctx) {
    this.isActive = true;
  };

  Target.prototype.deactivate = function(ctx) {
    this.isActive = false;
  };

  Target.prototype.render = function(ctx) {
    if (this.isActive) {
      draw.rotatedImage(ctx, this.imgOn, this.x, this.y, 0);
    } else {
      draw.rotatedImage(ctx, this.imgOff, this.x, this.y, 0);
    }
  };

  return Target;
});

