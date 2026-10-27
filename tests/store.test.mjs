import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Shipway as S, validateOrder, saveOrder, startDraft, getOrders, addPickup, getPickups, stepErrors, getCatalogue, saveCatalogueProduct } from '../src/lib/store.js';
const memory=new Map();
globalThis.localStorage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,String(value))};
globalThis.window={dispatchEvent(){}};
beforeEach(()=>memory.clear());
function ready(){const d=S.load().draft;return {...d,buyer:{...d.buyer,name:'Test Buyer',phone:'9876543210',email:'buyer@example.com',line:'12 Market Road',pincode:'122001',city:'Gurugram',state:'Haryana'},products:[{...S.Store.products[0],qty:2}]}}
test('completeness rejects incomplete addresses, invalid packages, and excessive discounts',()=>{const order=ready();assert.equal(S.completeness(order).pct,100);assert.deepEqual(validateOrder(order),{});order.buyer.line='';assert.equal(S.completeness(order).pct,75);assert.ok(validateOrder(order).line);order.pack.w=-1;assert.ok(validateOrder(order).w);order.payment.discount=10000;assert.ok(validateOrder(order).discount)});
test('saved drafts survive reload and a new order does not overwrite them',()=>{const first=ready();saveOrder({...first,status:'Draft'});assert.equal(S.load().draft.buyer.name,'Test Buyer');const second=startDraft();assert.notEqual(second.id,first.id);assert.equal(getOrders().find(o=>o.id===first.id).products[0].qty,2);assert.equal(S.load().draft.id,second.id)});
test('saving edits never ships; confirmed status and latest values persist',()=>{const order=ready();saveOrder({...order,status:'New'});assert.equal(getOrders().find(o=>o.id===order.id).status,'New');saveOrder({...order,buyer:{...order.buyer,name:'Updated Buyer'},status:'Ready for Pickup',courier:'xb-s'});const saved=getOrders().find(o=>o.id===order.id);assert.equal(saved.status,'Ready for Pickup');assert.equal(saved.buyer.name,'Updated Buyer');assert.equal(saved.courier,'xb-s')});
test('pickup addresses remain reusable and address parsing supports recovery',()=>{const pickup=addPickup({label:'Test warehouse',line:'12 Test Street, Mumbai 400001',phone:'9876543210'});assert.equal(getPickups().find(p=>p.id===pickup.id).label,'Test warehouse');assert.equal(S.parseAddress('12 Test Street').ok,false);assert.equal(S.parseAddress('12 Test Street, Mumbai 400001').city,'Mumbai')});
test('a draft and its saved copy appear only once in the order list',()=>{const order=ready();saveOrder(order);saveOrder(order);assert.equal(getOrders().filter(o=>o.id===order.id).length,1)});

test('payment and packaging validate independently, with pickup owned by packaging',()=>{const order=ready();order.pack.w=0;order.pickup='';assert.deepEqual(stepErrors(order,3),{});assert.ok(stepErrors(order,4).w);assert.ok(stepErrors(order,4).pickup);assert.equal(stepErrors(order,1).pickup,undefined);order.payment.discount=10000;assert.ok(stepErrors(order,3).discount)});
test('custom catalogue products persist and can be used in a saved order',()=>{const product={sku:'CUSTOM-TEST',name:'Custom sample',price:175};saveCatalogueProduct(product);assert.equal(getCatalogue().find(p=>p.sku===product.sku).price,175);const order=ready();order.products=[{...product,qty:20}];saveOrder(order);assert.equal(S.orderTotal(getOrders().find(o=>o.id===order.id)),3500)});

test('demo orders cover every status and saved changes take precedence', () => {
  const rows = getOrders();
  for (const status of ['New', 'Ready for Pickup', 'In Transit', 'Draft']) assert.ok(rows.some(order => order.status === status));
  assert.ok(rows.length >= 11);
  assert.equal(new Set(rows.map(order => order.id)).size, rows.length);
  const sample = rows.find(order => order.id === 'DEMO-1001');
  assert.equal(S.completeness(sample).pct, 100);
  saveOrder({...sample, products: [{...sample.products[0], qty: 9}]});
  assert.equal(getOrders().find(order => order.id === sample.id).products[0].qty, 9);
});
