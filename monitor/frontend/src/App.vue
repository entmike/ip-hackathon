<template>
  <v-app>
    <v-app-bar app>
      <v-toolbar-title class="headline text-uppercase">
        <span>IP Hackathon </span><span class="font-weight-light">Camera Classification</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-text>
        <v-switch
        v-model="highlighted"
        :label="`Highlight`"
      ></v-switch>
      </v-toolbar-text>
    </v-app-bar>

    <v-content>
      <HelloWorld :highlighted="this.highlighted"/>
    </v-content>
  </v-app>
</template>

<script>
import HelloWorld from './components/HelloWorld';

export default {
  name: 'App',
  components: {
    HelloWorld,
  },
  data () {
    return {
      highlighted : false
    }
  }
};
</script>
