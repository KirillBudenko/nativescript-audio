import "globals";
import { TNSRecorder} from 'nativescript-audio';

let recorder = null;

const context: Worker = self as any;

context.onmessage = (msg:any) => {
  if (msg.data === "start") {
    if(!recorder){
      recorder = new TNSRecorder();
    }

    recorder.start(msg.options)
  } else if(msg.data === "stop"){
    recorder.stop();
  }
};

context.onerror = e => {
  // return true to not propagate to main
};
