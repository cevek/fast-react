(function () {
    var doc = document;
    /**-------------------------------------**
     * Globals
     **-------------------------------------**/
    var DEBUG_MODE = false;
    var TRY_CATCH = (process.env.NODE_ENV === "production" && sessionStorage.getItem("SkipFastReactCatchErrorMode") === null) || sessionStorage.getItem("FastReactCatchErrorMode");
    var id = 1;
    var htmlElement = doc.documentElement;
    function ReactTag(){}
    function ReactComponent(){}
    function ReactArray(){}
    function ReactText(){}

    function debugVNode(node) {
        node.id = id++;
    }

    var currentComponent = null;

    // for performance purposes
    var VTag = new ReactTag();
    var VText = new ReactText()
    var VComponent = new ReactComponent();
    var VArray = new ReactArray();

    var constProps = {
        checked: 'checked',
        controls: 'controls',
        loop: 'loop',
        multiple: 'multiple',
        muted: 'muted',
        readOnly: 'readOnly',
        selected: 'selected',
        srcDoc: 'srcdoc',
        value: 'value'
    };
    var allAttrs = "accept,accessKey,action,allowFullScreen,allowTransparency,alt,async,autoComplete,autoPlay,capture,cellPadding,cellSpacing,charSet,challenge,checked,classID,cols,colSpan,content,contentEditable,contextMenu,controls,coords,crossOrigin,data,dateTime,default,defer,dir,disabled,download,draggable,encType,form,formAction,formEncType,formMethod,formNoValidate,formTarget,frameBorder,headers,height,hidden,high,href,hrefLang,icon,id,inputMode,integrity,is,keyParams,keyType,kind,label,lang,list,loop,low,manifest,marginHeight,marginWidth,max,maxLength,media,mediaGroup,method,min,minLength,multiple,muted,name,nonce,noValidate,open,optimum,pattern,placeholder,poster,preload,radioGroup,readOnly,rel,required,reversed,role,rows,rowSpan,sandbox,scope,scoped,scrolling,seamless,selected,shape,size,sizes,span,spellCheck,src,srcDoc,srcLang,srcSet,start,step,summary,tabIndex,target,title,type,useMap,value,width,wmode,wrap,about,datatype,inlist,prefix,property,resource,typeof,vocab,autoCapitalize,autoCorrect,autoSave,color,itemProp,itemScope,itemType,itemID,itemRef,results,security,unselectable,cx,cy,d,dx,dy,fill,fx,fy,gradientTransform,gradientUnits,offset,opacity,patternContentUnits,patternUnits,points,preserveAspectRatio,r,rx,ry,spreadMethod,stroke,transform,version,viewBox,x1,x2,x,y1,y2,y".split(',')
    var fastAttrs = {"acceptCharset":"accept-charset","className":"class","htmlFor":"for","httpEquiv":"http-equiv","clipPath":"clip-path","fillOpacity":"fill-opacity","fontFamily":"font-family","fontSize":"font-size","markerEnd":"marker-end","markerMid":"marker-mid","markerStart":"marker-start","stopColor":"stop-color","stopOpacity":"stop-opacity","strokeDasharray":"stroke-dasharray","strokeLinecap":"stroke-linecap","strokeOpacity":"stroke-opacity","strokeWidth":"stroke-width","textAnchor":"text-anchor"};
    for (var i = 0; i < allAttrs.length; i++)
        if (!constProps[allAttrs[i]])
            fastAttrs[allAttrs[i]] = allAttrs[i];
    //var ss = []; var obj = {}; for (var i in DOMProperty.properties){ if (i == 'style') continue; var attr = DOMProperty.properties[i].attributeName; if (i.toLowerCase() == attr.toLowerCase()) ss.push(i); else obj[i] = attr } ss.join(',')

    var xLinkNS = 'http://www.w3.org/1999/xlink';
    var xLinkAttrs = {"xlinkActuate":"xlink:actuate","xlinkArcrole":"xlink:arcrole","xlinkHref":"xlink:href","xlinkRole":"xlink:role","xlinkShow":"xlink:show","xlinkTitle":"xlink:title","xlinkType":"xlink:type"};
    var xmlNS = 'http://www.w3.org/XML/1998/namespace';
    var xmlAttrs = {"xmlBase":"xml:base","xmlLang":"xml:lang","xmlSpace":"xml:space"};


    var svgElements = {
        circle: 'circle',
        clipPath: 'clipPath',
        defs: 'defs',
        ellipse: 'ellipse',
        g: 'g',
        image: 'image',
        line: 'line',
        linearGradient: 'linearGradient',
        mask: 'mask',
        path: 'path',
        pattern: 'pattern',
        polygon: 'polygon',
        polyline: 'polyline',
        radialGradient: 'radialGradient',
        rect: 'rect',
        stop: 'stop',
        svg: 'svg',
        text: 'text',
        tspan: 'tspan',
    }


    //noinspection JSUnusedLocalSymbols
    var isUnitlessNumber = {
        boxFlex: true,
        boxFlexGroup: true,
        columnCount: true,
        flex: true,
        flexGrow: true,
        flexPositive: true,
        flexShrink: true,
        flexNegative: true,
        fontWeight: true,
        lineClamp: true,
        lineHeight: true,
        opacity: true,
        order: true,
        orphans: true,
        widows: true,
        zIndex: true,
        zoom: true,

        // SVG-related properties
        fillOpacity: true,
        strokeDashoffset: true,
        strokeOpacity: true,
        strokeWidth: true
    };

    var constEvents = {
        onClick: 'onclick',
        onDblClick: 'ondblclick',

        onMouseDown: 'onmousedown',
        onMouseUp: 'onmouseup',
        onMouseMove: 'onmousemove',
        onMouseEnter: 'onmouseenter',
        onMouseLeave: 'onmouseleave',
        onMouseOver: 'onmouseover',
        onMouseOut: 'onmouseout',

        onTouchStart: 'ontouchstart',
        onTouchEnd: 'ontouchend',
        onTouchMove: 'ontouchmove',
        onTouchCancel: 'ontouchcancel',
        onTouchLeave: 'ontouchleave',

        onContextMenu: 'oncontextmenu',

        onInput: 'oninput',
        onFocus: 'onfocus',
        onChange: 'onchange',

        onKeyDown: 'onkeydown',
        onKeyPress: 'onkeypress',
        onKeyUp: 'onkeyup'
    };

    var topEvents = {
        onClick: 'click',
        onDblClick: 'dblclick',

        onMouseDown: 'mousedown',
        onMouseUp: 'mouseup',
        onMouseMove: 'mousemove',
        onMouseEnter: 'mouseenter',
        onMouseLeave: 'mouseleave',
        onMouseOver: 'mouseover',
        onMouseOut: 'mouseout'
    };
    var topEventsMap = {};
    for (var i in topEvents)
        topEventsMap[topEvents[i]] = 0;

    function renderError() {
        return makeTag('div', {className: 'react-render-error'}, ['Error occurred'], 0, 1, currentComponent);
    }


    var svgNS = 'http://www.w3.org/2000/svg';

    var defaultContext = {};

    /**
     * VTagTuple[type, node, tag, key, attrsHash, attrsLen, constAttrsLen, ...attrs, ...children]
     **/
    // 0/*type*/
    // 1/*node*/
    // 2/*tag*/
    // 3/*key*/
    // 4/*refT*/
    // 5/*ownerT*/
    // 6/*attrsHash*/
    // 7/*attrsLen*/
    // 8/*constAttrsLen*/
    // 9/*attrsStartPos*/

    /**
     * VTextTuple[type, node, value]
     */
    // 0/*type*/
    // 1/*nodeText*/
    // 2/*text*/

    /**
     * VArrayTuple[type, parentNode, keyMap, sourceArray, ...values]
     */
    // 0/*type*/
    // 1/*parentNodeArr*/
    // 2/*keymap*/
    // 3/*sourceArray*/
    // 4/*arrayFirstNode*/

    /**
     * VChildren[type, parentNode, refComponent, ...values]
     */
    // 0/*type*/
    // 1/*parentNodeChild*/
    // 2/*refComponent*/
    // 3/*VChildrenFirstNode*/

    /**
     * VComponentTuple[type, parentNode, Ctor, key, ref, instance, children, props, propsChildren?]
     */
    // 0/*type*/
    // 1/*parentNode*/
    // 2/*Ctor*/
    // 3/*keyCmp*/
    // 4/*ref*/
    // 5/*ownerC*/
    // 6/*instance*/
    // 7/*children*/
    // 8/*props*/
    // 9/*propsChildren*/

    function tryCatch(fn, _this, arg1, arg2, catchReturn) {
        try {
            return fn.call(_this, arg1, arg2);
        } catch (e) {
            Throw(e);
        }
        return catchReturn;
    }

    function tryCatchNew(fn, arg1, arg2, catchReturn) {
        try {
            return new fn(arg1, arg2);
        } catch (e) {
            Throw(e);
        }
        return catchReturn;
    }

    function Throw(err){
        if (TRY_CATCH) {
            setTimeout(function() {
                throw err;
            });
        } else {
            throw err;
        }
    }


    /**-------------------------------------**
     * Creating
     **-------------------------------------**/
    function create(vdom, rootNode, before, parentComponent, renderToParent) {
        if (DEBUG_MODE) {
            debugVNode(vdom);
        }

        if (vdom[0/*type*/] == VText) {
            if (renderToParent && vdom[2/*text*/]) {
                rootNode.textContent = vdom[2/*text*/];
                vdom[1/*nodeText*/] = rootNode.firstChild;
            } else {
                vdom[1/*nodeText*/] = doc.createTextNode(vdom[2/*text*/]);
                rootNode.insertBefore(vdom[1/*nodeText*/], before);
            }
        }
        else if (vdom[0/*type*/] == VTag) {
            if (typeof vdom[2/*tag*/] !== 'string') {
                Throw(new Error('Incorrect tag name: ' + vdom[2/*tag*/]));
                return create(renderError(), rootNode, before, parentComponent, renderToParent); // return empty text
            }
            // isSvg
            if (typeof svgElements[vdom[2/*tag*/]] == 'string') {
                var node = doc.createElementNS(svgNS, vdom[2/*tag*/]);
            } else {
                var node = doc.createElement(vdom[2/*tag*/]);
            }
            if (process.env.NODE_ENV !== "production") {
                var cmp = vdom[5/*ownerT*/];
                node.setAttribute(":", cmp && cmp.constructor && (cmp.constructor.displayName || cmp.constructor.name) || 'unknown');
                node.$component = cmp;
            }
            vdom[1/*node*/] = rootNode.insertBefore(node, before);
            var attrsStart = 9/*attrsStartPos*/;
            var attrsEnd = 9/*attrsStartPos*/ + vdom[7/*attrsLen*/] * 2;
            for (var i = attrsStart; i < attrsEnd; i += 2) {
                handleAttr(vdom[i], vdom[i + 1], null, node, vdom);
            }
            var start = 9/*attrsStartPos*/ + vdom[7/*attrsLen*/] * 2;
            var end = vdom.length;
            var childRenderToParent = end - start == 1;
            for (var i = start; i < end; i++) {
                vdom[i] = create(norm(vdom[i]), node, null, parentComponent, childRenderToParent);
            }

            if (vdom[4/*refT*/]) {
                setRef(vdom);
            }
        }
        else if (vdom[0/*type*/] == VArray) {
            vdom[1/*parentNodeArr*/] = rootNode;
            //iterate source array
            var sourceArray = vdom[3/*sourceArray*/];
            var keyMap = vdom[2/*keymap*/] = {};
            for (i = 0; i < sourceArray.length; i++) {
                var vdomPos = i + 4/*arrayFirstNode*/;
                var child = norm(sourceArray[i]);
                vdom[vdomPos] = create(child, rootNode, before, parentComponent, false);
                var key = getKey(child);
                if (key != null) {
                    keyMap[key] = vdomPos;
                }
            }
            vdom[3/*sourceArray*/] = null;
        }
        else if (vdom[0/*type*/] == VComponent) {
            vdom = createComponent(vdom, rootNode, before, parentComponent);
        }
        return vdom;
    }

    function createComponent(vdom, rootNode, before, parentComponent) {
        var Constructor = vdom[2/*Ctor*/];
        if (typeof Constructor !== 'function') {
            Throw(new Error('Incorrect function as Component: ' + Constructor));
            return create(renderError(), rootNode, before, parentComponent, false); // return empty text
        }
        vdom[1/*parentNode*/] = rootNode;
        var props = vdom[8/*props*/];
        if (Constructor.defaultProps) {
            setDefaultProps(props, Constructor.defaultProps);
        } else {
            Constructor.defaultProps = void 0;
        }

        if (Constructor.contextTypes) {
            var nextContext = getContext(parentComponent, Constructor.contextTypes);
        } else {
            Constructor.contextTypes = null;
            nextContext = defaultContext;
        }


        if (!Constructor.prototype || !Constructor.prototype.render) {
            var children = norm(TRY_CATCH
                ? tryCatch(Constructor, null, props, nextContext, renderError())
                : Constructor(props, nextContext));
            vdom[7/*children*/] = create(children, vdom[1/*parentNode*/], before, parentComponent, false);
        }
        else {
            var component = vdom[6/*instance*/] = TRY_CATCH
                ? tryCatchNew(Constructor, props, nextContext, new Component)
                : new Constructor(props, nextContext);
            var prevComponent = currentComponent;
            currentComponent = component;
            component.node = vdom;
            component._internalParentComponent = parentComponent;
            if (component.componentWillMount) {
                TRY_CATCH ? tryCatch(component.componentWillMount, component) : component.componentWillMount();
            }

            if (nextContext) {
                component.context = nextContext;
            }

            var children = norm(TRY_CATCH
                ? tryCatch(component.render, component, null, null, renderError())
                : component.render());
            component._internalContext = component.getChildContext
                ? (TRY_CATCH
                    ? tryCatch(component.getChildContext, component, null, null, null)
                    : component.getChildContext())
                : null;

            vdom[7/*children*/] = create(children, vdom[1/*parentNode*/], before, component, false);
            if (component.componentDidMount) {
                TRY_CATCH ? tryCatch(component.componentDidMount, component) : component.componentDidMount();
            }
            currentComponent = prevComponent;
        }
        if (vdom[4/*ref*/]) {
            setRef(vdom);
        }
        return vdom;
    }


    /**-------------------------------------**
     * Updating
     **-------------------------------------**/
    function update(old, vdom, parentComponent) {
        var type = vdom[0/*type*/];
        if (DEBUG_MODE && !vdom.id) {
            debugVNode(vdom);
        }
        // don't update the same node
        // happens when we use {this.props.children}
        if (vdom === old) {
            return vdom;
        }
        if (type !== old[0/*type*/]) {
            return replace(old, vdom, parentComponent);
        }
        else if (type == VText) {
            return updateText(old, vdom);
        }
        else if (type == VTag) {
            return updateTag(old, vdom, parentComponent);
        }
        else if (type == VArray) {
            return updateArray(old, vdom, parentComponent);
        }
        else if (type == VComponent) {
            return updateComponent(old, vdom, parentComponent);
        }
    }

    function updateText(old, vdom) {
        vdom[1/*nodeText*/] = old[1/*nodeText*/];
        if (vdom[2/*text*/] !== old[2/*text*/]) {
            vdom[1/*nodeText*/].textContent = vdom[2/*text*/];
        }
        return vdom;
    }

    function updateTag(old, vdom, parentComponent) {
        var node = vdom[1/*node*/] = old[1/*node*/];
        if (vdom[2/*tag*/] !== old[2/*tag*/]) {
            return replace(old, vdom, parentComponent);
        }
        var attrsStart = 9/*attrsStartPos*/ + vdom[8/*constAttrsLen*/] * 2;
        var attrsEnd = 9/*attrsStartPos*/ + vdom[7/*attrsLen*/] * 2;
        var oldAttrsEnd = 9/*attrsStartPos*/ + old[7/*attrsLen*/] * 2;
        var vdomLen = vdom.length;
        var oldLen = old.length;
        var childLen = vdomLen - attrsEnd;
        var oldChildLen = oldLen - oldAttrsEnd;
        if (childLen !== oldChildLen) {
            return replace(old, vdom, parentComponent);
        }
        if (vdom[6/*attrsHash*/] === old[6/*attrsHash*/] && attrsEnd === oldAttrsEnd) {
            for (var i = attrsStart; i < attrsEnd; i += 2) {
                handleAttr(vdom[i], vdom[i + 1], old[i + 1], node, vdom);
            }
            for (var i = attrsEnd; i < vdomLen; i++) {
                vdom[i] = update(old[i], norm(vdom[i]), parentComponent);
            }
        } else {
            handleAttrs(vdom, old, attrsEnd, oldAttrsEnd);
            for (var i = 0; i < childLen; i++) {
                vdom[attrsEnd + i] = update(old[oldAttrsEnd + i], norm(vdom[attrsEnd + i]), parentComponent);
            }
        }
        if (old[4/*refT*/] != vdom[4/*refT*/] || old[5/*ownerT*/] != vdom[5/*ownerT*/]) {
            setRef(vdom);
        }
        return vdom;
    }

    function updateComponent(old, vdom, parentComponent) {
        var Ctor = vdom[2/*Ctor*/];
        if (old[2/*Ctor*/] !== Ctor) {
            vdom = replace(old, vdom, parentComponent);
        }
        else {

            var nextContext = Ctor.contextTypes ? getContext(parentComponent, Ctor.contextTypes) : defaultContext;
            var nextProps = vdom[8/*props*/];
            if (Ctor.defaultProps) {
                setDefaultProps(nextProps, Ctor.defaultProps);
            }
            vdom[8/*props*/] = nextProps; //todo why?


            vdom[1/*parentNode*/] = old[1/*parentNode*/];
            var component = vdom[6/*instance*/] = old[6/*instance*/];
            var props = vdom[8/*props*/];
            if (Ctor.defaultProps) {
                setDefaultProps(props, Ctor.defaultProps);
            }
            if (!component) {
                var children = norm(TRY_CATCH
                    ? tryCatch(Ctor, null, nextProps, nextContext, renderError())
                    : Ctor(nextProps, nextContext));
                vdom[7/*children*/] = update(old[7/*children*/], children, parentComponent);
            }
            else {
                var prevComponent = currentComponent;
                currentComponent = component;

                var nextState = component.state;

                // todo why?
                if (component._internalParentComponent !== parentComponent) {
                    component._internalParentComponent = parentComponent;
                    throw new Error('Something wrong');
                }

                if (component.componentWillReceiveProps) {
                    TRY_CATCH
                        ? tryCatch(component.componentWillReceiveProps, component, nextProps) // todo context
                        : component.componentWillReceiveProps(nextProps, nextContext);
                }
                vdom[7/*children*/] = _updateComponent(component, nextProps, nextState, nextContext, false) || old[7/*children*/];
                component.node = vdom;

                currentComponent = prevComponent;
            }
            if (old[4/*ref*/] != vdom[4/*ref*/] || old[5/*ownerC*/] != vdom[5/*ownerC*/]) {
                setRef(vdom);
            }
        }
        return vdom;
    }

    function _updateComponent(component, nextProps, nextState, nextContext, skipShouldUpdate){
        var shouldUpdate = true;
        if (!skipShouldUpdate && component.shouldComponentUpdate) {
            shouldUpdate = TRY_CATCH
                ? tryCatch(component.shouldComponentUpdate, component, nextProps, nextState, true) // todo  context
                : component.shouldComponentUpdate(nextProps, nextState, nextContext);
        }

        if (shouldUpdate) {
            if (component.componentWillUpdate) {
                TRY_CATCH
                    ? tryCatch(component.componentWillUpdate, component, nextProps, nextState) // todo context
                    : component.componentWillUpdate(nextProps, nextState, nextContext);
            }
            var currentContext = component.context;
            var currentProps = component.props;
            var currentState = component.state;
            component.context = nextContext;
            component.props = nextProps;
            component.state = nextState;
            var children = norm(TRY_CATCH
                ? tryCatch(component.render, component, null, null, renderError())
                : component.render());
            component._internalContext = component.getChildContext ?
                (TRY_CATCH
                    ? tryCatch(component.getChildContext, component, null, null, null)
                    : component.getChildContext())
                : null;
            var newChildren = update(component.node[7/*children*/], children, component);
            if (component.componentDidUpdate) {
                TRY_CATCH
                    ? tryCatch(component.componentDidUpdate, component, currentProps, currentState) //todo context
                    : component.componentDidUpdate(currentProps, currentState, currentContext);
            }
            return newChildren;
        }
        return null;
    }

    function getContext(component, contextTypes) {
        var parentComponent = component;
        var nextContext = {};
        for (var prop in contextTypes) {
            nextContext[prop] = void 0;
        }

        var parents = [];
        do {
            if (parentComponent._internalContext) {
                parents.push(parentComponent._internalContext);
            }
        }
        while (parentComponent = parentComponent._internalParentComponent);
        for (var i = parents.length - 1; i >= 0; i--) {
            parentComponent = parents[i];
            // todo: make array to more faster iterate
            for (var prop in contextTypes) {
                var val = parentComponent[prop];
                if (val !== void 0) {
                    nextContext[prop] = val;
                }
            }
        }
        return nextContext;
    }

    function updateArray(old, vdom, parentComponent) {
        var rootNode = vdom[1/*parentNodeArr*/] = old[1/*parentNodeArr*/];
        var keyMap = vdom[2/*keymap*/] = old[2/*keymap*/];
        var oldLen = old.length;
        var sourceArray = vdom[3/*sourceArray*/];
        //todo:maybe slow speed
        var lastNextNode = getChildNode(old, true).nextSibling;
        var inserts = null;

        var fitCount = 0;
        for (var i = 4/*arrayFirstNode*/; i < vdom.length; i++) {
            var newChild = vdom[i] = norm(sourceArray[i - 4/*arrayFirstNode*/]);
            var oldChild = oldLen > i ? old[i] : null;
            var newKey = getKey(newChild);
            if (newKey != null) {
                var fitPos = keyMap[newKey];
            }
            else {
                if (oldChild && getKey(oldChild) == null) {
                    fitPos = i;
                }
                else {
                    fitPos = null;
                }
            }

            if (fitPos != null) {
                oldChild = old[fitPos];
                if (oldChild) {
                    fitCount++;
                    vdom[i] = update(oldChild, newChild, parentComponent);
                    if (fitPos !== i) {
                        if (inserts == null) {
                            inserts = [];
                        }
                        inserts.push(i);
                    }
                    old[fitPos] = null;
                } else {
                    Throw(new Error('duplicate key: ' + newKey));
                    if (inserts == null) {
                        inserts = [];
                    }
                    inserts.push(i);
                }
            }
            else {
                if (inserts == null) {
                    inserts = [];
                }
                inserts.push(i);
            }
            if (newKey != null) {
                // todo: this is incorrect because if we have duplicate keys, we take from old incorrect element in next iteration
                keyMap[newKey] = i;
            }
        }
        vdom[3/*sourceArray*/] = null;

        var oldLenFull = oldLen - 4/*arrayFirstNode*/;
        if (oldLenFull > fitCount) {
            for (i = 4/*arrayFirstNode*/; i < oldLen; i++) {
                oldChild = old[i];
                if (oldChild) {
                    var key = getKey(oldChild);
                    if (key != null) {
                        keyMap[key] = null;
                    }
                    remove(rootNode, oldChild, true);
                    if (oldLenFull == ++fitCount) {
                        break;
                    }
                }
            }
        }

        if (inserts) {
            for (i = inserts.length - 1; i >= 0; i--) {
                var pos = inserts[i];
                var child = vdom[pos];

                if (pos == vdom.length - 1) {
                    var beforeChild = lastNextNode;
                }
                else {
                    beforeChild = getChildNode(vdom[pos + 1], false);
                }

                if (isRendered(child)) {
                    move(rootNode, child, beforeChild);
                }
                else {
                    child = vdom[pos] = create(child, rootNode, beforeChild, parentComponent, false);
                }
            }
        }
        return vdom;
    }

    function setRef(vdom) {
        var topComponent;
        var ref;
        var val;
        if (vdom[0/*type*/] == VTag) {
            topComponent = vdom[5/*ownerT*/];
            ref = vdom[4/*refT*/];
            val = vdom[1/*node*/];
        }
        else {
            topComponent = vdom[5/*ownerC*/];
            ref = vdom[4/*ref*/];
            val = vdom[6/*instance*/];
        }
        if (typeof ref == 'function') {
            TRY_CATCH ? tryCatch(ref, null, val) : ref(val);
        }
        else {
            if (!topComponent.refs) {
                topComponent.refs = {};
            }
            topComponent.refs[ref] = val;
        }
    }

    function setDefaultProps(props, defaultProps) {
        for (var prop in defaultProps) {
            if (typeof props[prop] == 'undefined') {
                props[prop] = defaultProps[prop];
            }
        }
    }




    /**-------------------------------------**
     * Attrs
     **-------------------------------------**/
    function setStyle(node, oldStyles, newStyles) {
        var val;
        var styleNode = node.style;
        for (prop in newStyles) {
            val = newStyles[prop];
            if (oldStyles && oldStyles[prop] === val) {
                continue;
            }
            if (val == +val && typeof isUnitlessNumber[prop] == 'undefined') {
                val = val + 'px';
            }
            styleNode[prop] = val;
        }
        if (oldStyles) {
            for (var prop in oldStyles) {
                if (!newStyles || typeof newStyles[prop] === 'undefined') {
                    styleNode[prop] = null;
                }
            }
        }
    }

    function handleAttr(attr, val, oldVal, node, vdom) {
        var normAttr;
        if (val === oldVal) {
            return;
        }
        if ((normAttr = fastAttrs[attr]) || (attr[4] == '-' && attr.substr(0, 5) == 'data-' && (normAttr = attr))) {
            if (val == null || val === false) {
                if (oldVal) {
                    node.removeAttribute(normAttr);
                }
            }
            else {
                node.setAttribute(normAttr, val);
            }
        }
        else if (normAttr = constProps[attr]) {
            node[normAttr] = val;
        }
        else if ((normAttr = constEvents[attr]) || (attr[0] == 'o' && attr[1] == 'n' && (normAttr = attr.toLowerCase()) && (normAttr in doc && normAttr.substr(0, 2) == 'on'))) {
            var topEventName = topEvents[attr];
            if (topEventName) {
                setTopEvent(node, topEventName, val);
            }
            else {
                node[normAttr] = val;
            }
        }
        else if (attr === 'style') {
            setStyle(node, oldVal, val);
        }
        else if (attr === 'dangerouslySetInnerHTML') {
            if (!oldVal || oldVal.__html !== val.html) {
                node.innerHTML = val.__html;
            }
        }
        else if ((normAttr = xLinkAttrs[attr]) || (normAttr = xmlAttrs[attr])) {
            var ns = normAttr[5] == ':' ? xLinkNS : xmlNS;
            if (val == null || val === false) {
                if (oldVal) {
                    node.removeAttributeNS(ns, normAttr);
                }
            }
            else {
                node.setAttributeNS(ns, normAttr, val);
            }
        }
    }

    function handleAttrs(vdom, old, newEnd, oldEnd) {
        var newProp, newPropVal, oldProp, oldPropVal, node = vdom[1/*node*/];
        var max = oldEnd > newEnd ? oldEnd : newEnd;
        for (var i = 9/*attrsStartPos*/; i < max; i += 2) {
            if (i < newEnd) {
                newProp = vdom[i];
                newPropVal = vdom[i + 1];
            } else {
                newProp = null;
                newPropVal = null;
            }
            if (i < oldEnd) {
                oldProp = old[i];
                oldPropVal = old[i + 1];
            } else {
                oldProp = null;
                oldPropVal = null;
            }
            if (newProp !== oldProp) {
                if (oldProp) {
                    //check old is deleted
                    var found = false;
                    for (var j = 9/*attrsStartPos*/; j < newEnd; j += 2) {
                        if (vdom[j] == oldProp) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        handleAttr(oldProp, null, oldPropVal, node, vdom);
                    }

                }
                if (newProp) {
                    var found = -1;
                    for (var j = 9/*attrsStartPos*/; j < oldEnd; j += 2) {
                        if (old[j] == newProp) {
                            found = j;
                            break;
                        }
                    }
                    if (found > -1) {
                        handleAttr(newProp, newPropVal, old[found + 1], node, vdom);
                    } else {
                        handleAttr(newProp, newPropVal, null, node, vdom);
                    }
                }
            }
            else {
                handleAttr(newProp, newPropVal, oldPropVal, node, vdom);
            }
        }
    }

    function stopPropagation() {
        this.propagationStopped = true;
    }

    function stopImmediatePropagation() {
        this.propagationStopped = true;
    }

    var currentTarget = null;
    function getCurrentTarget(){
        return currentTarget;
    }
    function topEvent(event) {
        var dom = event.target;
        event.stopPropagation = stopPropagation;
        event.stopImmediatePropagation = stopImmediatePropagation;
        event.propagationStopped = false;
        currentTarget = null;
        Object.defineProperty(event, 'currentTarget', {get: getCurrentTarget})

        var dom2 = dom;
        while (dom2 && !dom2._events) {
            dom2 = dom2.parentNode;
        }
        currentTarget = dom2;
        do {
            if (event.propagationStopped) {
                break;
            }
            if (dom._events) {
                var callback = dom._events[event.type];
                if (callback) {
                    callback.call(dom, event);
                }

                dom2 = dom.parentNode;
                while (dom2 && !dom2._events) {
                    dom2 = dom2.parentNode;
                }
                currentTarget = dom2;
            }
        } while (dom = dom.parentNode);
    }

    function setTopEvent(dom, eventName, callback) {
        if (!dom._events) {
            dom._events = {};
        }
        if (callback) {
            dom._events[eventName] = callback;
            if (topEventsMap[eventName]++ === 0) {
                htmlElement.addEventListener(eventName, topEvent);
            }
        }
        else {
            dom._events[eventName] = null;
            if (--topEventsMap[eventName] === 0) {
                htmlElement.removeEventListener(eventName, topEvent);
            }
        }
    }



    /**-------------------------------------**
     * Move, Remove, Replace
     **-------------------------------------**/
    function replace(old, vdom, parentComponent) {
        var type = old[0/*type*/];
        if (type == VComponent) {
            var parentNode = old[1/*parentNode*/];
            var before = getChildNode(old, false);
        }
        else if (type == VArray) {
            var parentNode = old[1/*parentNodeArr*/];
            var before = getChildNode(old, false);
        }
        else if (type == VTag) {
            parentNode = old[1/*node*/].parentNode;
            before = old[1/*node*/];
        }
        else if (type == VText) {
            parentNode = old[1/*nodeText*/].parentNode;
            before = old[1/*nodeText*/];
        }
        vdom = create(vdom, parentNode, before, parentComponent, false);
        remove(parentNode, old, true);
        return vdom;
    }

    function remove(parentNode, vdom, removeFromDom) {
        var type = vdom[0/*type*/];
        if (type == VComponent || type == VArray) {
            if (type == VArray) {
                for (var i = 4/*arrayFirstNode*/; i < vdom.length; i++) {
                    remove(vdom[1/*parentNodeArr*/], vdom[i], removeFromDom);
                }
            }
            else if (type == VComponent) {
                if (vdom[6/*instance*/] && vdom[6/*instance*/].componentWillUnmount) {
                    vdom[6/*instance*/].componentWillUnmount();
                }
                remove(vdom[1/*parentNode*/], vdom[7/*children*/], removeFromDom);
            }
        }
        else {
            if (type == VTag) {
                for (i = 9/*attrsStartPos*/ + vdom[7/*attrsLen*/] * 2; i < vdom.length; i++) {
                    remove(vdom[1/*node*/], vdom[i], false);
                }
                if (removeFromDom) {
                    parentNode.removeChild(vdom[1/*node*/]);
                }
            }
            if (type == VText && removeFromDom) {
                parentNode.removeChild(vdom[1/*nodeText*/]);
            }
        }
    }

    function move(parentNode, vdom, beforeChild) {
        var node = getChildNode(vdom, false);
        if (node.nextSibling !== beforeChild) {
            parentNode.insertBefore(node, beforeChild);
        }
    }


    /**-------------------------------------**
     * Utils
     **-------------------------------------**/
    function norm(vdom) {
        if (typeof vdom == 'number' || typeof vdom == 'string') {
            return makeText(vdom);
        }
        if (typeof vdom == 'boolean' || vdom == null) {
            return makeText('');
        }
        var type = vdom[0/*type*/];
        if (!type || (type !== VTag && type !== VText && type !== VComponent && type !== VArray)) {
            if (vdom.constructor == Array) {
                return makeVArray(vdom);
            }
            return makeText('');
        }
        if (type == VComponent) {
            //convertComponentToTag
            if (typeof vdom[2/*Ctor*/] == 'string') {
                var children = normChildren(vdom[8/*props*/].children);
                return makeTag(vdom[2/*Ctor*/], vdom[8/*props*/], children, 0, children.length, vdom[5/*ownerC*/]);
            }
        }
        return vdom;
    }

    // [], null, false, "223", undefined, {}, ["xT", ...],
    function normChildren(vdom) {
        if (typeof vdom == 'number' || typeof vdom == 'string' || typeof vdom == 'boolean' || vdom == null) {
            return [vdom];
        }
        var type = vdom[0/*type*/];
        if (type === VTag || type === VText || type === VComponent || type === VArray) {
            return [vdom];
        }
        if (vdom.constructor == Array) {
            return vdom;
        }
        return [vdom];
    }

    var propsHashCounter = 1;

    function makeAttrs(vdom, attrs, ownerComponent) {
        var pCount = 0;
        var k = 9/*attrsStartPos*/;
        var key, ref;
        for (var p in attrs) {
            if (p === 'children') {
                continue;
            }
            if (p === 'key') {
                key = attrs[p];
                continue;
            }
            if (p === 'ref') {
                ref = attrs[p];
                continue;
            }
            vdom[k++] = p;
            vdom[k++] = attrs[p];
            pCount++;
        }
        vdom[3/*key*/] = key;
        vdom[4/*refT*/] = ref;
        vdom[5/*ownerT*/] = ref ? ownerComponent : null;
        return pCount;
    }

    function makeTag(tag, attrs, childrenArray, from, to, ownerComponent) {
        var childrenLen = to - from;
        if (childrenLen < 0) {
            childrenLen = 0;
        }
        if (childrenLen == 0) {
            if (attrs && attrs.children) {
                childrenArray = normChildren(attrs.children);
                from = 0;
                to = childrenArray.length;
            }
        }
        // var newVdom = new Array(9/*attrsStartPos*/ + 2 + to - from); // min tag array len
        var vdom = [];
        vdom[8/*constAttrsLen*/] = 0;
        vdom[0/*type*/] = VTag;
        vdom[1/*node*/] = null;
        vdom[2/*tag*/] = tag;
        var pCount = attrs ? makeAttrs(vdom, attrs, ownerComponent) : 0;
        var k = 9/*attrsStartPos*/ + pCount * 2;
        if (process.env.NODE_ENV !== "production") {
            vdom[5/*ownerT*/] = ownerComponent;
        }
        vdom[6/*attrsHash*/] = propsHashCounter++;
        vdom[7/*attrsLen*/] = pCount;

        if (childrenLen) {
            // pre create array slots
            vdom.length = k + childrenLen;
            // vdom[k + childrenLen - 1] = null;
        }
        if (childrenArray) {
            for (var i = from; i < to; i++) {
                vdom[k++] = childrenArray[i];
            }
        }
        if (DEBUG_MODE) {
            debugVNode(vdom);
        }
        return vdom;
    }

    function makeComponent(Ctor, props, childrenArray, ownerComponent) {
        var key = null;
        var ref = null;
        var newProps = {children: childrenArray};
        if (props) {
            for (var p in props) {
                if (p === 'children') {
                    if (childrenArray == null) {
                        newProps.children = props.children;
                    }
                    continue;
                }
                if (p === 'key') {
                    key = props[p];
                    continue;
                }
                if (p === 'ref') {
                    ref = props[p];
                    continue;
                }
                newProps[p] = props[p];
            }
        }
        var vdom = [VComponent, null, Ctor, key, ref, ref ? ownerComponent : null, null, null, newProps];
        if (DEBUG_MODE) {
            debugVNode(vdom);
        }
        return vdom;
    }

    function makeVArray(array) {
        var length = array.length;
        if (length === 0) {
            return [VText, null, ''];
        }
        var p = new Array(length + 4/*arrayFirstNode*/);
        p[0/*type*/] = VArray;
        p[3/*sourceArray*/] = array;
        if (DEBUG_MODE) {
            debugVNode(p);
        }
        return p;
    }

    function makeText(text) {
        var vdom = [VText, null, text];
        if (DEBUG_MODE) {
            debugVNode(vdom);
        }
        return vdom;
    }

    function getKey(vdom) {
        if (vdom[0/*type*/] == VTag) {
            return vdom[3/*key*/];
        }
        else if (vdom[0/*type*/] == VComponent) {
            return vdom[3/*keyCmp*/];
        }
        return null;
    }

    function getRef(vdom) {
        if (vdom[0/*type*/] == VComponent) {
            return vdom[4/*ref*/]
        }
        else if (vdom[0/*type*/] == VTag) {
            return vdom[4/*refT*/]
        }
    }

    function getProps(vdom) {
        if (vdom[0/*type*/] == VComponent) {
            return vdom[8/*props*/];
        }
        else if (vdom[0/*type*/] == VTag) {
            var attrsStart = 9/*attrsStartPos*/;
            var attrsEnd = 9/*attrsStartPos*/ + vdom[7/*attrsLen*/] * 2;
            var props = {};
            if (attrsEnd - attrsStart > 0) {
                for (var i = attrsStart; i < attrsEnd; i += 2) {
                    props[vdom[i]] = vdom[i + 1];
                }
            }
            return props;
        }
    }

    function getChildren(vdom){
        var children;
        var type = vdom[0/*type*/];
        if (type == VComponent) {
            children = vdom[8/*props*/] ? vdom[8/*props*/].children : null;
        }
        else if (type == VTag) {
            children = vdom.slice(9/*attrsStartPos*/ + vdom[7/*attrsLen*/] * 2);
        }
        else if (type == VArray){
            children = vdom.slice(4/*arrayFirstNode*/);
        }
        return children;
    }

    function getTag(vdom){
        return vdom[0/*type*/] == VComponent ? vdom[2/*Ctor*/] : vdom[2/*tag*/];
    }

    function getChildNode(vdom, isLast) {
        while (true) {
            var type = vdom[0/*type*/];
            if (type == VArray) {
                vdom = vdom[isLast ? vdom.length - 1 : 4/*arrayFirstNode*/];
            }
            else if (type == VComponent) {
                vdom = vdom[7/*children*/];
            }
            else if (type == VTag) {
                return vdom[1/*node*/];
            }
            else if (type == VText) {
                return vdom[1/*nodeText*/];
            }
        }
    }

    function isRendered(vdom) {
        var type = vdom[0/*type*/];
        if (type == VArray) {
            return vdom[1/*parentNodeArr*/] != null;
        }
        else if (type == VComponent) {
            return vdom[1/*parentNode*/] != null;
        }
        else if (type == VTag) {
            return vdom[1/*node*/] != null;
        }
        else if (type == VText) {
            return vdom[1/*nodeText*/] != null;
        }
    }

    /**-------------------------------------**
     * Component
     **-------------------------------------**/
    function Component(props) {
        this.props = props;
        this.node = null;
        this.state = null;

        this._internalContext = defaultContext;
        this._internalParentComponent = null;
    }

    var ComponentProto = Component.prototype;
    ComponentProto.componentWillMount = null;
    ComponentProto.componentDidMount = null;
    ComponentProto.componentWillUpdate = null;
    ComponentProto.componentDidUpdate = null;
    ComponentProto.componentWillReceiveProps = null;
    ComponentProto.componentWillUnmount = null;
    ComponentProto.shouldComponentUpdate = null;
    ComponentProto.getChildContext = null;
    ComponentProto.contextTypes = null;

    var queue = [];
    var isUpdating = false;

    function runQueue() {
        if (!isUpdating && queue.length > 0) {
            isUpdating = true;
            var task = queue.shift();
            if (task.type == 'update') {
                var component = task.component;
                var prevComponent = currentComponent;
                currentComponent = component;
                var nextChildren = _updateComponent(component, component.props, task.nextState, component.context, task.force);
                if (nextChildren) {
                    component.node[7/*children*/] = nextChildren;
                }
                currentComponent = prevComponent;
            }
            isUpdating = false;
            runQueue();
            if (task.callback) {
                TRY_CATCH
                    ? tryCatch(task.callback, task)
                    : task.callback();
            }
        }
    }

    ComponentProto.setState = function (state, callback) {
        if (state && this.state) {
            for (var key in this.state) {
                if (!(key in state)) {
                    state[key] = this.state[key];
                }
            }
        }
        queue.push({type: 'update', force: false, nextState: state, component: this, callback: callback});
        runQueue();
    };
    ComponentProto.render = function () {
        return null;
    };
    ComponentProto.getChildContext = null;
    ComponentProto.forceUpdate = function (callback) {
        queue.push({type: 'update', force: true, nextState: this.state, component: this, callback: callback});
        runQueue();
    };


    /**-------------------------------------**
     * Top Level
     **-------------------------------------**/
    function createElement(tag, attrs, child) {
        var argLen = arguments.length;
        if (typeof tag == 'function') {
            var children;
            if (argLen > 2) {
                children = new Array(argLen - 2);
                for (var i = 2; i < argLen; i++) {
                    children[i - 2] = arguments[i];
                }
            } else {
                children = null;
            }
            return makeComponent(tag, attrs, children, currentComponent);
        }
        var vdom = makeTag(tag, attrs, null, 2, argLen, currentComponent);
        if (argLen) {
            var shift = vdom.length - argLen;
            for (var i = 2; i < argLen; i++) {
                vdom[shift + i] = arguments[i];
            }
        }
        return vdom;
    }

    function render(vdom, rootNode, callback) {
        isUpdating = true;
        if (typeof rootNode._vdom == 'undefined') {
            vdom = rootNode._vdom = create(norm(vdom), rootNode, null, null, false);
        }
        else {
            var old = rootNode._vdom;
            vdom = rootNode._vdom = update(old, norm(vdom), null);
        }
        isUpdating = false;
        runQueue();
        if (callback) {
            callback();
        }
        return vdom[0/*type*/] == VComponent ? vdom[6/*instance*/] : vdom[1/*node*/];
    }

    function renderDummy(vdom){
        doc = dummyDoc;
        var rootNode = dummyNode;
        isUpdating = true;
        if (typeof rootNode._vdom == 'undefined') {
            vdom = rootNode._vdom = create(norm(vdom), rootNode, null, null, false);
        }
        else {
            var old = rootNode._vdom;
            vdom = rootNode._vdom = update(old, norm(vdom), null);
        }
        isUpdating = false;
        runQueue();
        return vdom[0/*type*/] == VComponent ? vdom[6/*instance*/] : vdom[1/*node*/];
    }

    var propType = function () {return propType};
    propType.isRequired = function () {}
    var PropTypes = {
        array: propType,
        bool: propType,
        func: propType,
        number: propType,
        object: propType,
        string: propType,
        any: propType,
        arrayOf: propType,
        element: propType,
        instanceOf: propType,
        node: propType,
        objectOf: propType,
        oneOf: propType,
        oneOfType: propType,
        shape: propType
    };

    function findDOMNode(vdom) {
        if (vdom instanceof Component) {
            vdom = vdom.node;
        }
        if (vdom instanceof Node) {
            return vdom;
        }
        if (isValidElement(vdom)) {
            var node = getChildNode(vdom, false);
            if (node instanceof Text) {
                return null;
            }
        }
        return node;
    }

    function cloneElement(vdom, props) {
        var vprops = getProps(vdom);
        for (var i in props){
            vprops[i] = props[i];
        }
        return makeComponent(getTag(vdom), vprops, getChildren(vdom), null);
    }

    function isValidElement(element) {
        return element && typeof element == 'object' && (element[0/*type*/] == VTag || element[0/*type*/] == VComponent);
    }

    function createClass(specification) {
        var defaultProps = specification.getDefaultProps ? specification.getDefaultProps() : null;
        var componentProps = {};
        for (var p in specification) {
            if (p != 'getDefaultProps' && p != 'getInitialState' && p != 'statics'
                && p != 'componentWillMount' && p != 'componentDidMount' && p != 'componentWillReceiveProps'
                && p != 'shouldComponentUpdate' && p != 'componentWillUpdate' && p != 'componentDidUpdate'
                && p != 'componentWillUnmount' && p != 'render' && p != 'propTypes' && p != 'displayName') {
                componentProps[p] = specification[p];
            }
        }
        if (!specification.getInitialState) {
            specification.getInitialState = null;
        }

        function Comp(props) {
            this.state = specification.getInitialState ? (TRY_CATCH ? tryCatch(specification.getInitialState, specification, null, null, null) : specification.getInitialState()) : null;
            this.props = props;
            this.node = null;
            for (var p in componentProps) {
                var val = componentProps[p];
                this[p] = typeof val == 'function' ? val.bind(this) : val;
            }

            this._internalContext = null;
            this._internalParentComponent = null;
        }

        Comp.prototype = new Component(null);

        for (var method in ComponentProto) {
            Comp.prototype[method] = ComponentProto[method];
        }
        Comp.prototype.componentWillMount = specification.componentWillMount;
        Comp.prototype.componentDidMount = specification.componentDidMount;
        Comp.prototype.componentWillReceiveProps = specification.componentWillReceiveProps;
        Comp.prototype.shouldComponentUpdate = specification.shouldComponentUpdate;
        Comp.prototype.componentWillUpdate = specification.componentWillUpdate;
        Comp.prototype.componentDidUpdate = specification.componentDidUpdate;
        Comp.prototype.componentWillUnmount = specification.componentWillUnmount;
        Comp.prototype.render = specification.render;
        Comp.displayName = specification.displayName;
        Comp.propTypes = specification.propTypes;
        Comp.defaultProps = defaultProps;
        if (specification.statics) {
            for (var i in specification.statics) {
                Comp[i] = specification.statics[i];
            }
        }
        return Comp;
    }

    function unmountComponentAtNode(container) {
        render(null, container, null);
    }

    function createFactory(type) {
        return createElement.bind(null, type);
    }

    function spread(from) {
        for (var i = 1, len = arguments.length; i < len; i++) {
            var arg = arguments[i];
            for (var prop in arg) {
                from[prop] = arg[prop];
            }
        }
        return from;
    }

    var Children = {
        map: function (children, fn, thisArg) {
            return Children.toArray(children).map(fn, thisArg);
        },
        forEach: function (children, fn, thisArg) {
            return Children.toArray(children).forEach(fn, thisArg);
        },
        count: function (children) {
            return Children.toArray(children).length;
        },
        toArray: function (children) {
            if (children == null) {
                return [];
            }
            var vdom = norm(children);
            var ret = [];
            var type = vdom[0/*type*/];
            if (type == VArray) {
                var start = 4/*arrayFirstNode*/;
                for (var i = start; i < vdom.length; i++) {
                    ret = ret.concat(Children.toArray(vdom[i]));
                }
                return ret;
            }
            var tag = getTag(vdom);
            var childs = getChildren(vdom);
            var props = getProps(vdom);
            props.children = childs;
            var obj = vdom.slice();
            obj.type = tag;
            obj.key = getKey(vdom);
            obj.ref = getRef(vdom);
            obj.props = props;
            return [obj];
        },
        only: function (children) {
            if (!isValidElement(children)) {
                Throw(new Error('onlyChild must be passed a children with exactly one child.'));
            }
            return children;
        }
    };

    /**-------------------------------------**
     * Export
     **-------------------------------------**/
    module.exports = {
        Component: Component,
        findDOMNode: findDOMNode,
        createElement: createElement,
        render: render,
        renderDummy: renderDummy,
        PropTypes: PropTypes,
        cloneElement: cloneElement,
        isValidElement: isValidElement,
        createClass: createClass,
        unmountComponentAtNode: unmountComponentAtNode,
        createFactory: createFactory,
        Children: Children,
        TagType: VTag,
        ComponentType: VComponent,
        ArrayType: VArray,
        TextType: VText,
        __spread: spread
    };
    if (typeof window == 'object') {
        window.__FRC = VComponent;
        window.__FRT = VTag;
        window.__FRt = VText;
        window.__FRA = VArray;
    }
    function dummy(){return dummyNode;}
    var dummyNode = {
        firstChild: null,
        parentNode: null,
        textContent: '',
        setAttribute: dummy,
        addEventListener: dummy,
        removeEventListener: dummy,
        insertBefore: dummy,
        removeChild: dummy
    };
    dummyNode.firstChild = dummyNode;
    dummyNode.parentNode = dummyNode;
    var dummyDoc = {
        documentElement: dummyNode,
        appendChild: dummy,
        insertBefore: dummy,
        createElement: dummy,
        createElementNS: dummy,
        createTextNode: dummy
    }
})();
