---
---
{% include js/Core/Kube.js %}
{% include js/Core/Kube.Plugin.js %}
{% include js/Core/Kube.Animation.js %}
{% include js/Sticky/Kube.Sticky.js %}
{% include js/Tabs/Kube.Tabs.js %}
{% include js/Toggleme/Kube.Toggleme.js %}

function changeSiteNavActive(newActive){
  $('#siteNav .active').removeClass('active');
  $("#siteNav [href='"+newActive+"']").parent().addClass('active');
}

$(function(){

  /*Add bottom border under nav when scrolled down*/
  $('#siteNav').on('fixed.sticky', function()
  {
    $('#siteNav').addClass("scrolled");
  });

  $('#siteNav').on('unfixed.sticky', function()
  {
    $('#siteNav').removeClass("scrolled");
  });

  $("#siteNav li").on("click",function(){
    if($("[data-target='#toggleNav']").toggleme('isOpened')){
      $("[data-target='#toggleNav']").toggleme('close');
    }
  });

  /*Smooth scroll all anchor links*/
  $("a[href*='#']").not("#livetabs ul li a").click(function(e) {
      e.preventDefault();
      var hash = this.hash;
      $('html, body').animate({
        scrollTop: $(hash).offset().top-$(siteNav).innerHeight()
      }, "slow", function(){
        window.location.hash = hash;
        changeSiteNavActive(hash);
      });
  });

  /*Change active nav on scroll*/
  $(window).on("scroll",function(){
    var scrollPos = $(document).scrollTop();
    $('#toggleNav a').each(function () {
      var currLink = $(this);
      var refElement = $(currLink.attr("href"));
      if(scrollPos+$(window).height() > $("#contact").position().top+$("#contact").height()){
        changeSiteNavActive("#contact");
      }
      else if (refElement.position().top <= scrollPos && refElement.position().top + refElement.height() > scrollPos) {
        changeSiteNavActive(currLink[0].hash);
      }
    });
  });

})
