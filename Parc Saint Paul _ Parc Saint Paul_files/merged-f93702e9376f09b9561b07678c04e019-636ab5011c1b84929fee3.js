
/*!
 * parallax.js v1.5.0 (http://pixelcog.github.io/parallax.js/)
 * @copyright 2016 PixelCog, Inc.
 * @license MIT (https://github.com/pixelcog/parallax.js/blob/master/LICENSE)
 */

;(function ( $, window, document, undefined ) {

  // Polyfill for requestAnimationFrame
  // via: https://gist.github.com/paulirish/1579671

  (function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
      window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
      window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
      window.requestAnimationFrame = function(callback) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = window.setTimeout(function() { callback(currTime + timeToCall); },
            timeToCall);
        lastTime = currTime + timeToCall;
        return id;
      };

    if (!window.cancelAnimationFrame)
      window.cancelAnimationFrame = function(id) {
        clearTimeout(id);
      };
  }());


  // Parallax Constructor

  function Parallax(element, options) {
    var self = this;

    if (typeof options == 'object') {
      delete options.refresh;
      delete options.render;
      $.extend(this, options);
    }

    this.$element = $(element);

    if (!this.imageSrc && this.$element.is('img')) {
      this.imageSrc = this.$element.attr('src');
    }

    var positions = (this.position + '').toLowerCase().match(/\S+/g) || [];

    if (positions.length < 1) {
      positions.push('center');
    }
    if (positions.length == 1) {
      positions.push(positions[0]);
    }

    if (positions[0] == 'top' || positions[0] == 'bottom' || positions[1] == 'left' || positions[1] == 'right') {
      positions = [positions[1], positions[0]];
    }

    if (this.positionX !== undefined) positions[0] = this.positionX.toLowerCase();
    if (this.positionY !== undefined) positions[1] = this.positionY.toLowerCase();

    self.positionX = positions[0];
    self.positionY = positions[1];

    if (this.positionX != 'left' && this.positionX != 'right') {
      if (isNaN(parseInt(this.positionX))) {
        this.positionX = 'center';
      } else {
        this.positionX = parseInt(this.positionX);
      }
    }

    if (this.positionY != 'top' && this.positionY != 'bottom') {
      if (isNaN(parseInt(this.positionY))) {
        this.positionY = 'center';
      } else {
        this.positionY = parseInt(this.positionY);
      }
    }

    this.position =
        this.positionX + (isNaN(this.positionX)? '' : 'px') + ' ' +
        this.positionY + (isNaN(this.positionY)? '' : 'px');

    if (navigator.userAgent.match(/(iPod|iPhone|iPad)/)) {
      if (this.imageSrc && this.iosFix && !this.$element.is('img')) {
        this.$element.css({
          backgroundImage: 'url("' + this.imageSrc + '")',
          backgroundSize: 'cover',
          backgroundPosition: this.position
        });
      }
      return this;
    }

    if (navigator.userAgent.match(/(Android)/)) {
      if (this.imageSrc && this.androidFix && !this.$element.is('img')) {
        this.$element.css({
          backgroundImage: 'url("' + this.imageSrc + '")',
          backgroundSize: 'cover',
          backgroundPosition: this.position
        });
      }
      return this;
    }

    this.$mirror = $('<div />').prependTo(this.mirrorContainer);

    var slider = this.$element.find('>.parallax-slider');
    var sliderExisted = false;

    if (slider.length == 0)
      this.$slider = $('<img />').prependTo(this.$mirror);
    else {
      this.$slider = slider.prependTo(this.$mirror)
      sliderExisted = true;
    }

    this.$mirror.addClass('parallax-mirror').css({
      visibility: 'hidden',
      zIndex: this.zIndex,
      position: 'fixed',
      top: 0,
      left: 0,
      overflow: 'hidden'
    });

    this.$slider.addClass('parallax-slider').one('load', function() {
      if (!self.naturalHeight || !self.naturalWidth) {
        self.naturalHeight = this.naturalHeight || this.height || 1;
        self.naturalWidth  = this.naturalWidth  || this.width  || 1;
      }
      self.aspectRatio = self.naturalWidth / self.naturalHeight;

      Parallax.isSetup || Parallax.setup();
      Parallax.sliders.push(self);
      Parallax.isFresh = false;
      Parallax.requestRender();
    });

    if (!sliderExisted)
      this.$slider[0].src = this.imageSrc;

    if (this.naturalHeight && this.naturalWidth || this.$slider[0].complete || slider.length > 0) {
      this.$slider.trigger('load');
    }

  }


  // Parallax Instance Methods

  $.extend(Parallax.prototype, {
    speed:    0.2,
    bleed:    0,
    zIndex:   -100,
    iosFix:   true,
    androidFix: true,
    position: 'center',
    overScrollFix: false,
    mirrorContainer: 'body',

    refresh: function() {
      this.boxWidth        = this.$element.outerWidth();
      this.boxHeight       = this.$element.outerHeight() + this.bleed * 2;
      this.boxOffsetTop    = this.$element.offset().top - this.bleed;
      this.boxOffsetLeft   = this.$element.offset().left;
      this.boxOffsetBottom = this.boxOffsetTop + this.boxHeight;

      var winHeight = Parallax.winHeight;
      var docHeight = Parallax.docHeight;
      var maxOffset = Math.min(this.boxOffsetTop, docHeight - winHeight);
      var minOffset = Math.max(this.boxOffsetTop + this.boxHeight - winHeight, 0);
      var imageHeightMin = this.boxHeight + (maxOffset - minOffset) * (1 - this.speed) | 0;
      var imageOffsetMin = (this.boxOffsetTop - maxOffset) * (1 - this.speed) | 0;
      var margin;

      if (imageHeightMin * this.aspectRatio >= this.boxWidth) {
        this.imageWidth    = imageHeightMin * this.aspectRatio | 0;
        this.imageHeight   = imageHeightMin;
        this.offsetBaseTop = imageOffsetMin;

        margin = this.imageWidth - this.boxWidth;

        if (this.positionX == 'left') {
          this.offsetLeft = 0;
        } else if (this.positionX == 'right') {
          this.offsetLeft = - margin;
        } else if (!isNaN(this.positionX)) {
          this.offsetLeft = Math.max(this.positionX, - margin);
        } else {
          this.offsetLeft = - margin / 2 | 0;
        }
      } else {
        this.imageWidth    = this.boxWidth;
        this.imageHeight   = this.boxWidth / this.aspectRatio | 0;
        this.offsetLeft    = 0;

        margin = this.imageHeight - imageHeightMin;

        if (this.positionY == 'top') {
          this.offsetBaseTop = imageOffsetMin;
        } else if (this.positionY == 'bottom') {
          this.offsetBaseTop = imageOffsetMin - margin;
        } else if (!isNaN(this.positionY)) {
          this.offsetBaseTop = imageOffsetMin + Math.max(this.positionY, - margin);
        } else {
          this.offsetBaseTop = imageOffsetMin - margin / 2 | 0;
        }
      }
    },

    render: function() {
      var scrollTop    = Parallax.scrollTop;
      var scrollLeft   = Parallax.scrollLeft;
      var overScroll   = this.overScrollFix ? Parallax.overScroll : 0;
      var scrollBottom = scrollTop + Parallax.winHeight;

      if (this.boxOffsetBottom > scrollTop && this.boxOffsetTop <= scrollBottom) {
        this.visibility = 'visible';
        this.mirrorTop = this.boxOffsetTop  - scrollTop;
        this.mirrorLeft = this.boxOffsetLeft - scrollLeft;
        this.offsetTop = this.offsetBaseTop - this.mirrorTop * (1 - this.speed);
      } else {
        this.visibility = 'hidden';
      }

      this.$mirror.css({
        transform: 'translate3d('+this.mirrorLeft+'px, '+(this.mirrorTop - overScroll)+'px, 0px)',
        visibility: this.visibility,
        height: this.boxHeight,
        width: this.boxWidth
      });

      this.$slider.css({
        transform: 'translate3d('+this.offsetLeft+'px, '+this.offsetTop+'px, 0px)',
        position: 'absolute',
        height: this.imageHeight,
        width: this.imageWidth,
        maxWidth: 'none'
      });
    }
  });


  // Parallax Static Methods

  $.extend(Parallax, {
    scrollTop:    0,
    scrollLeft:   0,
    winHeight:    0,
    winWidth:     0,
    docHeight:    1 << 30,
    docWidth:     1 << 30,
    sliders:      [],
    isReady:      false,
    isFresh:      false,
    isBusy:       false,

    setup: function() {
      if (this.isReady) return;

      var self = this;

      var $doc = $(document), $win = $(window);

      var loadDimensions = function() {
        Parallax.winHeight = $win.height();
        Parallax.winWidth  = $win.width();
        Parallax.docHeight = $doc.height();
        Parallax.docWidth  = $doc.width();
      };

      var loadScrollPosition = function() {
        var winScrollTop  = $win.scrollTop();
        var scrollTopMax  = Parallax.docHeight - Parallax.winHeight;
        var scrollLeftMax = Parallax.docWidth  - Parallax.winWidth;
        Parallax.scrollTop  = Math.max(0, Math.min(scrollTopMax,  winScrollTop));
        Parallax.scrollLeft = Math.max(0, Math.min(scrollLeftMax, $win.scrollLeft()));
        Parallax.overScroll = Math.max(winScrollTop - scrollTopMax, Math.min(winScrollTop, 0));
      };

      $win.on('resize.px.parallax load.px.parallax', function() {
        loadDimensions();
        self.refresh();
        Parallax.isFresh = false;
        Parallax.requestRender();
      })
          .on('scroll.px.parallax load.px.parallax', function() {
            loadScrollPosition();
            Parallax.requestRender();
          });

      loadDimensions();
      loadScrollPosition();

      this.isReady = true;

      var lastPosition = -1;

      function frameLoop() {
        if (lastPosition == window.pageYOffset) {   // Avoid overcalculations
          window.requestAnimationFrame(frameLoop);
          return false;
        } else lastPosition = window.pageYOffset;

        self.render();
        window.requestAnimationFrame(frameLoop);
      }

      frameLoop();
    },

    configure: function(options) {
      if (typeof options == 'object') {
        delete options.refresh;
        delete options.render;
        $.extend(this.prototype, options);
      }
    },

    refresh: function() {
      $.each(this.sliders, function(){ this.refresh(); });
      this.isFresh = true;
    },

    render: function() {
      this.isFresh || this.refresh();
      $.each(this.sliders, function(){ this.render(); });
    },

    requestRender: function() {
      var self = this;
      self.render();
      self.isBusy = false;
    },
    destroy: function(el){
      var i,
          parallaxElement = $(el).data('px.parallax');
      parallaxElement.$mirror.remove();
      for(i=0; i < this.sliders.length; i+=1){
        if(this.sliders[i] == parallaxElement){
          this.sliders.splice(i, 1);
        }
      }
      $(el).data('px.parallax', false);
      if(this.sliders.length === 0){
        $(window).off('scroll.px.parallax resize.px.parallax load.px.parallax');
        this.isReady = false;
        Parallax.isSetup = false;
      }
    }
  });


  // Parallax Plugin Definition

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var options = typeof option == 'object' && option;

      if (this == window || this == document || $this.is('body')) {
        Parallax.configure(options);
      }
      else if (!$this.data('px.parallax')) {
        options = $.extend({}, $this.data(), options);
        $this.data('px.parallax', new Parallax(this, options));
      }
      else if (typeof option == 'object')
      {
        $.extend($this.data('px.parallax'), options);
      }
      if (typeof option == 'string') {
        if(option == 'destroy'){
          Parallax.destroy(this);
        }else{
          Parallax[option]();
        }
      }
    });
  }

  var old = $.fn.parallax;

  $.fn.parallax             = Plugin;
  $.fn.parallax.Constructor = Parallax;


  // Parallax No Conflict

  $.fn.parallax.noConflict = function () {
    $.fn.parallax = old;
    return this;
  };


  // Parallax Data-API

  $( function () {
    $('[data-parallax="scroll"]').parallax();
  });

}(jQuery, window, document));
var a = 0;
if(jQuery('.kpi-box').length > 0) {
    $(window).scroll(function() {

        var oTop = $('.kpi-box').offset().top - window.innerHeight;
        if (a == 0 && $(window).scrollTop() > oTop) {
            $('.kpi-box .kpi-value').each(function() {
                var $this = $(this),
                    countTo = $this.attr('data-count');
                $({
                    countNum: $this.text()
                }).animate({
                        countNum: countTo
                    },
                    {
                        duration: 2000,
                        easing: 'swing',
                        step: function() {
                            $this.text(Math.floor(this.countNum));
                        },
                        complete: function() {
                            $this.text(this.countNum);
                        }
                    });
            });
            a = 1;
        }
    });
}
/**
 *
 *
 * TABS Gridelement
 *
 *
 */

$(document).ready(function () {
  jarallax(document.querySelectorAll(".jarallax"), {
    speed: 0.5,
  });

  /* attraction detail iconbox show only 1 height for english*/
  const heightNumbers = [];
  $(".iconbox").each(function (index) {
    if (
      $(this).text().includes("Height") ||
      $(this).text().includes("Taille")
    ) {
      heightNumbers.push(
        parseFloat(
          $(this)
            .find("div.value")
            .text()
            .replace(/[^0-9.]/g, "")
        )
      );
    }
    // if (
    //   (!$(this).text().includes(Math.min.apply(Math, heightNumbers)) &&
    //     $(this).text().includes("Height"))
    // ) {
    //   $(this).css("display", "none");
    // }
  });
});

$(document).ready(function () {
  $(".event-item").click(function (event) {
    $(".event-item").removeClass("active");
    $(".event-image").removeClass("active");

    /* activate event image and item */
    for (i = 0; i < 30; i++) {
      if ($(event.delegateTarget).hasClass("counter-" + i)) {
        event.preventDefault();
        $(".counter-" + i).addClass("active");
      }
    }
  });
});

$(document).ready(function () {
  if ($.fn.fancybox && $(".fancybox").length) {
    $(".fancybox").fancybox(); //initialize the language menu in a lightbox modal
  }
});

$(document).ready(function () {
  $(".tabBody.active").show(); //initially show the `tabBody` which has active class
});

//click event to each `tabs` element
$(".tabs").on("click", function (e) {
  e.preventDefault();
  $(".tabs").removeClass("active"); //remove active class from all the tabs
  $(this).addClass("active"); //add active to current clicked element
  var target = $(this).attr("href"); //get its href attrbute
  $(".tabBody").hide("fast").removeClass("active"); //remove active from tabBody and hide all of them
  $(target).show("slow").addClass("active"); //show target tab and add active class to it
});

new WOW().init();

//Sticky Header
$(document).ready(function () {
  var offset = $(".header-main").offset();
  var sticky = document.getElementById("header-main");
  var additionalPixels = 0;
  $(window).scroll(function () {
    if ($(document).scrollTop() > offset.top - additionalPixels) {
      $(".header-main").addClass("fixed");
    } else {
      $(".header-main").removeClass("fixed");
    }
  });
});

// Custom Codes
$(document).ready(function () {
  $(".modal-content").prepend(
    '<a href="javascript:;" class="icon-close" data-dismiss="modal"><i class="fal fa-times"></i></a>'
  );
  $(".modal").appendTo("body");

  $(".header-main .nav-wrap").append('<div class="overlay-menu"></div>');
  $(".nav-bar").wrapInner('<div class="nav-max"></div>');
  $(".nav-bar .nav-max").wrapInner('<div class="nav-inn"></div>');

  $(".menu-btn").click(function () {
    $(".menu-btn").toggleClass("active");
    // $('.nav-bar').toggleClass('active');
    // $('.overlay-menu').toggleClass('active');
    // $('body').toggleClass('hiddenscroll-menu');
    if ($(".top-nav").length > 0) {
      $(".offcanvas").css({
        top: $(".navbar").outerHeight() + $(".top-nav").outerHeight(true),
      });
      $(".offcanvas-backdrop").css({
        top: $(".navbar").outerHeight() + $(".top-nav").outerHeight(true),
      });
    } else {
      $(".offcanvas").css({ top: $(".navbar").outerHeight() });
      $(".offcanvas-backdrop").css({ top: $(".navbar").outerHeight() });
    }
  });

  $("body").on("click", ".offcanvas-backdrop", () => {
    $(".menu-btn").toggleClass("active");
  });

  $(".close-btn, .overlay-menu").click(function () {
    $(".menu-btn").removeClass("active");
    $(".nav-bar").removeClass("active");
    $(".overlay-menu").removeClass("active");
    $("body").removeClass("hiddenscroll-menu");
  });

  $(".menu-item-has-children>a")
    .focus(function () {
      $(this).parent().addClass("nav-menu-open");
    })
    .blur(function () {
      $(this).parent().removeClass("nav-menu-open");
    });
  $(".menu-item-has-children>ul>li>a")
    .focus(function () {
      $(this).parent().parent().addClass("nav-menu-open");
      $(this).parent().parent().parent().addClass("nav-menu-open");
    })
    .blur(function () {
      $(this).parent().parent().removeClass("nav-menu-open");
      $(this).parent().parent().parent().removeClass("nav-menu-open");
    });

  $(".mega-menu.mega-menu-explore")
    .clone()
    .appendTo(".primary-menu .mega-menu-item.mega-menu-explore");
  $(".mega-menu-item.mega-menu-explore a")
    .focus(function () {
      $(".mega-menu-item.mega-menu-explore").addClass("nav-menu-open");
    })
    .blur(function () {
      $(".mega-menu-item.mega-menu-explore").removeClass("nav-menu-open");
    });

  $(".mega-menu.mega-menu-hotel")
    .clone()
    .appendTo(".primary-menu .mega-menu-item.mega-menu-hotel");
  $(".mega-menu-item.mega-menu-hotel a")
    .focus(function () {
      $(".mega-menu-item.mega-menu-hotel").addClass("nav-menu-open");
    })
    .blur(function () {
      $(".mega-menu-item.mega-menu-hotel").removeClass("nav-menu-open");
    });

  $(".mega-menu-item .item > .item-link")
    .focus(function () {
      $(this).parent().addClass("nav-menu-open");
    })
    .blur(function () {
      $(this).parent().removeClass("nav-menu-open");
    });
  $(".mega-menu-item .item > .mega-sub-menu a")
    .focus(function () {
      $(this).parent().parent().parent().addClass("nav-menu-open");
    })
    .blur(function () {
      $(this).parent().parent().parent().removeClass("nav-menu-open");
    });

  $(".primary-menu>ul>.menu-item-has-children>.sub-menu").before(
    $('<div class="submenu-lv1"></div>')
  );
  $(".primary-menu>ul>.mega-menu-item>.mega-menu").before(
    $('<div class="submenu-lv1"></div>')
  );

  $(".submenu-lv1").click(function () {
    $(".submenu-lv1").removeClass("active");
    $(
      ".primary-menu>ul>.menu-item-has-children>.sub-menu, .primary-menu>ul>.mega-menu-item>.mega-menu"
    ).slideUp("normal");
    if ($(this).next().is(":hidden") == true) {
      $(this).addClass("active");
      $(this).next().slideDown("normal");
    }
  });

  $(".pre-footer h2").click(function () {
    $(".pre-footer h2").removeClass("active");
    $(".pre-footer .footer-menu").slideUp("normal");
    if ($(this).next().is(":hidden") == true) {
      $(this).addClass("active");
      $(this).next().slideDown("normal");
    }
  });

  $(".pre-footer .footer-title").click(function () {
    $(".pre-footer .footer-title").removeClass("active");
    $(".pre-footer .footer-menu").slideUp("normal");
    if ($(this).next().is(":hidden") == true) {
      $(this).addClass("active");
      $(this).next().slideDown("normal");
    }
  });

  $(".accord-link").click(function () {
    $(".accord-link").removeClass("active");
    $(".accord-cont").slideUp("normal");
    if ($(this).next().is(":hidden") == true) {
      $(this).addClass("active");
      $(this).next().slideDown("normal");
    }
  });

  $(".filter-title-sm").click(function () {
    $(".filter-title-sm").removeClass("active");
    $(".filter-item-out").slideUp("normal");
    if ($(this).next().is(":hidden") == true) {
      $(this).addClass("active");
      $(this).next().slideDown("normal");
    }
  });

  $(".menu-item-has-children>a")
    .focus(function () {
      $(this).parent().addClass("nav-menu-open");
    })
    .blur(function () {
      $(this).parent().removeClass("nav-menu-open");
    });

  $(".menu-item-has-children>ul>li>a")
    .focus(function () {
      $(this).parent().parent().addClass("nav-menu-open");
      $(this).parent().parent().parent().addClass("nav-menu-open");
    })
    .blur(function () {
      $(this).parent().parent().removeClass("nav-menu-open");
      $(this).parent().parent().parent().removeClass("nav-menu-open");
    });

  $("input,textarea")
    .focus(function () {
      $(this)
        .data("placeholder", $(this).attr("placeholder"))
        .attr("placeholder", "");
    })
    .blur(function () {
      $(this).attr("placeholder", $(this).data("placeholder"));
    });

  $(".search-box input")
    .focus(function () {
      $(".search-box").addClass("open");
    })
    .blur(function () {
      $(".search-box").removeClass("open");
    });

  // for when site is loaded
  if (window.innerWidth <= 1200) {
    $(".dropdown").on("show.bs.dropdown", function (e) {
      $(this).find(".dropdown-menu").first().stop(true, true).slideDown("fast");
    });
    $(".dropdown").on("hide.bs.dropdown", function (e) {
      $(this).find(".dropdown-menu").first().stop(true, true).slideUp("fast");
    });
  }
  // for when window is resized
  $(window).on("resize", () => {
    if (window.innerWidth <= 1200) {
      $(".dropdown").on("show.bs.dropdown", function (e) {
        $(this)
          .find(".dropdown-menu")
          .first()
          .stop(true, true)
          .slideDown("fast");
      });
      $(".dropdown").on("hide.bs.dropdown", function (e) {
        $(this).find(".dropdown-menu").first().stop(true, true).slideUp("fast");
      });
    }
  });

  $('.search-box input[type="text"]').keyup(function () {
    if ($(this).val().length) {
      $(".search-box").removeClass("btn-disabled");
    } else {
      $(".search-box").addClass("btn-disabled");
    }
  });

  $(".alert-close-button").click(function () {
    $(this).closest(".alert-closable").addClass("hidden");
  });

  $(".alert-minimize-button, .alert-box .btn").click(function () {
    $(this).closest(".alert-closable").toggleClass("minimized");
  });

  if (window.matchMedia("(max-device-width: 960px)").matches) {
    $(".alert-minimize-button, .alert-box .btn")
      .closest(".alert-closable")
      .toggleClass("minimized");
  }

  $(".nav-link.dropdown-toggle").click(function () {
    const link = $(this).closest(".nav-link").attr("href");
    window.location = link;
  });
});

//Owl Slider Control

$("#eventlist-slider").owlCarousel({
  loop: true,
  items: 1,
  margin: 30,
  nav: false,
  dots: true,
  dotsEach: true,
  autoplay: false,
});

// $('.review-slider').owlCarousel({
//     loop: true,
//     items: 1,
//     margin: 30,
//     center: $('.review-slider').hasClass("center-large"),
//     nav: false,
//     dots: true,
//     dotsEach: true,
//     autoplay: false,
//     responsive: {
//         0: {
//             margin: 0,
//             items: 1,
//         },
//
//         768: {
//             items: 2,
//             margin: 20,
//         },
//
//         992: {
//             items: 2,
//             nav: true,
//         },
//
//         1200: {
//             items: 3,
//             nav: true,
//         }
//     }
// });

// $(document).ready(function () {
//
//
//
//
//     $('#hero-slider').owlCarousel({
//         items: 1,
//         margin: 0,
//         loop: true,
//         nav: false,
//         dots: true,
//         autoplay: false
//     });
//
//     $('#offers-slider').owlCarousel({
//         items: 1,
//         margin: 0,
//         loop: true,
//         nav: true,
//         dots: true,
//         dotsEach: true,
//         autoplay: false,
//         responsive: {
//             0: {
//                 items: 1,
//                 margin: 20,
//             },
//
//             768: {
//                 items: 2,
//                 margin: 20,
//             },
//
//             992: {
//                 items: 2,
//                 margin: 20,
//             },
//
//             1200: {
//                 items: 3,
//                 margin: 24,
//             }
//         }
//     });
//
//     $('#reviews-slider').owlCarousel({
//         loop: true,
//         items: 1,
//         margin: 30,
//         center: $('#reviews-slider').hasClass("center-large"),
//         nav: false,
//         dots: true,
//         dotsEach: true,
//         autoplay: false,
//         responsive: {
//             0: {
//                 margin: 0,
//                 items: 1,
//             },
//
//             768: {
//                 items: 2,
//                 margin: 20,
//             },
//
//             992: {
//                 items: 2,
//                 nav: true,
//             },
//
//             1200: {
//                 items: 3,
//                 nav: true,
//             }
//         }
//     });
//
// });

// Grid Layout
$(window).on("load", function () {
  var $grid = $(".grid-boxes").isotope({
    itemSelector: ".grid-boxes>div",
    layoutMode: "fitRows",
    percentPosition: true,
    masonry: {
      columnWidth: ".grid-boxes>div",
    },
  });

  var $grid2 = $(".grid-items").isotope({
    itemSelector: ".grid-items>div",
    percentPosition: true,
    masonry: {
      columnWidth: ".grid-items>div",
    },
  });

  $(".filters ul li a").click(function () {
    $(".filters ul li a").removeClass("active");
    $(this).addClass("active");

    var data = $(this).attr("data-filter");
    $grid.isotope({
      filter: data,
    });
  });
});

//Custom SelectBox
$(document).ready(function () {
  enableSelectBoxes();
});

function enableSelectBoxes() {
  $(".selectbox").each(function () {
    $(".selectbox ul").addClass("selectoptions");
    $(".selectbox ul li").addClass("selectoption");

    $(this)
      .children(".current-item")
      .html(
        $(this)
          .children(".selectoptions")
          .children(".selectoption:first")
          .text()
      );

    $(this)
      .children(".current-item")
      .click(function () {
        $(this).toggleClass("active");
        $(".selectoptions").slideToggle("fast");
        $(".selectoptions2").slideUp(10);
        $(".selectoptions3").slideUp(10);
      });

    $(this)
      .find(".selectoption")
      .click(function () {
        $(".current-item").removeClass("active");
        $(".selectoptions").slideUp(10);
        $(this).closest(".selectbox").attr("value", $(this).attr("value"));
        $(this)
          .parent()
          .siblings(".selectbox .current-item")
          .html($(this).text());
      });
  });
} //-->

//Custom SelectBox
$(document).ready(function () {
  enableSelectBoxes2();
});

function enableSelectBoxes2() {
  $(".selectbox2").each(function () {
    $(".selectbox2 ul").addClass("selectoptions2");
    $(".selectbox2 ul li").addClass("selectoption2");

    $(this)
      .children(".current-item2")
      .html(
        $(this)
          .children(".selectoptions2")
          .children(".selectoption2:first")
          .text()
      );

    $(this)
      .children(".current-item2")
      .click(function () {
        $(this).toggleClass("active");
        $(".selectoptions2").slideToggle("fast");
        $(".selectoptions").slideUp(10);
        $(".selectoptions3").slideUp(10);
      });

    $(this)
      .find(".selectoption2")
      .click(function () {
        $(".current-item2").removeClass("active");
        $(".selectoptions2").slideUp(10);
        $(this).closest(".selectbox2").attr("value", $(this).attr("value"));
        $(this).parent().siblings(".current-item2").html($(this).text());
      });
  });
} //-->

//Custom SelectBox
$(document).ready(function () {
  enableSelectBoxes3();
});

function enableSelectBoxes3() {
  $(".selectbox3").each(function () {
    $(".selectbox3 ul").addClass("selectoptions3");
    $(".selectbox3 ul li").addClass("selectoption3");

    $(this)
      .children(".current-item3")
      .html(
        $(this)
          .children(".selectoptions3")
          .children(".selectoption3:first")
          .text()
      );

    $(this)
      .children(".current-item3")
      .click(function () {
        $(this).toggleClass("active");
        $(".selectoptions3").slideToggle("fast");
        $(".selectoptions").slideUp(10);
        $(".selectoptions2").slideUp(10);
      });

    $(this)
      .find(".selectoption3")
      .click(function () {
        $(".current-item3").removeClass("active");
        $(".selectoptions3").slideUp(10);
        $(this).closest(".selectbox3").attr("value", $(this).attr("value"));
        $(this).parent().siblings(".current-item3").html($(this).text());
      });
  });
} //-->

//Onload
$(document).ready(function () {
  $(".wow").css("opacity", "1");
});

// Dropdown Menu Outer Close
var mouse_is_inside2 = false;
$(document).ready(function () {
  $(".dropdown-menu").hover(
    function () {
      mouse_is_inside2 = true;
    },
    function () {
      mouse_is_inside2 = false;
    }
  );

  $("body").mouseup(function () {
    if (!mouse_is_inside2) $(".dropdown-toggle").removeClass("active");
  });
});
$(".dropdown-menu").on("click", function (event) {
  event.stopPropagation();
});

// Box Equalheight
try {
  equalheight = function (container) {
    var currentTallest = 0,
      currentRowStart = 0,
      rowDivs = new Array(),
      $el,
      topPosition = 0;
    $(container).each(function () {
      $el = $(this);
      $($el).height("auto");
      topPostion = $el.position().top;

      if (currentRowStart != topPostion) {
        for (currentDiv = 0; currentDiv < rowDivs.length; currentDiv++) {
          rowDivs[currentDiv].height(currentTallest);
        }
        rowDivs.length = 0; // empty the array
        currentRowStart = topPostion;
        currentTallest = $el.height();
        rowDivs.push($el);
      } else {
        rowDivs.push($el);
        currentTallest =
          currentTallest < $el.height() ? $el.height() : currentTallest;
      }
      for (currentDiv = 0; currentDiv < rowDivs.length; currentDiv++) {
        rowDivs[currentDiv].height(currentTallest);
      }
    });
  };

  /*$(window).load(function () {
        equalheight('.article-box2 .txt-wrap');
    });
    $(window).resize(function () {
        equalheight('.article-box2 .txt-wrap');
    });

    $(window).load(function () {
        equalheight('.article-box2 .price-wrap .price-out .price');
    });
    $(window).resize(function () {
        equalheight('.article-box2 .price-wrap .price-out .price');
    });

    $(window).load(function () {
        equalheight('.grid-boxes > div .box');
    });
    $(window).resize(function () {
    $(window).resize(function () {
        equalheight('.grid-boxes > div .box');
    });*/
} catch (e) {}

// Select
(function ($) {
  // Color the empty select
  $.fn.selectColored = function (options) {
    var defaults = {
      def: -1,
      classSel: "colorize",
      classEmpty: "empty",
      classDef: "def",
    };
    // extend default options with those provided
    var opts = $.extend(defaults, options);

    // implementation code
    return this.each(function () {
      var $select = $(this);
      $select
        .addClass(opts.classSel)
        .find('option[value="' + opts.def + '"]')
        .addClass(opts.classDef);

      function color() {
        $select.toggleClass(opts.classEmpty, $select.val() == opts.def);
      }

      $select.bind("change", function () {
        color();
      });

      // initialize
      color();
    });
  }; // end plugin definition
})(jQuery);
$(document).ready(function () {
  $("select").selectColored();
});

$(document).ready(function () {
  // Flying Focus - http://n12v.com/focus-transition/
  (function () {
    if (document.getElementById("flying-focus")) return;

    var flyingFocus = document.createElement("flying-focus"); // use uniq element name to decrease the chances of a conflict with website styles
    flyingFocus.id = "flying-focus";
    document.body.appendChild(flyingFocus);

    var DURATION = 100;
    flyingFocus.style.transitionDuration =
      flyingFocus.style.WebkitTransitionDuration = DURATION / 1000 + "s";

    function offsetOf(elem) {
      var rect = elem.getBoundingClientRect();
      var docElem = document.documentElement;
      var win = document.defaultView;
      var body = document.body;

      var clientTop = docElem.clientTop || body.clientTop || 0,
        clientLeft = docElem.clientLeft || body.clientLeft || 0,
        scrollTop = win.pageYOffset || docElem.scrollTop || body.scrollTop,
        scrollLeft = win.pageXOffset || docElem.scrollLeft || body.scrollLeft,
        top = rect.top + scrollTop - clientTop,
        left = rect.left + scrollLeft - clientLeft;

      return { top: top, left: left };
    }

    var movingId = 0;
    var prevFocused = null;
    var isFirstFocus = true;
    var keyDownTime = 0;

    document.documentElement.addEventListener(
      "keydown",
      function (event) {
        var code = event.which;
        // Show animation only upon Tab or Arrow keys press.
        if (code === 9 || (code > 36 && code < 41)) {
          keyDownTime = now();
        }
      },
      false
    );

    document.documentElement.addEventListener(
      "focus",
      function (event) {
        var target = event.target;
        if (target.id === "flying-focus") {
          return;
        }
        var offset = offsetOf(target);
        flyingFocus.style.left = offset.left + "px";
        flyingFocus.style.top = offset.top + "px";
        flyingFocus.style.width = target.offsetWidth + "px";
        flyingFocus.style.height = target.offsetHeight + "px";

        // Would be nice to use:
        //
        //   flyingFocus.style['outline-offset'] = getComputedStyle(target, null)['outline-offset']
        //
        // but it always '0px' in WebKit and Blink for some reason :(

        if (isFirstFocus) {
          isFirstFocus = false;
          return;
        }

        if (now() - keyDownTime > 42) {
          return;
        }

        onEnd();
        target.classList.add("flying-focus_target");
        flyingFocus.classList.add("flying-focus_visible");
        prevFocused = target;
        movingId = setTimeout(onEnd, DURATION);
      },
      true
    );

    document.documentElement.addEventListener(
      "blur",
      function () {
        onEnd();
      },
      true
    );

    function onEnd() {
      if (!movingId) {
        return;
      }
      clearTimeout(movingId);
      movingId = 0;
      flyingFocus.classList.remove("flying-focus_visible");
      prevFocused.classList.remove("flying-focus_target");
      prevFocused = null;
    }

    function now() {
      return new Date().valueOf();
    }
  })();
});

/**
 * Filters a list of element by given filters.
 *
 * @param {array<object>} elements an array ob objects with: {element: jqueryElement, data: FeaturesArray}
 * @param {array<object>} activeOptions an array of active filters.
 */

function filterElements(elements, activeOptions) {
  elements.forEach(function (element) {
    fullfilledGroups = {};
    activeOptions.forEach((option) => {
      fullfilledGroups[option.group] = false;
    });
    // check every filter. Means, for each filter the function has to return true
    activeOptions.forEach(function (filter) {
      // check every datapoint of the current element. Means, the function has to retorn true al least one time.
      if (!element.data) {
        return false;
      }
      return element.data.forEach(function (datapoint) {
        var filterFullfilled =
          datapoint.group === filter.group && datapoint.value === filter.value;
        if (filterFullfilled) {
          fullfilledGroups[filter.group] = true;
        }
        // check if group and value match
        return filterFullfilled;
      });
    });
    var allGroupsFUllfilled = Object.values(fullfilledGroups).every(
      (group) => group === true
    );
    if (activeOptions.length === 0 || allGroupsFUllfilled) {
      element.element.parent().removeClass("disabled");
    } else {
      element.element.parent().addClass("disabled");
    }
  });
}

$(document).ready(function () {
  // find each filter and element section
  $(".filter-elements").each(function () {
    // get all boxed that should be filtered
    var elements = $(this).find(".filter-element");
    // read out and save groups and values
    var elementsProcessed = [];
    elements.each(function () {
      // the data attribute data-features should look like this:
      // [ { group: "1", value: "a"},
      //   { group: "1", value: "b"},
      //   { group: "2", value: "a"} ]
      var data = $(this).data("features");
      elementsProcessed.push({
        element: $(this),
        data: data,
      });
    });
    // save all active filters for filtering
    var activeFilter = [];
    // get the container where the active filter badges should be placed
    var activeOptionContainer = $(this).find(".filter-active-options");
    // get the tempalte badge and clone it
    var templateElement = $(this).find(".filter-active-options > div");
    var template = templateElement.clone();
    // it was display: none - remove it
    template.removeAttr("style");
    templateElement.remove();
    // get each dropdown
    $(this)
      .find(".btn-filter")
      .each(function () {
        $(this).click(function () {
          $(this).find(".filter-options").toggleClass("show");
          $(this).find(".icon-select").toggleClass("toggle-icon-filter");

          $(".btn-filter")
            .not(this)
            .find(".filter-options")
            .removeClass("show");
          $(".btn-filter")
            .not(this)
            .find(".icon-select")
            .removeClass("toggle-icon-filter");
        });

        // save the group of the dropdown
        var group = $(this).data("group").toString();
        // get each option of the current dropdown
        $(this)
          .find(".filter-options > div, .filter-category-options")
          .each(function () {
            // save current value and group in this function
            var optionGroup = group;
            var optionValue = $(this).data("value").toString();
            // save the current option in the dropdown
            var optionInDropdown = $(this);
            // add a click event to the option
            $(this).click(function () {
              // only execute the click, if the option is not already active
              if (
                activeFilter.findIndex(
                  (option) =>
                    option.group === optionGroup && option.value === optionValue
                ) === -1
              ) {
                // copy the template
                var option = template.clone();
                // replace the text with the text of the current option
                option.find(".label").text($(this).text());
                // add it to the container of the active options
                activeOptionContainer.append(option);
                // save the option in the active filters array
                activeFilter.push({
                  value: optionValue,
                  group: optionGroup,
                });
                // disable option in dropdown to indicate that is was taken already
                optionInDropdown.addClass("disabled");
                // update the listing
                filterElements(elementsProcessed, activeFilter);
                // add a click event to the active option badge to disable it again
                option.click(function () {
                  // remove ooption from active filter array
                  activeFilter = activeFilter.filter(
                    (activeOption) =>
                      !(
                        activeOption.group === optionGroup &&
                        activeOption.value === optionValue
                      )
                  );
                  // remove badge
                  $(this).remove();
                  // remove disabled class in the option  in the dropdown
                  optionInDropdown.removeClass("disabled");
                  // update the listing
                  filterElements(elementsProcessed, activeFilter);
                });
              }
            });
          });
      });
  });
  $(document).on("click", function (event) {
    if (!$(event.target).closest(".filter-elements .btn-filter").length) {
      $(".filter-elements .btn-filter .filter-options").removeClass("show");
      $(".filter-elements .btn-filter span.icon-select").removeClass(
        "toggle-icon-filter"
      );
    }
  });
});

var youtubeIframeAPIReadyStack = [];
/**
 * Fonction appelé lorsque l'API YouTube est chargée dans le DOM.
 *
 * On indique alors que pour toutes les vidéos en arrière plan, on coupe le son.
 */
youtubeIframeAPIReadyStack.push(function () {
  var videos = document.getElementsByClassName("slider__background--video");

  var i;
  for (i = 0; i < videos.length; i++) {
    new YT.Player(videos[i].id, {
      events: {
        onReady: function (event) {
          event.target.mute();
          event.target.playVideo();
          event.target.loop();
        },
      },
    });
  }
});

function onYouTubeIframeAPIReady() {
  if (typeof YT !== "undefined" && typeof YT.Player !== "undefined") {
    while (youtubeIframeAPIReadyStack.length > 0) {
      youtubeIframeAPIReadyStack.shift()();
    }
  }
}

onYouTubeIframeAPIReady();

$(document).ready(function () {
  $(".navbar .nav-item.dropdown").each(function (i) {
    parentItem = $(this).find(".dropdown-toggle");
    parentNonLinked = parentItem.clone();
    parentNonLinked.attr("href", "");
    parentNonLinked.addClass("non-linked-menu-item");
    parentItem.addClass("linked-menu-item");
    parentItem.before(parentNonLinked);
    parentText = parentItem.find(".nav-text").text();
    parentLink = parentItem.attr("href");
    dropdownMenu = $(this).find(".dropdown-menu");
    allLinks = [];
    dropdownMenu.find(".dropdown-item a").each(function (j) {
      allLinks.push($(this).attr("href"));
    });
    if (!allLinks.includes(parentLink)) {
      dropdownItemTemplate = dropdownMenu.find(".dropdown-item").first();
      newDropdownItem = dropdownItemTemplate.clone();
      newDropdownItem.addClass("duplicated-parent");
      newDropdownLink = newDropdownItem.find("a");
      newDropdownLink.attr("href", parentLink);
      newDropdownLink.text(parentText);
      dropdownItemTemplate.before(newDropdownItem);
    }

    /**
     *
     * Apple iOS toggle fix @05.04.2022: 1st menu items should not redirect to target page AND duplicated 1st for 2nd level should be visible
     *
     */
    if (window.innerWidth < 1200) {
      jQuery(
        ".navbar .nav-item.dropdown a.nav-link.dropdown-toggle.linked-menu-item"
      ).attr("href", "javascript:void(0)");
    }
    /**
     * End of iOS fix
     */
  });
});

// Custom Codes
$(document).ready(function () {
  $("#accelerate-slider").owlCarousel({
    items: 1,
    margin: 0,
    loop: true,
    nav: true,
    dots: false,
    autoplay: true,
  });

  $("#ourrides-slider").owlCarousel({
    items: 1,
    margin: 30,
    loop: true,
    nav: false,
    dots: true,
    dotsEach: false,
    autoplay: false,
    responsive: {
      0: {
        items: 1,
        autoWidth: false,
      },
      768: {
        items: 1,
        autoWidth: true,
      },
      992: {
        items: 2,
        nav: true,
        autoWidth: false,
      },
      1200: {
        items: 3,
        nav: true,
        autoWidth: false,
      },
      1700: {
        items: 4,
        nav: true,
        autoWidth: false,
      },
    },
  });

  $("#attr-image-slider").owlCarousel({
    items: 1,
    margin: 30,
    loop: true,
    nav: false,
    dots: true,
    dotsEach: false,
    autoplay: false,
    responsive: {
      0: {
        items: 1,
        autoWidth: false,
      },
      768: {
        items: 1,
        autoWidth: true,
      },
      992: {
        items: 2,
        autoWidth: false,
      },
      1200: {
        items: 3,
        autoWidth: false,
      },
      1700: {
        items: 4,
        autoWidth: false,
      },
    },
  });

  $("#more-news-slider").owlCarousel({
    items: 1,
    margin: 30,
    loop: true,
    nav: false,
    dots: true,
    dotsEach: true,
    autoplay: false,
    responsive: {
      0: {
        items: 1,
        autoWidth: true,
      },
      768: {
        items: 1,
        autoWidth: true,
      },
      992: {
        items: 2,
        nav: true,
        autoWidth: false,
      },
      1200: {
        items: 3,
        nav: true,
        autoWidth: false,
      },
      1700: {
        items: 3,
        nav: true,
        autoWidth: false,
      },
    },
  });

  // $('#news-slider').owlCarousel({
  //     items: 1,
  //     margin: 30,
  //     loop: true,
  //     nav: false,
  //     dots: true,
  //     dotsEach: true,
  //     autoplay: false,
  //     responsive: {
  //         0: {
  //             items: 1,
  //         },
  //         768: {
  //             items: 1,
  //         },
  //         992: {
  //             items: 2,
  //             nav: true,
  //             autoWidth: false,
  //         },
  //         1200: {
  //             items: 3,
  //             nav: true,
  //             autoWidth: false,
  //         },
  //         1700: {
  //             items: 3,
  //             nav: true,
  //             autoWidth: false,
  //         }
  //     }
  // });

  $("#animal-slider").owlCarousel({
    items: 1,
    margin: 30,
    loop: true,
    nav: false,
    dots: true,
    dotsEach: true,
    autoplay: false,
    responsive: {
      0: {
        items: 1,
        autoWidth: false,
      },
      768: {
        items: 1,
        autoWidth: true,
      },
      992: {
        items: 2,
        nav: true,
        autoWidth: false,
      },
      1200: {
        items: 3,
        nav: true,
        autoWidth: false,
      },
      1700: {
        items: 3,
        nav: true,
        autoWidth: false,
      },
    },
  });

  $(function () {
    $('[data-toggle="tooltip"]').tooltip();
  });
});

jQuery(document).ready(function () {
  if (jQuery(".fixed-icon a.scrolltop").length > 0) {
    // Der Button wird ausgeblendet
    jQuery(".fixed-icon a.scrolltop").hide();
    jQuery(".fixed-icon a.scrolltop").attr("href", "javascript:void(0)");

    // Funktion für das Scroll-Verhalten
    jQuery(function () {
      jQuery(window).scroll(function () {
        if (jQuery(this).scrollTop() > 100) {
          // Wenn 100 Pixel gescrolled wurde
          jQuery(".fixed-icon a.scrolltop").fadeIn();
        } else {
          jQuery(".fixed-icon a.scrolltop").fadeOut();
        }
      });

      jQuery(".fixed-icon a.scrolltop").click(function (event) {
        // Klick auf den Button
        event.stopPropagation();
        jQuery("body,html").animate(
          {
            scrollTop: 0,
          },
          1000
        );
        return false;
      });
    });
  }
});

/* 2022-05-04: HOTFIX for extension "calenderize"; currentlich there are some situations with multiple calender entries of same date (redundant) */
jQuery(document).ready(function () {
  if (jQuery(".events-cont#calendar").length > 0) {
    let calEntryCounter = 0;
    jQuery(".events-cont .events-articles").each(function (
      calEntryIndex,
      calEntry
    ) {
      if (jQuery(calEntry).is(":visible")) {
        if (calEntryCounter >= 1) {
          jQuery(calEntry).hide();
        }
        calEntryCounter += 1;
      }
    });
  }
});
/*************************************************************************************************************************************************/

jQuery(document).ready(function () {
  if (jQuery(".news-single .frame-type-form_formframework form").length > 0) {
    // get rewrited url title of the current news article (like e.g., "whats-new-this-summer")
    let newsDetailUrlTitle = window.location.pathname.split("/").pop();
    // get full form action -> without the single new article in url :( and remove everything before "?" in url sting
    let oldAction = jQuery(".news-single .frame-type-form_formframework form")
      .attr("action")
      .split("?")
      .pop();
    let newAction = newsDetailUrlTitle + "?" + oldAction;
    // set new action url for the form inside a news article
    jQuery(".news-single .frame-type-form_formframework form").attr(
      "action",
      newAction
    );
  }
});

jQuery(document).ready(function () {
  $(".tab-wrapper .nav-link.active").parent().css("overflow", "visible");
  $(".tab-wrapper .nav-link").on("click", clickToggle);
  function clickToggle() {
    $(this).parent().css("overflow", "visible");
    $(".tab-wrapper .nav-link:not(.active)").parent().css("overflow", "hidden");
  }
});

// jQuery(document).ready(function() {
// if ($(".container-fluid").find('.container').length > 0) {
//     $('.container-fluid').addClass('mobile-padding');
// }
[].forEach.call(document.querySelectorAll(".container-fluid"), (e) => {
  let elements = e.querySelectorAll(".container");
  if (!elements.length > 0) {
    e.classList.add("mobile-padding");
    // e.classList.addClass('test');
  }
});

jQuery(document).ready(function () {
  $(".toggleElement").click(function (e) {
    e.preventDefault();
    e.stopPropagation();
  });

  $(".toggle-wrapper").on("show.bs.collapse", function () {
    $(this).siblings(".toggleElement").addClass("active");
    if ($(this).siblings(".toggleElement").hasClass("active")) {
      $(this)
        .siblings(".toggleElement")
        .children(".textbutton-active")
        .css("display", "block");
      $(this)
        .siblings(".toggleElement")
        .children(".textbutton")
        .css("display", "none");
    }
  });

  $(".toggle-wrapper").on("hide.bs.collapse", function () {
    $(this).siblings(".toggleElement").removeClass("active");
    if ($(this).siblings(".toggleElement").not("active")) {
      $(this)
        .siblings(".toggleElement")
        .children(".textbutton-active")
        .css("display", "none");
      $(this)
        .siblings(".toggleElement")
        .children(".textbutton")
        .css("display", "block");
    }
  });

  $(".toggleText").on("show.bs.collapse", function () {
    $(this).siblings(".toggleElement").addClass("active");
    if ($(this).siblings(".toggleElement").hasClass("active")) {
      $(this)
        .siblings(".toggleElement")
        .children(".textbutton-active")
        .css("display", "block");
      $(this)
        .siblings(".toggleElement")
        .children(".textbutton")
        .css("display", "none");
    }
  });

  $(".toggleText").on("hide.bs.collapse", function () {
    $(this).siblings(".toggleElement").removeClass("active");
    if ($(this).siblings(".toggleElement").not("active")) {
      $(this)
        .siblings(".toggleElement")
        .children(".textbutton-active")
        .css("display", "none");
      $(this)
        .siblings(".toggleElement")
        .children(".textbutton")
        .css("display", "block");
    }
  });

  $(".text.toggleText").each(function () {
    $(this).parent().css({
      position: "relative",
      display: "flex",
      "flex-direction": "column",
    });
  });
});

jQuery(document).ready(function () {
  if ($(window).width() < 1199) {
    if ($(".card .content .btn-out")) {
      // $('.mb-3').addClass('mb-5');
      $(".row .item").css("padding-bottom", "50px");
    }
    if ($(".feature-items .fourcol-25-25-25-25")) {
      $(".row .col-6").removeClass("mb-3");
    }
  }
});

jQuery(document).ready(function () {
  if (
    $("a.card.cardtype-price.customBackgroundColor").find($("[class*='#']"))
  ) {
    $("a.card.cardtype-price.customBackgroundColor[class*='#']").each(
      function () {
        var classList = $(this).attr("class");
        var classArr = classList.split(/\s+/);
        var lastClassNameArr = classArr.slice(-1);
        var lastClassName = lastClassNameArr.toString();
        $(this).css("background-color", lastClassName);
      }
    );
  }
});

$(document).ready(function () {
  function initializeSlider() {
    const $slider = $(".card-carsl-item-list");
    const $bannerSlider = $(".hero-banner-holder");

    // Initialize hero banner slider
    if ($.fn && $.fn.slick && !$bannerSlider.hasClass("slick-initialized")) {
      $bannerSlider.slick({
        dots: false,
        arrows: false,
        infinite: true,
        centerMode: false,
        slidesToShow: 1,
        slidesToScroll: 1,
        speed: 300,
        accessibility: false,
        draggable: false,
        swipe: false,
        touchMove: false,
        adaptiveHeight: true,
      });
    }

    // Initialize card carousel slider for smaller screens
    if (window.matchMedia("(max-width: 1023px)").matches) {
      if ($.fn && $.fn.slick && !$slider.hasClass("slick-initialized")) {
        $slider.slick({
          dots: true,
          arrows: false,
          infinite: true,
          speed: 300,
          centerMode: true,
          slidesToShow: 3,
          slidesToScroll: 1,
          centerPadding: "0px",
          dotsClass: "slick-dots custom_paging",
          asNavFor: ".hero-banner-holder",
          variableWidth: true,
          customPaging: function (slider, i) {
            return i + 1 + "/" + slider.slideCount;
          },
          responsive: [
            {
              breakpoint: 768,
              settings: {
                slidesToShow: 1,
                slidesToScroll: 1,
              },
            },
            {
              breakpoint: 640,
              settings: {
                centerPadding: "0px",
              },
            },
          ],
        });
      }
    } else {
      if ($slider.hasClass("slick-initialized")) {
        $slider.slick("unslick");
      }
    }

    // Reattach click functionality after resize
    attachCardClickEvent();
  }
  initializeSlider();
  function attachCardClickEvent() {
    $(".card-carsl-item")
      .off("click")
      .on("click", function () {
        // Get the index of the clicked card
        let cardIndex = 0;
        if (window.matchMedia("(max-width: 1023px)").matches) {
          cardIndex = $(this).closest(".slick-slide").data("slick-index");
        } else {
          cardIndex = $(this).index();

          // Reset all elements with 'card-carous-list-trans-2x' to 'card-carous-list-trans-1x'
          $(".card-carous-list-trans-2x")
            .removeClass("card-carous-list-trans-2x")
            .addClass("card-carous-list-trans-1x");

          // Replace class of the clicked element
          $(this)
            .removeClass("card-carous-list-trans-1x")
            .addClass("card-carous-list-trans-2x");
          // Move the hero banner slider to the corresponding slide
          $(".hero-banner-holder").slick("slickGoTo", cardIndex);
        }
      });
  }

  // Reinitialize slider on window resize
  $(window).on("resize", function () {
    initializeSlider();
  });

  //  -------- 5 col mobile slider---------
  function initMobileCarousels() {
    $(
      ".mobile-slider-five-col .row, .mobile-slider-four-col .row, .mobile-slider-three-col .row"
    ).each(function () {
      var $carousel = $(this);

      if ($(window).width() <= 767.7) {
        // Add owl-carousel class if missing
        if (!$carousel.hasClass("owl-carousel")) {
          $carousel.addClass("owl-carousel");
        }

        // Default settings
        var settings = {
          loop: true,
          margin: 10,
          nav: false,
          dots: false,
          items: 1.2,
        };

        // Init
        $carousel.owlCarousel(settings);
      } else {
        // Destroy on desktop
        if ($carousel.hasClass("owl-carousel")) {
          $carousel.trigger("destroy.owl.carousel");
          $carousel.removeClass("owl-carousel owl-loaded");
          $carousel.find(".owl-stage-outer").children().unwrap();
        }
      }
    });
  }

  $(document).ready(initMobileCarousels);
  $(window).on("resize", initMobileCarousels);
});

$(document).ready(function () {
  const carouselContainers = $(".mobile-slider-multi-row");
  const rowSelector =
    ".threecol-33-33-33 .row, .fourcol-25-25-25-25 .row, .fivecol-20-20-20-20-20  .row";

  const breakpoint = 767.7;

  // Store original rows HTML per container so we can restore only the rows later
  carouselContainers.each(function () {
    const $container = $(this);
    const $allRows = $container.find(rowSelector);
    const originalRowsHtml = $allRows
      .map(function () {
        return $(this).prop("outerHTML");
      })
      .get()
      .join("");
    $container.data("originalRowsHtml", originalRowsHtml);
  });

  function toggleMultiRowCarousel() {
    carouselContainers.each(function () {
      const $container = $(this);
      const $existingOwl = $container.find(".owl-carousel");

      if ($(window).width() <= breakpoint) {
        // If carousel not initialized for this container
        if (!$existingOwl.length) {
          const $allRows = $container.find(rowSelector);
          // Collect all .col slides from the rows and clone them
          const allSlides = $allRows.find('[class*="col-"]').clone();

          // Create the owl wrapper and insert it where the rows were, keeping other siblings intact
          const $owl = $("<div class='owl-carousel owl-theme'></div>");
          $owl.append(allSlides);
          $allRows.first().before($owl);
          $allRows.remove();

          // Initialize Owl Carousel on the created element
          $owl.owlCarousel({
            items: 1.2,
            loop: true,
            margin: 10,
            nav: false,
            dots: false,
            autoplay: true,
            autoplayTimeout: 4000,
          });
        }
      } else {
        // Restore original rows HTML if returning to desktop
        if ($existingOwl.length) {
          // Destroy owl on the actual owl element
          $existingOwl.trigger("destroy.owl.carousel");
          const originalRowsHtml = $container.data("originalRowsHtml") || "";
          // Replace the owl element with the saved rows markup
          $existingOwl.replaceWith(originalRowsHtml);
        }
      }
    });
  }

  // Initial run
  toggleMultiRowCarousel();

  // Re-run on resize (debounced)
  let resizeTimer;
  $(window).on("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(toggleMultiRowCarousel, 250);
  });
});

/**
 * Dynamically converts the four-column grid into an Owl Carousel on mobile devices,
 * correctly handling multiple frames per column.
 */
$(document).ready(function () {
  const carouselContainer = $(".photo-gallery-elem");
  const targetRow = carouselContainer.find(".row");

  // Store the original grid HTML to restore it on desktop
  const originalGridHtml = targetRow.html();

  const breakpoint = 767;

  function toggleFourColCarousel() {
    if ($(window).width() < breakpoint) {
      // If the carousel hasn't been initialized yet...
      if (!targetRow.hasClass("owl-loaded")) {
        // 1. Find all individual frames from the original HTML
        const slides = $(originalGridHtml).find(".frame-type-image");

        // 2. Replace the row's content with just the slide frames
        targetRow.html(slides);

        // 3. Initialize Owl Carousel
        targetRow.addClass("owl-carousel").owlCarousel({
          items: 1,
          loop: true,
          margin: 20,
          nav: true,
          dots: true,
        });
      }
    } else {
      // If the carousel is active...
      if (targetRow.hasClass("owl-loaded")) {
        // 1. Destroy the carousel instance
        targetRow.trigger("destroy.owl.carousel");

        // 2. Remove the carousel class
        targetRow.removeClass("owl-carousel");

        // 3. Restore the original grid structure from the saved HTML
        targetRow.html(originalGridHtml);
      }
    }
  }

  // Run the function on page load
  toggleFourColCarousel();

  // Re-run the function on window resize
  let resizeTimer;
  $(window).on("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(toggleFourColCarousel, 250);
  });
});

// Disable AOS on sliders and carousels
$(document).ready(function () {
  const sliderSelectors = [
    ".mobile-slider-five-col",
    ".mobile-slider-four-col",
    ".mobile-slider-three-col",
    ".mobile-slider-multi-row",
  ].join(",");

  function removeAosOnSmallScreens() {
    if (window.innerWidth < 768) {
      const $sliders = $(sliderSelectors);
      $sliders.each(function () {
        const $slider = $(this);
        if ($slider.attr("data-aos")) {
          $slider.removeAttr("data-aos");
        }
        $slider.find("[data-aos]").removeAttr("data-aos");
      });
    }
  }

  // run on load
  removeAosOnSmallScreens();

  // re-run on resize (debounced)
  let resizeTimer;
  $(window).on("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(removeAosOnSmallScreens, 150);
  });
});

/*!
 * Jarallax v2.0.1 (https://github.com/nk-o/jarallax)
 * Copyright 2022 nK <https://nkdev.info>
 * Licensed under MIT (https://github.com/nk-o/jarallax/blob/master/LICENSE)
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.jarallax = factory());
})(this, (function () { 'use strict';

  function ready(callback) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      // Already ready or interactive, execute callback
      callback();
    } else {
      document.addEventListener('DOMContentLoaded', callback, {
        capture: true,
        once: true,
        passive: true
      });
    }
  }

  /* eslint-disable import/no-mutable-exports */

  /* eslint-disable no-restricted-globals */
  let win;

  if (typeof window !== 'undefined') {
    win = window;
  } else if (typeof global !== 'undefined') {
    win = global;
  } else if (typeof self !== 'undefined') {
    win = self;
  } else {
    win = {};
  }

  var global$1 = win;

  /* eslint-disable no-param-reassign */
  const {
    navigator
  } = global$1;
  const isMobile = /*#__PURE__*/ /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  let $deviceHelper;
  /**
   * The most popular mobile browsers changes height after page scroll and this generates image jumping.
   * We can fix it using this workaround with vh units.
   */

  function getDeviceHeight() {
    if (!$deviceHelper && document.body) {
      $deviceHelper = document.createElement('div');
      $deviceHelper.style.cssText = 'position: fixed; top: -9999px; left: 0; height: 100vh; width: 0;';
      document.body.appendChild($deviceHelper);
    }

    return ($deviceHelper ? $deviceHelper.clientHeight : 0) || global$1.innerHeight || document.documentElement.clientHeight;
  } // Window height data


  let wndH;

  function updateWndVars() {
    if (isMobile) {
      wndH = getDeviceHeight();
    } else {
      wndH = global$1.innerHeight || document.documentElement.clientHeight;
    }
  }

  updateWndVars();
  global$1.addEventListener('resize', updateWndVars);
  global$1.addEventListener('orientationchange', updateWndVars);
  global$1.addEventListener('load', updateWndVars);
  ready(() => {
    updateWndVars();
  }); // list with all jarallax instances
  // need to render all in one scroll/resize event

  const jarallaxList = []; // get all parents of the element.

  function getParents(elem) {
    const parents = [];

    while (elem.parentElement !== null) {
      elem = elem.parentElement;

      if (elem.nodeType === 1) {
        parents.push(elem);
      }
    }

    return parents;
  }

  function updateParallax() {
    if (!jarallaxList.length) {
      return;
    }

    jarallaxList.forEach((data, k) => {
      const {
        instance,
        oldData
      } = data;
      const clientRect = instance.$item.getBoundingClientRect();
      const newData = {
        width: clientRect.width,
        height: clientRect.height,
        top: clientRect.top,
        bottom: clientRect.bottom,
        wndW: global$1.innerWidth,
        wndH
      };
      const isResized = !oldData || oldData.wndW !== newData.wndW || oldData.wndH !== newData.wndH || oldData.width !== newData.width || oldData.height !== newData.height;
      const isScrolled = isResized || !oldData || oldData.top !== newData.top || oldData.bottom !== newData.bottom;
      jarallaxList[k].oldData = newData;

      if (isResized) {
        instance.onResize();
      }

      if (isScrolled) {
        instance.onScroll();
      }
    });
    global$1.requestAnimationFrame(updateParallax);
  }

  let instanceID = 0; // Jarallax class

  class Jarallax {
    constructor(item, userOptions) {
      const self = this;
      self.instanceID = instanceID;
      instanceID += 1;
      self.$item = item;
      self.defaults = {
        type: 'scroll',
        // type of parallax: scroll, scale, opacity, scale-opacity, scroll-opacity
        speed: 0.5,
        // supported value from -1 to 2
        imgSrc: null,
        imgElement: '.jarallax-img',
        imgSize: 'cover',
        imgPosition: '50% 50%',
        imgRepeat: 'no-repeat',
        // supported only for background, not for <img> tag
        keepImg: false,
        // keep <img> tag in it's default place
        elementInViewport: null,
        zIndex: -100,
        disableParallax: false,
        disableVideo: false,
        // video
        videoSrc: null,
        videoStartTime: 0,
        videoEndTime: 0,
        videoVolume: 0,
        videoLoop: true,
        videoPlayOnlyVisible: true,
        videoLazyLoading: true,
        // events
        onScroll: null,
        // function(calculations) {}
        onInit: null,
        // function() {}
        onDestroy: null,
        // function() {}
        onCoverImage: null // function() {}

      }; // prepare data-options

      const dataOptions = self.$item.dataset || {};
      const pureDataOptions = {};
      Object.keys(dataOptions).forEach(key => {
        const loweCaseOption = key.substr(0, 1).toLowerCase() + key.substr(1);

        if (loweCaseOption && typeof self.defaults[loweCaseOption] !== 'undefined') {
          pureDataOptions[loweCaseOption] = dataOptions[key];
        }
      });
      self.options = self.extend({}, self.defaults, pureDataOptions, userOptions);
      self.pureOptions = self.extend({}, self.options); // prepare 'true' and 'false' strings to boolean

      Object.keys(self.options).forEach(key => {
        if (self.options[key] === 'true') {
          self.options[key] = true;
        } else if (self.options[key] === 'false') {
          self.options[key] = false;
        }
      }); // fix speed option [-1.0, 2.0]

      self.options.speed = Math.min(2, Math.max(-1, parseFloat(self.options.speed))); // prepare disableParallax callback

      if (typeof self.options.disableParallax === 'string') {
        self.options.disableParallax = new RegExp(self.options.disableParallax);
      }

      if (self.options.disableParallax instanceof RegExp) {
        const disableParallaxRegexp = self.options.disableParallax;

        self.options.disableParallax = () => disableParallaxRegexp.test(navigator.userAgent);
      }

      if (typeof self.options.disableParallax !== 'function') {
        self.options.disableParallax = () => false;
      } // prepare disableVideo callback


      if (typeof self.options.disableVideo === 'string') {
        self.options.disableVideo = new RegExp(self.options.disableVideo);
      }

      if (self.options.disableVideo instanceof RegExp) {
        const disableVideoRegexp = self.options.disableVideo;

        self.options.disableVideo = () => disableVideoRegexp.test(navigator.userAgent);
      }

      if (typeof self.options.disableVideo !== 'function') {
        self.options.disableVideo = () => false;
      } // custom element to check if parallax in viewport


      let elementInVP = self.options.elementInViewport; // get first item from array

      if (elementInVP && typeof elementInVP === 'object' && typeof elementInVP.length !== 'undefined') {
        [elementInVP] = elementInVP;
      } // check if dom element


      if (!(elementInVP instanceof Element)) {
        elementInVP = null;
      }

      self.options.elementInViewport = elementInVP;
      self.image = {
        src: self.options.imgSrc || null,
        $container: null,
        useImgTag: false,
        // 1. Position fixed is needed for the most of browsers because absolute position have glitches
        // 2. On MacOS with smooth scroll there is a huge lags with absolute position - https://github.com/nk-o/jarallax/issues/75
        // 3. Previously used 'absolute' for mobile devices. But we re-tested on iPhone 12 and 'fixed' position is working better, then 'absolute', so for now position is always 'fixed'
        position: 'fixed'
      };

      if (self.initImg() && self.canInitParallax()) {
        self.init();
      }
    } // add styles to element
    // eslint-disable-next-line class-methods-use-this


    css(el, styles) {
      if (typeof styles === 'string') {
        return global$1.getComputedStyle(el).getPropertyValue(styles);
      }

      Object.keys(styles).forEach(key => {
        el.style[key] = styles[key];
      });
      return el;
    } // Extend like jQuery.extend
    // eslint-disable-next-line class-methods-use-this


    extend(out, ...args) {
      out = out || {};
      Object.keys(args).forEach(i => {
        if (!args[i]) {
          return;
        }

        Object.keys(args[i]).forEach(key => {
          out[key] = args[i][key];
        });
      });
      return out;
    } // get window size and scroll position. Useful for extensions
    // eslint-disable-next-line class-methods-use-this


    getWindowData() {
      return {
        width: global$1.innerWidth || document.documentElement.clientWidth,
        height: wndH,
        y: document.documentElement.scrollTop
      };
    } // Jarallax functions


    initImg() {
      const self = this; // find image element

      let $imgElement = self.options.imgElement;

      if ($imgElement && typeof $imgElement === 'string') {
        $imgElement = self.$item.querySelector($imgElement);
      } // check if dom element


      if (!($imgElement instanceof Element)) {
        if (self.options.imgSrc) {
          $imgElement = new Image();
          $imgElement.src = self.options.imgSrc;
        } else {
          $imgElement = null;
        }
      }

      if ($imgElement) {
        if (self.options.keepImg) {
          self.image.$item = $imgElement.cloneNode(true);
        } else {
          self.image.$item = $imgElement;
          self.image.$itemParent = $imgElement.parentNode;
        }

        self.image.useImgTag = true;
      } // true if there is img tag


      if (self.image.$item) {
        return true;
      } // get image src


      if (self.image.src === null) {
        self.image.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        self.image.bgImage = self.css(self.$item, 'background-image');
      }

      return !(!self.image.bgImage || self.image.bgImage === 'none');
    }

    canInitParallax() {
      return !this.options.disableParallax();
    }

    init() {
      const self = this;
      const containerStyles = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      };
      let imageStyles = {
        pointerEvents: 'none',
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden',
        willChange: 'transform,opacity'
      };

      if (!self.options.keepImg) {
        // save default user styles
        const curStyle = self.$item.getAttribute('style');

        if (curStyle) {
          self.$item.setAttribute('data-jarallax-original-styles', curStyle);
        }

        if (self.image.useImgTag) {
          const curImgStyle = self.image.$item.getAttribute('style');

          if (curImgStyle) {
            self.image.$item.setAttribute('data-jarallax-original-styles', curImgStyle);
          }
        }
      } // set relative position and z-index to the parent


      if (self.css(self.$item, 'position') === 'static') {
        self.css(self.$item, {
          position: 'relative'
        });
      }

      if (self.css(self.$item, 'z-index') === 'auto') {
        self.css(self.$item, {
          zIndex: 0
        });
      } // container for parallax image


      self.image.$container = document.createElement('div');
      self.css(self.image.$container, containerStyles);
      self.css(self.image.$container, {
        'z-index': self.options.zIndex
      }); // it will remove some image overlapping
      // overlapping occur due to an image position fixed inside absolute position element
      // needed only when background in fixed position

      if (this.image.position === 'fixed') {
        self.css(self.image.$container, {
          '-webkit-clip-path': 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
          'clip-path': 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
        });
      }

      self.image.$container.setAttribute('id', `jarallax-container-${self.instanceID}`);
      self.$item.appendChild(self.image.$container); // use img tag

      if (self.image.useImgTag) {
        imageStyles = self.extend({
          'object-fit': self.options.imgSize,
          'object-position': self.options.imgPosition,
          'max-width': 'none'
        }, containerStyles, imageStyles); // use div with background image
      } else {
        self.image.$item = document.createElement('div');

        if (self.image.src) {
          imageStyles = self.extend({
            'background-position': self.options.imgPosition,
            'background-size': self.options.imgSize,
            'background-repeat': self.options.imgRepeat,
            'background-image': self.image.bgImage || `url("${self.image.src}")`
          }, containerStyles, imageStyles);
        }
      }

      if (self.options.type === 'opacity' || self.options.type === 'scale' || self.options.type === 'scale-opacity' || self.options.speed === 1) {
        self.image.position = 'absolute';
      } // 1. Check if one of parents have transform style (without this check, scroll transform will be inverted if used parallax with position fixed)
      //    discussion - https://github.com/nk-o/jarallax/issues/9
      // 2. Check if parents have overflow scroll


      if (self.image.position === 'fixed') {
        const $parents = getParents(self.$item).filter(el => {
          const styles = global$1.getComputedStyle(el);
          const parentTransform = styles['-webkit-transform'] || styles['-moz-transform'] || styles.transform;
          const overflowRegex = /(auto|scroll)/;
          return parentTransform && parentTransform !== 'none' || overflowRegex.test(styles.overflow + styles['overflow-y'] + styles['overflow-x']);
        });
        self.image.position = $parents.length ? 'absolute' : 'fixed';
      } // add position to parallax block


      imageStyles.position = self.image.position; // insert parallax image

      self.css(self.image.$item, imageStyles);
      self.image.$container.appendChild(self.image.$item); // set initial position and size

      self.onResize();
      self.onScroll(true); // call onInit event

      if (self.options.onInit) {
        self.options.onInit.call(self);
      } // remove default user background


      if (self.css(self.$item, 'background-image') !== 'none') {
        self.css(self.$item, {
          'background-image': 'none'
        });
      }

      self.addToParallaxList();
    } // add to parallax instances list


    addToParallaxList() {
      jarallaxList.push({
        instance: this
      });

      if (jarallaxList.length === 1) {
        global$1.requestAnimationFrame(updateParallax);
      }
    } // remove from parallax instances list


    removeFromParallaxList() {
      const self = this;
      jarallaxList.forEach((data, key) => {
        if (data.instance.instanceID === self.instanceID) {
          jarallaxList.splice(key, 1);
        }
      });
    }

    destroy() {
      const self = this;
      self.removeFromParallaxList(); // return styles on container as before jarallax init

      const originalStylesTag = self.$item.getAttribute('data-jarallax-original-styles');
      self.$item.removeAttribute('data-jarallax-original-styles'); // null occurs if there is no style tag before jarallax init

      if (!originalStylesTag) {
        self.$item.removeAttribute('style');
      } else {
        self.$item.setAttribute('style', originalStylesTag);
      }

      if (self.image.useImgTag) {
        // return styles on img tag as before jarallax init
        const originalStylesImgTag = self.image.$item.getAttribute('data-jarallax-original-styles');
        self.image.$item.removeAttribute('data-jarallax-original-styles'); // null occurs if there is no style tag before jarallax init

        if (!originalStylesImgTag) {
          self.image.$item.removeAttribute('style');
        } else {
          self.image.$item.setAttribute('style', originalStylesTag);
        } // move img tag to its default position


        if (self.image.$itemParent) {
          self.image.$itemParent.appendChild(self.image.$item);
        }
      } // remove additional dom elements


      if (self.image.$container) {
        self.image.$container.parentNode.removeChild(self.image.$container);
      } // call onDestroy event


      if (self.options.onDestroy) {
        self.options.onDestroy.call(self);
      } // delete jarallax from item


      delete self.$item.jarallax;
    } // Fallback for removed function.
    // Does nothing now.
    // eslint-disable-next-line class-methods-use-this


    clipContainer() {}

    coverImage() {
      const self = this;
      const rect = self.image.$container.getBoundingClientRect();
      const contH = rect.height;
      const {
        speed
      } = self.options;
      const isScroll = self.options.type === 'scroll' || self.options.type === 'scroll-opacity';
      let scrollDist = 0;
      let resultH = contH;
      let resultMT = 0; // scroll parallax

      if (isScroll) {
        // scroll distance and height for image
        if (speed < 0) {
          scrollDist = speed * Math.max(contH, wndH);

          if (wndH < contH) {
            scrollDist -= speed * (contH - wndH);
          }
        } else {
          scrollDist = speed * (contH + wndH);
        } // size for scroll parallax


        if (speed > 1) {
          resultH = Math.abs(scrollDist - wndH);
        } else if (speed < 0) {
          resultH = scrollDist / speed + Math.abs(scrollDist);
        } else {
          resultH += (wndH - contH) * (1 - speed);
        }

        scrollDist /= 2;
      } // store scroll distance


      self.parallaxScrollDistance = scrollDist; // vertical center

      if (isScroll) {
        resultMT = (wndH - resultH) / 2;
      } else {
        resultMT = (contH - resultH) / 2;
      } // apply result to item


      self.css(self.image.$item, {
        height: `${resultH}px`,
        marginTop: `${resultMT}px`,
        left: self.image.position === 'fixed' ? `${rect.left}px` : '0',
        width: `${rect.width}px`
      }); // call onCoverImage event

      if (self.options.onCoverImage) {
        self.options.onCoverImage.call(self);
      } // return some useful data. Used in the video cover function


      return {
        image: {
          height: resultH,
          marginTop: resultMT
        },
        container: rect
      };
    }

    isVisible() {
      return this.isElementInViewport || false;
    }

    onScroll(force) {
      const self = this;
      const rect = self.$item.getBoundingClientRect();
      const contT = rect.top;
      const contH = rect.height;
      const styles = {}; // check if in viewport

      let viewportRect = rect;

      if (self.options.elementInViewport) {
        viewportRect = self.options.elementInViewport.getBoundingClientRect();
      }

      self.isElementInViewport = viewportRect.bottom >= 0 && viewportRect.right >= 0 && viewportRect.top <= wndH && viewportRect.left <= global$1.innerWidth; // stop calculations if item is not in viewport

      if (force ? false : !self.isElementInViewport) {
        return;
      } // calculate parallax helping variables


      const beforeTop = Math.max(0, contT);
      const beforeTopEnd = Math.max(0, contH + contT);
      const afterTop = Math.max(0, -contT);
      const beforeBottom = Math.max(0, contT + contH - wndH);
      const beforeBottomEnd = Math.max(0, contH - (contT + contH - wndH));
      const afterBottom = Math.max(0, -contT + wndH - contH);
      const fromViewportCenter = 1 - 2 * ((wndH - contT) / (wndH + contH)); // calculate on how percent of section is visible

      let visiblePercent = 1;

      if (contH < wndH) {
        visiblePercent = 1 - (afterTop || beforeBottom) / contH;
      } else if (beforeTopEnd <= wndH) {
        visiblePercent = beforeTopEnd / wndH;
      } else if (beforeBottomEnd <= wndH) {
        visiblePercent = beforeBottomEnd / wndH;
      } // opacity


      if (self.options.type === 'opacity' || self.options.type === 'scale-opacity' || self.options.type === 'scroll-opacity') {
        styles.transform = 'translate3d(0,0,0)';
        styles.opacity = visiblePercent;
      } // scale


      if (self.options.type === 'scale' || self.options.type === 'scale-opacity') {
        let scale = 1;

        if (self.options.speed < 0) {
          scale -= self.options.speed * visiblePercent;
        } else {
          scale += self.options.speed * (1 - visiblePercent);
        }

        styles.transform = `scale(${scale}) translate3d(0,0,0)`;
      } // scroll


      if (self.options.type === 'scroll' || self.options.type === 'scroll-opacity') {
        let positionY = self.parallaxScrollDistance * fromViewportCenter; // fix if parallax block in absolute position

        if (self.image.position === 'absolute') {
          positionY -= contT;
        }

        styles.transform = `translate3d(0,${positionY}px,0)`;
      }

      self.css(self.image.$item, styles); // call onScroll event

      if (self.options.onScroll) {
        self.options.onScroll.call(self, {
          section: rect,
          beforeTop,
          beforeTopEnd,
          afterTop,
          beforeBottom,
          beforeBottomEnd,
          afterBottom,
          visiblePercent,
          fromViewportCenter
        });
      }
    }

    onResize() {
      this.coverImage();
    }

  } // global definition


  const jarallax = function (items, options, ...args) {
    // check for dom element
    // thanks: http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
    if (typeof HTMLElement === 'object' ? items instanceof HTMLElement : items && typeof items === 'object' && items !== null && items.nodeType === 1 && typeof items.nodeName === 'string') {
      items = [items];
    }

    const len = items.length;
    let k = 0;
    let ret;

    for (k; k < len; k += 1) {
      if (typeof options === 'object' || typeof options === 'undefined') {
        if (!items[k].jarallax) {
          items[k].jarallax = new Jarallax(items[k], options);
        }
      } else if (items[k].jarallax) {
        // eslint-disable-next-line prefer-spread
        ret = items[k].jarallax[options].apply(items[k].jarallax, args);
      }

      if (typeof ret !== 'undefined') {
        return ret;
      }
    }

    return items;
  };

  jarallax.constructor = Jarallax;

  const $ = global$1.jQuery; // jQuery support

  if (typeof $ !== 'undefined') {
    const $Plugin = function (...args) {
      Array.prototype.unshift.call(args, this);
      const res = jarallax.apply(global$1, args);
      return typeof res !== 'object' ? res : this;
    };

    $Plugin.constructor = jarallax.constructor; // no conflict

    const old$Plugin = $.fn.jarallax;
    $.fn.jarallax = $Plugin;

    $.fn.jarallax.noConflict = function () {
      $.fn.jarallax = old$Plugin;
      return this;
    };
  } // data-jarallax initialization


  ready(() => {
    jarallax(document.querySelectorAll('[data-jarallax]'));
  });

  return jarallax;

}));
//# sourceMappingURL=jarallax.js.map

jQuery(document).ready(function () {
    // Init
    new IndexSearchAutoComplete();
});
function IndexSearchAutoComplete() {
    var debounceTimeout = null; // Used to reduce the amount of queries
    var lastSearchQuery = ''; // Used to reduce the amount of queries

    // Check whether there is an input box to apply the autocomplete to
    if (jQuery('input.search, input.tx-indexedsearch-searchbox-sword, input.indexed-search-atocomplete-sword, input.indexed-search-autocomplete-sword').length == 0)
        return;

    // Initialise the autocomplete
    var that = this;
    jQuery('input.search, input.tx-indexedsearch-searchbox-sword, input.indexed-search-atocomplete-sword, input.indexed-search-autocomplete-sword')
        .on('keypress keyup', function (e) {
            that.autocomplete(e, this);
        }).attr('autocomplete', 'off');

    // When a click is performed somewhere on the page, remove the autocomplete-box
    jQuery(document).on("click", function (event) {
        var targetClass = '.search-autocomplete-results';

        if (!jQuery(event.target).hasClass(targetClass)) {
            jQuery(targetClass).html('').hide().removeClass('results').addClass('no-results');
        }
    });
}

/**
 * Autocomplete a query
 *
 * @param e jQuery-Event which gets fired in case of a keypress
 */
IndexSearchAutoComplete.prototype.autocomplete = function(e, ref) {
    var $input = jQuery(ref);
    var $elem = jQuery(ref);
    var $results;

    // Find the corresponding div for the results
    var cnt = 0;
    while ($elem.prop("tagName") !== 'HTML') {
        $results = $elem.find('.search-autocomplete-results');
        if ($results.length > 0) {
            break;
        }
        $elem = $elem.parent();
    }
    if ($elem.prop("tagName") === 'HTML') {
        console.log("we couldn't find a result div (.search-autocomplete-results)");
        return;
    }

    // Retrieve options
    var mode = typeof $results.data('mode') === 'undefined' ? 'word' : $results.data('mode');
    var soc = $results.data('searchonclick') == true;

    // navigate through the suggestions/results
    if (e.which === 38 || e.which === 40 || e.keyCode === 10 || e.keyCode === 13) { // up / down / enter

        if (e.which === 38 && e.type === 'keyup') { // up
            var $prev = $results.find('li.highlighted').prev();

            if ($results.find('li.highlighted').length === 0 || $prev.length === 0) {
                $results.find('li.highlighted').removeClass('highlighted');
                $results.find('li').last().addClass('highlighted');
                return;
            }

            $results.find('li.highlighted').removeClass('highlighted');
            $prev.addClass('highlighted');
        }

        if (e.which === 40 && e.type === 'keyup') { // down
            var $next = $results.find('li.highlighted').next();
            if ($results.find('li.highlighted').length === 0 || $next.length === 0) {
                $results.find('li.highlighted').removeClass('highlighted');
                $results.find('li').first().addClass('highlighted');
                return;
            }

            $results.find('li.highlighted').removeClass('highlighted');
            $next.addClass('highlighted');
        }

        if ((e.keyCode === 10 || e.keyCode === 13) && e.type === 'keypress') { // enter
            if ($results.is(':visible') && $results.find('li.highlighted').length > 0) {
                if (mode === 'word') {
                    $results.find('li.highlighted').click();

                    // Search on click
                    if (soc) {
                        $input.closest('form').submit();
                    }
                } else {
                    window.location = $results.find('li.highlighted a.navigate-on-enter').attr('href');
                }
                e.preventDefault();
            }
        }

        return;
    }

    // Catch left / right arrow keys
    if (e.keyCode === 37 || e.keyCode === 39)
        return;

    // Do only start a query if a key is released to save querys
    if (e.type !== 'keyup')
        return;

    // Empty the results
    $results.html('').hide().removeClass('results').addClass('no-results');

    // Retrieve the query
    var val = jQuery(ref).val().trim();
    var minlen = typeof $results.data('minlength') === 'undefined' ? 3 : $results.data('minlength');
    var maxResults = typeof $results.data('maxresults') === 'undefined' ? 10 : $results.data('maxresults');

    // Check if the query is long enough
    if (val.length < minlen)
        return;

    // Check whether the search term changed
    if (val == this.lastSearchQuery)
        return;

    // Set the old query value
    this.lastSearchQuery = val;

    // tell the user the search is running
    $results.addClass('autocomplete_searching');

    // Perform the query
    this.performQuery(val, mode, maxResults, $results, $input);
}


IndexSearchAutoComplete.prototype.performQuery = function(val, mode, maxResults, $results, $input) {
    var soc = $results.data('searchonclick') === true;
    // Debounce
    clearTimeout(this.debounceTimeout);
    this.debounceTimeout = setTimeout(function() {
        clearTimeout(this.debounceTimeout);

        // Execute the query
        jQuery.ajax({
            url: $results.data('searchurl'),
            cache: false,
            method: 'POST',
            data: {
                s: val,
                m: mode,
                mr: maxResults
            },
            success: function (data) {

                // Insert the results
                $li = $results
                    .show()
                    .html(data)
                    .removeClass('autocomplete_searching')
                    .find('li');

                // Add a click action
                $li.click(function () {
                    if (mode === 'word') {
                        $input.val(jQuery(this).text().trim());
                        $results.html('').hide();

                        if (soc) {
                            $input.closest('form').submit();
                        }
                    } else {
                        window.location = $li.find('a.navigate-on-enter').attr('href');
                    }
                });

                // Check if there are results and update the FE depending on it
                if ($li.length == 0) {

                    // No results
                    $results.html('').hide();
                    $results.removeClass('results').addClass('no-results');
                } else {

                    // Results
                    $results.removeClass('no-results').addClass('results');
                }
            }
        });
    }, 250);
}

$('document').ready(function(){
    checkPopupVisibilities();
});

$('.alert-box .btn-link').click(function () {
    $(this).closest(".alert-closable").toggleClass("minimized");
});


function closeWabsPopup(uid) {
    if(getCookie('wabs_popup')) {
        // load value from cookie
        let cookie_object = JSON.parse(getCookie('wabs_popup'));
        // check if id is in cookie_object, if not -> append it to array
        let uid_array = cookie_object.closed;
        // append uid to cookie
        if (!cookie_object.closed.includes(uid)) {
            uid_array.push(uid);
            document.cookie = 'wabs_popup={"closed":'+JSON.stringify(uid_array)+'}; SameSite=None; Secure';
        }
    }
    else {
        // cookie was_popup is not available yet
        let uid_array = [];
        uid_array.push(uid);
        document.cookie = 'wabs_popup={"closed":'+JSON.stringify(uid_array)+'}; SameSite=None; Secure';
    }
    //hide the popup
    // $('#'+uid).find('.tx-wabsolute-popup:first').hide();
    $('#'+uid).next('.alert-closable').addClass("hidden");
}


function checkPopupVisibilities() {
    if(getCookie('wabs_popup')) {
        // load value from cookie
        let cookie_object = JSON.parse(getCookie('wabs_popup'));
        // loop through every item in DOM with class "tx-wabsolute-popup"
        $( ".tx-wabsolute-popup" ).each(function( index ) {
            // hide all wabs_popups by default
            $(this).children().addClass("hidden");
            // get the parent id
            let parent_id = $(this).closest('div .frame').attr('id');
            // get the according "data-sessiondriven" value
            let sessiondriven = $(this).attr("data-sessiondriven");
            // check if parent_id is in cookie_object
            if(cookie_object.closed.includes(parent_id)) {
                //check if wabs_popup is sessiondriven -> always open
                if(sessiondriven==0) {
                    $(this).children().removeClass("hidden");
                }
                else {
                    // keep wabs_popup closed
                }
            }
            else {
                // popup has not been closed yet => show it
                $(this).children().removeClass("hidden");
            }
            });
     }
     else {
        // no cookie -> no popup has been closed -> show all popups
        $( ".tx-wabsolute-popup" ).each(function( index ) {
            $(this).children().removeClass("hidden");
        });
     }

}



// ##############################

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

