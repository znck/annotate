<template>
  <div class="image-container">
    <div v-for="image in images">
      <img :src="image" class="preview">
    </div>
  </div>
</template>

<script>
export default {
  params: {
    files: {
      required: true,
      type: Array
    }
  },
  computed: {
    images () {
          
    }
  }
}
</script>

<style>
.image-container {

}

.preview {
  width: 64px;
  height: 64px;
}
</style>
