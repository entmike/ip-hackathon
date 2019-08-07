<template>
  <div>
  <v-dialog v-model="dialog" :width="detailsWidth">
    <v-card v-if="details.data">
      <v-card-title class="headline">{{details.data.name}}</v-card-title>
      <v-img v-if="highlighted==false" :width="detailsWidth" :lazy-src="`${details.data.url}/320/240?ts=${details.data.metadata.timestamp}`" :src="`${details.data.url}/480/300?ts=${details.data.metadata.timestamp}`" />
      <v-img v-if="highlighted==true" :width="detailsWidth" :lazy-src="`${details.data.bwurl}/320/240?ts=${details.data.metadata.timestamp}`" :src="`${details.data.bwurl}/480/300?ts=${details.data.metadata.timestamp}`" />
      <json-viewer :value="details.data.metadata" :expand-depth=7 copyable></json-viewer>
    </v-card>
  </v-dialog>
  <v-layout row wrap>
      <v-card  class="mt-5 ml-5" :key="cam.name" v-for="cam in cams" width=320>
        <v-layout column>
        <v-img v-on:click="showDetails(cam)" v-if="highlighted==false" :lazy-src="`${cam.url}/32/20?ts=${cam.metadata.timestamp}`" :src="`${cam.url}/320/240?ts=${cam.metadata.timestamp}`" class="white--text" width="320">
          <v-card-title class="align-end fill-height">{{cam.name}}</v-card-title>
        </v-img>
        <v-img v-on:click="showDetails(cam)" v-if="highlighted==true" :lazy-src="`${cam.bwurl}/32/20?ts=${cam.metadata.timestamp}`" :src="`${cam.bwurl}/320/240?ts=${cam.metadata.timestamp}`" class="white--text" width="320">
          <v-card-title class="align-end fill-height">{{cam.name}}</v-card-title>
        </v-img>
        <v-card-text>
          <span>{{cam.metadata.ip}}</span><br>
           <span class="text--primary">
            {{cam.metadata.date.toLocaleString()}}<br>
          </span>
          <v-chip :key="label.Name" v-for="label in cam.metadata.rekognition.Labels" class="mr-1 ma-1" :color="toColor(label.Confidence)" text-color="white" >
            {{label.Name}} ({{Math.round(label.Confidence)}}%)
          </v-chip><br/>
         
        </v-card-text>
        </v-layout>
      </v-card>
  </v-layout>
  </div>
</template>

<script>
import axios from 'axios';
import JsonViewer from 'vue-json-viewer';
export default {
  components : { JsonViewer },
  methods : {
    toColor (confidence) {
      if(confidence > 80) return "green";
      if(confidence > 60) return "orange";
      return "#CC8800";
    },
    showDetails (cam) {
      this.dialog = true;
      this.details.data = cam;
    },
    startPoll () {
      window.setTimeout(this.fetchMeta.bind(this),1000);
    },
    fetchMeta () {
      axios.get(process.env.VUE_APP_HACKATHON_BACKEND + '/list',{})
      .then(res=>{
        let cams = [];
        for(let i=0;i<res.data.length;i++){
          let cam = res.data[i];
          cam.url = process.env.VUE_APP_HACKATHON_BACKEND + '/cameras/' + cam.name;
          cam.bwurl = process.env.VUE_APP_HACKATHON_BACKEND + '/focuscameras/' + cam.name;
          cam.metadata.date = new Date(cam.metadata.timestamp);
          cams.push(cam);
        }
        this.cams = cams;
        window.setTimeout(this.fetchMeta.bind(this),1000);
        })
      .catch(err=>{
        alert(err);
      });
    }
  },
  mounted () {
    this.startPoll();
  },
  props : {
    highlighted : {
      type : Boolean,
      default : false
    }
  },
  data () {
    return {
      detailsWidth : 600,
      details : {
        
      },
      dialog : false,
      host : process.env.VUE_APP_HACKATHON_BACKEND,
      cams : []
    };
  }
};
</script>
