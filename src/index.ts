const zmq = require("zeromq");

export type Vec2 = [number,number];
export type Vec4 = [number,number,number,number];


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



// run()

class BehaviorTreeZmq {
  logStartup: boolean = false;
  constructor(public options = {repAddress:'127.0.0.1:1667', pubAddress:'127.0.0.1:1666'}) {
    if( this.logStartup ) {
      console.log('ctons');
    }
  }

  logSockBind: boolean = true;

  repSock: any;
  pubSock: any;

  firstCallback: boolean = true;

  // transition 0 is the full header
  // transition 1 is a specific transition from a->b
  // at any point after 0 we can add a "flush".

  dataCallback(buf: Uint8Array, flushList?: Vec2[]): void {

    console.log(this.firstCallback, buf);

    // save the header to a variable and send nothing over a socket
    if( this.firstCallback ) {
      this.firstMessage = buf;
      this.firstCallback = false;
      if( flushList != undefined ) {
        throw new Error(`dataCallback cannot have a second argument on the first call`);
        
      }
      return;
    }

    // at this point we always send via the docker

    if( flushList == undefined ) {

      // this is a Promise
      // we fire and forget so that this function
      // doesn't need to be async
      this.packAndSend(buf);
    } else {
      this.packAndSendAndFlush(buf, flushList);
    }

  }





  // packs and sends one buf
  async packAndSend(buf: Uint8Array): Promise<void> {

    if( (buf.length % 12) !== 0) {
      throw new Error(`packAndSend length must be multiple of 12:  ${buf.length} is wrong`);
    }

    // FIXME these only work for values less than 256

    // let headerLen = 0;
    // header is 0 length
    let header = Uint8Array.of(0,0,0,0);

    let numTransitions = 1;
    let transitions = Uint8Array.of(...this.buildUint32(numTransitions));

    let final = _catbuf(Uint8Array, header, transitions, buf);

    await this.sendData(final);
  }



  // packs and sends one buf
  async packAndSendAndFlush(buf: Uint8Array, flushList: Vec2[]): Promise<void> {

    if( (buf.length % 12) !== 0) {
      throw new Error(`packAndSend length must be multiple of 12:  ${buf.length} is wrong`);
    }



    // FIXME these only work for values less than 256

    let headerLenBuf = this.getFlushHeaderLen(flushList);
    let header = this.getFlushHeader(flushList);

    // console.log("header", header);


    let numTransitions = 1;
    let transitions = Uint8Array.of(numTransitions,0,0,0);

    let final = _catbuf(Uint8Array, headerLenBuf, header, transitions, buf);

    await this.sendData(final);
  }


  getFlushHeaderLen(flushList: number[][]) {
    let headerLen = flushList.length*3;
    let headerLenBuf = Uint8Array.of(...this.buildUint32(headerLen));
    return headerLenBuf;
  }


  getFlushHeader(flushList: Vec2[]): Uint8Array {

    let ret = [];

    for(let f of flushList) {
      ret.push(this.getFlushStatus(...f));
    }

    return _catbuf(Uint8Array, ...ret);
  }

  buildUint32(x: number): Vec4 {
    let a = (x >> 24) & 0xff;
    let b = (x >> 16) & 0xff;
    let c = (x >>  8) & 0xff;
    let d = (x)       & 0xff
    return [d,c,b,a];
  }

  buildUint16(x: number): Vec2 {
    let a = (x >> 8) & 0xff;
    let b = (x)      & 0xff;
    // console.log("x",x,a,b);
    return [b,a];
  }

  getFlushStatus(id: number, status: number): Uint8Array {

    let masked = status & 0xff;
    let ret = Uint8Array.of(...this.buildUint16(id),masked);

    // console.log("flushstatus",id,status,ret);

    return ret;
  }


// zmq.Subscriber
// zmq.Publisher
// zmq.Request
// zmq.Reply


  firstMessage: any;

  async setupRepSock(): Promise<void> {

    this.repSock = new zmq.Reply;

    let repSock = this.repSock;

    // let port = 1666;
    // let port = 1667;

    let fullPath = `tcp://${this.options.repAddress}`;

    await repSock.bind(fullPath);
    if( this.logSockBind ) {
      console.log(`Reply bound to port ${fullPath}`);
    }

    setTimeout(async ()=>{

      for await (const [msg] of repSock) {
        // console.log("got msg");
        // console.log(msg);
        await repSock.send(this.firstMessage);
      }
    }, 0);


  }

  async setupPubSock(): Promise<void> {
    this.pubSock = new zmq.Publisher;

    let pubSock = this.pubSock;

    let fullPath = `tcp://${this.options.pubAddress}`;

    await pubSock.bind(fullPath);
    if( this.logSockBind ) {
      console.log(`Publisher bound to port ${fullPath}`);
    }
  }


  async run(): Promise<void> {
    await this.setupRepSock();
    await this.setupPubSock();

    // while (true) {
    //   await sock.send("some work");
    //   await new Promise(resolve => setTimeout(resolve, 500));
    // }
  }

  // sends data to the publish sock unmodified
  async sendData(b: Uint8Array): Promise<void> {
    await this.pubSock.send(b);
  }


}


export {
BehaviorTreeZmq,
}

