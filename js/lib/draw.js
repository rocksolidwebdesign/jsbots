define(function() {
  var TO_RADIANS = Math.PI / 180;

  return {
    clear: function(ctx, w, h) {
      w = w || 10000;
      h = h || 10000;

      ctx.clearRect(0,0,w,h);
    },

    rotatedImage: function(ctx, img, x, y, angle) {

      // save the current co-ordinate system
      // before we screw with it
      ctx.save();

      // move to the middle of where we want to draw our img
      ctx.translate(x, y);

      // rotate around that point, converting our
      // angle from degrees to radians
      ctx.rotate(angle * TO_RADIANS);

      // draw it up and to the left by half the width
      // and height of the img
      ctx.drawImage(img, -(img.width/2), -(img.height/2));

      // and restore the co-ords to how they were when we began
      ctx.restore();
    }
  };
});
