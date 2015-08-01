import {NodeType, VText, VTagNode, VNode, VComponent, VFragment} from './node';
import {normChild, destroy} from './utils';
import {remove} from './remove';
import {append} from './append';
import {updateChildren} from './update-children';
import {updateAttrs} from './attrs';
import {updateComponent} from './component';

export function update(old:VNode, parent:VNode, childPos:number) {
    var node = parent.children[childPos];

    if (old.type !== node.type) {
        replaceNode(old, parent, childPos);
        return;
    }
    if (node.type == NodeType.TEXT) {
        node.dom = (<VText>old).dom;
        if ((<VText>old).text !== (<VText>node).text) {
            node.dom.textContent = (<VText>node).text;
        }
        destroy(old);
        //old.destroy();
        return;
    }

    if (typeof node.key !== 'undefined') {
        if (typeof parent.keyMap == 'undefined') {
            parent.keyMap = {}
        }
        parent.keyMap[node.key] = childPos;
    }

    if (node.type == NodeType.TAG) {
        if ((<VTagNode>old).tag !== (<VTagNode>node).tag) {
            replaceNode(old, parent, childPos);
            return;
        }
        node.dom = (<VTagNode>old).dom;

        updateAttrs(<VTagNode>old, parent, childPos);
    }
    else if (node.type == NodeType.FRAGMENT || node.type == NodeType.COMPONENT) {
        if (node.type == NodeType.COMPONENT) {
            if ((<VComponent>old).ctor !== (<VComponent>node).ctor) {
                replaceNode(old, parent, childPos);
                return;
            }
            updateComponent(<VComponent>old, parent, childPos);
            return;
        }
        (<VFragment>node).lastNode = (<VFragment>old).lastNode;
        (<VFragment>node).firstNode = (<VFragment>old).firstNode;
        node.dom = (<VFragment>old).dom;
    }

    updateChildren(old, node);
    destroy(old);
    //old.destroy();
}

export function replaceNode(old:VNode, parent:VNode, childPos:number) {
    append(parent, childPos, old instanceof VFragment ? old.firstNode : (<VTagNode>old).dom);
    remove(old, parent);
}