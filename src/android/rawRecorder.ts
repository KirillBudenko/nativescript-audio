import '../async-await';
import * as permissions from 'nativescript-permissions';
import * as app from 'tns-core-modules/application';
import { TNSRecordI, TNSRecorderUtil, TNS_Recorder_Log } from '../common';
import { AudioRecorderOptions } from '../options';
import FileOutputStream = java.io.FileOutputStream;
import FileNotFoundException = java.io.FileNotFoundException;
import IOException = java.io.IOException;

export class TNSRecorder implements TNSRecordI {
  private static readonly RECORDER_SAMPLERATE = 8000;
  private static readonly RECORDER_CHANNELS = android.media.AudioFormat.CHANNEL_IN_MONO;
  private static readonly RECORDER_AUDIO_ENCODING = android.media.AudioFormat.ENCODING_PCM_16BIT;
  private recorder = null;
  private recordingThread = null;
  private isRecording: boolean = false;

  private bufferElements2Rec = 1024; // want to play 2048 (2K) since 2 bytes we use only 1024
  private bytesPerElement = 2; // 2 bytes in 16bit format

  get android() {
    return this.recorder;
  }

  set debug(value: boolean) {
    TNSRecorderUtil.debug = value;
  }

  public static CAN_RECORD(): boolean {
    const pManager = app.android.context.getPackageManager();
    const canRecord = pManager.hasSystemFeature(android.content.pm.PackageManager.FEATURE_MICROPHONE);
    if (canRecord) {
      return true;
    } else {
      return false;
    }
  }

  public requestRecordPermission(explanation = '') {
    return new Promise(async (resolve, reject) => {
      try {
        await permissions.requestPermission((android as any).Manifest.permission.RECORD_AUDIO).catch(err => {
          TNS_Recorder_Log('Error getting RECORD_AUDIO permission.', err);
          reject(err);
        });
        resolve();
      } catch (error) {
        TNS_Recorder_Log('requestRecordPermission error', error);
        reject(error);
      }
    });
  }

  public hasRecordPermission() {
    const permission = permissions.hasPermission((android as any).Manifest.permission.RECORD_AUDIO);
    return !0 === permission ? !0 : !1;
  }

  public start(options: AudioRecorderOptions): Promise<any> {
    console.log('raw recorder!');
    TNS_Recorder_Log('raw recorder!');
    return new Promise(async (resolve, reject) => {
      try {
        // bake the permission into this so the dev doesn't have to call it
        await this.requestRecordPermission().catch(err => {
          console.log(err);
          reject('Permission to record audio is not granted.');
        });

        const bufferSize = android.media.AudioRecord.getMinBufferSize(
          TNSRecorder.RECORDER_SAMPLERATE,
          TNSRecorder.RECORDER_CHANNELS,
          TNSRecorder.RECORDER_AUDIO_ENCODING
        );

        if (this.recorder) {
          // reset for reuse
          this.recorder.reset();
        } else {
          TNS_Recorder_Log('recorder is not initialized, creating new instance of android MediaRecorder.');
          try {
            this.recorder = new android.media.AudioRecord(
              android.media.MediaRecorder.AudioSource.MIC,
              options.sampleRate || TNSRecorder.RECORDER_SAMPLERATE,
              options.channels || TNSRecorder.RECORDER_CHANNELS,
              options.encoder || TNSRecorder.RECORDER_AUDIO_ENCODING,
              this.bufferElements2Rec * this.bytesPerElement
            );
          } catch (e) {
            console.log('what??');
            TNS_Recorder_Log('Error creating AudioRecord!', e);
          }
        }

        try {
          this.recorder.startRecording();
          this.isRecording = true;
        } catch (e) {
          TNS_Recorder_Log('Error starting record!', e);
        }

        TNS_Recorder_Log('Starting thread!');

        resolve();

        try {
          // this.recordingThread = new java.lang.Thread(
          //     new java.lang.Runnable({
          //                                run: () => {
          TNS_Recorder_Log('From thread!');

          // Write the output audio in byte
          const filePath: string = '/sdcard/voice8K16bitmono.pcm';
          const sData = Array.create('short', this.bufferElements2Rec);

          let os: FileOutputStream = null;

          try {
            os = new FileOutputStream(options.filename);
          } catch (e) {
            TNS_Recorder_Log('stream creation error', e);
          }

          while (this.isRecording) {
            // gets the voice output from microphone to byte format
            TNS_Recorder_Log('reading record  shit!');
            this.recorder.read(sData, 0, this.bufferElements2Rec);
            // System.out.println("Short wirting to file" + sData.toString());
            try {
              // // writes the data to file from buffer
              // // stores the voice buffer
              const bData = this.short2byte(sData);
              TNS_Recorder_Log('start to write record shit data');
              os.write(bData, 0, this.bufferElements2Rec * this.bytesPerElement);
            } catch (e) {
              TNS_Recorder_Log('file write error', e);
            }

            TNS_Recorder_Log('reading record shit succeed!');
          }
          try {
            os.close();
          } catch (e) {
            TNS_Recorder_Log('stream close error', e);
          }
          //                                }
          //                            }), "AudioRecorder Thread");
          // this.recordingThread.start();
        } catch (e) {
          TNS_Recorder_Log('error creating new thread!', e);
        }
      } catch (ex) {
        TNS_Recorder_Log('start error', ex);
        reject(ex);
      }
    });
  }

  // convert short to byte
  private short2byte(sData) {
    const shortArrsize = sData.length;
    const bytes = Array.create('byte', shortArrsize * 2);
    for (let i = 0; i < shortArrsize; i++) {
      bytes[i * 2] = sData[i] & 0x00ff;
      bytes[i * 2 + 1] = sData[i] >> 8;
      sData[i] = 0;
    }
    return bytes;
  }

  public getMeters(): number {
    if (this.recorder != null) return this.recorder.getMaxAmplitude();
    else return 0;
  }

  public pause(): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        if (this.recorder) {
          TNS_Recorder_Log('pausing recorder...');
          this.recorder.pause();
        }
        resolve();
      } catch (ex) {
        TNS_Recorder_Log('pause error', ex);
        reject(ex);
      }
    });
  }

  public resume(): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        if (this.recorder) {
          TNS_Recorder_Log('resuming recorder...');
          this.recorder.resume();
        }
        resolve();
      } catch (ex) {
        TNS_Recorder_Log('resume error', ex);
        reject(ex);
      }
    });
  }

  public stop(): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        if (this.recorder) {
          TNS_Recorder_Log('stopping recorder...');
          this.recorder.stop();
          this.isRecording = false;
        }
        resolve();
      } catch (ex) {
        TNS_Recorder_Log('stop error', ex);
        reject(ex);
      }
    });
  }

  public dispose(): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        TNS_Recorder_Log('disposing recorder...');
        if (this.recorder) {
          this.recorder.release();
        }
        this.recorder = undefined;
        this.recordingThread = null;
        resolve();
      } catch (ex) {
        TNS_Recorder_Log('dispose error', ex);
        reject(ex);
      }
    });
  }
}
