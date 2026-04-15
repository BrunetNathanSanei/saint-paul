/**
 * Hero Search Tab Color Sync
 * Updates the background color of the tab content based on the selected tab
 */
$(document).ready(function () {
    function updateHeroTabColor($content, color) {
        if (!$content.length) return;
        // Remove bg-tab-* classes
        var classes = $content.attr('class').split(" ").filter(function (c) {
            return !c.startsWith('bg-tab-');
        });
        $content.attr('class', classes.join(" ").trim());
        if (color) {
            $content.addClass('bg-tab-' + color);
        }
    }

    // Initial setup for existing hero search components
    $('.hero-tabs-nav').each(function () {
        var $activeTab = $(this).find('.hero-tab-link.active');
        var $content = $(this).siblings('.hero-tabs-content');
        if ($activeTab.length && $content.length) {
            updateHeroTabColor($content, $activeTab.data('color') || 'primary');
        }
    });

    // Delegated listener for tab changes
    $(document).on('shown.bs.tab', '.hero-tab-link', function (e) {
        var $tab = $(e.target);
        var color = $tab.data('color') || 'primary';
        var $content = $tab.closest('.hero-search-tabs').find('.hero-tabs-content');
        updateHeroTabColor($content, color);
    });
});
