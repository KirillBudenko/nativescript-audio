import { AudioRecorderOptions} from 'nativescript-audio';
const TsWorker = require("nativescript-worker-loader!./workers/typescript.worker");

export default class TNSRecorderAsync{

    private recordWorker:Worker = null;

    constructor(){
        this.recordWorker = new TsWorker();
    }

    set debug(value: boolean) {

    }

    public start(options: AudioRecorderOptions): Promise<any> {
        this.recordWorker.postMessage({data: "start", options});
        return Promise.resolve();
    }

    public getMeters(): number {
        return 0;
    }

    public stop(): Promise<any> {
        this.recordWorker.postMessage({data: "stop"});
        return Promise.resolve();
    }
}
