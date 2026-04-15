/**
 * Ride Card Slider Initializer
 * Uses data attributes on .ride-card-slider to configure Owl Carousel.
 */
$(document).ready(function () {
    $('.ride-card-slider').each(function () {
        const $el = $(this);
        const data = $el.data();

        const config = {
            loop: true,
            margin: 20,
            nav: true,
            dots: true,
            autoplay: false,
            lazyLoad: true,
            navText: ['<span>‹</span>', '<span>›</span>'],
            responsive: {
                0: {
                    items: data.itemsMobile || 1,
                    dots: data.dotsMobile === true,
                    nav: false
                },
                768: {
                    items: data.itemsTablet || 2,
                    dots: data.dotsTablet === true
                },
                1024: {
                    items: data.itemsDesktop || 3,
                    dots: data.dotsDesktop === true
                }
            }
        };

        if (!$el.hasClass('owl-loaded')) {
            $el.owlCarousel(config);
        }
    });
});
