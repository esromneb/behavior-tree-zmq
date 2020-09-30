// const t05 = require("./btrees/t05.xml");
// const testTree14 = require("./btrees/testTree14.xml");
const testTree5 = require("./btrees/testTree5.xml");
// const fs = require('fs');

import {BehaviorTreeZmq} from '../src/index'

import testData from './data/data'
// import {getTestTree5Header} from './data/data'


// console.log(t05);



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
  dataCallback(buf: Uint8Array): void;
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

    this.logger.writeToCallback(z.dataCallback.bind(z));


    await this.logger.start();
    this.logger.registerActionNodes(this.getActionNodes());
    this.logger.registerConditionNodes(this.getConditionNodes());
    this.logger.parseXML(this.rawXml);
  }

  async execute(): Promise<void> {
    // values here do not matter
    // cooked data will be used
    this.logger.logTransition(0,0,0);
  }

}



const runServerFor = 990000


jest.setTimeout(runServerFor);

test("test all together with zmq", async function(done) {


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







test.skip("test saved data", async function(done) {

  let a = testData.getTestTree5Header();

  // console.log(a);

  let b = testData.getTestTree5Transitions();

  for(let c of b) {
    console.log(c);
  }

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