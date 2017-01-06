<template>
  <div class="container window-placeholder">
    <h1 class="message">
      Drop Images.
    </h1>
  </div>
</template>

<script>
export default {
  name: 'Dropzone',
};
</script>

<style lang="scss" scoped>
.window-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}
.message {
  padding: 60px 30px;
  color: #cfcfcf;
  border: 1px dashed;
}
</style>
