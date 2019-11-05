<template>
  <v-app id="app">
    <loading-dialog v-model="loading" :message="loadingMessage" />
    <error-dialog
      v-model="error.visible"
      :message="error.message"
      :details="error.details"
    />
    <v-app-bar app>
      <v-toolbar-title class="headline text-uppercase">
        <span>Take a Photo</span>
      </v-toolbar-title>
    </v-app-bar>
    <v-content>
      <v-container>
        <v-list-item
          v-for="camera in cameras"
          v-show="step !== 'capture' && step !== 'snap'"
          :key="camera.deviceId"
          primary
          @click="capture(camera)"
        >
          <v-list-item-content>
            <v-list-item-title v-text="camera.label" />
          </v-list-item-content>
        </v-list-item>
        <v-dialog v-model="imageCaptured" transition="dialog-bottom-transition">
          <v-card>
            <v-toolbar dark color="primary">
              <v-btn icon dark @click="stop">
                <v-icon>mdi-close</v-icon>
              </v-btn>
              <v-toolbar-title>Capture Results</v-toolbar-title>
            </v-toolbar>

            <v-data-table
              :hide-default-footer="true"
              :headers="headers"
              :items="metaLabels"
            ></v-data-table>
          </v-card>
        </v-dialog>
      </v-container>
      <div
        v-show="step === 'capture' || step === 'snap'"
        class="video-container"
      >
        <div v-show="step === 'capture' || step === 'snap'" id="videoContainer">
          <video v-show="true" id="video" playsinline muted autoplay></video>
          <canvas id="canvas" />
        </div>
      </div>
    </v-content>
    <v-footer v-show="step === 'capture' || step === 'snap'" app padless>
      <v-toolbar>
        <v-btn text color="error" outlined @click="stop">Cancel</v-btn>
        <v-spacer />
        <v-btn text color="success" outlined @click="snap">snap</v-btn>
      </v-toolbar>
    </v-footer>
  </v-app>
</template>

<script>
import axios from 'axios';
import LoadingDialog from '@/components/LoadingDialog';
import ErrorDialog from '@/components/ErrorDialog';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

export default {
  name: 'App',
  components: { LoadingDialog, ErrorDialog },
  data() {
    return {
      cameras: [],
      model: null,
      videoRef: null,
      canvasRef: null,
      error: {
        visible: false,
        message: ''
      },
      stream: null,
      currentDevice: null,
      loading: false,
      loadingMessage: '',
      complete: false,
      metadata: null,
      step: '',
      headers: [
        {
          text: 'Label',
          value: 'Name'
        },
        {
          text: 'Confidence',
          value: 'Confidence'
        }
      ]
    };
  },
  computed: {
    imageCaptured() {
      if (this.step === 'results') return true;
      return false;
    },
    metaLabels() {
      let labels = [];
      if (this.metadata && this.metadata.Labels) {
        for (let l of this.metadata.Labels) {
          labels.push(l);
        }
      }
      return labels;
    }
  },
  mounted() {
    this.initialize();
  },
  methods: {
    stop() {
      this.step = '';
      const video = document.getElementById('video');
      let stream = video.srcObject;
      if (stream)
        stream.getTracks().forEach(track => {
          track.stop();
        });
      this.currentDevice = null;
    },
    snap() {
      this.loading = true;
      this.loadingMessage = 'Analyzing, please wait...';
      this.step = 'snap';
      const video = document.getElementById('video');
      const canvas = document.getElementById('canvas');
      const context = canvas.getContext('2d');
      // let w = 640,
      //   h = 480; // Defaults
      // if (this.currentDevice.getCapabilities) {
      //   let capabilities = this.currentDevice.getCapabilities();
      //   if (capabilities.width) w = capabilities.width.max;
      //   if (capabilities.height) h = capabilities.height.max;
      // }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      let stream = video.srcObject;
      if (stream)
        stream.getTracks().forEach(track => {
          track.stop();
        });
      let form = new FormData();
      //form.append("file", canvas.toDataURL());
      let blobBin = atob(canvas.toDataURL().split(',')[1]);
      let array = [];
      for (let i = 0; i < blobBin.length; i++) {
        array.push(blobBin.charCodeAt(i));
      }
      let file = new Blob([new Uint8Array(array)], { type: 'image/png' });
      form.append('file', file);
      // form.append('otherparam',example);
      axios
        .post(process.env.VUE_APP_HACKATHON_BACKEND + '/upload/', form, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        .then(res => {
          this.metadata = res.data;
          this.loading = false;
          this.complete = true;
          this.step = 'results';
          this.error.message = null;
        })
        .catch(err => {
          this.step = '';
          this.loading = false;
          this.error.message = `${err}`;
          this.error.visible = true;
        });
    },
    capture(device) {
      this.currentDevice = device;
      this.step = 'capture';
      const video = document.getElementById('video');
      this.videoRef = video;
      this.canvasRef = document.getElementById('canvas');
      this.loading = true;
      this.loadingMessage = 'Initializing Stream...';
      const webcamPromise = navigator.mediaDevices
        .getUserMedia({
          video: {
            deviceId: this.currentDevice.deviceId
          }
        })
        .then(function(stream) {
          console.log('Stream loaded');
          video.srcObject = stream;
          video.play();
          return video;
        });
      Promise.all([webcamPromise])
        .then(values => {
          return new Promise((resolve, reject) => {
            values[0].addEventListener('loadeddata', event => {
              resolve(values);
            });
          });
        })
        .then(values => {
          console.log('detecting frames');
          this.loading = false;
          this.detectFrame(this.videoRef, this.model);
        })
        .catch(error => {
          console.error(error);
        });
    },
    detectFrame(video, model) {
      if (this.step !== 'capture') return;
      model.detect(video).then(predictions => {
        this.renderPredictions(predictions);
        requestAnimationFrame(() => {
          this.detectFrame(video, model);
        });
      });
    },
    renderPredictions(predictions) {
      const ctx = this.canvasRef.getContext('2d');
      ctx.canvas.width = this.videoRef.videoWidth;
      ctx.canvas.height = this.videoRef.videoHeight;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      // Font options.
      const font = '16px sans-serif';
      ctx.font = font;
      ctx.textBaseline = 'top';
      predictions.forEach(prediction => {
        const x = prediction.bbox[0];
        const y = prediction.bbox[1];
        const width = prediction.bbox[2];
        const height = prediction.bbox[3];
        // Draw the bounding box.
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, width, height);
        // Draw the label background.
        ctx.fillStyle = '#00FFFF';
        const textWidth = ctx.measureText(prediction.class).width;
        const textHeight = parseInt(font, 10); // base 10
        ctx.fillRect(x, y, textWidth + 4, textHeight + 4);
      });

      predictions.forEach(prediction => {
        const x = prediction.bbox[0];
        const y = prediction.bbox[1];
        // Draw the text last to ensure it's on top.
        ctx.fillStyle = '#000000';
        ctx.fillText(prediction.class, x, y);
      });
    },
    initialize() {
      // Get access to the camera
      this.loading = true;
      this.loadingMessage = 'Initializing...';
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.loadingMessage = 'Loading Tensorflow model...';
        cocoSsd.load().then(model => {
          this.loadingMessage = 'Getting media devices...';
          this.model = model;
          // Get permission
          navigator.mediaDevices
            .getUserMedia({
              video: true
            })
            // Shut off the streams
            .then(stream => {
              stream.getTracks().forEach(track => {
                track.stop();
              });
              this.loadingMessage = 'Enumerating media devices...';
              return navigator.mediaDevices.enumerateDevices();
            })
            // Enumerate the devices now that we have permission
            .then(devices => {
              this.cameras = [];
              devices.map(d => {
                if (d.kind === 'videoinput') this.cameras.push(d);
              });
              if (this.cameras.length === 0) {
                this.error.message = 'No cameras detected';
                this.error.visible = true;
              }
              this.loading = false;
            })
            .catch(err => {
              // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
              this.cameras = [];
              this.error.message = `An unknown error occured: ${err.name}`;
              if (err.name === 'NotAllowedError')
                this.error.message = `This page does not have access to your camera.  Please allow access in order to take a picture.`;
              if (err.name === 'NotFoundError')
                this.error.message = `Your device does not seem to have a video feed.`;
              this.error.visible = true;
            });
        });
      } else {
        this.error.message = `Your browser does not seem to support video capture, or this app is not running in under https.`;
        this.error.visible = true;
      }
    }
  }
};
</script>

<style scoped>
/* .video-container {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  object-fit: fill;
} */

.video-container video,
.video-container canvas {
  position: absolute;
  top: 0;
  left: 0;
  object-fit: contain;
  width: 100%;
  height: 100%;
}
</style>
