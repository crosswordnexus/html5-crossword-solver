/**
* Open a puzzleme page from the first iframe on a page
**/
var iframes = document.getElementsByTagName("iframe");
for (var k in Object.keys(iframes)) {
  console.log(k);
  if (iframes[k].src.indexOf('amuselabs.com') !== -1) {
    /* make a link, go there, break */
    window.open(iframes[k].src, '_blank');
    break;
  }
}
