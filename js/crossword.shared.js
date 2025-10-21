/**
 * Shared functions (desktop and mobile)
 * Namespace: CrosswordShared
 */
window.CrosswordShared = {
  getCrosswordParams() {
    const url = new URL(window.location.href);
    const puzzle = url.searchParams.get("puzzle") || url.searchParams.get("file");
    const b64config = url.searchParams.get("config");
    const params = {};
    const lzpuz = window.location.hash.slice(1);

    if (puzzle) {
      params.puzzle_file = {
        url: puzzle,
        type: puzzle.slice(puzzle.lastIndexOf('.') + 1)
      };
    } else if (lzpuz) {
      try {
        console.log("[startup] Found lzpuz param — decompressing...");
        const xw = JSCrossword.deserialize(lzpuz);
        console.log("[startup] Loaded LZ puzzle:", xw.metadata.title, "by", xw.metadata.author);
        params.puzzle_object = xw;
      } catch (err) {
        console.error("[startup] Failed to load lzpuz:", err);
      }
    }

    if (b64config) {
      try {
        Object.assign(params, JSON.parse(atob(b64config)));
      } catch (e) {
        console.warn("Invalid config:", e);
      }
    }

    return params;
  },

  isMobileDevice() {
    const ua = navigator.userAgent || '';
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 1;
    const isiPad = ua.includes("iPad") || (ua.includes("Mac") && navigator.maxTouchPoints > 1);
    const isMobileUA = /android|iphone|ipod|mobile/i.test(ua);
    return isTouch && (isMobileUA || isiPad);
  }
};

/** Functions to help with colors **/
window.Color = {

  // "Simple" to adjust a color
  rgbToHsv([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h *= 60;
    }
    const s = max === 0 ? 0 : d / max;
    const v = max;
    return [h, s, v];
  },

  hsvToRgb([h, s, v]) {
    h = ((h % 360) + 360) % 360;
    const c = v * s;
    const x = c * (1 - Math.abs(((h/60)%2) - 1));
    const m = v - c;
    let rp=0,gp=0,bp=0;
    if (0<=h && h<60){rp=c;gp=x;bp=0;}
    else if (60<=h && h<120){rp=x;gp=c;bp=0;}
    else if (120<=h && h<180){rp=0;gp=c;bp=x;}
    else if (180<=h && h<240){rp=0;gp=x;bp=c;}
    else if (240<=h && h<300){rp=x;gp=0;bp=c;}
    else {rp=c;gp=0;bp=x;}
    return [
      Math.round((rp+m)*255),
      Math.round((gp+m)*255),
      Math.round((bp+m)*255)
    ];
  },

  applyHsvTransform(rgbHex, {dh, ks, kv}) {
    let rgb = this.hexToRgb(rgbHex);
    let [h,s,v] = this.rgbToHsv(rgb);
    h = h + dh;
    s = Math.min(1, Math.max(0, s*ks));
    v = Math.min(1, Math.max(0, v*kv));
    let outRgb = this.hsvToRgb([h,s,v]);
    return this.rgbToHex(outRgb[0], outRgb[1], outRgb[2]);
  },

  // hex string to RGB array and vice versa
  // thanks https://stackoverflow.com/a/39077686
  hexToRgb(hex) {
    return hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m, r, g, b) => '#' + r + r + g + g + b + b)
    .substring(1).match(/.{2}/g)
    .map(x => parseInt(x, 16));
  },

  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }).join('');
  },

  // perceived brightness of a color on a scale of 0-255
  getBrightness(hex) {
    const rgb = this.hexToRgb(hex);
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  },

  // Helper for a single component
  componentAvg(c1, c2, weight) {
    //return Math.floor(Math.sqrt(weight * c1**2 + (1 - weight) * c2**2));
    return Math.floor(weight * c1 + (1 - weight) * c2)
  },

  // helper to take the "average" of two RGB strings
  // thanks https://stackoverflow.com/a/29576746
  averageColors(c1, c2, weight = 0.5) {
    // if there's no c2, just return c1
    if (!c2) {
      return c1;
    }
    var r1 = this.hexToRgb(c1);
    var r2 = this.hexToRgb(c2);
    var newColor = [this.componentAvg(r1[0], r2[0], weight),
      this.componentAvg(r1[1], r2[1], weight),
      this.componentAvg(r1[2], r2[2], weight)
    ]
    return this.rgbToHex(newColor[0], newColor[1], newColor[2]);
  },

  adjustColor(color, amount) {
    if (!color) {
      return null;
    }
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
  }
};
