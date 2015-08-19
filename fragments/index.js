!function (global) {
    var typeText = new VText();
    var typeArray = new VArray();
    var typeTemplate = new VTemplate(null, null);

    function VDom() {}

    VDom.prototype.vdom = true;

    function VText() {}

    VText.prototype = new VDom();
    VText.prototype.constructor = VText;

    function VArray() {}

    VArray.prototype = new VDom();
    VArray.prototype.constructor = VArray;


    //[VComponent, node, Ctor, instance, props, children, key]
    function VComponent() {}

    VComponent.prototype = new VDom();
    VComponent.prototype.constructor = VComponent;


    function VTemplate(render, argTypes, len, keyPos, refs) {
        this.render = render;
        this.argTypes = argTypes;
        this.len = len;
        this.keyPos = keyPos;
        this.refs = refs;
    }

    VTemplate.prototype = new VDom();
    VTemplate.prototype.constructor = VTemplate;

    function norm(child, vdom, pos) {
        var newChild;
        if (child == null) {
            newChild = vdom[pos] = [typeText, null, ''];
            return newChild;
        }
        if (typeof child == 'object' && child.constructor === Array && typeof child[0].vdom == 'boolean') {
            return child;
        }
        if (child.constructor == Array) {
            var p = new Array(child.length + 4);
            p[0] = typeArray;
            //p[2] = {};
            p[3] = child;
            vdom[pos] = p;
            return p;
        }
        newChild = vdom[pos] = [typeText, null, child];
        return newChild;
    }

    function create(vdom, parent, pos, rootNode, before) {
        //vdom = norm(vdom, parent, pos);

        //console.log("create", vdom);
        var type = vdom[0];
        var typeCtor = type.constructor;

        if (typeCtor == VTemplate) {
            //[type, node, ...values, ...refs, key]
            type.render(vdom, rootNode);
            rootNode.insertBefore(vdom[1], before);
            if (parent && type.keyPos > -1) {
                //parent should be array type
                parent[2/*keymap*/][vdom[vdom.length - 1]] = pos;
            }
        }
        else if (typeCtor == VText) {
            //[type, node, value]
            vdom[1] = document.createTextNode(vdom[2]);
            rootNode.appendChild(vdom[1]);
        }
        else if (typeCtor == VArray) {
            //[type, node, keyMap, sourceArray,...values]
            vdom[1] = rootNode;
            vdom[2] = {};
            //iterate source array
            var sourceArray = vdom[3];
            for (var i = 0; i < sourceArray.length; i++) {
                create(vdom[i + 4] = sourceArray[i], vdom, i + 4, rootNode);
            }
            vdom[3] = null;
        }
        else if (typeCtor == VComponent) {
            createComponent(vdom, rootNode);
        }
        return vdom;
    }

    function update(oldParent, oldPos, old, vdom) {
        //vdom = norm(vdom, parent, pos);
        //console.log("update", old, vdom);
        var type = vdom[0/*type*/];
        var typeCtor = type.constructor;
        //console.log("Update", vdom);
        if (typeCtor !== old[0/*type*/].constructor) {
            replace(oldParent, oldPos, old, vdom);
        }
        else if (typeCtor == VTemplate) {
            for (var i = 2; i < type.len + 2; i++) {
                var argType = type.argTypes[i - 2];
                var domEl = old[type.refs[i - 2]];
                //console.log('argType', argType);
                var child = vdom[i];
                var oldChild = old[i];
                if (argType[0] == 'children') {
                    update(old, i, oldChild, norm(child, vdom, i));
                }
                else if (argType[0] == 'attr') {
                    //console.log("change attr");
                    if (child !== oldChild) {
                        old[i] = child;
                        domEl.setAttribute(argType[1], child);
                    }
                }
                else if (argType[0] == 'style') {
                    //console.log("change style");
                    if (child !== oldChild) {
                        old[i] = child;
                        domEl.style[argType[1]] = child;
                    }
                }
                else if (argType[0] == 'attrs') {
                    //console.log("change attrs");
                    //todo: check diff
                    old[i] = child;
                    for (var attr in child) {
                        if (child[attr] !== oldChild[attr]) {
                            domEl.setAttribute(attr, child[attr]);
                        }
                    }
                }
            }
        }
        else if (typeCtor == VText) {
            if (vdom[2/*children*/] !== old[2/*children*/]) {
                old[2] = vdom[2];
                old[1].textContent = vdom[2];
            }
        }
        else if (typeCtor == VArray) {
            //replace old child with new
            updateChildren(oldParent, oldPos, vdom);
        }
        else if (typeCtor == VComponent) {
            updateComponent(oldParent, oldPos, old, vdom);
        }
        return old;
    }

    function replace(oldParent, oldPos, old, vdom) {
        var parentNode = old[1].parentNode;
        create(vdom, null, null, parentNode, old[1]);
        remove(parentNode, old);
        oldParent[oldPos] = vdom;
    }


    function updateChildren(oldParent, oldPos, vdom) {
        var old = oldParent[oldPos];
        var rootNode = old[1];
        vdom[1] = rootNode;
        var keyMap = old[2];
        vdom[2] = keyMap;
        var oldLen = old.length;
        var sourceArray = vdom[3];
        if (oldLen == 4) {
            for (var i = 4; i < sourceArray.length + 4; i++) {
                create(vdom[i] = norm(sourceArray[i - 4]), vdom, i, rootNode, null);
            }
            oldParent[oldPos] = vdom;
            return;
        }
        if (vdom.length == 4) {
            for (var i = 4; i < old.length; i++) {
                remove(rootNode, old[i]);
            }
            oldParent[oldPos] = vdom;
            return;
        }

        //[type, node, keyMap, sourceArray, ...values]
        var inserts = null;

        var fitCount = 0;
        var sourceArray = vdom[3];
        for (var i = 4; i < vdom.length; i++) {
            var newChild = norm(vdom[i] = sourceArray[i - 4], vdom, i);
            var oldChild = old[i];
            var fitPos = null;
            var newKey = null;
            var newChildType = newChild[0];
            if (old.length > i && oldChild != null) {
                var oldChildType = oldChild[0];
            }
            if (newChildType.constructor == VTemplate && newChildType.keyPos > -1) {
                newKey = newChild[newChild.length - 1];
                // fitPos = old.keyMap[newKey];
                fitPos = keyMap[newKey];
            }
            else {
                if (oldChildType && (oldChildType.constructor !== VTemplate || oldChildType.keyPos == -1)) {
                    fitPos = i;
                }
            }

            if (fitPos != null) {
                fitCount++;
                if (newKey != null) {
                    // vdom.keymap[newKey] = i;
                    keyMap[newKey] = i;
                }
                //todo:check
                vdom[i] = update(old, fitPos, old[fitPos], newChild);
                //after update restore old
                //vdom[i] = old[fitPos];
                if (fitPos !== i) {
                    if (inserts == null) {
                        inserts = [];
                    }
                    inserts.push(i);
                }
                old[fitPos] = null;
            }
            else {
                keyMap[newKey] = i;
                if (inserts == null) {
                    inserts = [];
                }
                inserts.push(i);
            }
        }
        vdom[3] = null; // clear source array

        var oldLenFull = oldLen - 4;
        if (oldLenFull > fitCount) {
            for (var i = 4; i < oldLen; i++) {
                var oldChild = old[i];
                if (oldChild) {
                    keyMap[oldChild[oldChild.length - 1]] = null;
                    remove(rootNode, oldChild);
                    old[i] = null;
                    if (oldLenFull == ++fitCount) {
                        break;
                    }
                }
            }
        }

        if (inserts) {
            for (var i = inserts.length - 1; i >= 0; i--) {
                var pos = inserts[i];
                var child = vdom[pos];

                if (pos == vdom.length - 1) {
                    var beforeChild = null;
                }
                else {
                    beforeChild = vdom[pos + 1][1];
                }

                if (child[1]) {
                    move(rootNode, child, beforeChild);
                }
                else {
                    create(child, vdom, pos, rootNode, beforeChild);
                }
            }
        }
        oldParent[oldPos] = vdom;
    }

    function remove(parentNode, vdom) {
        parentNode.removeChild(vdom[1]);
    }

    function move(parentNode, vdom, beforeChild) {
        if (vdom[1].nextSibling !== beforeChild) {
            parentNode.insertBefore(vdom[1], beforeChild);
        }
    }

    function updateComponent(oldParent, oldPos, old, vdom) {
        // 0           1     2     3         4      5         6
        //[VComponent, node, Ctor, instance, props, children, key]
        if (old[2] !== vdom[2]) {
            replace(oldParent, oldPos, old, vdom);
        }
        else {
            var component = old[3];
            var props = vdom[4];
            component.componentWillReceiveProps(props);
            component.props = old[4] = props;
            component.forceUpdate();
            //destroy(newNode);
        }
    }

    function createComponent(vdom, rootNode) {
        // 0           1     2     3         4      5         6
        //[VComponent, node, Ctor, instance, props, children, key]
        vdom[1] = rootNode;
        var props = vdom[4];
        var component = vdom[3] = new vdom[2](props);
        component.node = vdom;
        component.componentWillMount();
        vdom[3] = component.render();
        var prevComponent = globs.component;
        globs.component = component;
        create(norm(vdom[5], vdom, 5), null, rootNode, vdom[1]);
        globs.component = prevComponent;
        component.componentDidMount();
    }

    function findDOMNode(vdom) {
        return vdom[1];
    }

    function Component() {}

    var ComponentProto = Component.prototype;
    ComponentProto.componentWillMount = function () {};
    ComponentProto.componentDidMount = function () {};
    ComponentProto.componentWillUpdate = function () {};
    ComponentProto.componentDidUpdate = function () {};
    ComponentProto.componentWillReceiveProps = function () {};
    ComponentProto.componentWillUnmount = function () {}; //todo
    ComponentProto.setState = function () {}; //todo
    ComponentProto.render = function () {return null};
    ComponentProto.forceUpdate = function () {
        // 0           1     2     3         4      5         6
        //[VComponent, node, Ctor, instance, props, children, key]
        this.componentWillUpdate();
        var prevComponent = globs.component;
        globs.component = this;
        update(this.node, 5, this.node[5], this.render());
        globs.component = prevComponent;
        this.componentDidUpdate();
    };

    global.FastReact = {
        VTemplate: VTemplate,
        create: create,
        Component: Component,
        findDOMNode: findDOMNode,
        render: function (vdom, rootNode) {
            return create(vdom, null, null, rootNode, null);
        },
        update: function (old, vdom) {
            return update([typeTemplate, null, old], 2, old, vdom);
        }
    };
}(window);