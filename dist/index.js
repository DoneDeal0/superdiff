'use strict';

var u={ADDED:"added",EQUAL:"equal",DELETED:"deleted",UPDATED:"updated"},d={...u,MOVED:"moved"},y={BASIC:"basic",DEEP:"deep"};function D(e,t,i={ignoreArrayOrder:!1}){return typeof e!=typeof t?!1:Array.isArray(e)?e.length!==t.length?!1:i.ignoreArrayOrder?e.every(f=>t.some(n=>JSON.stringify(n)===JSON.stringify(f))):e.every((f,n)=>JSON.stringify(f)===JSON.stringify(t[n])):typeof e=="object"?JSON.stringify(e)===JSON.stringify(t):e===t}function p(e){return !!e&&typeof e=="object"&&!Array.isArray(e)}function O(e,t={statuses:[],granularity:y.BASIC}){let{statuses:i,granularity:f}=t;return e.reduce((n,r)=>{if(f===y.DEEP&&r.subPropertiesDiff){let s=O(r.subPropertiesDiff,t);if(s.length>0)return [...n,{...r,subPropertiesDiff:s}]}if(f===y.DEEP&&r.subDiff){let s=O(r.subDiff,t);if(s.length>0)return [...n,{...r,subDiff:s}]}return i.includes(r.status)?[...n,r]:n},[])}function E(e){return e.some(t=>t.status!==u.EQUAL)?u.UPDATED:u.EQUAL}function A(e,t,i={ignoreArrayOrder:!1,showOnly:{statuses:[],granularity:y.BASIC}}){if(!e)return {type:"object",status:u.EQUAL,diff:[]};let f=[];return Object.entries(e).forEach(([n,r])=>{if(p(r)){let s=[];return Object.entries(r).forEach(([o,c])=>{s.push({property:o,previousValue:t===u.ADDED?void 0:c,currentValue:t===u.ADDED?c:void 0,status:t});}),f.push({property:n,previousValue:t===u.ADDED?void 0:e[n],currentValue:t===u.ADDED?r:void 0,status:t,subPropertiesDiff:s})}return f.push({property:n,previousValue:t===u.ADDED?void 0:e[n],currentValue:t===u.ADDED?r:void 0,status:t})}),i.showOnly&&i.showOnly.statuses.length>0?{type:"object",status:t,diff:O(f,i.showOnly)}:{type:"object",status:t,diff:f}}function P(e,t,i){if(!e)return;let f=Object.entries(e).find(([n])=>D(n,t,i));return f?f[1]:void 0}function j(e,t,i){return D(e,t,i)?u.EQUAL:u.UPDATED}function U(e){return e.some(t=>t.status!==u.EQUAL)?u.UPDATED:u.EQUAL}function g(e,t){if(!e)return;let i=Object.keys(e),f=Object.keys(t),n=i.filter(r=>!f.includes(r));if(n.length>0)return n.map(r=>({property:r,value:e[r]}))}function S(e,t,i){let f=[],n,r=g(e,t);return r&&r.forEach(s=>{f.push({property:s.property,previousValue:s.value,currentValue:void 0,status:u.DELETED});}),Object.entries(t).forEach(([s,o])=>{let c=P(e,s,i);if(!c)return f.push({property:s,previousValue:c,currentValue:o,status:!e||!(s in e)?u.ADDED:c===o?u.EQUAL:u.UPDATED});if(p(o)){let a=S(c,o,i);a&&a.length>0&&(n=a);}c&&f.push({property:s,previousValue:c,currentValue:o,status:j(c,o,i),...!!n&&{subDiff:n}});}),f}function m(e,t,i={ignoreArrayOrder:!1,showOnly:{statuses:[],granularity:y.BASIC}}){if(!e&&!t)return {type:"object",status:u.EQUAL,diff:[]};if(!e)return A(t,u.ADDED,i);if(!t)return A(e,u.DELETED,i);let f=[];Object.entries(t).forEach(([r,s])=>{let o=e[r];if(!o)return f.push({property:r,previousValue:o,currentValue:s,status:r in e?o===s?u.EQUAL:u.UPDATED:u.ADDED});if(p(s)){let c=S(o,s,i),a=U(c);return f.push({property:r,previousValue:o,currentValue:s,status:a,...a!==u.EQUAL&&{subPropertiesDiff:c}})}return f.push({property:r,previousValue:o,currentValue:s,status:j(o,s,i)})});let n=g(e,t);return n&&n.forEach(r=>{f.push({property:r.property,previousValue:r.value,currentValue:void 0,status:u.DELETED});}),i.showOnly&&i.showOnly.statuses.length>0?{type:"object",status:E(f),diff:O(f,i.showOnly)}:{type:"object",status:E(f),diff:f}}function w(e,t=[]){return e.filter(i=>t?.includes(i.status))}function h(e,t,i={showOnly:[]}){let f=e.map((n,r)=>({value:n,prevIndex:t===d.ADDED?null:r,newIndex:t===d.ADDED?r:null,indexDiff:null,status:t}));return i.showOnly&&i.showOnly.length>0?{type:"list",status:t,diff:f.filter(n=>i.showOnly?.includes(n.status))}:{type:"list",status:t,diff:f}}function L(e){return e.some(t=>t.status!==d.EQUAL)?d.UPDATED:d.EQUAL}function T(e,t){return p(e)&&t?Object.hasOwn(e,t):!1}var I=(e,t,i={showOnly:[],referenceProperty:void 0,considerMoveAsUpdate:!1})=>{if(!e&&!t)return {type:"list",status:d.EQUAL,diff:[]};if(!e)return h(t,d.ADDED,i);if(!t)return h(e,d.DELETED,i);let f=[],n=[];return t.forEach((r,s)=>{let o=e.findIndex((a,b)=>T(a,i.referenceProperty)?p(r)?D(a[i.referenceProperty],r[i.referenceProperty])&&!n.includes(b):!1:D(a,r)&&!n.includes(b));o>-1&&n.push(o);let c=o===-1?null:s-o;if(c===0){let a=d.EQUAL;return T(r,i.referenceProperty)&&(D(e[o],r)||(a=d.UPDATED)),f.push({value:r,prevIndex:o,newIndex:s,indexDiff:c,status:a})}return o===-1?f.push({value:r,prevIndex:null,newIndex:s,indexDiff:c,status:d.ADDED}):f.push({value:r,prevIndex:o,newIndex:s,indexDiff:c,status:i.considerMoveAsUpdate?d.UPDATED:d.MOVED})}),e.forEach((r,s)=>{if(!n.includes(s))return f.splice(s,0,{value:r,prevIndex:s,newIndex:null,indexDiff:null,status:d.DELETED})}),i.showOnly&&i?.showOnly?.length>0?{type:"list",status:L(f),diff:w(f,i.showOnly)}:{type:"list",status:L(f),diff:f}};

exports.getListDiff = I;
exports.getObjectDiff = m;
exports.isEqual = D;
exports.isObject = p;
