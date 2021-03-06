// const t05 = require("./btrees/t05.xml");
// const testTree14 = require("./btrees/testTree14.xml");
const testTree5 = require("./btrees/testTree5.xml");
// const fs = require('fs');

import {BehaviorTreeZmq} from '../src/index'

import testData from './data/data'
// import {getTestTree5Header} from './data/data'


// console.log(t05);

function _catbuf(resultConstructor, ...arrays) {
    let totalLength = 0;
    for (const arr of arrays) {
        totalLength += arr.length;
    }
    const result = new resultConstructor(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}





export interface IFunctionWriterCb {
  (buf: Uint8Array): void;
}


export interface ABTLogger {
  start(): Promise<void>;
  reset(): void;
  setFilePath(path: string): Promise<void>;
  parseXML(xml: string): void;
  registerActionNodes(ns: string[]): void;
  registerConditionNodes(ns: string[]): void;
  logTransition(uid: number, prev_status: number, status: number): void;
  logTransitionDuration(uid: number, prev_status: number, status: number, duration_ms: number): void;
  getNameForUID(u: number): string;
  getForPath(path: string): number;
  getForPathArray(ps: number[]): number;
  writeToCallback(cb: IFunctionWriterCb): void;
}

export interface ABTZmqLogger {
  dataCallback(buf: Uint8Array, flushBuf: number[][]): void;
  run(): Promise<void>;
}

class MockBehaviorTreeFlatBuffer {
  async start(): Promise<void> {}
  reset(): void {}
  async setFilePath(path: string): Promise<void> {}

  savedTransitions: any;

  parseXML(xml: string): void {
    this.children = JSON.parse('[[],[2,3,10,11,12],[],[4,5,6],[],[],[7,8,9],[],[],[],[],[],[13,14],[],[],[]]');
    this.treeNodeIds = JSON.parse('{"1":"Sequence","2":"go1","3":"Sequence","4":"stay1","5":"stay2","6":"Sequence","7":"go1","8":"go2","9":"go3","10":"go2","11":"go3","12":"Sequence","13":"go1","14":"go2","15":"CloseDoor"}');

    this.savedTransitions = testData.getTestTree5Transitions();

    this.userCallback(testData.getTestTree5Header());
  }
  registerActionNodes(ns: string[]): void {}
  registerConditionNodes(ns: string[]): void {}

  writeToCallback(cb: IFunctionWriterCb): void {
    // this.writeBufferContainer = o;
    this.userCallback = cb;
  }

  userCallback: IFunctionWriterCb;


  treeNodeIds: any = {};
  // seems like node ids start at 1 not 0
  // this allows it to be similar to others
  children: any = [[]];

  nextTransition = 0;

  logTransition(uid: number, prev_status: number, status: number): void {
    this.userCallback(this.savedTransitions[this.nextTransition]);

    this.nextTransition = (this.nextTransition + 1) % this.savedTransitions.length;
  }

}



class MockAsyncBehaviorTree {

  rawXml: string;

  constructor(xml: string, public bb: any, public warningCb?: {(m: string): void}) {
    this.rawXml = xml;
  }

  getActionNodes(): string[] {
    return this.actionNodes;
  }
  getConditionNodes(): string[] {
    return [];
  }

   actionNodes = [
    'go1',
    'go2',
    'go3',
    'stay1',
    'stay2',
  ];

  // transition logger
  // not a text logger
  logger: ABTLogger;

  logPath: string;


  zmq: ABTZmqLogger;

  async setFileLogger(l: ABTLogger, path: string): Promise<void> {
    this.logger = l;

    // await this.logger.start();
    // await this.logger.setFilePath(path);
    // this.logPath = path;

    // this.logger.registerActionNodes(this.getActionNodes());
    // this.logger.registerConditionNodes(this.getConditionNodes());
    // this.logger.parseXML(this.rawXml);

    // this.writeNodeUID();

  }

  async setZmqLogger(l: any, z: ABTZmqLogger): Promise<void> {
    this.logger = l;
    this.zmq = z;

    this.logger.writeToCallback(this.gotTransition.bind(this));


    await this.logger.start();
    this.logger.registerActionNodes(this.getActionNodes());
    this.logger.registerConditionNodes(this.getConditionNodes());
    this.logger.parseXML(this.rawXml);
  }

  transitions: number = 0;



  // transition 0 is the full header
  // transition 1 is a specific transition from a->b
  // at any point after 0 we can add a "flush".
  gotTransition(buf: Uint8Array) {

    if( this.transitions === 1 ) {

      let flushList = [
      [1,0],
      [2,2],
      [3,3],
      [4,3],
      [5,2],
      [6,2],
      [7,2],
      [8,3],
      [9,1],
      // [9,2],
      ];

      this.zmq.dataCallback(buf, flushList);

    } else {
      this.zmq.dataCallback(buf, undefined);
    }

    this.transitions++;

  }


  async execute(): Promise<void> {
    // values here do not matter
    // cooked data will be used
    this.logger.logTransition(0,0,0);
  }

}



const runServerFor = 990000;
// jest.setTimeout(runServerFor);

test.skip("test all together with zmq", async function(done) {


  // debugger;

  let mockFlatBuffer = new MockBehaviorTreeFlatBuffer();

  let dut = new BehaviorTreeZmq();

  let mock = new MockAsyncBehaviorTree(testTree5, {});

  mock.setZmqLogger(mockFlatBuffer, dut);


  console.log("----------------- start timer");
  setTimeout(()=>{
    mock.execute();

    setTimeout(()=>{
      mock.execute();
      setTimeout(()=>{
        mock.execute();
      },1000);
    },1000);

  },3000);


  await dut.run();


  setTimeout(()=>{



    done();
  }, runServerFor-1000);




  // let dut = new AsyncBehaviorTree(testTree5b, blackBoard);

  // await dut.setFileLogger(btfb, logpath);

  // dut.printCall = true;

  // console.log(dut.exe);

  // console.log(util.inspect(dut.exe, {showHidden: false, depth: null}))



  // reset();

  // fail = []
  // blackBoard.isFull = false;

  // expect(blackBoard.called).toStrictEqual(expected);

  // reset();
  // blackBoard.isFull = false;
  // await dut.execute();
  // expect(blackBoard.called).toStrictEqual([]);





    // injectAD(btfb, 1, 'idle', 'running');
    // injectAD(btfb, 2, 'idle', 'running');
    // injectAD(btfb, 3, 'idle', 'running');
    // injectAD(btfb, 4, 'idle', 'failure');
    // injectAD(btfb, 4, 'failure', 'idle');
    // injectAD(btfb, 3, 'running', 'failure');
    // injectAD(btfb, 6, 'idle', 'running');
    // injectAD(btfb, 7, 'idle', 'running');


});


function checkTypedArrayType(someTypedArray) {
  const typedArrayTypes = [
    Int8Array,
    Uint8Array,
    Uint8ClampedArray,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array,
    BigInt64Array,
    BigUint64Array
  ];
  const checked = typedArrayTypes.filter(ta => someTypedArray.constructor === ta);
  return checked.length && checked[0].name || null;
}




test("test helpers", async function(done) {
  let dut = new BehaviorTreeZmq();


  let got0 = Uint8Array.of(...dut.buildUint32(200));
  expect(checkTypedArrayType(got0)).toBe('Uint8Array');
  let expected0 = Uint8Array.of(200,0,0,0);
  expect(Buffer.compare(got0,expected0)).toBe(0);


  let got1 = Uint8Array.of(...dut.buildUint32(200<<16));
  expect(checkTypedArrayType(got1)).toBe('Uint8Array');
  let expected1 = Uint8Array.of(0,0,200,0);
  expect(Buffer.compare(got1,expected1)).toBe(0);


  let got2 = Uint8Array.of(...dut.buildUint16(23752));
  expect(checkTypedArrayType(got2)).toBe('Uint8Array');
  let expected2 = Uint8Array.of(0xc8,0x5c);
  expect(Buffer.compare(got2,expected2)).toBe(0);



  done();

});


test("test saved data", async function(done) {

  let a = testData.getTestTree5Header();

  // console.log(a);

  let b = testData.getTestTree5Transitions();

  // for(let c of b) {
  //   console.log(c);
  // }

  expect(a).not.toBeNull();
  expect(b).not.toBeNull();

  done();
});

/*
test.skip("test zmq", async function(done) {

  // setInterval(()=>{console.log('now')}, 1000);

  console.log("---------- Test Started ----------");



  const actionNodes = [
    'go1',
    'go2',
    'go3',
    'stay1',
    'stay2',
  ];



  // const dut = new BehaviorTreeFlatBuffer();
  // await dut.start();

  dut.writeToBuffer();

  // await dut.setFilePath(outputPath);

  dut.registerActionNodes(actionNodes);

  dut.parseXML(testTree5);

  console.log(dut.internalBuffer);

  const zut = new BehaviorTreeZmq();


  zut.firstMessage = dut.internalBuffer;

  await zut.run();

  
  // done();
});


*/