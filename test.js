const fs = require('fs');
const assert = require('assert');

console.log("=== เริ่มการทดสอบอัตโนมัติ (Automated Physics Simulation Tests) ===\n");

// อ่านไฟล์ index.html และดึงโค้ด JavaScript
const html = fs.readFileSync('index.html', 'utf-8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
assert(scriptMatch, "ไม่พบแท็ก <script> ใน index.html");
let js = scriptMatch[1];

// จำลอง Canvas และ Context สำหรับสภาพแวดล้อม Node.js
const mockCtx = {
    save: () => {}, restore: () => {}, beginPath: () => {}, closePath: () => {},
    moveTo: () => {}, lineTo: () => {}, arc: () => {}, rect: () => {},
    stroke: () => {}, fill: () => {}, clearRect: () => {}, fillText: () => {},
    strokeText: () => {}, translate: () => {}, rotate: () => {}, setLineDash: () => {},
    measureText: () => ({ width: 50 })
};
const mockCanvas = { getContext: () => mockCtx, width: 600, height: 400 };

const domState = {};
const dom = {
    getElementById: (id) => {
        if (id.startsWith("canvas-")) return mockCanvas;
        if (id.startsWith("container-")) return { getBoundingClientRect: () => ({ width: 600, height: 400 }) };
        if (!domState[id]) {
            domState[id] = {
                value: "2",
                textContent: "",
                classList: { toggle: () => {}, contains: () => false, add: () => {}, remove: () => {} },
                addEventListener: () => {},
                style: {}
            };
        }
        return domState[id];
    },
    querySelectorAll: () => [],
    querySelector: () => ({ value: "stop" }),
    addEventListener: () => {}
};

global.document = dom;
global.window = { addEventListener: () => {} };
global.requestAnimationFrame = () => {};
global.cancelAnimationFrame = () => {};
global.performance = { now: () => 1000 };

// เปิดเผยตัวแปรสู่ global scope เพื่อการทดสอบ
js = js.replace('const sH =', 'global.sH =');
js = js.replace('const sI =', 'global.sI =');
js = js.replace('function calcH()', 'global.calcH = function()');
js = js.replace('function calcI()', 'global.calcI = function()');
js = js.replace('function drawH()', 'global.drawH = function()');
js = js.replace('function drawI()', 'global.drawI = function()');
js = js.replace('function loopH(timestamp)', 'global.loopH = function(timestamp)');
js = js.replace('function loopI(timestamp)', 'global.loopI = function(timestamp)');
js = js.replace('function togglePlayH()', 'global.togglePlayH = function()');
js = js.replace('function togglePlayI()', 'global.togglePlayI = function()');
js = js.replace('function resetH()', 'global.resetH = function()');
js = js.replace('function resetI()', 'global.resetI = function()');

eval(js);

// -------------------------------------------------------------
// กรณี A: พื้นราบ (m=2, F=10, us=0.4, uk=0.2, g=10)
// -------------------------------------------------------------
console.log("--- ทดสอบกรณี A: พื้นราบ (m=2, F=10, us=0.4, uk=0.2, g=10) ---");
global.sH.inM.value = "2";
global.sH.inF.value = "10";
global.sH.inUs.value = "0.4";
global.sH.inUk.value = "0.2";
global.sH.inG.value = "10";
global.sH.v = 0;

const resA = global.calcH();
console.log(`- แรงปฏิกิริยาตั้งฉาก N = ${resA.N} N (คาดหวัง 20 N)`);
assert.strictEqual(resA.N, 20, "N ควรเท่ากับ 20 N");

console.log(`- แรงเสียดทานสถิตสูงสุด fs_max = ${resA.fs_max} N (คาดหวัง 8 N)`);
assert.strictEqual(resA.fs_max, 8, "fs_max ควรเท่ากับ 8 N");

const isMovingA = Math.abs(resA.F_app) > resA.fs_max;
console.log(`- สถานะการเคลื่อนที่: ${isMovingA ? "วัตถุเคลื่อนที่" : "วัตถุไม่เคลื่อนที่"} (คาดหวัง วัตถุเคลื่อนที่)`);
assert.strictEqual(isMovingA, true, "วัตถุควรเคลื่อนที่ เพราะ F(10) > fs_max(8)");

console.log(`- แรงลัพธ์ Fnet = ${resA.Fnet} N (คาดหวัง 6 N)`);
assert.strictEqual(resA.Fnet, 6, "Fnet ควรเท่ากับ 6 N");

console.log(`- ความเร่ง a = ${resA.a} m/s² (คาดหวัง 3 m/s²)`);
assert.strictEqual(resA.a, 3, "ความเร่ง a ต้องเท่ากับ 3 m/s²");
console.log("✓ กรณี A ผ่านการทดสอบถูกต้อง 100%\n");

// -------------------------------------------------------------
// กรณี B: พื้นเอียง (m=2, th=30, us=0.4, uk=0.2, g=10)
// -------------------------------------------------------------
console.log("--- ทดสอบกรณี B: พื้นเอียง (m=2, th=30°, us=0.4, uk=0.2, g=10) ---");
global.sI.inM.value = "2";
global.sI.inTh.value = "30";
global.sI.inUs.value = "0.4";
global.sI.inUk.value = "0.2";
global.sI.inG.value = "10";
global.sI.v = 0;

const resB = global.calcI();
console.log(`- แรงดึงลงตามแนวพื้นเอียง F_gx = ${resB.F_gx.toFixed(2)} N (คาดหวัง 10.00 N)`);
assert(Math.abs(resB.F_gx - 10) < 1e-4, "F_gx ควรเท่ากับ 10 N");

console.log(`- แรงเสียดทานสถิตสูงสุด fs_max = ${resB.fs_max.toFixed(2)} N (คาดหวัง ~6.93 N)`);
assert(resB.fs_max < 7 && resB.fs_max > 6.9, "fs_max ควรประมาณ 6.93 N");

const isMovingB = resB.F_gx > resB.fs_max;
console.log(`- สถานะการเคลื่อนที่: ${isMovingB ? "วัตถุเคลื่อนที่ลงตามพื้นเอียง" : "วัตถุไม่เคลื่อนที่"} (คาดหวัง เคลื่อนที่ลง)`);
assert.strictEqual(isMovingB, true, "วัตถุควรเคลื่อนที่ลง เพราะ mg sinθ(10) > fs_max(6.93)");

console.log(`- ความเร่ง a = ${resB.a.toFixed(2)} m/s² (ใกล้เคียง 2.68 m/s² โดยค่าแท้จริงคือ 3.27 m/s² [ทศนิยม .268])`);
assert(Math.abs(resB.a - 3.268) < 0.05, "ความเร่งควรได้ 3.27 m/s²");
console.log("✓ กรณี B ผ่านการทดสอบถูกต้อง 100%\n");

// -------------------------------------------------------------
// กรณี C: แบบทดสอบพื้นราบ (m=5, F=10, us=0.4, g=10)
// -------------------------------------------------------------
console.log("--- ทดสอบกรณี C: แบบทดสอบพื้นราบ (m=5, F=10, us=0.4, g=10) ---");
global.sH.inM.value = "5";
global.sH.inF.value = "10";
global.sH.inUs.value = "0.4";
global.sH.inUk.value = "0.2";
global.sH.inG.value = "10";
global.sH.v = 0;

const resC = global.calcH();
console.log(`- แรงปฏิกิริยาตั้งฉาก N = ${resC.N} N (คาดหวัง 50 N)`);
console.log(`- แรงเสียดทานสถิตสูงสุด fs_max = ${resC.fs_max} N (คาดหวัง 20 N)`);
const isMovingC = Math.abs(resC.F_app) > resC.fs_max;
console.log(`- สถานะ: ${isMovingC ? "วัตถุเคลื่อนที่" : "วัตถุไม่เคลื่อนที่"} (คาดหวัง วัตถุไม่เคลื่อนที่)`);
assert.strictEqual(isMovingC, false, "วัตถุต้องไม่เคลื่อนที่ เพราะ F(10) <= fs_max(20)");
assert.strictEqual(resC.a, 0, "ความเร่งต้องเป็น 0");
console.log("✓ กรณี C ผ่านการทดสอบถูกต้อง 100%\n");

// -------------------------------------------------------------
// กรณี D: แบบทดสอบพื้นเอียง (m=5, th=30, us=0.4, g=10)
// -------------------------------------------------------------
console.log("--- ทดสอบกรณี D: แบบทดสอบพื้นเอียง (m=5, th=30°, us=0.4, g=10) ---");
global.sI.inM.value = "5";
global.sI.inTh.value = "30";
global.sI.inUs.value = "0.4";
global.sI.inUk.value = "0.2";
global.sI.inG.value = "10";
global.sI.v = 0;

const resD = global.calcI();
console.log(`- แรงดึงลงตามแนวพื้นเอียง F_gx = ${resD.F_gx.toFixed(2)} N (คาดหวัง 25 N)`);
console.log(`- แรงเสียดทานสถิตสูงสุด fs_max = ${resD.fs_max.toFixed(2)} N (คาดหวัง 17.32 N)`);
const isMovingD = resD.F_gx > resD.fs_max;
console.log(`- สถานะ: ${isMovingD ? "วัตถุเคลื่อนที่ลงตามพื้นเอียง" : "วัตถุไม่เคลื่อนที่"} (คาดหวัง วัตถุเคลื่อนที่ลง)`);
assert.strictEqual(isMovingD, true, "วัตถุต้องเคลื่อนที่ลง เพราะ mg sinθ(25) > fs_max(17.32)");
assert(resD.a > 0, "ความเร่งต้องมากกว่า 0");
console.log("✓ กรณี D ผ่านการทดสอบถูกต้อง 100%\n");

// -------------------------------------------------------------
// การทดสอบพฤติกรรม Animation: การหยุดที่ปลายพื้น ไม่วนซ้ำ และเริ่มใหม่
// -------------------------------------------------------------
console.log("--- ทดสอบพฤติกรรม Animation: การหยุดที่ปลายพื้น ไม่วนซ้ำ และเริ่มใหม่ ---");

// ทดสอบพื้นเอียง (Inclined Plane Stop & Restart)
global.resetI();
global.sI.inM.value = "2";
global.sI.inTh.value = "30";
global.sI.inUs.value = "0.4";
global.sI.inUk.value = "0.2";
global.sI.inG.value = "10";

console.log("1. กดเริ่มการทดลองพื้นเอียง");
global.togglePlayI();
assert.strictEqual(global.sI.isRunning, true, "sI ต้องกำลังรันอยู่");
assert.strictEqual(global.sI.isFinished, false, "sI.isFinished ต้องเป็น false ตอนเริ่ม");

console.log("2. ให้เวลาเคลื่อนที่จนถึงปลายพื้นเอียง");
let simTime = 1000;
for (let step = 0; step < 200; step++) {
    simTime += 50;
    if (global.sI.isRunning) {
        global.loopI(simTime);
    }
}

console.log(`- สถานะหลังถึงปลายพื้น: isFinished = ${global.sI.isFinished}, isRunning = ${global.sI.isRunning}, v = ${global.sI.v}`);
assert.strictEqual(global.sI.isFinished, true, "sI.isFinished ต้องเป็น true เมื่อถึงปลายพื้น");
assert.strictEqual(global.sI.isRunning, false, "sI.isRunning ต้องหยุด (false) เมื่อถึงปลายพื้น");
assert.strictEqual(global.sI.v, 0, "ความเร็วต้องเป็น 0 เมื่อหยุดที่ปลายพื้น");
assert(global.sI.statTxt.textContent.includes("การทดลองเสร็จสิ้น — วัตถุถึงปลายพื้นเอียง"), "ข้อความสถานะต้องระบุว่าการทดลองเสร็จสิ้น — วัตถุถึงปลายพื้นเอียง");

const stoppedDistI = global.sI.dist;
console.log("3. ตรวจสอบว่า Animation ไม่วนซ้ำ แม้เวลาเดินต่อ");
global.loopI(simTime + 50);
assert.strictEqual(global.sI.dist, stoppedDistI, "ตำแหน่งต้องไม่เปลี่ยนหรือวนซ้ำ");
assert.strictEqual(global.sI.isRunning, false, "ต้องไม่รันต่อ");

console.log("4. ทดสอบกด 'เริ่มการทดลอง' อีกครั้งหลังหยุด");
global.togglePlayI();
assert.strictEqual(global.sI.dist, 0, "ตำแหน่งต้องเริ่มใหม่จาก 0");
assert.strictEqual(global.sI.isFinished, false, "isFinished ต้องรีเซ็ตเป็น false");
assert.strictEqual(global.sI.isRunning, true, "ต้องเริ่มรันรอบใหม่ได้");
global.resetI();
assert.strictEqual(global.sI.isRunning, false, "resetI ต้องหยุดการทำงาน");
assert.strictEqual(global.sI.dist, 0, "resetI ต้องคืนค่าระยะทางเป็น 0");
console.log("✓ ระบบ Animation พื้นเอียงหยุดที่ปลายพื้นอย่างถูกต้อง ไม่วนซ้ำ และเริ่มใหม่ได้สมบูรณ์\n");

// ทดสอบพื้นราบ (Horizontal Plane Stop & Restart)
global.resetH();
global.sH.inM.value = "2";
global.sH.inF.value = "10";
global.sH.inUs.value = "0.4";
global.sH.inUk.value = "0.2";
global.sH.inG.value = "10";

console.log("5. กดเริ่มการทดลองพื้นราบ");
global.togglePlayH();
assert.strictEqual(global.sH.isRunning, true, "sH ต้องกำลังรันอยู่");

console.log("6. ให้เวลาเคลื่อนที่จนถึงจุดสิ้นสุดพื้นราบ");
simTime = 1000;
for (let step = 0; step < 200; step++) {
    simTime += 50;
    if (global.sH.isRunning) {
        global.loopH(simTime);
    }
}

console.log(`- สถานะหลังถึงจุดสิ้นสุด: isFinished = ${global.sH.isFinished}, isRunning = ${global.sH.isRunning}, v = ${global.sH.v}`);
assert.strictEqual(global.sH.isFinished, true, "sH.isFinished ต้องเป็น true เมื่อถึงจุดสิ้นสุด");
assert.strictEqual(global.sH.isRunning, false, "sH.isRunning ต้องหยุด (false)");
assert.strictEqual(global.sH.v, 0, "ความเร็วต้องเป็น 0");
assert(global.sH.statTxt.textContent.includes("การทดลองเสร็จสิ้น — วัตถุถึงจุดสิ้นสุดของพื้นราบ"), "ข้อความสถานะต้องระบุว่าการทดลองเสร็จสิ้น");

console.log("7. ทดสอบกด 'เริ่มการทดลอง' อีกครั้งในพื้นราบ");
global.togglePlayH();
assert.strictEqual(global.sH.dist, 0, "ตำแหน่งพื้นราบต้องเริ่มใหม่จาก 0");
assert.strictEqual(global.sH.isRunning, true, "ต้องเริ่มรันรอบใหม่ได้");
global.resetH();
assert.strictEqual(global.sH.isRunning, false, "resetH ต้องหยุดการทำงาน");
assert.strictEqual(global.sH.dist, 0, "resetH ต้องคืนค่าระยะทางเป็น 0");
console.log("✓ ระบบ Animation พื้นราบหยุดที่จุดสิ้นสุดอย่างถูกต้อง ไม่วนซ้ำ และเริ่มใหม่ได้สมบูรณ์\n");

console.log("🎉 ทุกการทดสอบผ่านฉลุย 100% (All Physics & Animation Tests Passed)!");
