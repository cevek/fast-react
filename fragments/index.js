!function (global) {
    var undef = 'undefined';
    var typeText = new VText();
    var typeArray = new VArray();
    var typeTemplate = new VTemplate(null, null);
    var NodeProto = Node.prototype;

    function VDom() {}

    function VText() {}

    VText.prototype = new VDom();
    VText.prototype.constructor = VText;

    function VArray() {}

    VArray.prototype = new VDom();
    VArray.prototype.constructor = VArray;
    function VTemplate(render, argTypes, len, keyPos, refs) {
        this.render = render;
        this.argTypes = argTypes;
        this.len = len;
        this.keyPos = keyPos;
        this.refs = refs;
    }

    VTemplate.prototype = new VDom();
    VTemplate.prototype.constructor = VTemplate;

    NodeProto.setAttr = function (attrName, attrVal) {
        this.setAttribute(attrName, attrVal);
        return this;
    };
    NodeProto.setStyle = function (attrName, attrVal) {
        this.style[attrName] = attrVal;
        return this;
    };
    NodeProto.setAttrs = function (attrs) {
        for (var i in attrs) {
            this.setAttribute(i, attrs[i]);
        }
        return this;
    };
    NodeProto.setRef = function (vdom, i) {
        vdom[i] = this;
        return this;
    };

    NodeProto.addValueChild = function (parent, i) {
        create(parent, i, this);
        return this;
    };

    NodeProto.addChild = function (child) {
        if (child instanceof Node) {
            this.appendChild(child);
            return this;
        }
        this.appendChild(document.createTextNode(child));
        return this;
    };

    function norm(vdom, pos) {
        var child = vdom[pos];
        if (child == null) {
            vdom[pos] = [typeText, null, ''];
            return;
        }
        if (typeof child == 'object' && child.constructor === Array && child[0] instanceof VDom) {
            return;
        }
        if (child instanceof Array) {
            vdom[pos] = new Array(child.length + 3);
            vdom[pos][0] = typeArray;
            vdom[pos][2] = {};
            for (var j = 0; j < child.length; j++) {
                vdom[pos][j + 3] = child[j];
            }
            return;
        }
        vdom[pos] = [typeText, null, child];
    }

    function create(parent, pos, rootNode) {
        norm(parent, pos);
        var vdom = parent[pos];
        console.log("create", vdom);
        var type = vdom[0];
        var typeCtor = type.constructor;

        if (typeCtor == VTemplate) {
            //[type, node, ...values, ...refs, key]
            type.render(vdom, rootNode);
            if (rootNode) {
                rootNode.appendChild(vdom[1]);
            }
            if (type.keyPos > -1) {
                //parent should be array type
                parent[2/*keymap*/][vdom[type.keyPos]] = pos;
            }
        }
        else if (typeCtor == VText) {
            //[type, node, value]
            vdom[1] = document.createTextNode(vdom[2]);
            if (rootNode) {
                rootNode.appendChild(vdom[1]);
            }
        }
        else if (typeCtor == VArray) {
            //[type, node, keyMap, ...values]
            vdom[1] = rootNode;
            for (var i = 3; i < vdom.length; i++) {
                create(vdom, i, rootNode);
            }
        }
        return vdom;
    }

    function update(oldParent, oldPos, parent, pos) {
        norm(parent, pos);
        var old = oldParent[oldPos];
        var vdom = parent[pos];
        console.log("update", old, vdom);
        var type = vdom[0/*type*/];
        var typeCtor = type.constructor;
        //console.log("Update", vdom);
        if (typeCtor !== old[0/*type*/].constructor) {
            replace(oldParent, oldPos, parent, pos);
        }
        else if (typeCtor == VTemplate) {
            for (var i = 2; i < type.len + 2; i++) {
                var argType = type.argTypes[i - 2];
                var domEl = old[type.refs[i - 2]];
                console.log('argType', argType);
                if (argType[0] == 'attr') {
                    console.log("change attr");
                    if (vdom[i] !== old[i]) {
                        old[i] = vdom[i];
                        domEl.setAttribute(argType[1], vdom[i]);
                    }
                }
                else if (argType[0] == 'style') {
                    console.log("change style");
                    if (vdom[i] !== old[i]) {
                        old[i] = vdom[i];
                        domEl.style[argType[1]] = vdom[i];
                    }
                }
                else if (argType[0] == 'attrs') {
                    console.log("change attrs");
                    //todo: check diff
                    old[i] = vdom[i];
                    for (var attr in vdom[i]) {
                        if (vdom[i][attr] !== old[i][attr]) {
                            domEl.setAttribute(attr, vdom[i][attr]);
                        }
                    }
                }
                else if (argType[0] == 'children') {
                    update(old, i, vdom, i);
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
        return old;
    }

    function replace(oldParent, oldPos, parent, pos) {
        create(parent, pos, null);
        oldParent[oldPos][0].parentNode.replaceChild(parent[pos][1], oldParent[oldPos][1]);
        oldParent[oldPos] = parent[pos];
    }


    function updateChildren(oldParent, oldPos, vdom) {
        var old = oldParent[oldPos];
        //[type, node, keyMap, ...values]
        var inserts = [];


        var fitCount = 0;
        for (var i = 3; i < vdom.length; i++) {
            norm(vdom, i);
            var fitPos = null;
            var newKey = null;
            var newChild = vdom[i]; // only use before update
            var newChildType = newChild[0];
            if (old.length > i) {
                var oldChildType = old[i][0];
            }
            if (newChildType.constructor == VTemplate && newChildType.keyPos > -1) {
                newKey = newChild[newChildType.keyPos];
                // fitPos = old.keyMap[newKey];
                fitPos = old[2][newKey];
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
                    vdom[2][newKey] = i;
                }
                update(old, fitPos, vdom, i);
                //after update restore old
                vdom[i] = old[fitPos];
                if (fitPos !== i) {
                    inserts.push(i);
                }
                old[fitPos] = null;
            }
            else {
                inserts.push(i);
            }
        }

        if (old.length - 3 !== fitCount) {
            for (var i = 3; i < old.length; i++) {
                var oldChild = old[i];
                if (oldChild) {
                    remove(oldChild, old, i)
                }
                old[i] = null;
            }
        }


        for (var i = inserts.length - 1; i >= 0; i--) {
            var pos = inserts[i];

            if (i == vdom.length - 1) {
                var beforeChild = null;
            }
            else {
                beforeChild = vdom[pos + 1][1];
            }

            if (vdom[pos][1]) {
                move(vdom, vdom[pos], beforeChild);
            }
            else {
                create(vdom, pos, null);
                move(old[1], vdom[pos], beforeChild);
            }
        }
        oldParent[oldPos] = vdom;
    }

    function remove(vdom) {
        vdom[1].parentNode.removeChild(vdom[1]);
    }

    function move(parentNode, vdom, beforeChild) {
        if (vdom[1].nextSibling !== beforeChild) {
            parentNode.insertBefore(vdom[1], beforeChild);
        }
    }

    global.FastReact = {
        VTemplate: VTemplate,
        render: function (vdom, rootNode) {
            return create([typeTemplate, null, vdom], 2, rootNode);
        },
        update: function (old, vdom) {
            return update([typeTemplate, null, old], 2, [typeTemplate, null, vdom], 2);
        }
    };
}(window);
