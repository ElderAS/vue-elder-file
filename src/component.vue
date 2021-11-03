<template>
  <div class="elder-file">
    <label v-if="label" :for="id" class="elder-file__label">
      {{ label }}
      <span v-if="isRequired" class="elder-file__label-required">*</span>
    </label>
    <draggable
      v-if="thumbnails.length || isReadonly"
      v-model="thumbnails"
      :disabled="!multiple || !sortable"
      class="elder-file__thumbnails"
      handle=".elder-file__thumbnail-sort"
    >
      <thumbnail
        v-for="(item, index) in thumbnails"
        :key="index"
        :readonly="isReadonly"
        :sortable="sortable && multiple && thumbnails.length > 1"
        :rename="rename === true"
        :value="serializeComp(item)"
        @rename="($ev) => (item.name = $ev)"
        @delete="remove(item)"
      />
      <template #footer>
        <div v-if="!thumbnails.length && isReadonly" class="elder-file__thumbnail" v-html="nofilesMessage"></div>
      </template>
    </draggable>
    <div
      v-if="showDroparea"
      class="elder-file__droparea"
      :class="dropareaClass"
      @drop="onDrop"
      @dragover="onDragOver"
      @dragenter="onDragOver"
      @dragleave="onLeave"
    >
      <input
        type="file"
        ref="input"
        :accept="accept"
        @change="onChange"
        :required="isRequired"
        :disabled="!canUpload"
        :multiple="multiple"
      />
      <div class="elder-file__droparea-instruction">
        <slot v-if="isValidDragOver" name="drop-message" :extensions="extensions">
          <SlotHandler :value="dropMessage" :extensions="extensions" />
        </slot>
        <FontAwesomeIcon v-else icon="ban" size="lg" />
      </div>
    </div>
    <Uploader
      v-if="queue.total"
      :value="queue.progress"
      :bytes="queue.bytes"
      :current="queue.counter"
      :total="queue.total"
    ></Uploader>
  </div>
</template>

<script>
import { AttributeBoolean, Clone, IsAccepted, GetFileExtensions } from './utils'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import { Options } from '../index'
import Draggable from 'vuedraggable'
import Uploader from './uploader'
import Thumbnail from './thumbnail'
import SlotHandler from './SlotHandler'

import './icons'

const QueueTemplate = {
  counter: 0,
  total: 0,
  progress: 0,
  bytes: 0,
  result: [],
}

/* Value format
{
  name: '...',
  url: '...',
  type: '...'
}
------------ */

export default {
  props: {
    value: [Array, Object, String],
    label: String,
    sortable: {
      type: Boolean,
      default: true,
    },
    multiple: Boolean,
    accept: String,
    rename: {
      type: [Boolean, String],
      default: true,
    },
    upload: Function,
    serialize: Function,
    uploadOptions: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      id: null,
      isDragOver: false,
      isValidDragOver: true,
      queue: Clone(QueueTemplate),
    }
  },
  computed: {
    isRequired: AttributeBoolean('required'),
    isReadonly: AttributeBoolean('readonly'),
    dropareaClass() {
      return {
        'elder-file__droparea--active': this.isDragOver,
        'elder-file__droparea--invalid': !this.isValidDragOver,
      }
    },
    showDroparea() {
      if (this.isReadonly) return false
      if (!this.multiple && this.value) return false
      return true
    },
    serializeComp() {
      return this.serialize || Options.serialize
    },
    dropMessage() {
      return Options.dropMessage
    },
    nofilesMessage() {
      return Options.nofilesMessage
    },
    uploadComp() {
      return this.upload || Options.upload
    },
    canUpload() {
      return !this.isReadonly && !this.queue.total
    },
    extensions() {
      return GetFileExtensions(this.accept)
    },
    thumbnails: {
      get() {
        if (!this.value) return []
        return this.value instanceof Array ? this.value : [this.value]
      },
      set(val) {
        if (!this.multiple) return
        this.$emit('input', val)
      },
    },
  },
  methods: {
    run(files) {
      files = Array.from(files).filter((f) => IsAccepted(f, this.accept))

      this.queue.total = files.length
      this.queue.counter = 0
      this.queue.bytes = files.reduce((res, cur) => (res += cur.size), 0)
      let progress = files.map(() => 0)

      Promise.all(
        files.map((file, index) => {
          let opts = { ...this.uploadOptions }
          if (typeof this.rename === 'string') opts.name = this.rename
          return this.uploadComp(
            file,
            (val) => {
              progress[index] = val
              this.queue.progress = progress.reduce((r, c) => (r += c), 0) / progress.length
            },
            opts,
          ).then((res) => {
            this.queue.counter++
            return res
          })
        }),
      ).then((result) => {
        if (!result || !result.length) return
        result = result.flat()
        let value = this.value || []
        this.$emit('input', this.multiple ? [...value, ...result] : result[0])
        this.resetQueue()
      })
    },
    remove(item) {
      this.$emit('input', this.multiple ? this.value.filter((v) => v !== item) : null)
    },
    async onChange(e) {
      let files = e.target.files
      if (this.uploadOptions.preTransform) files = await this.uploadOptions.preTransform(e)

      this.run(files)
      this.$refs.input.value = null
    },
    async onDrop(e) {
      e.preventDefault()
      this.onLeave()
      if (this.isReadonly || !e.dataTransfer.files.length) return

      let files = e.dataTransfer.files
      if (this.uploadOptions.preTransform) files = await this.uploadOptions.preTransform(e)

      this.$refs.input.files = e.dataTransfer.files
      this.$refs.input.dispatchEvent(new InputEvent('input'))
      this.run(files)
    },
    onDragOver(e) {
      this.isValidDragOver = Array.from(e.dataTransfer.items).every((e) => IsAccepted(e, this.accept))
      this.isDragOver = true
      e.preventDefault()
    },
    onLeave() {
      this.isValidDragOver = true
      this.isDragOver = false
    },
    resetQueue() {
      this.queue = Clone(QueueTemplate)
    },
  },
  created() {
    this.id = this._uid
  },
  components: {
    Uploader,
    Thumbnail,
    Draggable,
    FontAwesomeIcon,
    SlotHandler,
  },
}
</script>

<style lang="scss">
@import './main';

.elder-file {
  display: flex;
  flex-direction: column;

  text-align: left;

  & > * + * {
    margin-top: 0.5rem;
  }

  &__label {
    font-weight: bold;

    display: block;
    // margin-bottom: 0.5em;

    &-required {
      color: GetVariable('error');
    }
  }

  &__droparea {
    position: relative;

    display: flex;
    align-items: center;
    flex-grow: 1;
    justify-content: center;

    padding: 1.5rem 1rem;

    transition: background-color 150ms ease-out, border-color 150ms ease-out;
    text-align: center;

    border: 2px dashed GetVariable('border-color');
    border-radius: GetVariable('border-radius');
    background-color: GetVariable('input-color');
    background-repeat: no-repeat;
    background-position: center;
    background-origin: content-box;

    &:before {
      position: absolute;
      top: 0;
      left: 0;

      width: 100%;
      height: 100%;

      content: '';

      opacity: 0;
      background-color: GetVariable('primary');
    }

    &--active {
      border-color: GetVariable('primary');

      &:before {
        opacity: 0.15;
      }

      &.elder-file__droparea--invalid {
        cursor: not-allowed;

        color: GetVariable('error');
        border-color: GetVariable('error');

        &:before {
          opacity: 0.15;
          background-color: GetVariable('error');
        }
      }
    }

    &-instruction {
      font-size: 0.9em;

      transition: opacity 250ms ease;
    }

    input {
      position: absolute;
      top: 0;
      left: 0;

      width: 100%;
      height: 100%;

      cursor: pointer;

      opacity: 0;

      &[type='text'] {
        z-index: -1;

        pointer-events: none;
      }
    }

    b {
      color: GetVariable('primary');
    }
  }

  &__thumbnails {
    $space: 0.5rem;

    & > * + * {
      margin-top: $space;
    }
  }
}
</style>
