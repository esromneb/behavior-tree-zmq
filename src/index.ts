const zmq = require("zeromq")


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

  repSock: any;
  pubSock: any;

  firstCallback: boolean = true;

  dataCallback(buf: Uint8Array): void {

    console.log(this.firstCallback, buf);

    // save the header to a variable and send nothing over a socket
    if( this.firstCallback ) {
      this.firstMessage = buf;
      this.firstCallback = false;
      return;
    }

    // at this point we always send via the docker

    // this is a Promise
    // we fire and forget so that this function
    // doesn't need to be async
    this.packAndSend(buf);



  }

  // packs and sends one buf
  async packAndSend(buf: Uint8Array): Promise<void> {

    if( (buf.length % 12) !== 0) {
      throw new Error(`packAndSend length must be multiple of 12:  ${buf.length} is wrong`);
    }

    // FIXME these only work for values less than 256

    let headerLen = 0;
    let header = Uint8Array.of(headerLen,0,0,0);

    let numTransitions = 1;
    let transitions = Uint8Array.of(numTransitions,0,0,0);

    let final = _catbuf(Uint8Array, header, transitions, buf);

    await this.sendData(final);
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
    console.log(`Reply bound to port ${fullPath}`);

    setTimeout(async ()=>{

      for await (const [msg] of repSock) {
        console.log("got msg");
        console.log(msg);
        await repSock.send(this.firstMessage);
      }
    }, 0);


  }

  async setupPubSock(): Promise<void> {
    this.pubSock = new zmq.Publisher;

    let pubSock = this.pubSock;

    let fullPath = `tcp://${this.options.pubAddress}`;

    await pubSock.bind(fullPath);
    console.log(`Publisher bound to port ${fullPath}`);
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

