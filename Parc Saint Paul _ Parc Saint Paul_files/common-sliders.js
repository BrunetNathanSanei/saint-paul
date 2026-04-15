/**
 * Generic Owl Carousel Initializer by Data Attributes
 * Restore static page caching by removing inline scripts.
 */
$(document).ready(function () {
    $('[data-owl-carousel="true"]').each(function () {
        const $el = $(this);

        // Skip if already initialized
        if ($el.hasClass('owl-loaded')) {
            return;
        }

        const data = $el.data();
        const parseValue = function (val) {
            if (val === 'true' || val === true) return true;
            if (val === 'false' || val === false) return false;
            if (!isNaN(val) && val !== '' && typeof val !== 'boolean') return parseFloat(val);
            if (typeof val === 'string') {
                var trimmed = val.trim();
                if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                    try { return JSON.parse(trimmed); } catch (e) { return {}; }
                }
            }
            return val;
        };

        const config = {
            items: 3,
            loop: false,
            margin: 0,
            nav: false,
            dots: true,
            autoplay: false,
            lazyLoad: false,
            autoplaySpeed: false,
            navText: ['<span>‹</span>', '<span>›</span>'],
            responsive: {}
        };

        $.each(this.attributes, function () {
            // Handle generic attributes: data-owl-items="3"
            if (this.name.indexOf('data-owl-') === 0
                && this.name.indexOf('data-owl-carousel') !== 0
                && this.name.indexOf('data-owl-responsive-') !== 0
                && this.name.indexOf('data-owl-resp-') !== 0) {
                let parts = this.name.split('-');
                if (parts.length >= 3) {
                    let option = parts.slice(2).join('-');
                    // camelCase: auto-width -> autoWidth
                    option = option.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });

                    let value = parseValue(this.value);
                    config[option] = value;
                }
            }

            // Handle individual attributes: data-owl-resp-0-items="1.2"
            if (this.name.indexOf('data-owl-resp-') === 0) {
                let parts = this.name.split('-');
                if (parts.length >= 5) {
                    let breakpoint = parseInt(parts[3]);
                    let option = parts.slice(4).join('-');
                    // camelCase: auto-width -> autoWidth
                    option = option.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });

                    let value = parseValue(this.value);
                    if (!config.responsive[breakpoint]) {
                        config.responsive[breakpoint] = {};
                    }
                    config.responsive[breakpoint][option] = value;
                }
            }
        });

        // Handle JSON data-owl-responsive (Object or Array of Objects)
        if (data.owlResponsive) {
            const respData = parseValue(data.owlResponsive);
            if (Array.isArray(respData)) {
                respData.forEach(function (item) {
                    if (item.breakpoint !== undefined) {
                        config.responsive[item.breakpoint] = item.settings || {};
                    }
                });
            } else if (respData && typeof respData === 'object') {
                $.extend(config.responsive, respData);
            }
        }

        // Initialize owlCarousel
        $el.owlCarousel(config);
    });
});
