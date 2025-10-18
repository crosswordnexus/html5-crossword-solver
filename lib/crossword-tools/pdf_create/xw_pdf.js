/** Helper functions for splitting text with tags **/
// function to traverse DOM tree
function traverseTree(htmlDoc, agg=[]) {
    if (htmlDoc.nodeName == '#text') {
        // if we have a text element we can add it
        var thisTag = htmlDoc.parentNode.tagName;
        var is_bold = (thisTag == 'B');
        var is_italic = (thisTag == 'I');
        var textContent = htmlDoc.textContent;
        textContent.replace(/\s+/g, ' ');
        htmlDoc.textContent.split('').forEach(char => {
            agg.push({'char': char, 'is_bold': is_bold, 'is_italic': is_italic});
        });
    }
    for (var i=0; i<htmlDoc.childNodes.length; i++) {
        agg = traverseTree(htmlDoc.childNodes[i], agg=agg);
    }
    return agg;
}

/**
* Helper function for non-ascii characters
* https://github.com/mplatt/fold-to-ascii-js
* http://www.apache.org/licenses/LICENSE-2.0
**/
class ASCIIFolder{static foldReplacing(o="",e=""){return this._fold(o,()=>e)}static foldMaintaining(o=""){return this._fold(o,o=>o)}static _fold(o,e){if(null===o)return"";if("number"==typeof o)return""+o;if("string"!=typeof o)throw new Error("Invalid input data type");return o.split("").map(o=>{if(o.charCodeAt(0)<256)return o;{const a=this.mapping.get(o.charCodeAt(0));return void 0===a?e(o):a}}).join("")}}ASCIIFolder.mapping=new Map([[256,"A"],[258,"A"],[260,"A"],[399,"A"],[461,"A"],[478,"A"],[480,"A"],[506,"A"],[512,"A"],[514,"A"],[550,"A"],[570,"A"],[7424,"A"],[7680,"A"],[7840,"A"],[7842,"A"],[7844,"A"],[7846,"A"],[7848,"A"],[7850,"A"],[7852,"A"],[7854,"A"],[7856,"A"],[7858,"A"],[7860,"A"],[7862,"A"],[9398,"A"],[65313,"A"],[257,"a"],[259,"a"],[261,"a"],[462,"a"],[479,"a"],[481,"a"],[507,"a"],[513,"a"],[515,"a"],[551,"a"],[592,"a"],[601,"a"],[602,"a"],[7567,"a"],[7573,"a"],[7681,"a"],[7834,"a"],[7841,"a"],[7843,"a"],[7845,"a"],[7847,"a"],[7849,"a"],[7851,"a"],[7853,"a"],[7855,"a"],[7857,"a"],[7859,"a"],[7861,"a"],[7863,"a"],[8336,"a"],[8340,"a"],[9424,"a"],[11365,"a"],[11375,"a"],[65345,"a"],[42802,"AA"],[482,"AE"],[508,"AE"],[7425,"AE"],[42804,"AO"],[42806,"AU"],[42808,"AV"],[42810,"AV"],[42812,"AY"],[9372,"(a)"],[42803,"aa"],[483,"ae"],[509,"ae"],[7426,"ae"],[42805,"ao"],[42807,"au"],[42809,"av"],[42811,"av"],[42813,"ay"],[385,"B"],[386,"B"],[579,"B"],[665,"B"],[7427,"B"],[7682,"B"],[7684,"B"],[7686,"B"],[9399,"B"],[65314,"B"],[384,"b"],[387,"b"],[595,"b"],[7532,"b"],[7552,"b"],[7683,"b"],[7685,"b"],[7687,"b"],[9425,"b"],[65346,"b"],[9373,"(b)"],[262,"C"],[264,"C"],[266,"C"],[268,"C"],[391,"C"],[571,"C"],[663,"C"],[7428,"C"],[7688,"C"],[9400,"C"],[65315,"C"],[263,"c"],[265,"c"],[267,"c"],[269,"c"],[392,"c"],[572,"c"],[597,"c"],[7689,"c"],[8580,"c"],[9426,"c"],[42814,"c"],[42815,"c"],[65347,"c"],[9374,"(c)"],[270,"D"],[272,"D"],[393,"D"],[394,"D"],[395,"D"],[7429,"D"],[7430,"D"],[7690,"D"],[7692,"D"],[7694,"D"],[7696,"D"],[7698,"D"],[9401,"D"],[42873,"D"],[65316,"D"],[271,"d"],[273,"d"],[396,"d"],[545,"d"],[598,"d"],[599,"d"],[7533,"d"],[7553,"d"],[7569,"d"],[7691,"d"],[7693,"d"],[7695,"d"],[7697,"d"],[7699,"d"],[9427,"d"],[42874,"d"],[65348,"d"],[452,"DZ"],[497,"DZ"],[453,"Dz"],[498,"Dz"],[9375,"(d)"],[568,"db"],[454,"dz"],[499,"dz"],[675,"dz"],[677,"dz"],[274,"E"],[276,"E"],[278,"E"],[280,"E"],[282,"E"],[398,"E"],[400,"E"],[516,"E"],[518,"E"],[552,"E"],[582,"E"],[7431,"E"],[7700,"E"],[7702,"E"],[7704,"E"],[7706,"E"],[7708,"E"],[7864,"E"],[7866,"E"],[7868,"E"],[7870,"E"],[7872,"E"],[7874,"E"],[7876,"E"],[7878,"E"],[9402,"E"],[11387,"E"],[65317,"E"],[275,"e"],[277,"e"],[279,"e"],[281,"e"],[283,"e"],[477,"e"],[517,"e"],[519,"e"],[553,"e"],[583,"e"],[600,"e"],[603,"e"],[604,"e"],[605,"e"],[606,"e"],[666,"e"],[7432,"e"],[7570,"e"],[7571,"e"],[7572,"e"],[7701,"e"],[7703,"e"],[7705,"e"],[7707,"e"],[7709,"e"],[7865,"e"],[7867,"e"],[7869,"e"],[7871,"e"],[7873,"e"],[7875,"e"],[7877,"e"],[7879,"e"],[8337,"e"],[9428,"e"],[11384,"e"],[65349,"e"],[9376,"(e)"],[401,"F"],[7710,"F"],[9403,"F"],[42800,"F"],[42875,"F"],[43003,"F"],[65318,"F"],[402,"f"],[7534,"f"],[7554,"f"],[7711,"f"],[7835,"f"],[9429,"f"],[42876,"f"],[65350,"f"],[9377,"(f)"],[64256,"ff"],[64259,"ffi"],[64260,"ffl"],[64257,"fi"],[64258,"fl"],[284,"G"],[286,"G"],[288,"G"],[290,"G"],[403,"G"],[484,"G"],[485,"G"],[486,"G"],[487,"G"],[500,"G"],[610,"G"],[667,"G"],[7712,"G"],[9404,"G"],[42877,"G"],[42878,"G"],[65319,"G"],[285,"g"],[287,"g"],[289,"g"],[291,"g"],[501,"g"],[608,"g"],[609,"g"],[7543,"g"],[7545,"g"],[7555,"g"],[7713,"g"],[9430,"g"],[42879,"g"],[65351,"g"],[9378,"(g)"],[292,"H"],[294,"H"],[542,"H"],[668,"H"],[7714,"H"],[7716,"H"],[7718,"H"],[7720,"H"],[7722,"H"],[9405,"H"],[11367,"H"],[11381,"H"],[65320,"H"],[293,"h"],[295,"h"],[543,"h"],[613,"h"],[614,"h"],[686,"h"],[687,"h"],[7715,"h"],[7717,"h"],[7719,"h"],[7721,"h"],[7723,"h"],[7830,"h"],[9431,"h"],[11368,"h"],[11382,"h"],[65352,"h"],[502,"HV"],[9379,"(h)"],[405,"hv"],[296,"I"],[298,"I"],[300,"I"],[302,"I"],[304,"I"],[406,"I"],[407,"I"],[463,"I"],[520,"I"],[522,"I"],[618,"I"],[7547,"I"],[7724,"I"],[7726,"I"],[7880,"I"],[7882,"I"],[9406,"I"],[43006,"I"],[65321,"I"],[297,"i"],[299,"i"],[301,"i"],[303,"i"],[305,"i"],[464,"i"],[521,"i"],[523,"i"],[616,"i"],[7433,"i"],[7522,"i"],[7548,"i"],[7574,"i"],[7725,"i"],[7727,"i"],[7881,"i"],[7883,"i"],[8305,"i"],[9432,"i"],[65353,"i"],[306,"IJ"],[9380,"(i)"],[307,"ij"],[308,"J"],[584,"J"],[7434,"J"],[9407,"J"],[65322,"J"],[309,"j"],[496,"j"],[567,"j"],[585,"j"],[607,"j"],[644,"j"],[669,"j"],[9433,"j"],[11388,"j"],[65354,"j"],[9381,"(j)"],[310,"K"],[408,"K"],[488,"K"],[7435,"K"],[7728,"K"],[7730,"K"],[7732,"K"],[9408,"K"],[11369,"K"],[42816,"K"],[42818,"K"],[42820,"K"],[65323,"K"],[311,"k"],[409,"k"],[489,"k"],[670,"k"],[7556,"k"],[7729,"k"],[7731,"k"],[7733,"k"],[9434,"k"],[11370,"k"],[42817,"k"],[42819,"k"],[42821,"k"],[65355,"k"],[9382,"(k)"],[313,"L"],[315,"L"],[317,"L"],[319,"L"],[321,"L"],[573,"L"],[671,"L"],[7436,"L"],[7734,"L"],[7736,"L"],[7738,"L"],[7740,"L"],[9409,"L"],[11360,"L"],[11362,"L"],[42822,"L"],[42824,"L"],[42880,"L"],[65324,"L"],[314,"l"],[316,"l"],[318,"l"],[320,"l"],[322,"l"],[410,"l"],[564,"l"],[619,"l"],[620,"l"],[621,"l"],[7557,"l"],[7735,"l"],[7737,"l"],[7739,"l"],[7741,"l"],[9435,"l"],[11361,"l"],[42823,"l"],[42825,"l"],[42881,"l"],[65356,"l"],[455,"LJ"],[7930,"LL"],[456,"Lj"],[9383,"(l)"],[457,"lj"],[7931,"ll"],[682,"ls"],[683,"lz"],[412,"M"],[7437,"M"],[7742,"M"],[7744,"M"],[7746,"M"],[9410,"M"],[11374,"M"],[43005,"M"],[43007,"M"],[65325,"M"],[623,"m"],[624,"m"],[625,"m"],[7535,"m"],[7558,"m"],[7743,"m"],[7745,"m"],[7747,"m"],[9436,"m"],[65357,"m"],[9384,"(m)"],[323,"N"],[325,"N"],[327,"N"],[330,"N"],[413,"N"],[504,"N"],[544,"N"],[628,"N"],[7438,"N"],[7748,"N"],[7750,"N"],[7752,"N"],[7754,"N"],[9411,"N"],[65326,"N"],[324,"n"],[326,"n"],[328,"n"],[329,"n"],[331,"n"],[414,"n"],[505,"n"],[565,"n"],[626,"n"],[627,"n"],[7536,"n"],[7559,"n"],[7749,"n"],[7751,"n"],[7753,"n"],[7755,"n"],[8319,"n"],[9437,"n"],[65358,"n"],[458,"NJ"],[459,"Nj"],[9385,"(n)"],[460,"nj"],[332,"O"],[334,"O"],[336,"O"],[390,"O"],[415,"O"],[416,"O"],[465,"O"],[490,"O"],[492,"O"],[510,"O"],[524,"O"],[526,"O"],[554,"O"],[556,"O"],[558,"O"],[560,"O"],[7439,"O"],[7440,"O"],[7756,"O"],[7758,"O"],[7760,"O"],[7762,"O"],[7884,"O"],[7886,"O"],[7888,"O"],[7890,"O"],[7892,"O"],[7894,"O"],[7896,"O"],[7898,"O"],[7900,"O"],[7902,"O"],[7904,"O"],[7906,"O"],[9412,"O"],[42826,"O"],[42828,"O"],[65327,"O"],[333,"o"],[335,"o"],[337,"o"],[417,"o"],[466,"o"],[491,"o"],[493,"o"],[511,"o"],[525,"o"],[527,"o"],[555,"o"],[557,"o"],[559,"o"],[561,"o"],[596,"o"],[629,"o"],[7446,"o"],[7447,"o"],[7575,"o"],[7757,"o"],[7759,"o"],[7761,"o"],[7763,"o"],[7885,"o"],[7887,"o"],[7889,"o"],[7891,"o"],[7893,"o"],[7895,"o"],[7897,"o"],[7899,"o"],[7901,"o"],[7903,"o"],[7905,"o"],[7907,"o"],[8338,"o"],[9438,"o"],[11386,"o"],[42827,"o"],[42829,"o"],[65359,"o"],[338,"OE"],[630,"OE"],[42830,"OO"],[546,"OU"],[7445,"OU"],[9386,"(o)"],[339,"oe"],[7444,"oe"],[42831,"oo"],[547,"ou"],[420,"P"],[7448,"P"],[7764,"P"],[7766,"P"],[9413,"P"],[11363,"P"],[42832,"P"],[42834,"P"],[42836,"P"],[65328,"P"],[421,"p"],[7537,"p"],[7549,"p"],[7560,"p"],[7765,"p"],[7767,"p"],[9439,"p"],[42833,"p"],[42835,"p"],[42837,"p"],[43004,"p"],[65360,"p"],[9387,"(p)"],[586,"Q"],[9414,"Q"],[42838,"Q"],[42840,"Q"],[65329,"Q"],[312,"q"],[587,"q"],[672,"q"],[9440,"q"],[42839,"q"],[42841,"q"],[65361,"q"],[9388,"(q)"],[569,"qp"],[340,"R"],[342,"R"],[344,"R"],[528,"R"],[530,"R"],[588,"R"],[640,"R"],[641,"R"],[7449,"R"],[7450,"R"],[7768,"R"],[7770,"R"],[7772,"R"],[7774,"R"],[9415,"R"],[11364,"R"],[42842,"R"],[42882,"R"],[65330,"R"],[341,"r"],[343,"r"],[345,"r"],[529,"r"],[531,"r"],[589,"r"],[636,"r"],[637,"r"],[638,"r"],[639,"r"],[7523,"r"],[7538,"r"],[7539,"r"],[7561,"r"],[7769,"r"],[7771,"r"],[7773,"r"],[7775,"r"],[9441,"r"],[42843,"r"],[42883,"r"],[65362,"r"],[9389,"(r)"],[346,"S"],[348,"S"],[350,"S"],[352,"S"],[536,"S"],[7776,"S"],[7778,"S"],[7780,"S"],[7782,"S"],[7784,"S"],[9416,"S"],[42801,"S"],[42885,"S"],[65331,"S"],[347,"s"],[349,"s"],[351,"s"],[353,"s"],[383,"s"],[537,"s"],[575,"s"],[642,"s"],[7540,"s"],[7562,"s"],[7777,"s"],[7779,"s"],[7781,"s"],[7783,"s"],[7785,"s"],[7836,"s"],[7837,"s"],[9442,"s"],[42884,"s"],[65363,"s"],[7838,"SS"],[9390,"(s)"],[64262,"st"],[354,"T"],[356,"T"],[358,"T"],[428,"T"],[430,"T"],[538,"T"],[574,"T"],[7451,"T"],[7786,"T"],[7788,"T"],[7790,"T"],[7792,"T"],[9417,"T"],[42886,"T"],[65332,"T"],[355,"t"],[357,"t"],[359,"t"],[427,"t"],[429,"t"],[539,"t"],[566,"t"],[647,"t"],[648,"t"],[7541,"t"],[7787,"t"],[7789,"t"],[7791,"t"],[7793,"t"],[7831,"t"],[9443,"t"],[11366,"t"],[65364,"t"],[42854,"TH"],[42792,"TZ"],[9391,"(t)"],[680,"tc"],[7546,"th"],[42855,"th"],[678,"ts"],[42793,"tz"],[360,"U"],[362,"U"],[364,"U"],[366,"U"],[368,"U"],[370,"U"],[431,"U"],[467,"U"],[469,"U"],[471,"U"],[473,"U"],[475,"U"],[532,"U"],[534,"U"],[580,"U"],[7452,"U"],[7550,"U"],[7794,"U"],[7796,"U"],[7798,"U"],[7800,"U"],[7802,"U"],[7908,"U"],[7910,"U"],[7912,"U"],[7914,"U"],[7916,"U"],[7918,"U"],[7920,"U"],[9418,"U"],[65333,"U"],[361,"u"],[363,"u"],[365,"u"],[367,"u"],[369,"u"],[371,"u"],[432,"u"],[468,"u"],[470,"u"],[472,"u"],[474,"u"],[476,"u"],[533,"u"],[535,"u"],[649,"u"],[7524,"u"],[7577,"u"],[7795,"u"],[7797,"u"],[7799,"u"],[7801,"u"],[7803,"u"],[7909,"u"],[7911,"u"],[7913,"u"],[7915,"u"],[7917,"u"],[7919,"u"],[7921,"u"],[9444,"u"],[65365,"u"],[9392,"(u)"],[7531,"ue"],[434,"V"],[581,"V"],[7456,"V"],[7804,"V"],[7806,"V"],[7932,"V"],[9419,"V"],[42846,"V"],[42856,"V"],[65334,"V"],[651,"v"],[652,"v"],[7525,"v"],[7564,"v"],[7805,"v"],[7807,"v"],[9445,"v"],[11377,"v"],[11380,"v"],[42847,"v"],[65366,"v"],[42848,"VY"],[9393,"(v)"],[42849,"vy"],[372,"W"],[503,"W"],[7457,"W"],[7808,"W"],[7810,"W"],[7812,"W"],[7814,"W"],[7816,"W"],[9420,"W"],[11378,"W"],[65335,"W"],[373,"w"],[447,"w"],[653,"w"],[7809,"w"],[7811,"w"],[7813,"w"],[7815,"w"],[7817,"w"],[7832,"w"],[9446,"w"],[11379,"w"],[65367,"w"],[9394,"(w)"],[7818,"X"],[7820,"X"],[9421,"X"],[65336,"X"],[7565,"x"],[7819,"x"],[7821,"x"],[8339,"x"],[9447,"x"],[65368,"x"],[9395,"(x)"],[374,"Y"],[376,"Y"],[435,"Y"],[562,"Y"],[590,"Y"],[655,"Y"],[7822,"Y"],[7922,"Y"],[7924,"Y"],[7926,"Y"],[7928,"Y"],[7934,"Y"],[9422,"Y"],[65337,"Y"],[375,"y"],[436,"y"],[563,"y"],[591,"y"],[654,"y"],[7823,"y"],[7833,"y"],[7923,"y"],[7925,"y"],[7927,"y"],[7929,"y"],[7935,"y"],[9448,"y"],[65369,"y"],[9396,"(y)"],[377,"Z"],[379,"Z"],[381,"Z"],[437,"Z"],[540,"Z"],[548,"Z"],[7458,"Z"],[7824,"Z"],[7826,"Z"],[7828,"Z"],[9423,"Z"],[11371,"Z"],[42850,"Z"],[65338,"Z"],[378,"z"],[380,"z"],[382,"z"],[438,"z"],[541,"z"],[549,"z"],[576,"z"],[656,"z"],[657,"z"],[7542,"z"],[7566,"z"],[7825,"z"],[7827,"z"],[7829,"z"],[9449,"z"],[11372,"z"],[42851,"z"],[65370,"z"],[9397,"(z)"],[8304,"0"],[8320,"0"],[9450,"0"],[9471,"0"],[65296,"0"],[8321,"1"],[9312,"1"],[9461,"1"],[10102,"1"],[10112,"1"],[10122,"1"],[65297,"1"],[9352,"1."],[9332,"(1)"],[8322,"2"],[9313,"2"],[9462,"2"],[10103,"2"],[10113,"2"],[10123,"2"],[65298,"2"],[9353,"2."],[9333,"(2)"],[8323,"3"],[9314,"3"],[9463,"3"],[10104,"3"],[10114,"3"],[10124,"3"],[65299,"3"],[9354,"3."],[9334,"(3)"],[8308,"4"],[8324,"4"],[9315,"4"],[9464,"4"],[10105,"4"],[10115,"4"],[10125,"4"],[65300,"4"],[9355,"4."],[9335,"(4)"],[8309,"5"],[8325,"5"],[9316,"5"],[9465,"5"],[10106,"5"],[10116,"5"],[10126,"5"],[65301,"5"],[9356,"5."],[9336,"(5)"],[8310,"6"],[8326,"6"],[9317,"6"],[9466,"6"],[10107,"6"],[10117,"6"],[10127,"6"],[65302,"6"],[9357,"6."],[9337,"(6)"],[8311,"7"],[8327,"7"],[9318,"7"],[9467,"7"],[10108,"7"],[10118,"7"],[10128,"7"],[65303,"7"],[9358,"7."],[9338,"(7)"],[8312,"8"],[8328,"8"],[9319,"8"],[9468,"8"],[10109,"8"],[10119,"8"],[10129,"8"],[65304,"8"],[9359,"8."],[9339,"(8)"],[8313,"9"],[8329,"9"],[9320,"9"],[9469,"9"],[10110,"9"],[10120,"9"],[10130,"9"],[65305,"9"],[9360,"9."],[9340,"(9)"],[9321,"10"],[9470,"10"],[10111,"10"],[10121,"10"],[10131,"10"],[9361,"10."],[9341,"(10)"],[9322,"11"],[9451,"11"],[9362,"11."],[9342,"(11)"],[9323,"12"],[9452,"12"],[9363,"12."],[9343,"(12)"],[9324,"13"],[9453,"13"],[9364,"13."],[9344,"(13)"],[9325,"14"],[9454,"14"],[9365,"14."],[9345,"(14)"],[9326,"15"],[9455,"15"],[9366,"15."],[9346,"(15)"],[9327,"16"],[9456,"16"],[9367,"16."],[9347,"(16)"],[9328,"17"],[9457,"17"],[9368,"17."],[9348,"(17)"],[9329,"18"],[9458,"18"],[9369,"18."],[9349,"(18)"],[9330,"19"],[9459,"19"],[9370,"19."],[9350,"(19)"],[9331,"20"],[9460,"20"],[9371,"20."],[9351,"(20)"],[8220,'"'],[8221,'"'],[8222,'"'],[8243,'"'],[8246,'"'],[10077,'"'],[10078,'"'],[10094,'"'],[10095,'"'],[65282,'"'],[8216,"'"],[8217,"'"],[8218,"'"],[8219,"'"],[8242,"'"],[8245,"'"],[8249,"'"],[8250,"'"],[10075,"'"],[10076,"'"],[65287,"'"],[8208,"-"],[8209,"-"],[8210,"-"],[8211,"-"],[8212,"-"],[8315,"-"],[8331,"-"],[65293,"-"],[8261,"["],[10098,"["],[65339,"["],[8262,"]"],[10099,"]"],[65341,"]"],[8317,"("],[8333,"("],[10088,"("],[10090,"("],[65288,"("],[11816,"(("],[8318,")"],[8334,")"],[10089,")"],[10091,")"],[65289,")"],[11817,"))"],[10092,"<"],[10096,"<"],[65308,"<"],[10093,">"],[10097,">"],[65310,">"],[10100,"{"],[65371,"{"],[10101,"}"],[65373,"}"],[8314,"+"],[8330,"+"],[65291,"+"],[8316,"="],[8332,"="],[65309,"="],[65281,"!"],[8252,"!!"],[8265,"!?"],[65283,"#"],[65284,"$"],[8274,"%"],[65285,"%"],[65286,"&"],[8270,"*"],[65290,"*"],[65292,","],[65294,"."],[8260,"/"],[65295,"/"],[65306,":"],[8271,";"],[65307,";"],[65311,"?"],[8263,"??"],[8264,"?!"],[65312,"@"],[65340,"\\"],[8248,"^"],[65342,"^"],[65343,"_"],[8275,"~"],[65374,"~"]]);

// Print a line of text that may be bolded or italicized
const printCharacters = (doc, textObject, startY, startX, fontSize) => {
    if (!textObject.length) {
        return;
    }

    if (typeof(textObject) == 'string') {
        var myText = ASCIIFolder.foldReplacing(textObject, '*')
        doc.text(startX, startY, myText);
    }
    else {
        textObject.map(row => {
            if (row.is_bold) {
                doc.setFontType('bold');
            }
            else if (row.is_italic) {
                doc.setFontType('italic');
            }
            else {
                doc.setFontType('normal');
            }

            // Some characters don't render properly in PDFs
            // we replace them using the mapping above
            var mychar = row.char;
            mychar = ASCIIFolder.foldReplacing(mychar, '*');
            doc.text(mychar, startX, startY);
            startX = startX + doc.getStringUnitWidth(row.char) * fontSize;
            doc.setFontType('normal');
        });
    }
};

// helper function for bold and italic clues
function split_text_to_size_bi(clue, col_width, doc, has_header=false) {
    // replace multiple whitespaces with just one
    //clue = clue.replace('\n', ' ');
    //clue = clue.replace(/\s+/g, ' ');

    // get the clue with HTML stripped out
    var el = document.createElement( 'html' );
    el.innerHTML = clue;
    var clean_clue = el.innerText;

    // split the clue
    var lines1 = doc.splitTextToSize(clean_clue, col_width);

    // if there's no <B> or <I> in the clue just return lines1
    if (clue.toUpperCase().indexOf('<B') == -1 && clue.toUpperCase().indexOf('<I') == -1) {
        return lines1;
    }

    // Check if there's a "header"
    // if so, track the header, and separate out the clue
    var header_line = null;
    if (has_header) {
        var clue_split = clue.split('\n');
        header_line = clue_split[0];
        clue = clue_split.slice(1).join('\n');
        el.innerHTML = clue;
        clean_clue = el.innerText;
    }


    // parse the clue into a tree
    var myClueArr = [];
    var parser = new DOMParser();
    var htmlDoc = parser.parseFromString(clue, 'text/html');
    var split_clue = traverseTree(htmlDoc);

    // Make a new "lines1" with all bold splits
    doc.setFontType('bold');
    lines1 = doc.splitTextToSize(clean_clue, col_width);
    doc.setFontType('normal');

    // split this like we did the "lines1"
    var lines = [];
    var ctr = 0;
    // Characters to skip
    const SPLIT_CHARS = new Set([' ', '\t', '\n']);
    lines1.forEach(line => {
        var thisLine = [];
        var myLen = line.length;
        for (var i=0; i < myLen; i++) {
            thisLine.push(split_clue[ctr++]);
        }
        if (split_clue[ctr]) {
            if (SPLIT_CHARS.has(split_clue[ctr].char)) {
                ctr = ctr + 1;
            }
        }
        lines.push(thisLine);
    });
    if (has_header) {
        lines = [header_line].concat(lines);
    }
    return lines;
}

//

/* function to strip HTML tags */
/* via https://stackoverflow.com/a/5002618 */
function strip_html(s) {
    var div = document.createElement("div");
    div.innerHTML = s;
    var text = div.textContent || div.innerText || "";
    return text;
}

/** Draw a crossword grid (requires jsPDF) **/
function draw_crossword_grid(doc, xw, options)
{
    /*
    *  doc is a jsPDF instance
    * xw is a JSCrossword instance
    */

    // options are as below
    var DEFAULT_OPTIONS = {
        grid_letters : true
    ,   grid_numbers : true
    ,   x0: 20
    ,   y0: 20
    ,   cell_size: 24
    ,   gray : null
    ,   line_width: 0.7
    ,   bar_width: 2
    };

    for (var key in DEFAULT_OPTIONS) {
        if (!DEFAULT_OPTIONS.hasOwnProperty(key)) continue;
        if (!options.hasOwnProperty(key))
        {
            options[key] = DEFAULT_OPTIONS[key];
        }
    }

    var PTS_TO_IN = 72;
    var cell_size = options.cell_size;

    /** Function to draw a square **/
    function draw_square(doc,x1,y1,cell_size,number,letter,filled,cell, barsOnly=false) {

      if (!barsOnly) {
        // thank you https://stackoverflow.com/a/5624139
        function hexToRgb(hex) {
            hex = hex || '#FFFFFF';
            // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
            var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            hex = hex.replace(shorthandRegex, function(m, r, g, b) {
                return r + r + g + g + b + b;
            });


            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }

        var MIN_NUMBER_SIZE = 4;

        var filled_string = (filled ? 'F' : '');
        var number_offset = cell_size/20;
        var number_size = cell_size/3.5 < MIN_NUMBER_SIZE ? MIN_NUMBER_SIZE : cell_size/3.5;
        //var letter_size = cell_size/1.5;
        var letter_length = letter.length;
        var letter_size = cell_size/(1.5 + 0.5 * (letter_length - 1));
        var letter_pct_down = 4/5;

        // for "clue" cells we set the background and text color
        doc.setTextColor(0, 0, 0);
        if (cell.clue) {
          //doc.setTextColor(255, 255, 255);
          cell['background-color'] = '#CCCCCC';
        }

        if (cell['background-color']) {
            var filled_string = 'F';
            var rgb = hexToRgb(cell['background-color']);
            doc.setFillColor(rgb.r, rgb.g, rgb.b);
            doc.setDrawColor(options.gray.toString());
            // Draw one filled square and then one unfilled
            doc.rect(x1, y1, cell_size, cell_size, filled_string);
            doc.rect(x1, y1, cell_size, cell_size, '');
        }
        else {
            doc.setFillColor(options.gray.toString());
            doc.setDrawColor(options.gray.toString());
            // draw the bounding box for all squares -- even "clue" squares
            if (true) {
                doc.rect(x1, y1, cell_size, cell_size, '');
                doc.rect(x1, y1, cell_size, cell_size, filled_string);
            }
        }
        //numbers
        doc.setFontType('normal');
        doc.setFontSize(number_size);
        doc.text(x1+number_offset,y1+number_size,number);

        // top-right numbers
        var top_right_number = cell.top_right_number ? cell.top_right_number : '';
        doc.setFontSize(number_size);
        doc.text(x1 + cell_size - number_offset, y1 + number_size, top_right_number, null, null, 'right');

        // letters
        doc.setFontType('normal');
        doc.setFontSize(letter_size);
        doc.text(x1+cell_size/2,y1+cell_size * letter_pct_down,letter,null,null,'center');

        // circles
        if (cell['background-shape']) {
            doc.circle(x1+cell_size/2,y1+cell_size/2,cell_size/2);
        }
      }
      // bars
      cell.bar = {
        top: cell['top-bar']
      , left: cell['left-bar']
      , right: cell['right-bar']
      , bottom: cell['bottom-bar']
      };
      if (cell.bar) {
          var bar = cell.bar;
          var bar_start = {
              top: [x1, y1],
              left: [x1, y1],
              right: [x1 + cell_size, y1 + cell_size],
              bottom: [x1 + cell_size, y1 + cell_size]
          };
          var bar_end = {
              top: [x1 + cell_size, y1],
              left: [x1, y1 + cell_size],
              right: [x1 + cell_size, y1],
              bottom: [x1, y1 + cell_size]
          };
          for (var key in bar) {
              if (bar.hasOwnProperty(key)) {
                  if (bar[key]) {
                      //console.log(options.bar_width);
                      doc.setLineWidth(options.bar_width);
                      doc.line(bar_start[key][0], bar_start[key][1], bar_end[key][0], bar_end[key][1]);
                      doc.setLineWidth(options.line_width);
                  }
              }
          }
      }
      // Reset the text color, if necessary
      doc.setTextColor(0, 0, 0);
    } // end draw_square()

    var width = xw.metadata.width;
    var height = xw.metadata.height;
    xw.cells.forEach(function(c) {
        // don't draw a square if we have a void
        if (c.is_void || (c.type === 'block' && c['background-color'] === '#FFFFFF')) {
          return;
        }
        var x_pos = options.x0 + c.x * cell_size;
        var y_pos = options.y0 + c.y * cell_size;
        // letter
        var letter = c.solution || '';
        if (!options.grid_letters) {letter = '';}
        letter = letter || c.letter || '';
        var filled = c.type == 'block';
        // number
        var number = c['number'] || '';
        if (!options.grid_numbers) {number = '';}
        // circle
        var circle = c['background-shape'] == 'circle';
        // draw the square
        // for diagramless puzzles don't put anything but the square
        if (xw.metadata.crossword_type == 'diagramless') {
          number = ''; letter = ''; filled = false;
        }
        draw_square(doc,x_pos,y_pos,cell_size,number,letter,filled,c);
    });

    // Draw just the bars afterward
    // This is necessary because we may have overwritten bars earlier
    xw.cells.forEach(function(c) {
        var x_pos = options.x0 + c.x * cell_size;
        var y_pos = options.y0 + c.y * cell_size;
        draw_square(doc, x_pos ,y_pos, cell_size, '', '', false, c, true);
    });
}

/** Create a PDF (requires jsPDF) **/

function jscrossword_to_pdf(xw, options={}) {
    var DEFAULT_OPTIONS = {
        margin: 40
    ,   title_pt: null
    ,   copyright_pt: null
    ,   num_columns : null
    ,   num_full_columns: null
    ,   num_pages: 1
    ,   column_padding: 10
    ,   gray: null
    ,   under_title_spacing : 20
    ,   max_clue_pt : 14
    ,   min_clue_pt : 5
    ,   grid_padding : 5
    ,   outfile : null
    ,   vertical_separator : 10
    ,   show_notepad : false
    ,   line_width: 0.7
    ,   notepad_max_pt: 12
    ,   notepad_min_pt: 8
    ,   orientation: 'portrait'
    ,   header1: '', header2: '', header3: ''
    };

    for (var key in DEFAULT_OPTIONS) {
        if (!DEFAULT_OPTIONS.hasOwnProperty(key)) continue;
        if (!options.hasOwnProperty(key))
        {
            options[key] = DEFAULT_OPTIONS[key];
        }
    }

    // Sorry big titles but we need a max size here
    const MAX_TITLE_PT = 12;
    if (options.title_pt > MAX_TITLE_PT) {options.title_pt = MAX_TITLE_PT;}
    if (options.copyright_pt > MAX_TITLE_PT) {options.copyright_pt = MAX_TITLE_PT;}

    console.log(options);

    var PTS_PER_IN = 72;
    var DOC_WIDTH = 8.5 * PTS_PER_IN;
    var DOC_HEIGHT = 11 * PTS_PER_IN;
    // acrostics always get printed in landscape
    if (options.orientation == 'landscape' || xw.metadata.crossword_type == 'acrostic') {
      DOC_WIDTH = 11 * PTS_PER_IN;
      DOC_HEIGHT = 8.5 * PTS_PER_IN;
      options.orientation = 'landscape';
    } else {options.orientation = 'portrait';}


    var margin = options.margin;

    var xw_height = xw.metadata.height;
    var xw_width = xw.metadata.width;

    // If there's no filename, use the title
    if (!options.outfile) {
        var outname = xw.metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf';
        options.outfile = outname;
    }

    // variables used in for loops
    var i, j;

    // helper value for multiplying
    var show_notepad_int = options.show_notepad ? 1 : 0;

    // Reserve spot for the notepad
    var notepad_ypos = DOC_HEIGHT - margin - MAX_TITLE_PT - options.vertical_separator * 2;
    var notepad_xpos;

    // If options.gray is NULL, we determine it
    if (options.gray === null) {
      options.gray = 0.5; // default
      // If there are very few black squares, we can make darker
      var num_black_squares = xw.cells.map(x=>x.type).reduce(function(accum, cur) {return accum + (cur==='block' ? 1 : 0);}, 0);
      if (num_black_squares/(xw_height * xw_width) < 0.05) {
        options.gray = 0.1;
      }
    }

    console.log(options.gray);

    // If options.num_columns is null, we determine it ourselves
    if (options.num_columns === null || options.num_full_columns === null)
    {
        var word_count = xw.words.length;
        var clue_length = xw.clues.map(x=>x.clue).flat().map(x=>x.text).join('').length;
        //console.log(clue_length);

        // we handle acrostics separately
        if (xw.metadata.crossword_type == 'acrostic') {
          var cell_count = xw.cells.map(x=>x.solution).filter(Boolean).length;
          if (cell_count > 600 || clue_length > 1500) { // two pages
            options.num_pages = 2;
          // small acrostics are handled separately
          } else if (xw_height <= 15) {
            options.num_columns = 3;
            console.log(options.num_columns);
            options.num_full_columns = 0;
          } else {
            options.num_columns = 4;
            options.num_full_columns = 1;
          }
        }
        else if (xw_height > 2 * xw_width) {
            options.num_columns = 5;
            options.num_full_columns = 3;
        }
        // handle puzzles with very few words
        // max 5 columns
        else if (clue_length <= 1000) {
            options.num_columns = Math.min(Math.ceil(clue_length/350), 5);
            options.num_full_columns = 0;
        }
        else if (xw_height >= 17) {
            options.num_columns = 5;
            options.num_full_columns = 2;
        }
        else if (xw_width > 17) {
            options.num_columns = 4;
            options.num_full_columns = 1;
        }
        else if (clue_length >= 1600) {
            options.num_columns = 5;
            options.num_full_columns = 2;
        }
        else {
            options.num_columns = 3;
            options.num_full_columns = 1;
        }

        // special logic for two pages
        if (options.num_pages == 2) {
          var numCols = Math.min(Math.ceil(clue_length/800), 5);
          options.num_columns = numCols;
          options.num_full_columns = numCols;
        }
    }

    // The maximum font size of title and author
    var max_title_author_pt = MAX_TITLE_PT;

    var doc;

    // create the clue strings and clue arrays
    var clue_arrays = [];
    var num_arrays = [];
    for (j=0; j < xw.clues.length; j++) {
        var these_clues = [];
        var these_nums = [];
        for (i=0; i< xw.clues[j]['clue'].length; i++) {
            var e = xw.clues[j]['clue'][i];
            var num = e.number;
            var clue = e.text;
            // for acrostics, we don't print a clue without a "number"
            if (xw.metadata.crossword_type == 'acrostic' && !num) {
                continue;
            }

            //var this_clue_string = num + '. ' + clue;
            var this_clue_string = clue;
            if (i==0) {
                these_clues.push(xw.clues[j].title + '\n' + this_clue_string);
            }
            else {
                these_clues.push(this_clue_string);
            }
            these_nums.push(num);
        }
        // add a space between the clue lists, assuming we're not at the end
        if (j < xw.clues.length - 1) {
            these_clues.push('');
            these_nums.push('');
        }
        clue_arrays.push(these_clues);
        num_arrays.push(these_nums);
    }

    // size of columns
    var col_width = (DOC_WIDTH - 2 * margin - (options.num_columns -1 ) * options.column_padding) / options.num_columns;

    // The grid is under all but the first few columns
    var grid_width = DOC_WIDTH - 2 * margin - options.num_full_columns * (col_width + options.column_padding);
    var grid_height = (grid_width / xw_width) * xw_height;

    // We change the grid width and height if num_full_columns == 0
    // This is because we don't want it to take up too much space
    if (options.num_full_columns === 0 || options.num_pages == 2) {
        // set the height to be (about) half of the available area
        grid_height = DOC_HEIGHT * 4/9;
        if (options.num_pages == 2) {
          grid_height = DOC_HEIGHT - (2 * margin + 3 * MAX_TITLE_PT + 4 * options.vertical_separator + 3 * options.notepad_max_pt);
        }
        grid_width = (grid_height / xw_height) * xw_width;
        // however! if this is bigger than allowable, re-calibrate
        if (grid_width > (DOC_WIDTH - 2 * margin)) {
            grid_width = (DOC_WIDTH - 2 * margin);
            grid_height = (grid_width / xw_width) * xw_height;
        }
    }

    // x and y position of grid
    var notepad_height = 0;
    var grid_xpos = DOC_WIDTH - margin - grid_width;
    var grid_ypos = notepad_ypos - show_notepad_int * (options.vertical_separator + notepad_height) - grid_height;

    var notepad_xpos = DOC_WIDTH - margin - grid_width/2;

    // we change the x position of the grid if there are no full columns
    // or if we're printing on two pages
    // specifically, we want to center it.
    if (options.num_full_columns == 0 || options.num_pages == 2) {
        grid_xpos = (DOC_WIDTH - grid_width)/2;
        notepad_xpos = DOC_WIDTH/2;
    }

    // if there are no clues at all, center the y-position too
    if (!xw.clues.length || options.num_pages == 2) {
        grid_ypos = (DOC_HEIGHT - grid_height)/2;
        console.log(grid_ypos);
        console.log(grid_height);
    }

    // Determine how much space to set aside for the notepad
    var notepad_height = 0;
    if (options.show_notepad) {
      var doc1 = new jsPDF(options.orientation, 'pt', 'letter');
      const notepad_width = grid_width - 20;
      doc1.setFontSize(options.notepad_min_pt);
      var num_notepad_lines = doc1.splitTextToSize(xw.metadata.description, notepad_width).length;

      doc1.setFontType('italic');
      var notepad_pt = options.notepad_max_pt;
      doc1.setFontSize(notepad_pt);
      var notepad_lines = doc1.splitTextToSize(xw.metadata.description, notepad_width);
      while (notepad_lines.length > num_notepad_lines) {
        notepad_pt -= 0.2;
        doc1.setFontSize(notepad_pt);
        notepad_lines = doc1.splitTextToSize(xw.metadata.description, notepad_width);
      }
      var notepad_adj = (num_notepad_lines > 1 ? 1.1 : 1.2);
      notepad_height = num_notepad_lines * notepad_pt * notepad_adj;
      //console.log(notepad_pt);
    }
    grid_ypos -= notepad_height;

    // If there is no header 1 / header 2 we can save some space
    var has_top_header_row = 1;
    if (!options.header1 && !options.header2) {
      has_top_header_row = 0;
    }

    // Loop through and write to PDF if we find a good fit
    // Find an appropriate font size
    // don't do this if there are no clues
    doc = new jsPDF(options.orientation, 'pt', 'letter');
    if (xw.clues.length) {
      var clue_pt = options.max_clue_pt;
      var finding_font = true;
      while (finding_font)
      {
          doc = new jsPDF(options.orientation, 'pt', 'letter');
          var clue_padding = clue_pt / 3;
          doc.setFontSize(clue_pt);

          doc.setLineWidth(options.line_width);

          // Print the clues
          // We set the margin to be the maximum length of the clue numbers
          var max_clue_num_length = xw.clues.map(x=>x.clue).flat().map(x=>x.number).map(x => x.length).reduce((a, b) => Math.max(a, b));
          var num_margin = doc.getTextWidth('9'.repeat(max_clue_num_length));
          var num_xpos = margin + num_margin;
          var line_margin = 1.5 * doc.getTextWidth(' ');
          var line_xpos = num_xpos + line_margin;
          var top_line_ypos = margin + // top margin
                      has_top_header_row * (max_title_author_pt + options.vertical_separator) + // headers 1 & 2
                      max_title_author_pt + // title + header 3
                      options.vertical_separator * 2 + // padding
                      clue_pt + clue_padding; // first clue
          var line_ypos = top_line_ypos;
          var my_column = 0;
          for (var k=0; k<clue_arrays.length; k++) {
              var clues = clue_arrays[k];
              var nums = num_arrays[k];
              for (var i=0; i<clues.length; i++) {
                  var clue = clues[i];
                  var num = nums[i];

                  // check to see if we need to wrap
                  var max_line_ypos;
                  if (my_column < options.num_full_columns) {
                      max_line_ypos = DOC_HEIGHT - margin - MAX_TITLE_PT - 2 * options.vertical_separator;
                  } else {
                      max_line_ypos = grid_ypos - options.grid_padding;
                  }

                  // Split our clue
                  var lines = split_text_to_size_bi(clue, col_width - (num_margin + line_margin), doc, i==0);

                  if (line_ypos + (lines.length - 1) * (clue_pt + clue_padding) > max_line_ypos) {
                      // move to new column
                      my_column += 1;
                      num_xpos = margin + num_margin + my_column * (col_width + options.column_padding);
                      line_xpos = num_xpos + line_margin;
                      line_ypos = top_line_ypos;
                      // if we're at the top of a line we don't print a blank clue
                      if (clue == '') {
                          continue;
                      }
                  }


                  for (var j=0; j<lines.length; j++)
                  {
                      var line = lines[j];
                      //console.log(i, j, k, line);
                      // Set the font to bold for the title
                      if (i==0 && j==0) {
                          doc.setFontType('bold');
                          printCharacters(doc, line, line_ypos, line_xpos, clue_pt);
                          doc.setFontType('normal');
                          // add a little space after the header
                          line_ypos += clue_padding;
                      } else {
                          if (j == 0 || (i==0 && j==1)) {
                            // When j == 0 we print the number
                            doc.setFontType('bold');
                            doc.text(num_xpos, line_ypos, num, null, null, "right");
                            doc.setFontType('normal');
                          }
                          // Print the clue
                          doc.setFontType('normal');
                          // print the text
                          //doc.text(line_xpos,line_ypos,line);
                          printCharacters(doc, line, line_ypos, line_xpos, clue_pt);
                      }
                      // set the y position for the next line
                      line_ypos += clue_pt + clue_padding;
                  }
                  // Add a little extra space in between clues
                  line_ypos += clue_padding;
              }
          }

          // let's not let the font get ridiculously tiny
          if (clue_pt == options.min_clue_pt)
          {
              finding_font = false;
          }
          else if (my_column > options.num_columns - 1)
          {
              clue_pt -= 0.1;
          }
          else
          {
              finding_font = false;
          }
      }
    } // END if clues


    /***********************/

    // If title_pt is null, we determine it
    var DEFAULT_TITLE_PT = MAX_TITLE_PT;
    var total_width = DOC_WIDTH - 2 * margin;
    if (!options.title_pt) {
        options.title_pt = DEFAULT_TITLE_PT;
        var finding_title_pt = true;
        while (finding_title_pt)
        {
            var header1_header2 = options.header1 + 'ABCDEFGH' + options.header2;
            var title_header3 = xw.metadata.title + 'ABCDEFGH' + options.header3;
            doc.setFontSize(options.title_pt).setFontType('bold');
            var lines1 = doc.splitTextToSize(header1_header2,DOC_WIDTH);
            var lines2 = doc.splitTextToSize(title_header3,DOC_WIDTH);
            if (lines1.length == 1 && lines2.length == 1) {
                finding_title_pt = false;
            }
            else {
                options.title_pt -= 1;
            }
        }
    }
    // same for copyright
    if (!options.copyright_pt) {
        options.copyright_pt = DEFAULT_TITLE_PT;
        var finding_title_pt = true;
        while (finding_title_pt)
        {
            var author_copyright = xw.metadata.author + 'ABCDEFGH' + xw.metadata.copyright;
            doc.setFontSize(options.copyright_pt).setFontType('normal');
            var lines1 = doc.splitTextToSize(author_copyright,DOC_WIDTH);
            if (lines1.length == 1) {
                finding_title_pt = false;
            }
            else {
                options.title_pt -= 1;
            }
        }
    }



    /* Render headers and footers */
    function renderHeaders(page=1) {
      var title_xpos = margin;
      var author_xpos = DOC_WIDTH - margin;
      var title_author_ypos = margin + max_title_author_pt;
      var right_xpos = DOC_WIDTH - margin;

      if (options.header1 || options.header2) {
        doc.setFontSize(options.title_pt);
        doc.setFontType('bold');
        doc.text(title_xpos, title_author_ypos, options.header1);
        doc.text(right_xpos, title_author_ypos, options.header2, null, null, 'right');
        title_author_ypos += max_title_author_pt + options.vertical_separator;
        console.log(max_title_author_pt);
        console.log(options.vertical_separator);
      }

      //title
      doc.setFontSize(options.title_pt);
      doc.setFontType('bold');
      doc.text(title_xpos, title_author_ypos, xw.metadata.title);
      if (options.header3) {
        doc.text(right_xpos, title_author_ypos, options.header3, null, null, 'right');
      }

      // Draw a line under the headers
      var line_x1 = margin;
      var line_x2 = DOC_WIDTH - margin;
      var line_y = title_author_ypos + options.vertical_separator;
      doc.line(line_x1, line_y, line_x2, line_y);

      /* Render copyright */
      var copyright_xpos = DOC_WIDTH - margin;
      var copyright_ypos = DOC_HEIGHT - margin;
      doc.setFontSize(options.copyright_pt);
      doc.setFontType('normal');
      doc.text(copyright_xpos,copyright_ypos,xw.metadata.copyright,null,null,'right');

      /* Render author */
      var author_xpos = margin;
      var author_ypos = copyright_ypos;
      doc.setFontSize(options.copyright_pt);
      doc.setFontType('normal');
      doc.text(author_xpos,author_ypos,xw.metadata.author);

      /* Draw a line above the copyright */
      var line2_x1 = line_x1;
      var line2_x2 = line_x2;
      var line2_y = copyright_ypos - options.copyright_pt - options.vertical_separator;
      doc.line(line2_x1, line2_y, line2_x2, line2_y);

      /* Render notepad */
      if (options.show_notepad && page == 1) {
          doc.setFontType('italic');
          doc.setFontSize(notepad_pt);
          // We can move notepad_ypos up a bit depending on notepad_pt
          //notepad_ypos = grid_ypos + grid_height + options.vertical_separator + (notepad.max_pt + notepad_pt)/2;
          notepad_ypos = grid_ypos + grid_height + options.vertical_separator + notepad_pt;
          notepad_lines.forEach(function(notepad1) {
            doc.text(notepad_xpos, notepad_ypos, notepad1, null, null, 'center');
            notepad_ypos += notepad_pt;
          });
          doc.setFontType('normal');

          // Draw a rectangle around the notepad
          var notepad_rect_y = grid_ypos + grid_height + options.vertical_separator;
          var notepad_rect_x = grid_xpos;
          var notepad_rect_w = grid_width;
          var notepad_rect_h = notepad_height;
          var notepad_rect_radius = notepad_pt / 2.5;
          doc.roundedRect(notepad_rect_x, notepad_rect_y, notepad_rect_w, notepad_rect_h, notepad_rect_radius, notepad_rect_radius);

      }
    } // end renderHeaders()

    // Add headers to new page
    if (options.num_pages == 1) {
      renderHeaders(page=1);
    } else {
      // we do page 2 first because we switch the pages later
      renderHeaders(page=2);
      doc.addPage();
      renderHeaders(page=1);
    }

    /* Draw grid */

    var grid_options = {
        grid_letters : false
    ,   grid_numbers : true
    ,   x0: grid_xpos
    ,   y0: grid_ypos
    ,   cell_size: grid_width / xw_width
    ,   gray : options.gray
    };
    draw_crossword_grid(doc, xw, grid_options);

    if (options.num_pages == 2) {
        doc.movePage(2,1);
    }

    doc.save(options.outfile);
}

/** Create a NYT submission (requires jsPDF) **/
function jscrossword_to_nyt(xw, options={})
{
    var DEFAULT_OPTIONS = {
        margin: 20
    ,   grid_size : 360
    ,   email : ''
    ,   address : ''
    ,   header_pt : 10
    ,   grid_padding: 20
    ,   footer_pt: 8
    ,   clue_width : 250
    ,   entry_left_padding: 150
    ,   clue_entry_pt : 10
    ,   outfile: null
    ,   gray: 0.4
    };

    for (var key in DEFAULT_OPTIONS) {
        if (!DEFAULT_OPTIONS.hasOwnProperty(key)) continue;
        if (!options.hasOwnProperty(key))
        {
            options[key] = DEFAULT_OPTIONS[key];
        }
    }

    var xw_height = xw.metadata.height;
    var xw_width = xw.metadata.width;

    // If there's no filename, use the title
    if (!options.outfile) {
        var outname = xw.metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_nyt.pdf';
        options.outfile = outname;
    }

    var PTS_PER_IN = 72;
    var DOC_WIDTH = 8.5 * PTS_PER_IN;
    var DOC_HEIGHT = 11 * PTS_PER_IN;

    var margin = options.margin;
    var usable_height = DOC_HEIGHT - 2 * margin - options.footer_pt;

    var doc = new jsPDF('portrait','pt','letter');

    function print_headers(doc,headers,pt,margin) {
        // print headers; return where the next line would be
        var x0 = margin;
        var y0 = margin;
        var header_padding = pt/3;
        doc.setFontSize(pt);
        for (var i=0;i<headers.length;i++) {
            doc.text(x0,y0,headers[i]);
            y0 += pt + header_padding;
        }
        return y0;
    }

    function print_page_num(doc,pt,margin,doc_height,num) {
        var x0 = margin;
        var y0 = doc_height - margin;
        doc.setFontSize(pt)
            .text(x0,y0,'Page ' + num.toString());
    }

    /** First page: filled grid **/
    // Print the headers
    var headers = [];
    // only include the title if it's a Sunday
    if (xw_width >= 17)
    {
        headers.push(xw.metadata.title);
    }
    headers.push(xw.metadata.author);
    var address_arr = options.address.split('\n');
    headers = headers.concat(address_arr);
    headers.push(options.email);
    headers.push('');
    headers.push('Word count: ' + xw.words.length.toString());
    var y0 = print_headers(doc,headers,options.header_pt,margin);

    // Print the filled grid
    var grid_ypos = y0 + options.grid_padding;
    // adjust the the grid size if we don't have enough space
    var grid_size = options.grid_size;
    if (grid_size > DOC_HEIGHT - grid_ypos - margin - options.footer_pt) {
        grid_size = DOC_HEIGHT - grid_ypos - margin - options.footer_pt;
    }
    // position x so that the grid is centered
    var grid_xpos = (DOC_WIDTH - grid_size)/2;
    var first_page_options = {
        grid_letters : true
    ,   grid_numbers : true
    ,   x0: grid_xpos
    ,   y0: grid_ypos
    //,   grid_size: grid_size
    ,   cell_size: grid_size / xw_width
    ,   gray : options['gray']
    };
    draw_crossword_grid(doc, xw, first_page_options);
    print_page_num(doc,options.footer_pt,margin,DOC_HEIGHT,1);

    /** Second page: empty grid **/
    doc.addPage();
    print_headers(doc,headers,options.header_pt,margin);
    var second_page_options = {
        grid_letters : false
    ,   grid_numbers : true
    ,   x0: grid_xpos
    ,   y0: grid_ypos
    //,   grid_size: grid_size
    ,   cell_size: grid_size / xw_width
    ,   gray : options['gray']
    };
    draw_crossword_grid(doc, xw, second_page_options);
    print_page_num(doc,options.footer_pt,margin,DOC_HEIGHT,2);

    /** Remaining pages: clues and entries **/
    // Set up two arrays: one of clues and one of entries
    var clues = [];
    var entries = [];

    xw.clues.forEach(function(clue_list) {
        clues.push(`<b>${clue_list.title}</b>`); entries.push('');
        clue_list.clue.forEach(function(my_clue) {
            var num = my_clue['number'];
            var clue = my_clue['text'];
            const wordid_to_word = xw.get_entry_mapping();
            var entry = wordid_to_word[my_clue['word']];
            clues.push(num + ' ' + clue); entries.push(entry);
        });
    });

    var page_num = 3;
    doc.setFontSize(options.clue_entry_pt);
    headers = [xw.metadata.author];

    // new page
    doc.addPage();
    print_page_num(doc,options.footer_pt,margin,DOC_HEIGHT,page_num);
    var clue_ypos = print_headers(doc,headers,options.header_pt,margin);
    clue_ypos += options.clue_entry_pt;
    var clue_xpos = margin;
    var entry_xpos = margin + options.clue_width + options.entry_left_padding;
    var entry_ypos = clue_ypos;

    for (var i=0;i<clues.length;i++) {
        var clue = clues[i];
        var entry = entries[i];
        //var lines = doc.splitTextToSize(clue,options.clue_width);
        var lines = split_text_to_size_bi(clue, options.clue_width, doc, i==0);
        // check that the clue fits; if not, make a new page
        if (clue_ypos + lines.length * options.clue_entry_pt + options.footer_pt + margin > DOC_HEIGHT) {
            doc.addPage();
            page_num += 1;
            print_page_num(doc,options.footer_pt,margin,DOC_HEIGHT,page_num);
            clue_ypos = print_headers(doc,headers,options.header_pt,margin);
            clue_ypos += options.clue_entry_pt;
            entry_ypos = clue_ypos;
        }
        // print the clue
        for (var j=0; j<lines.length;j++) {
            doc.setFontSize(options.clue_entry_pt);
            printCharacters(doc, lines[j], clue_ypos, clue_xpos, options.clue_entry_pt);
            clue_ypos += options.clue_entry_pt;
        }
        // print the entry
        doc.setFontSize(options.clue_entry_pt).text(entry_xpos,entry_ypos,entry);

        // adjust the coordinates (double-spacing)
        clue_ypos += options.clue_entry_pt;
        entry_ypos = clue_ypos;
    }
    console.log('done');

    doc.save(options.outfile);
}
