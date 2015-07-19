import {VText, VTagNode, VNode, VComponent, VFragment} from './node';
import {append} from './append';
import {update, replaceNode} from './update';
import {normChild} from './utils';
import {attrs, props, events} from './const-attrs';
import {globs} from './component';

export function updateAttrs(old:VTagNode, parent:VNode, childPos:number):boolean {
    var node = <VTagNode>parent.children[childPos];
    if (node.attrs) {
        if (old.attrs) {
            createAttrs(node, old.attrs); // affect node.attrsCode
            return old.attrsCode === node.attrsCode;
        }
        else {
            return false;
        }
    }
    else if (old.attrs) {
        return false;
    }
    return true;
}

export function createAttrs(node:VTagNode, oldAttrs?:any) {
    var dom = <HTMLElement>node.dom;
    var attr:string;
    var prop:string;
    var event:string;
    for (var attrName in node.attrs) {
        node.attrsCode += attrName;
        var attrVal = node.attrs[attrName];
        if (attrName == 'key' || (oldAttrs && oldAttrs[attrName] === attrVal && attrName !== 'ref')) {
            continue;
        }
        if (prop = props[attrName]) {
            if (attrVal == null) {
                (<any>dom)[prop] = '';
            }
            else {
                (<any>dom)[prop] = attrVal;
            }
        }
        else if (attr = attrs[attrName]) {
            if (attrVal == null) {
                dom.removeAttribute(attr);
            }
            else {
                dom.setAttribute(attr, attrVal);
            }
        }
        else if (event = events[attrName]) {
            (<any>dom)['on' + event] = attrVal;
        }
        else if (attrName[0] === 'o' && attrName[1] === 'n') {
            event = attrName.substring(2).toLowerCase();
            (<any>dom)['on' + event] = attrVal;
        }
        else if (attrName[0] === 'd' && attrName[1] === 'a' && attrName[2] === 't' && attrName[3] === 'a') {
            if (attrVal == null) {
                dom.removeAttribute(attrName);
            }
            else {
                dom.setAttribute(attrName, attrVal);
            }
        }
        else if (attrName === 'style') {
            //todo:
        }
        else if (attrName == 'ref') {
            if (typeof attrVal == 'function') {
                attrVal(node);
            }
            else if (globs.component) {
                if (typeof globs.component.refs == 'undefined') {
                    globs.component.refs = {};
                }
                globs.component.refs[attrVal] = node;
            }
        }
    }
}