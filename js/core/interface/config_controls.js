define([
  'text!templates/layer.html'
], function(
  tplLayer
) {
  return {
    handleAddLayer: function(e) {
      e.preventDefault();

      $('.js-layers').prepend(tplLayer);
    },

    handleRemoveLayer: function(e) {
      var $target, $container;

      e.preventDefault();

      $target = $(e.currentTarget);
      $container = $target.parent('.layers');

      if ($container.length <= 0) {
        return;
      }

      $container.remove();
    },

    handleUpdateInputQty: function(e) {
      var $features, sizes, qty;

      $features = $('.js-feature:checked');
      sizes = _.map($features, function(el) {
        return Number($(el).data('size'));
      });

      qty = _.reduce(sizes, function(m, x) {
        return m + x;
      }, 0);

      $('.js-inputs-qty').val(qty);
    }
  };
});
