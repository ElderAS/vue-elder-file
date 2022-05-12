<template>
  <div class="elder-file__thumbnail">
    <div class="elder-file__thumbnail-icon">
      <slot name="icon">
        <FontAwesomeIcon :icon="icon"></FontAwesomeIcon>
      </slot>
    </div>
    <div class="elder-file__thumbnail-info">
      <input
        type="text"
        ref="input"
        class="elder-file__thumbnail-name"
        :value="value.name"
        @keypress.enter="unfocus"
        :disabled="readonly || !rename"
        @input="$emit('rename', $event.target.value)"
      />
      <div class="elder-file__thumbnail-info-footer">
        <span v-if="value.size" class="elder-file__thumbnail-size">{{ value.size | size }}</span>
        <a :href="value.url" target="_blank" title="Download" class="elder-file__thumbnail-download">
          <FontAwesomeIcon icon="arrow-alt-circle-down"></FontAwesomeIcon>
        </a>
      </div>
    </div>
    <slot name="action" />
    <div class="elder-file__thumbnail-actions">
      <FontAwesomeIcon
        v-if="!readonly"
        icon="times"
        title="Remove"
        class="elder-file__thumbnail-delete"
        @click="$emit('delete')"
      />

      <FontAwesomeIcon v-if="sortable" icon="arrows-alt-v" class="elder-file__thumbnail-sort" title="Sort" />
    </div>
  </div>
</template>

<script>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { BytesToSize } from './utils'
import { Options } from '../index'

const iconPatters = [
  { pattern: /text.*/, icon: 'file-alt' },
  { pattern: /image.*/, icon: 'file-image' },
  { pattern: /pdf/, icon: 'file-pdf' },
  { pattern: /word/, icon: 'file-word' },
  { pattern: /excel/, icon: 'file-excel' },
  { pattern: /powerpoint/, icon: 'file-powerpoint' },
  { pattern: /octet-stream|zip/, icon: 'file-archive' },
]

export default {
  props: {
    value: Object,
    readonly: Boolean,
    rename: Boolean,
    sortable: Boolean,
  },
  computed: {
    icon() {
      let match = [...Options.icons, ...iconPatters].find((e) => this.value.type.match(e.pattern)) || {}
      return match.icon || 'file'
    },
  },
  methods: {
    unfocus() {
      this.$refs.input.blur()
    },
  },
  filters: {
    size: BytesToSize,
  },
  components: {
    FontAwesomeIcon,
  },
}
</script>

<style lang="scss">
@import './main';

.elder-file__thumbnail {
  $spacing: 1rem;

  line-height: 1;

  position: relative;

  display: flex;
  align-items: center;

  padding: $spacing;

  border: 1px solid GetVariable('border-color');
  border-radius: GetVariable('border-radius');
  background-color: white;

  &-icon {
    margin-right: $spacing;

    .svg-inline--fa {
      font-size: 1.5em;
      opacity: 0.5;
    }
  }

  &-name {
    font: inherit;
    font-weight: bold;

    transition: background-color 150ms ease-out;

    color: inherit !important;
    border: none;
    border-radius: GetVariable('border-radius');
    background-color: transparent;

    &:hover:not(:disabled) {
      // background-color: lighten(GetVariable('border-color'), 5%);
      background-color: GetVariable('border-color');
    }
  }

  &-info {
    display: flex;
    flex-direction: column;
    flex-grow: 1;

    &-footer {
      display: flex;
      align-items: center;

      margin-top: 0.2rem;
    }
  }

  &-size {
    font-size: 0.8em;

    margin-right: $spacing / 2;

    opacity: 0.75;
  }

  &-download {
    font-size: 0.85em;

    transition: opacity 150ms ease-out, color 150ms ease-out;

    opacity: 0.5;
    color: inherit;

    &:hover {
      opacity: 1;
      color: GetVariable('primary');
    }
  }

  &-actions {
    font-size: 1em;

    display: flex;
    align-items: center;
    align-self: flex-start;
    flex-direction: column;

    margin-left: auto;
    padding-left: $spacing;

    transition: opacity 150ms ease-out, transform 150ms ease-out;
    transform: translateX(0);

    opacity: 1;

    @media (hover: hover) {
      transform: translateX($spacing);

      opacity: 0;
    }

    .elder-file__thumbnail:hover & {
      transform: translateX(0);

      opacity: 1;
    }

    & > * + * {
      margin-top: $spacing/2;
    }

    & > * {
      cursor: pointer;
      transition: opacity 200ms ease, color 200ms ease;

      opacity: 0.75;

      &:hover {
        opacity: 1;
        color: GetVariable('primary');
      }
    }
  }

  &-delete {
    // color: rgba(GetVariable('error'), 0.8) !important ;
    color: GetVariable('error') !important ;
  }
}
</style>
